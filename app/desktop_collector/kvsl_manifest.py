"""Offline KVSL metadata importer. No video decoding, ML runtime or app state."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile


REPOSITORY = "https://github.com/LeNguyenAnhKhoa/KVSL"
SOURCE_COMMIT = "e5165d79f373a12a4964e2c3d1bf59c911416667"
ARTIFACT_COMMIT = "4634b5d9f695f1118f99a6d09c9487f81bde0b3c"
MODEL_ROOT = "app/backend/Model/"
CSV_PATH = MODEL_ROOT + "data.csv"
VIDEO_ROOT = MODEL_ROOT + "Videos/"
SCHEMA = "smartglove-kvsl-manifest-v1"
COLUMNS = ["ID", "TOPIC", "LABEL", "LEVEL", "VIDEO_URL", "VIDEO", "topic_id"]


class ManifestError(ValueError):
    """Invalid source metadata or unavailable pinned objects."""


class GitSource:
    """Read immutable objects, ignoring working-tree edits and current HEAD."""

    def __init__(self, repository: Path):
        self.repository = Path(repository).resolve()

    def git(self, *args: str) -> bytes:
        try:
            result = subprocess.run(
                ["git", "--no-replace-objects", "-C", str(self.repository), *args],
                capture_output=True, check=True, timeout=60,
                env={**os.environ, "GIT_NO_LAZY_FETCH": "1", "GIT_TERMINAL_PROMPT": "0"},
            )
        except (OSError, subprocess.SubprocessError) as exc:
            raise ManifestError(
                "Cannot read local Git objects; use a full KVSL clone containing both pinned commits."
            ) from exc
        return result.stdout

    def tree(self, commit: str) -> dict[str, str]:
        if not re.fullmatch(r"[0-9a-f]{40}", commit):
            raise ManifestError("Revision must be a full lowercase 40-character commit SHA")
        if self.git("cat-file", "-t", commit).strip() != b"commit":
            raise ManifestError(f"Not a commit: {commit}")
        entries = {}
        for item in self.git("ls-tree", "-rz", commit).split(b"\0"):
            if not item:
                continue
            metadata, path = item.split(b"\t", 1)
            mode, kind, oid = metadata.split()
            if mode in (b"100644", b"100755") and kind == b"blob":
                entries[path.decode("utf-8")] = oid.decode("ascii")
        return entries

    def read(self, commit: str, path: str, tree: dict[str, str]) -> tuple[bytes, dict]:
        oid = tree.get(path)
        if oid is None:
            raise ManifestError(f"Missing required metadata: {commit}:{path}")
        data = self.git("cat-file", "blob", oid)
        actual = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
        if actual != oid:
            raise ManifestError(f"Git blob integrity failure: {path}")
        return data, {
            "commit": commit, "path": path, "git_blob": oid,
            "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
        }


def _unique_pairs(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ManifestError(f"Duplicate JSON label: {key}")
        result[key] = value
    return result


def _label_map(data: bytes, topic: str) -> dict[str, int]:
    try:
        mapping = json.loads(data.decode("utf-8-sig"), object_pairs_hook=_unique_pairs)
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ManifestError(f"Invalid label map: {topic}") from exc
    if not isinstance(mapping, dict) or not mapping:
        raise ManifestError(f"Empty/non-object label map: {topic}")
    if any(not label.strip() or type(index) is not int for label, index in mapping.items()):
        raise ManifestError(f"Invalid label/index: {topic}")
    if sorted(mapping.values()) != list(range(len(mapping))):
        raise ManifestError(f"Class indices must be unique and contiguous from zero: {topic}")
    return mapping


def build_manifest(
    repository: Path, *, source_commit: str = SOURCE_COMMIT,
    artifact_commit: str = ARTIFACT_COMMIT,
) -> dict:
    """Build a deterministic manifest; missing videos are explicit, bad metadata fails."""
    source = GitSource(repository)
    metadata_tree = source.tree(source_commit)
    artifact_tree = source.tree(artifact_commit)
    csv_bytes, csv_provenance = source.read(source_commit, CSV_PATH, metadata_tree)
    try:
        reader = csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig")), strict=True)
        if reader.fieldnames != COLUMNS:
            raise ManifestError(f"CSV columns must be exactly {COLUMNS}")
        rows = list(reader)
    except (UnicodeError, csv.Error) as exc:
        raise ManifestError("Invalid UTF-8 CSV") from exc
    if not rows:
        raise ManifestError("CSV contains no records")

    topics: dict[str, dict] = {}
    mappings: dict[str, dict[str, int]] = {}
    recordings: dict[str, dict] = {}
    seen_ids: set[str] = set()
    for row_number, row in enumerate(rows, 1):
        if set(row) != set(COLUMNS) or any(not isinstance(v, str) or not v.strip() for v in row.values()):
            raise ManifestError(f"Incomplete CSV record {row_number}")
        topic, video, label = row["topic_id"], row["VIDEO"], row["LABEL"]
        if not re.fullmatch(r"[a-z][a-z0-9_]*", topic):
            raise ManifestError(f"Unsafe topic at CSV record {row_number}")
        if not re.fullmatch(r"[A-Za-z0-9_-]+\.mp4", video):
            raise ManifestError(f"Unsafe video filename at CSV record {row_number}")
        if not re.fullmatch(r"0|[1-9][0-9]*", row["ID"]) or row["ID"] in seen_ids:
            raise ManifestError(f"Invalid/duplicate CSV ID at record {row_number}")
        seen_ids.add(row["ID"])
        if not re.fullmatch(r"[1-9][0-9]*", row["LEVEL"]):
            raise ManifestError(f"Invalid LEVEL at CSV record {row_number}")
        if topic not in topics:
            map_bytes, provenance = source.read(source_commit, MODEL_ROOT + topic + ".json", metadata_tree)
            mapping = mappings[topic] = _label_map(map_bytes, topic)
            topics[topic] = {
                "topic_id": topic, "display_name": row["TOPIC"], "label_map": provenance,
                "classes": [
                    {"label_id": f"kvsl:{topic}:{index}", "class_index": index, "label": name}
                    for name, index in sorted(mapping.items(), key=lambda item: item[1])
                ],
            }
        if topics[topic]["display_name"] != row["TOPIC"]:
            raise ManifestError(f"Conflicting topic name: {topic}")
        if label not in mappings[topic]:
            raise ManifestError(f"Label absent from topic map at CSV record {row_number}: {label}")
        recording = recordings.setdefault(video, {
            "recording_id": "kvsl:" + video.removesuffix(".mp4"),
            "video_filename": video, "modality": "video", "simulated": False,
            "signer_id": None, "session_id": None, "split": None,
            "training_overlap": "unknown", "license": "unknown",
            "media_validation": "not_performed", "annotations": [],
        })
        # One filename is one original recording. Preserve each topic membership,
        # but never silently accept contradictory labels for that recording.
        if recording["annotations"] and recording["annotations"][0]["label"] != label:
            raise ManifestError(f"Conflicting labels for original recording: {video}")
        annotation = next((a for a in recording["annotations"] if a["topic_id"] == topic), None)
        if annotation is None:
            index = mappings[topic][label]
            annotation = {
                "topic_id": topic, "class_index": index, "label_id": f"kvsl:{topic}:{index}",
                "label": label, "source_rows": [],
            }
            recording["annotations"].append(annotation)
        annotation["source_rows"].append({"record_number": row_number, **row})

    missing = []
    hashes: dict[str, list[str]] = {}
    for video, recording in sorted(recordings.items()):
        path = VIDEO_ROOT + video
        if path not in artifact_tree:
            recording["asset_status"] = "missing_at_artifact_commit"
            recording["asset"] = {"commit": artifact_commit, "path": path,
                                  "git_blob": None, "sha256": None, "bytes": None}
            missing.append(recording["recording_id"])
        else:
            _, recording["asset"] = source.read(artifact_commit, path, artifact_tree)
            recording["asset_status"] = "verified_git_blob"
            hashes.setdefault(recording["asset"]["sha256"], []).append(recording["recording_id"])
        recording["annotations"].sort(key=lambda a: a["topic_id"])

    referenced = {VIDEO_ROOT + video for video in recordings}
    historical_videos = {p for p in artifact_tree if p.startswith(VIDEO_ROOT) and p.endswith(".mp4")}
    annotations = [a for r in recordings.values() for a in r["annotations"]]
    duplicates = [
        {"recording_id": r["recording_id"], "topic_id": a["topic_id"],
         "record_numbers": [row["record_number"] for row in a["source_rows"]]}
        for r in sorted(recordings.values(), key=lambda r: r["recording_id"])
        for a in r["annotations"] if len(a["source_rows"]) > 1
    ]
    return {
        "schema_version": SCHEMA, "importer_version": 1,
        "source": {"repository": REPOSITORY, "source_commit": source_commit,
                   "artifact_commit": artifact_commit, "csv": csv_provenance},
        "limitations": {"code_license": "unknown", "data_license": "unknown",
                        "model_license": "unknown", "original_training_manifest": "unavailable",
                        "independent_evaluation": "not_established"},
        "topics": [topics[key] for key in sorted(topics)],
        "recordings": [recordings[key] for key in sorted(recordings)],
        "diagnostics": {
            "csv_rows": len(rows), "topics": len(topics),
            "topic_classes": sum(len(m) for m in mappings.values()),
            "recordings": len(recordings), "annotations": len(annotations),
            "duplicate_annotation_rows": len(rows) - len(annotations),
            "duplicate_rows": duplicates, "missing_recordings": missing,
            "identical_content_groups": [ids for _, ids in sorted(hashes.items()) if len(ids) > 1],
            "historical_video_paths": len(historical_videos),
            "unreferenced_video_paths": sorted(historical_videos - referenced),
        },
    }


def write_manifest(manifest: dict, destination: Path) -> str:
    """Publish a complete file without overwrite; identical reruns are a no-op."""
    destination = Path(destination).absolute()
    if destination.is_symlink():
        raise ManifestError("Manifest destination must not be a symlink")
    destination = destination.resolve()
    parts = [part.lower() for part in destination.parts]
    if any(parts[i:i + 2] == ["data", "raw"] for i in range(len(parts) - 1)):
        raise ManifestError("Manifest output must stay outside data/raw")
    payload = (json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n").encode("utf-8")
    if destination.exists():
        if destination.read_bytes() == payload:
            return "unchanged"
        raise ManifestError("Destination differs; choose a new output filename (no overwrite)")
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, prefix=".kvsl-", suffix=".part", delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        # Same-directory hard link is atomic and refuses an existing destination.
        try:
            os.link(temporary, destination)
        except FileExistsError:
            if destination.is_symlink() or destination.read_bytes() != payload:
                raise ManifestError("Destination changed during import; nothing overwritten") from None
            return "unchanged"
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return "created"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", required=True, type=Path, help="Local full KVSL Git clone")
    parser.add_argument("--output", required=True, type=Path, help="New manifest JSON path, outside raw data/upstream")
    args = parser.parse_args(argv)
    try:
        if args.output.resolve().is_relative_to(args.repository.resolve()):
            raise ManifestError("Output must stay outside the upstream repository")
        manifest = build_manifest(args.repository)
        status = write_manifest(manifest, args.output)
    except (ManifestError, OSError) as exc:
        parser.exit(2, f"KVSL import failed: {exc}\n")
    counts = manifest["diagnostics"]
    print(json.dumps({"status": status, "recordings": counts["recordings"],
                      "topics": counts["topics"], "csv_rows": counts["csv_rows"],
                      "missing_recordings": len(counts["missing_recordings"])}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
