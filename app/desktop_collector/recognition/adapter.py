"""Manifest membership -> verified local video; no CSV parsing or ML imports."""
from dataclasses import dataclass
import hashlib
from pathlib import Path
import re

from app.desktop_collector.kvsl_manifest import REPOSITORY, SCHEMA, SOURCE_COMMIT, ARTIFACT_COMMIT
from .contracts import MODEL, ManifestSampleRef, RecognitionError, decode, require


def contained(root: Path, relative: str) -> Path:
    require(isinstance(relative, str) and bool(relative) and not Path(relative).is_absolute(),
            "path_escape", "Configuration paths must be relative to their trusted root")
    path = (root / relative).resolve()
    require(path.is_relative_to(root.resolve()), "path_escape", "Path escapes its trusted root")
    return path


def verified_file(path: Path, sha256: str, code: str = "asset_hash") -> bytes:
    try:
        data = path.read_bytes()
    except OSError:
        raise RecognitionError("missing_" + ("model" if code == "model_hash" else "asset"),
                               "Required local file is unavailable") from None
    require(hashlib.sha256(data).hexdigest() == sha256, code, "Local file identity mismatch", "rejected")
    return data


@dataclass(frozen=True, slots=True)
class ResolvedVideo:
    ref: ManifestSampleRef
    path: Path
    annotation: dict
    classes: list
    provenance: dict


class KVSLVideoAdapter:
    def __init__(self, manifest_path: Path, assets_root: Path, model=None):
        self.model = model or MODEL
        self.manifest_path, self.assets_root = manifest_path, assets_root

    def resolve(self, sample_id: str) -> ResolvedVideo:
        model = self.model
        require(isinstance(sample_id, str), "unknown_sample", "Invalid sample identity", "rejected")
        match = re.fullmatch(r"kvsl:([a-z][a-z0-9_]*):([A-Za-z0-9_-]+)", sample_id)
        require(match is not None, "unknown_sample", "Use kvsl:<topic>:<recording-stem>", "rejected")
        topic_id, stem = match.groups()
        require(topic_id == model.topic_id, "unsupported_topic", "Sample topic does not match provider", "unsupported")
        try:
            raw = self.manifest_path.read_bytes()
            manifest = decode(raw)
        except (OSError, ValueError, UnicodeError):
            raise RecognitionError("invalid_manifest", "Cannot read a valid local UTF-8 manifest") from None
        require(manifest.get("schema_version") == SCHEMA, "manifest_schema", "Unsupported manifest schema", "unsupported")
        try:
            source = manifest["source"]
            require((source["repository"], source["source_commit"], source["artifact_commit"]) ==
                    (REPOSITORY, SOURCE_COMMIT, ARTIFACT_COMMIT),
                    "manifest_source", "Manifest source identity does not match verified provider", "rejected")
            topics = [t for t in manifest["topics"] if t["topic_id"] == topic_id]
            require(len(topics) == 1, "label_mapping", "Missing or duplicate topic mapping", "rejected")
            topic = topics[0]
            classes = topic["classes"]
            require(len(classes) == model.class_count and all(type(c["class_index"]) is int and
                    c["class_index"] == i and c["label_id"] == f"kvsl:{topic_id}:{i}" and
                    isinstance(c["label"], str) and bool(c["label"].strip())
                    for i, c in enumerate(classes)), "label_mapping", "Invalid topic-local vocabulary", "rejected")
            # Validate names against the verified map bytes, not free-form result labels.
            mapping = decode(verified_file(contained(self.assets_root, topic_id + ".json"), model.label_map_sha256))
            require(mapping == {c["label"]: c["class_index"] for c in classes} and
                    len(mapping) == model.class_count and topic["label_map"]["sha256"] == model.label_map_sha256 and
                    topic["label_map"]["commit"] == SOURCE_COMMIT and
                    topic["label_map"]["path"] == f"app/backend/Model/{topic_id}.json",
                    "label_mapping", "Manifest vocabulary differs from pinned model vocabulary", "rejected")
            recordings = [r for r in manifest["recordings"] if r["recording_id"] == "kvsl:" + stem]
            require(len(recordings) == 1, "unknown_sample", "Recording absent or duplicated in manifest", "rejected")
            recording = recordings[0]
            require(recording["video_filename"] == stem + ".mp4" and recording["modality"] == "video" and
                    recording["simulated"] is False, "recording_identity", "Invalid source recording identity", "rejected")
            annotations = [a for a in recording["annotations"] if a["topic_id"] == topic_id]
            require(len(annotations) == 1, "unknown_sample", "Recording has no unique topic membership", "rejected")
            annotation = annotations[0]
            i = annotation["class_index"]
            require(type(i) is int and 0 <= i < model.class_count and annotation["label_id"] == classes[i]["label_id"] and
                    annotation["label"] == classes[i]["label"] and bool(annotation["source_rows"]),
                    "label_mapping", "Annotation does not match vocabulary", "rejected")
            require(recording["asset_status"] == "verified_git_blob", "missing_asset", "Referenced asset is missing")
            asset = recording["asset"]
            require(asset["commit"] == ARTIFACT_COMMIT and
                    asset["path"] == "app/backend/Model/Videos/" + stem + ".mp4",
                    "recording_identity", "Asset provenance differs from recording", "rejected")
            path = contained(self.assets_root, recording["video_filename"])
            data = verified_file(path, asset["sha256"])
            blob = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
            require(len(data) == asset["bytes"] and blob == asset["git_blob"],
                    "asset_hash", "Asset size/blob identity mismatch", "rejected")
        except (KeyError, TypeError, IndexError, AttributeError):
            raise RecognitionError("invalid_manifest", "Manifest structure is invalid", "rejected") from None
        provenance = {"dataset": REPOSITORY, "source": source, "asset": asset,
                      "manifest_sha256": hashlib.sha256(raw).hexdigest(),
                      "annotation": annotation, "label_map": topic["label_map"],
                      "signer_id": recording.get("signer_id"), "session_id": recording.get("session_id"),
                      "split": recording.get("split"), "training_overlap": recording.get("training_overlap", "unknown"),
                      "license": recording.get("license", "unknown")}
        return ResolvedVideo(ManifestSampleRef(sample_id, "kvsl:" + stem, topic_id),
                             path, annotation, classes, provenance)
