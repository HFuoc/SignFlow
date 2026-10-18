"""Render train-only landmark replays, explicitly not original human videos.

Run with the existing isolated MediaPipe/OpenCV environment. Never modifies input
features/audits or an existing output directory. No model scores select exemplars.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path

from .recognition.gh_tcn import WORDS
from .recognition.gh_tcn_provider import POSE_INDICES


def select_examples(audit):
    selected = []
    for word in WORDS:
        candidates = [r for r in audit["records"] if r["split"] == "train" and r["gloss"] == word
                      and r["signer_id"] in ("S01", "S02", "S03", "S04")]
        if not candidates:
            raise ValueError("Missing training reference: " + word)
        # Prefer complete tracking and durations near one second, never evaluation accuracy.
        selected.append(min(candidates, key=lambda r: (
            -r["quality"]["hand_present_fraction"], -r["quality"]["shoulder_present_fraction"],
            abs(r["quality"]["frames"] - 30), r["segment_id"])))
    return selected


def load_segment(row, feature_dir):
    import numpy as np
    root = Path(feature_dir).resolve()
    path = (root / (row["recording_id"] + ".npy")).resolve()
    if not path.is_relative_to(root) or not 0 < path.stat().st_size < 5_000_000:
        raise ValueError("Invalid reference source path/size")
    raw = path.read_bytes()
    if hashlib.sha1(f"blob {len(raw)}\0".encode() + raw).hexdigest() != row["feature_git_blob"]:
        raise ValueError("Source blob changed")
    source = np.load(io.BytesIO(raw), allow_pickle=False)
    if source.dtype != np.float32 or source.ndim != 2 or source.shape[1] != 411 or not np.isfinite(source).all():
        raise ValueError("Invalid source landmarks")
    source = source.reshape(-1, 137, 3)
    start, end = row["source_start"], row["source_end"]
    if not 0 <= start < end <= len(source):
        raise ValueError("Invalid source boundary")
    segment = source[start:end]
    if hashlib.sha256(segment.tobytes()).hexdigest() != row["segment_content_sha256"]:
        raise ValueError("Source segment changed")
    return segment


def render(segment, path):
    import cv2
    import mediapipe as mp
    import numpy as np
    body_index = {source: dest for dest, source in enumerate(POSE_INDICES)}
    body_edges = [(body_index[a], body_index[b]) for a, b in mp.solutions.holistic.POSE_CONNECTIONS
                  if a in body_index and b in body_index and body_index[a] < 21 and body_index[b] < 21]
    hand_edges = list(mp.solutions.holistic.HAND_CONNECTIONS)
    width, height = 768, 720
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"VP80"), 30., (width, height))
    if not writer.isOpened():
        raise ValueError("WebM encoder unavailable")
    # A fixed per-clip hand scale preserves changing finger shape without zoom jitter.
    hand_scales = []
    for start in (95, 116):
        hand = segment[:, start:start + 21, :2]
        valid = (segment[:, start:start + 21] != 0).any(axis=2)
        offsets = hand - hand[:, :1]
        values = np.abs(offsets[valid & valid[:, :1]])
        hand_scales.append(max(float(np.max(values)) if values.size else .1, .025))
    try:
        for xyz in segment:
            canvas = np.full((height, width, 3), (243, 241, 241), np.uint8)
            present = (xyz != 0).any(axis=1)
            cv2.putText(canvas, "LANDMARK REPLAY - NOT ORIGINAL VIDEO", (24, 30), 0, .65, (45, 45, 45), 1, cv2.LINE_AA)
            cv2.putText(canvas, "Front view | not mirrored | source labels unverified", (24, 54), 0, .5, (65, 65, 65), 1, cv2.LINE_AA)
            xy = xyz[:, :2] * 350 + np.array([209, 66])
            def draw(points, mask, edges, color, radius=2):
                def point(i): return tuple(np.clip(points[i], -2048, 2048).astype(int))
                for a, b in edges:
                    if mask[a] and mask[b]: cv2.line(canvas, point(a), point(b), color, 2, cv2.LINE_AA)
                for i in range(len(points)):
                    if mask[i]: cv2.circle(canvas, point(i), radius, color, -1, cv2.LINE_AA)
            draw(xy[:21], present[:21], body_edges, (110, 100, 85))
            # Source face points provide spatial context; no invented face topology.
            draw(xy[25:95], present[25:95], [], (135, 135, 135), 1)
            for hand_no, start in enumerate((95, 116)):
                color = (215, 100, 30) if hand_no == 0 else (50, 115, 215)
                mask = present[start:start + 21]
                draw(xy[start:start + 21], mask, hand_edges, color)
                left = 24 + hand_no * 380
                cv2.putText(canvas, ("LEFT" if hand_no == 0 else "RIGHT") + " HAND - detail", (left, 518), 0, .55, color, 1, cv2.LINE_AA)
                if mask[0]:
                    local = (xyz[start:start + 21, :2] - xyz[start, :2]) * (82 / hand_scales[hand_no])
                    local += np.array([left + 170, 615])
                    draw(local, mask, hand_edges, color, 3)
                else:
                    cv2.putText(canvas, "Not tracked in source", (left + 25, 615), 0, .5, color, 1, cv2.LINE_AA)
            writer.write(canvas)
    finally:
        writer.release()
    if not path.is_file() or not 0 < path.stat().st_size <= 4 * 1024 * 1024:
        raise ValueError("Invalid rendered media")


def build(audit_path, feature_dir, output):
    raw = Path(audit_path).read_bytes()
    license_bytes = (Path(feature_dir).parent / "SOURCE_LICENSE.txt").read_bytes()
    if not 0 < len(license_bytes) < 65536:
        raise ValueError("Missing or oversized source license")
    audit = json.loads(raw)
    selected = select_examples(audit)
    output = Path(output).resolve()
    sources = [Path(feature_dir).resolve(), Path(audit_path).parent.resolve()]
    if any(output == source or output.is_relative_to(source) for source in sources):
        raise ValueError("Output must be separate from source data")
    output.mkdir(parents=True, exist_ok=False)
    (output / "SOURCE_LICENSE.txt").write_bytes(license_bytes)
    rows = []
    for i, row in enumerate(selected):
        segment = load_segment(row, feature_dir)
        identity = f"gh25-{i:02d}"
        path = output / (identity + ".webm")
        render(segment, path)
        data = path.read_bytes()
        rows.append(dict(reference_id=identity, label_id=f"gh_tcn:vsl_gh25:{i}", display_name=WORDS[i],
                         source_semantics_verified=False, media_type="video/webm", kind="landmark_replay",
                         filename=path.name, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                         source=row, fps=30, frames=len(segment)))
    manifest = dict(schema_version="gh-landmark-replays-v1", provider_id="vsl-gh-tcn-25",
                    source_semantics_verified=False, audit_sha256=hashlib.sha256(raw).hexdigest(),
                    source_url="https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation",
                    references=rows)
    data = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    (output / "manifest.json").write_bytes(data)
    print("manifest_sha256=" + hashlib.sha256(data).hexdigest())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit", required=True)
    parser.add_argument("--features", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    build(args.audit, args.features, args.output)
