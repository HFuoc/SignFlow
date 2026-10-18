"""Offline ViSign feature qualification, only in the existing isolated ML environment."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

from .kvsl_manifest import ManifestError, write_manifest
from .vsl_data_audit import AuditError, read_json

CONTRACT = "visign-holistic-75xyz-mask-v1"
CONFIG = {"mediapipe": "0.10.14", "model_complexity": 1,
          "min_detection_confidence": 0.5, "min_tracking_confidence": 0.5,
          "static_image_mode": False, "mirror": False, "resize": False}


def validate_candidates(pilot: dict, root: Path) -> list[dict]:
    if not isinstance(pilot, dict) or pilot.get("schema") != "smartglove-visign-local-pilot-v1":
        raise AuditError("Unsupported local pilot schema")
    records = pilot.get("candidates")
    if not isinstance(records, list) or not records:
        raise AuditError("No candidate records")
    seen = set()
    for r in records:
        if not isinstance(r, dict):
            raise AuditError("Invalid candidate record")
        digest = r.get("sha256")
        if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest) or digest in seen:
            raise AuditError("Invalid or repeated candidate SHA-256")
        seen.add(digest)
        if r.get("local_file") != f"videos/{digest}.mp4":
            raise AuditError("Source path must be the hash-addressed video")
        path = (root / r["local_file"]).resolve()
        if not path.is_relative_to(root.resolve()) or not path.is_file():
            raise AuditError("Source video missing or outside source root")
        if not isinstance(r.get("label"), str) or not r["label"].strip():
            raise AuditError("Missing candidate label")
        if type(r.get("decoded_frames")) is not int or not 1 <= r["decoded_frames"] <= 720:
            raise AuditError("Invalid expected frame count")
        with path.open("rb") as file:
            if hashlib.file_digest(file, "sha256").hexdigest() != digest:
                raise AuditError("Source video hash mismatch")
    return records


def pack_landmarks(result):
    """Zero plus explicit mask for absent landmarks; no invented/interpolated data."""
    import numpy as np
    xyz = np.zeros((75, 3), dtype=np.float32)
    present = np.zeros(75, dtype=np.bool_)
    visibility = np.zeros(33, dtype=np.float32)
    for attribute, offset, count in (("pose_landmarks", 0, 33),
                                      ("left_hand_landmarks", 33, 21),
                                      ("right_hand_landmarks", 54, 21)):
        group = getattr(result, attribute)
        if group is None:
            continue
        if len(group.landmark) != count:
            raise AuditError("Unexpected landmark count")
        values = np.asarray([(p.x, p.y, p.z) for p in group.landmark], dtype=np.float32)
        if not np.isfinite(values).all():
            raise AuditError("Non-finite landmark coordinates")
        xyz[offset:offset+count] = values
        present[offset:offset+count] = True
        if attribute == "pose_landmarks":
            visibility[:] = [p.visibility for p in group.landmark]
            if not np.isfinite(visibility).all():
                raise AuditError("Non-finite pose visibility")
    return xyz, present, visibility


def extract_one(job):
    import cv2
    import mediapipe as mp
    import numpy as np
    record, root, output = job
    if mp.__version__ != CONFIG["mediapipe"]:
        raise AuditError("Run with the pinned MediaPipe 0.10.14 environment")
    cv2.setNumThreads(1)
    source = Path(root) / record["local_file"]
    digest = record["sha256"]
    # Validate again in the worker, before decoding.
    with source.open("rb") as file:
        if hashlib.file_digest(file, "sha256").hexdigest() != digest:
            raise AuditError("Source changed after input validation")
    arrays, masks, visibility, signatures = [], [], [], []
    capture = cv2.VideoCapture(str(source))
    try:
        with mp.solutions.holistic.Holistic(static_image_mode=False, model_complexity=1,
                min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
            while True:
                ok, frame = capture.read()
                if not ok:
                    break
                xyz, mask, visible = pack_landmarks(holistic.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
                arrays.append(xyz)
                masks.append(mask)
                visibility.append(visible)
                signatures.append(cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (32, 32)))
                if len(arrays) > 720:
                    raise AuditError("Decoded clip exceeds bound")
    finally:
        capture.release()
    if len(arrays) != record["decoded_frames"]:
        raise AuditError("Decode count differs from source audit")
    xyz, present = np.stack(arrays), np.stack(masks)
    visible = np.stack(visibility)
    indices = np.linspace(0, len(arrays)-1, 8).astype(np.int64)
    signature = np.stack(signatures)[indices]
    directory = Path(output) / "features"
    destination = directory / f"{digest}.npz"
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=directory, prefix=".feature-", suffix=".part", delete=False) as handle:
            temporary = Path(handle.name)
            np.savez_compressed(handle, xyz=xyz, present=present, pose_visibility=visible,
                                frame_index=np.arange(len(arrays), dtype=np.int32),
                                visual_signature=signature)
            handle.flush()
            os.fsync(handle.fileno())
        os.link(temporary, destination)  # Exclusive publication, no overwrite.
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    with destination.open("rb") as file:
        feature_hash = hashlib.file_digest(file, "sha256").hexdigest()
    counts = {"pose_frames": int(present[:, 0].sum()),
              "left_hand_frames": int(present[:, 33].sum()),
              "right_hand_frames": int(present[:, 54].sum()),
              "either_hand_frames": int((present[:, 33] | present[:, 54]).sum())}
    return {"video_sha256": digest, "label": record["label"],
            "archive_path": record["archive_path"], "frames": len(arrays), **counts,
            "feature_file": f"features/{digest}.npz", "feature_sha256": feature_hash,
            "all_hands_missing": counts["either_hand_frames"] == 0,
            "either_hand_coverage": counts["either_hand_frames"] / len(arrays)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pilot", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--workers", type=int, choices=range(1, 5), default=2)
    args = parser.parse_args(argv)
    try:
        source_root = args.pilot.resolve().parent
        out = args.output_dir.resolve()
        if out.is_relative_to(source_root) or source_root.is_relative_to(out):
            raise AuditError("Feature output must be separate from source directories")
        parts = [p.lower() for p in out.parts]
        if any(parts[i:i+2] == ["data", "raw"] for i in range(len(parts)-1)):
            raise AuditError("Output cannot be in data/raw")
        if out.exists():
            raise AuditError("Choose a new output directory; existing runs remain immutable")
        pilot, receipt = read_json(args.pilot)
        records = validate_candidates(pilot, source_root)
        out.mkdir(parents=True)
        (out / "features").mkdir()
        write_manifest({"contract": CONTRACT, "config": CONFIG, "source": receipt,
                        "expected_clips": len(records), "state": "prepared_not_completed"}, out / "run-input.json")
        results = []
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            for result in executor.map(extract_one, [(r, str(source_root), str(out)) for r in records]):
                results.append(result)
                if len(results) % 25 == 0:
                    print(f"Processed {len(results)}/{len(records)}", flush=True)
        report = {"schema_version": CONTRACT, "config": CONFIG, "source": receipt,
                  "training_ready": False, "source_semantics_verified": False,
                  "state": "complete", "records": results,
                  "summary": {"clips": len(results), "frames": sum(r["frames"] for r in results),
                              "no_hand_clips": sum(r["all_hands_missing"] for r in results),
                              "below_half_hand_coverage": sum(r["either_hand_coverage"] < .5 for r in results)}}
        write_manifest(report, out / "feature-report.json")
        print(json.dumps(report["summary"]), flush=True)
    except (AuditError, ManifestError, OSError) as exc:
        parser.exit(2, f"Feature qualification failed: {exc}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
