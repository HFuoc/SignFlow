"""Experimental camera inference, imported only inside the isolated worker."""
from dataclasses import replace
import io
import time

from .adapter import verified_file
from .contracts import map_scores, require
from .experimental import VISIGN_MODEL, WORDS
from .captures import MAX_CAPTURE_SECONDS


def load_model(checkpoint):
    import numpy as np
    data = verified_file(checkpoint, VISIGN_MODEL.model_sha256, "model_hash")
    with np.load(io.BytesIO(data), allow_pickle=False) as archive:
        require(set(archive.files) == {"mean", "scale", "weight", "bias", "labels"},
                "model_compatibility", "Research checkpoint fields differ", "rejected")
        require(archive["labels"].dtype.kind == "U" and archive["labels"].tolist() == list(WORDS),
                "label_mapping", "Research vocabulary differs", "rejected")
        model = {key: archive[key] for key in ("mean", "scale", "weight", "bias")}
    for key, shape in {"mean": (3600,), "scale": (3600,), "weight": (3600, 25), "bias": (25,)}.items():
        require(model[key].shape == shape and model[key].dtype.kind == "f" and np.isfinite(model[key]).all(),
                "model_compatibility", "Invalid research weights", "rejected")
    require((model["scale"] > 0).all(), "model_compatibility", "Invalid research scaling", "rejected")
    return model


def predict(video, checkpoint, result, runtime):
    import cv2
    import numpy as np
    from app.desktop_collector.vsl_features import pack_landmarks
    from app.desktop_collector.vsl_baseline import encode_clip, scores

    start = time.perf_counter()
    hit = runtime.visign_model is not None
    if not hit:
        runtime.visign_model = (checkpoint, load_model(checkpoint))
    require(runtime.visign_model[0] == checkpoint, "model_hash", "Cached research model path changed", "rejected")
    load_ms = (time.perf_counter() - start) * 1000
    start = time.perf_counter()
    capture = cv2.VideoCapture(str(video.path))
    frames, masks, times = [], [], []
    missing = {"pose": 0, "left_hand": 0, "right_hand": 0}
    try:
        require(capture.isOpened(), "video_decode", "Cannot decode camera clip", "insufficient_data")
        width, height = capture.get(cv2.CAP_PROP_FRAME_WIDTH), capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
        require(np.isfinite(width) and np.isfinite(height) and min(width, height) >= 16 and width * height <= 1920 * 1080,
                "capture_media", "Camera resolution exceeds limit", "rejected")
        with runtime.visign_clip() as holistic:
            while True:
                ok, frame = capture.read()
                if not ok:
                    break
                require(min(frame.shape[:2]) >= 16 and frame.shape[0] * frame.shape[1] <= 1920 * 1080,
                        "capture_media", "Camera resolution exceeds limit", "rejected")
                stamp = float(capture.get(cv2.CAP_PROP_POS_MSEC)) / 1000
                require(np.isfinite(stamp) and stamp >= 0 and (not times or stamp >= times[-1]),
                        "capture_media", "Invalid camera timestamps", "rejected")
                times.append(stamp)
                require(len(frames) < 720 and stamp - times[0] <= MAX_CAPTURE_SECONDS,
                        "capture_duration", "Camera clip exceeds six seconds", "rejected")
                landmarks = holistic.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                xyz, mask, _ = pack_landmarks(landmarks)
                frames.append(xyz)
                masks.append(mask)
                for group in missing:
                    missing[group] += int(getattr(landmarks, group + "_landmarks") is None)
    finally:
        capture.release()
    require(len(frames) >= 5, "capture_short", "Too few decoded camera frames", "insufficient_data")
    require(times[-1] > times[0], "capture_media", "Camera duration unavailable", "rejected")
    masks = np.asarray(masks)
    coverage = float(masks[:, 33:].any(axis=1).mean())
    require(coverage >= .5, "hands_missing", "Keep both hands and your upper body visible, then try again.", "insufficient_data")
    encoded = encode_clip(np.asarray(frames), masks)
    preprocess_ms = (time.perf_counter() - start) * 1000
    start = time.perf_counter()
    values = scores(runtime.visign_model[1], encoded).tolist()
    top = map_scores(values, video.classes, VISIGN_MODEL)
    return replace(result, status="ok", top_k=top,
                   latency_ms={"provider_load": load_ms, "preprocess": preprocess_ms,
                               "model": (time.perf_counter() - start) * 1000},
                   quality={"frames_decoded": len(frames), "frames_selected": 16,
                            "missing_group_frames": missing, "hand_coverage": coverage,
                            "cache_hit": hit, "experimental": True,
                            "source_semantics_verified": False, "unknown_rejection": False,
                            "timestamp_basis": "decoded_presentation_timestamp_seconds",
                            "decoded_span_seconds": times[-1] - times[0], "resolution": [int(width), int(height)]})
