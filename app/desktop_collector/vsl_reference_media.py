"""Offline, explicit reference-preview preparation in the existing isolated CV environment.

Creates a fresh output directory; source media and research artifacts are read-only.
No semantic approval, model fitting, inference or evaluation is performed.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re

from .recognition.adapter import contained
from .recognition.contracts import require
from .recognition.experimental import VISIGN_MODEL, WORDS
from .recognition.references import (MAX_MEDIA_BYTES, REFERENCE_DIRECTORY, REFERENCE_SCHEMA,
                                     bounded_bytes, identities)

CURATION = ".design-cache/visign-curation-20261012/curation.json"
CURATION_SHA256 = "d2bd5174b536ce887b85c39b25a9abbf0c070930b2e09030caf32ea6f921deff"
RESEARCH_SPLIT = ".design-cache/visign-baseline-20261012/run1/split.json"
SPLIT_SHA256 = "5d2011fbf6561015aa1657b02292e944ce40db96e364ec666133bb69290ee7ef"
SOURCE_DIRECTORY = ".design-cache/vsl-immediate-20261012"
SELECTION = "smallest SHA-256 per label among screened clips in final research train split; no prediction scores"


def select_exemplars(curation, research_split):
    require(curation.get("schema_version") == "visign-curation-review-v1" and
            curation.get("semantic_review") == "pending", "reference_source", "Unsupported curation")
    rows = curation["records"]
    require(isinstance(rows, list) and all(isinstance(row, dict) for row in rows),
            "reference_source", "Invalid curation records")
    require(research_split.get("schema_version") == "visign-research-split-v1" and
            research_split.get("source_semantics_verified") is False,
            "reference_source", "Unsupported research split")
    splits = {row["sha256"]: row for row in research_split["records"]}
    require(len(splits) == len(research_split["records"]),
            "reference_source", "Duplicate research split identities")
    selected = []
    for word in WORDS:
        eligible = [row for row in rows if row.get("label") == word and
                    row.get("status") == "screened_pending_semantics" and
                    splits.get(row.get("sha256"), {}).get("split") == "train" and
                    row.get("semantic_review") == "pending" and
                    row.get("quality_flags") == [] and row.get("flat_frame_indices") == []]
        require(bool(eligible), "reference_source", "Every label requires a screened training exemplar")
        require(all(isinstance(row.get("sha256"), str) and
                    re.fullmatch("[0-9a-f]{64}", row["sha256"]) for row in eligible),
                "reference_source", "Invalid source identity")
        row = min(eligible, key=lambda item: item["sha256"])
        require((splits[row["sha256"]]["label"], splits[row["sha256"]]["group_id"]) ==
                (row["label"], row["group_id"]),
                "reference_source", "Research split label/group identity differs")
        require(row["local_file"] == "videos/" + row["sha256"] + ".mp4",
                "reference_source", "Source filename differs from hash identity")
        selected.append(row)
    require(len({row["sha256"] for row in selected}) == len(WORDS),
            "reference_source", "Conflicting source labels are not allowed")
    return selected


def transcode(source, destination):
    import cv2  # Only this explicit offline operation requires the existing CV environment.
    capture = cv2.VideoCapture(str(source))
    writer = None
    frames = 0
    try:
        require(capture.isOpened(), "reference_decode", "Cannot open source video")
        fps = float(capture.get(cv2.CAP_PROP_FPS))
        expected_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        width, height = (int(capture.get(prop)) for prop in
                         (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT))
        require(math.isfinite(fps) and 1 <= fps <= 60 and min(width, height) >= 16 and
                width * height <= 1920 * 1080 and width % 2 == height % 2 == 0,
                "reference_decode", "Unsupported reference geometry or frame rate")
        writer = cv2.VideoWriter(str(destination), cv2.VideoWriter_fourcc(*"VP80"), fps, (width, height))
        require(writer.isOpened(), "reference_encode", "VP8 encoder is unavailable")
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            require(frame.shape[:2] == (height, width) and frames < 720,
                    "reference_decode", "Source resolution/frame limit differs")
            writer.write(frame)
            frames += 1
        require(5 <= frames == expected_frames and frames / fps <= 30,
                "reference_decode", "Reference duration outside bounds")
    finally:
        capture.release()
        if writer is not None:
            writer.release()
    replay = cv2.VideoCapture(str(destination))
    decoded = 0
    try:
        require(replay.isOpened(), "reference_encode", "Cannot decode prepared preview")
        while True:
            ok, frame = replay.read()
            if not ok:
                break
            require(frame.shape[:2] == (height, width) and decoded < frames,
                    "reference_encode", "Preview frames differ")
            decoded += 1
        require(decoded == frames and abs(replay.get(cv2.CAP_PROP_FPS) - fps) < .02,
                "reference_encode", "Preview timing/frame count differs")
    finally:
        replay.release()
    return {"frames": frames, "width": width, "height": height, "fps": fps,
            "duration_seconds": frames / fps}


def prepare(workspace, output=REFERENCE_DIRECTORY):
    workspace = Path(workspace).resolve()
    source_root = contained(workspace, SOURCE_DIRECTORY)
    curation_bytes = bounded_bytes(contained(workspace, CURATION), 4 * 1024 * 1024)
    require(hashlib.sha256(curation_bytes).hexdigest() == CURATION_SHA256,
            "reference_source", "Curation checksum differs")
    split_bytes = bounded_bytes(contained(workspace, RESEARCH_SPLIT), 1024 * 1024)
    require(hashlib.sha256(split_bytes).hexdigest() == SPLIT_SHA256,
            "reference_source", "Research split checksum differs")
    selected = select_exemplars(json.loads(curation_bytes), json.loads(split_bytes))
    # Verify every source before allocating the new output directory.
    for row in selected:
        raw = bounded_bytes(contained(source_root, row["local_file"]), MAX_MEDIA_BYTES)
        require(hashlib.sha256(raw).hexdigest() == row["sha256"],
                "reference_source", "Source checksum differs")
    target = contained(workspace, output)
    require(target.is_relative_to(contained(workspace, ".design-cache")),
            "reference_output", "Preview output belongs in ignored cache storage")
    target.mkdir(parents=True, exist_ok=False)
    entries = []
    for identity, row in zip(identities(), selected, strict=True):
        filename = identity["reference_id"] + ".webm"
        source = contained(source_root, row["local_file"])
        metadata = transcode(source, target / filename)
        raw = bounded_bytes(target / filename, MAX_MEDIA_BYTES)
        require(hashlib.sha256(bounded_bytes(source, MAX_MEDIA_BYTES)).hexdigest() == row["sha256"],
                "reference_source", "Source changed during preview preparation")
        entries.append({**identity, **metadata, "filename": filename, "bytes": len(raw),
                        "sha256": hashlib.sha256(raw).hexdigest(),
                        "source": {**{key: row[key] for key in ("sha256", "local_file", "archive_path",
                                   "group_id", "proposed_split", "status", "semantic_review")},
                                   "research_split": "train", "hash_verified_before_and_after": True}})
    import cv2
    manifest = {"schema_version": REFERENCE_SCHEMA, "provider_id": VISIGN_MODEL.provider_id,
                "source_semantics_verified": False, "selection": SELECTION,
                "curation": {"path": CURATION, "sha256": hashlib.sha256(curation_bytes).hexdigest()},
                "research_split": {"path": RESEARCH_SPLIT, "sha256": SPLIT_SHA256},
                "summary": {"references": len(entries), "source_frames": sum(row["frames"] for row in entries),
                            "media_bytes": sum(row["bytes"] for row in entries),
                            "research_split_counts": {"train": len(entries)}},
                "conversion": {"codec": "VP8", "container": "WebM", "opencv": cv2.__version__,
                               "resize": False, "mirror": False, "speed_change": False,
                               "frame_reordering": False, "audio": False, "lossy": True},
                "references": entries}
    data = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf8")
    with (target / "manifest.json").open("xb") as stream:
        stream.write(data)
    return {"references": len(entries), "media_bytes": sum(row["bytes"] for row in entries),
            "manifest_sha256": hashlib.sha256(data).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--output", default=REFERENCE_DIRECTORY)
    args = parser.parse_args()
    print(json.dumps(prepare(args.workspace, args.output)))


if __name__ == "__main__":
    main()
