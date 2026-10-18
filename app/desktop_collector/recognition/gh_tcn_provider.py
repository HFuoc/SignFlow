"""Capture-only TCN inference. Heavy imports stay inside the isolated worker."""
from dataclasses import replace
import io
import time

from .adapter import contained, verified_file
from .captures import MAX_CAPTURE_SECONDS
from .contracts import RecognitionError, map_scores, require
from .gh_tcn import GH_TCN_MODEL, NATIVE_LABELS, NORMALIZATION_SHA256, ACCEPT_THRESHOLD, acceptance

POSE_INDICES = (0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 28)


def load_normalization(path):
    import numpy as np
    data = verified_file(path, NORMALIZATION_SHA256, "model_hash")
    with np.load(io.BytesIO(data), allow_pickle=False) as archive:
        require(set(archive.files) == {"mean", "scale", "labels"},
                "model_compatibility", "TCN normalization fields differ", "rejected")
        require(archive["labels"].dtype.kind == "U" and archive["labels"].tolist() == list(NATIVE_LABELS),
                "label_mapping", "TCN native vocabulary differs", "rejected")
        mean, scale = archive["mean"].copy(), archive["scale"].copy()
    require(all(a.shape == (279,) and a.dtype == np.float32 and np.isfinite(a).all()
                for a in (mean, scale)) and (scale > 0).all(),
            "model_compatibility", "Invalid TCN normalization", "rejected")
    return mean, scale


def load_model(checkpoint):
    import torch
    from app.desktop_collector.vsl_gh_experiment import make_tcn
    data = verified_file(checkpoint, GH_TCN_MODEL.model_sha256, "model_hash")
    mean, scale = load_normalization(contained(checkpoint.parent, "normalization.npz"))
    model = make_tcn(279, 26)
    model.load_state_dict(torch.load(io.BytesIO(data), map_location="cpu", weights_only=True), strict=True)
    model.eval()
    return model, mean, scale


def infer_encoded(loaded, encoded):
    import numpy as np
    import torch
    model, mean, scale = loaded
    require(encoded.shape == (32, 279) and np.isfinite(encoded).all(),
            "feature_mismatch", "Invalid TCN encoded segment", "rejected")
    tensor = torch.from_numpy(((encoded - mean) / scale).astype(np.float32)).T.unsqueeze(0)
    with torch.inference_mode():
        return model(tensor).softmax(-1)[0].tolist()


def pack_landmarks(landmarks):
    """Source GH137 layout. Face slots stay zero: the encoder never uses them."""
    import numpy as np
    frame = np.zeros((137, 3), dtype=np.float32)
    for name, start, indices in (("pose", 0, POSE_INDICES), ("left_hand", 95, range(21)),
                                 ("right_hand", 116, range(21))):
        group = getattr(landmarks, name + "_landmarks", None)
        if group is not None:
            for dest, index in enumerate(indices, start):
                point = group.landmark[index]
                frame[dest] = (point.x, point.y, point.z)
    return frame


def predict(video, checkpoint, result, runtime):
    import cv2
    import numpy as np
    from app.desktop_collector.vsl_gh_experiment import AuditError, encode_segment
    start = time.perf_counter()
    hit = runtime.gh_tcn_model is not None
    if not hit:
        runtime.gh_tcn_model = (checkpoint, load_model(checkpoint))
    require(runtime.gh_tcn_model[0] == checkpoint, "model_hash", "Cached TCN path changed", "rejected")
    load_ms = (time.perf_counter() - start) * 1000
    start = time.perf_counter()
    capture = cv2.VideoCapture(str(video.path))
    frames, times = [], []
    try:
        require(capture.isOpened(), "video_decode", "Cannot decode camera clip", "insufficient_data")
        width, height = capture.get(cv2.CAP_PROP_FRAME_WIDTH), capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
        require(np.isfinite(width) and np.isfinite(height) and min(width, height) >= 16
                and width * height <= 1920 * 1080,
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
                rgb = cv2.cvtColor(cv2.resize(frame, (360, 360)), cv2.COLOR_BGR2RGB)
                frames.append(pack_landmarks(holistic.process(rgb)))
    finally:
        capture.release()
    require(len(frames) >= 4, "capture_short", "Too few decoded camera frames", "insufficient_data")
    require(times[-1] > times[0], "capture_media", "Camera duration unavailable", "rejected")
    try:
        encoded, coverage = encode_segment(np.asarray(frames))
    except AuditError:
        raise RecognitionError("hands_missing", "Keep your upper body and hands visible, then capture a complete sign.",
                               "insufficient_data") from None
    preprocess_ms = (time.perf_counter() - start) * 1000
    start = time.perf_counter()
    values = infer_encoded(runtime.gh_tcn_model[1], encoded)
    index, reason = acceptance(values)
    return replace(result, status="rejected" if reason else "ok",
                   top_k=() if reason else map_scores(values[:25], video.classes, GH_TCN_MODEL),
                   rejection_reason=reason,
                   error_code=("outside_vocabulary" if index == 25 else "uncertain_sign") if reason else None,
                   latency_ms={"provider_load": load_ms, "preprocess": preprocess_ms,
                               "model": (time.perf_counter() - start) * 1000},
                   quality={"frames_decoded": len(frames), "frames_selected": 32, **coverage,
                            "native_top1_index": index, "native_top1_score": values[index],
                            "native_winner_supported": index < 25,
                            **({"candidate_top_k": list(map_scores(values[:25], video.classes, GH_TCN_MODEL))} if reason else {}),
                            "other_score": values[25], "accept_threshold": ACCEPT_THRESHOLD,
                            "cache_hit": hit, "experimental": True, "source_semantics_verified": False,
                            "unknown_rejection": "experimental_unverified_on_webcam",
                            "timestamp_basis": "decoded_presentation_timestamp_seconds",
                            "decoded_span_seconds": times[-1] - times[0], "resolution": [int(width), int(height)]})
