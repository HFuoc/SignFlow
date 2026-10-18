"""Isolated continuous Holistic worker. Camera pixels/features stay in RAM."""
from dataclasses import replace
import importlib.metadata
import math
import os
import sys
import time

from .contracts import decode, encode, map_scores, require
from .experimental import VISIGN_MODEL, classes
from .videomae import VIDEOMAE_MODEL, decide
from .gh_tcn import GH_TCN_MODEL, ACCEPT_THRESHOLD, acceptance, classes as gh_classes
from .registry import get_model
from .streaming import (FrameClock, MAX_FRAME_BYTES, MAX_GAP_MS, STREAM_PROTOCOL,
                        SignSegmenter, stream_prediction, validate_frame_header, validate_frame_pixels)
from .worker_client import WorkerConfig
from .runtime_errors import MARKER, runtime_failure


def hand_motion(previous, current, elapsed_ms):
    """All emitted hand points, including absolute wrist motion relative to shoulders."""
    if previous is None or elapsed_ms <= 0 or elapsed_ms > MAX_GAP_MS:
        return 0.0
    old_xyz, old_mask = previous
    xyz, mask = current
    def normalize(points, valid):
        if valid[11] and valid[12]:
            center = ((points[11][0] + points[12][0]) / 2, (points[11][1] + points[12][1]) / 2)
            scale = max(math.dist(points[11][:2], points[12][:2]), .05)
        else:
            center, scale = (0.5, 0.5), .25
        return [((p[0] - center[0]) / scale, (p[1] - center[1]) / scale) for p in points]
    old, new = normalize(old_xyz, old_mask), normalize(xyz, mask)
    values = []
    for start in (33, 54):
        indices = [i for i in range(start, start + 21) if mask[i] and old_mask[i]]
        if len(indices) >= 10:
            values.append(sum(math.dist(old[i], new[i]) for i in indices) / len(indices))
    return max(values, default=0) * 100 / elapsed_ms


class StreamEngine:
    def __init__(self, checkpoint, stream_id, model=VISIGN_MODEL):
        from .visign_provider import load_model
        from .worker import RUNTIME
        for package in ("mediapipe", "numpy", "opencv-contrib-python"):
            require(importlib.metadata.version(package) == RUNTIME[package],
                    "runtime_version", "Camera runtime differs from verified environment")
        import mediapipe as mp
        self.connections = sorted([list(edge) for edge in mp.solutions.holistic.POSE_CONNECTIONS]
                                  + [[a + offset, b + offset] for offset in (33, 54)
                                     for a, b in mp.solutions.holistic.HAND_CONNECTIONS])
        self.descriptor = model
        if model == GH_TCN_MODEL:
            from .gh_tcn_provider import load_model as load_tcn
            import torch
            require(importlib.metadata.version("torch") == RUNTIME["torch"],
                    "runtime_version", "TCN runtime differs from verified environment")
            torch.set_num_threads(1)
            self.model = load_tcn(checkpoint)
        elif model == VIDEOMAE_MODEL:
            from .videomae_provider import RGBModel
            self.model = RGBModel(checkpoint)
        else:
            self.model = load_model(checkpoint)
        self.stream_id = stream_id
        from .tracker import CpuHolistic, HandRecovery
        self.holistic = CpuHolistic()
        self.hand_recovery = None
        try:
            if model == GH_TCN_MODEL:
                self.hand_recovery = HandRecovery()
        except Exception:
            self.holistic.close()
            raise
        # RGB inference blocks frame acknowledgement. Run it only after the sign
        # ends so slow provisional inference cannot discard the ongoing motion.
        self.segmenter = (SignSegmenter(end_hold_ms=500, prediction_interval_ms=None,
                                       end_on_missing_hands=False, motion_window=3)
                          if model in (VIDEOMAE_MODEL, GH_TCN_MODEL) else SignSegmenter())
        self.previous = None
        self.last_stamp = None
        self.last_label = None
        self.stable_updates = 0
        self.last_segment = 0

    def frame(self, header, data):
        import cv2
        import numpy as np
        from app.desktop_collector.vsl_features import pack_landmarks
        from app.desktop_collector.vsl_baseline import encode_clip, scores
        started = time.perf_counter()
        validate_frame_header(header)
        width, height = validate_frame_pixels(header, data)
        if header.get("format") == "rgba8":
            rgba = np.frombuffer(data, dtype=np.uint8).reshape(height, width, 4)
            rgb = cv2.cvtColor(rgba, cv2.COLOR_RGBA2RGB)
        else:
            frame = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
            require(frame is not None and frame.shape == (height, width, 3),
                    "stream_media", "Cannot decode camera PNG")
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        decoded = time.perf_counter()
        stamp = header["timestamp_ms"]
        elapsed = 0 if self.last_stamp is None else stamp - self.last_stamp
        gap = elapsed > MAX_GAP_MS
        if gap:
            self.holistic.reset()
            if self.hand_recovery:
                self.hand_recovery.reset()
            self.previous = None
        rgb.flags.writeable = False
        tracking_rgb = cv2.resize(rgb, (360, 360)) if self.descriptor == GH_TCN_MODEL else rgb
        tracking_rgb.flags.writeable = False
        landmarks = self.holistic.process(tracking_rgb)
        recovery_started = time.perf_counter()
        recovered, attempted = [], False
        if self.hand_recovery:
            landmarks, recovered, attempted = self.hand_recovery.process(rgb, landmarks, stamp)
        tracked = time.perf_counter()
        xyz, mask, visibility = pack_landmarks(landmarks)
        current = (xyz.tolist(), mask.tolist())
        motion = hand_motion(self.previous, current, elapsed)
        self.previous, self.last_stamp = current, stamp
        hands = bool(mask[33:].any())
        feature = ((xyz, mask, self.model.crop(rgb)) if self.descriptor == VIDEOMAE_MODEL else (xyz, mask))
        if self.descriptor == GH_TCN_MODEL:
            from .gh_tcn_provider import pack_landmarks as pack_gh
            feature = (xyz, mask, pack_gh(landmarks))
        phase, selected, reason = self.segmenter.sample(stamp, motion, feature, hands,
                                                       finish_segment=header.get("finish_segment"))
        prediction = None
        quality = {"motion": motion, "hands_present": hands, "history_frames": len(self.segmenter.history),
                   "reset_reason": reason, "frame_gap_ms": elapsed if gap else 0,
                   "resolution": [width, height], "awaiting_quiet": self.segmenter.await_quiet,
                   "frame_format": header.get("format", "png"),
                   "tracker_profile": "holistic-cpu2-recovery-v2" if self.hand_recovery else "holistic-cpu2-v1",
                   "tracking_resolution": list(tracking_rgb.shape[1::-1]),
                   "recovery_attempted": attempted, "recovered_hands": recovered,
                   "recovery_ms": (tracked - recovery_started) * 1000 if attempted else 0,
                   "decode_ms": (decoded - started) * 1000, "tracking_ms": (tracked - decoded) * 1000}
        if self.last_segment != self.segmenter.segment_id or gap:
            self.last_label, self.stable_updates = None, 0
            self.last_segment = self.segmenter.segment_id
        if phase:
            result = stream_prediction(self.stream_id, self.segmenter.segment_id, header["sequence"], self.descriptor)
            coverage = sum(item[2] for item in selected) / len(selected) if selected else 0
            common = {"experimental": True, "source_semantics_verified": False, "unknown_rejection": False,
                      "continuous_tracking": True, "partial_gesture": phase == "provisional",
                      "frames_decoded": len(selected), "frames_selected": 32 if self.descriptor == GH_TCN_MODEL else 16,
                      "hand_coverage": coverage, "timestamp_basis": "browser_monotonic_ms",
                      "segment_start_ms": selected[0][0] if selected else stamp,
                      "segment_end_ms": selected[-1][0] if selected else stamp,
                      "boundary_reason": reason or ("stillness" if phase == "final" else None),
                      "resolution": [width, height]}
            if len(selected) < 5 or coverage < .5:
                result = replace(result, status="insufficient_data", error_code="hands_missing",
                                 rejection_reason="Keep your hands and upper body visible throughout the sign.",
                                 quality=common)
                self.last_label, self.stable_updates = None, 0
            elif self.descriptor == GH_TCN_MODEL:
                result = self.tcn_prediction(result, selected, phase, reason, common)
            elif self.descriptor == VIDEOMAE_MODEL:
                result = self.rgb_prediction(result, selected, phase, reason, common)
            else:
                encoded = encode_clip(np.stack([item[1][0] for item in selected]),
                                      np.stack([item[1][1] for item in selected]))
                classify = time.perf_counter()
                top = map_scores(scores(self.model, encoded).tolist(), classes(), VISIGN_MODEL)
                label = top[0]["label_id"]
                self.stable_updates = self.stable_updates + 1 if self.last_label == label else 1
                self.last_label = label
                result = replace(result, status="ok", top_k=top,
                                 quality={**common, "stable_updates": self.stable_updates},
                                 latency_ms={"model": (time.perf_counter() - classify) * 1000})
            prediction = replace(result, latency_ms={**result.latency_ms,
                                                    "total": (time.perf_counter() - started) * 1000}).to_dict()
        quality["processing_ms"] = (time.perf_counter() - started) * 1000
        quality["tracking"] = {"schema": "holistic-overlay-v1", "xy": xyz[:, :2].tolist(),
                               "present": mask.tolist(), "pose_visibility": visibility.tolist(),
                               "connections": self.connections}
        return {"type": "frame", "sequence": header["sequence"], "timestamp_ms": stamp,
                "state": self.segmenter.state, "phase": phase,
                "segment_id": self.segmenter.segment_id, "prediction": prediction, "quality": quality}

    def tcn_prediction(self, result, selected, phase, boundary, common):
        import numpy as np
        from app.desktop_collector.vsl_gh_experiment import AuditError, encode_segment
        from .gh_tcn_provider import infer_encoded
        common = {**common, "frames_selected": 32,
                  "unknown_rejection": "experimental_unverified_on_webcam",
                  "model_input_transform": "resize-360-square-holistic-gh137-current-frame-palm-recovery",
                  "tracking_recovery": "experimental_unverified_on_webcam"}
        # No provisional words or truncated segments: evaluate one complete movement.
        if phase != "final" or boundary in ("max_duration", "frame_gap"):
            return replace(result, status="insufficient_data", error_code="incomplete_sign",
                           rejection_reason=("Auto could not find the end within 5.5 seconds. Repeat one sign and press Recognize now when finished."
                                             if boundary == "max_duration" else
                                             "Movement was interrupted or incomplete. Repeat one complete sign."), quality=common)
        try:
            encoded, coverage = encode_segment(np.stack([item[1][2] for item in selected]))
        except AuditError:
            return replace(result, status="insufficient_data", error_code="hands_missing",
                           rejection_reason="Keep your hands and upper body visible throughout the sign.", quality=common)
        started = time.perf_counter()
        values = infer_encoded(self.model, encoded)
        index, reason = acceptance(values)
        return replace(result, status="rejected" if reason else "ok",
                       top_k=() if reason else map_scores(values[:25], gh_classes(), GH_TCN_MODEL),
                       error_code=("outside_vocabulary" if index == 25 else "uncertain_sign") if reason else None,
                       rejection_reason=reason, latency_ms={"model": (time.perf_counter() - started) * 1000},
                       quality={**common, **coverage, "native_top1_index": index,
                                "native_top1_score": values[index], "other_score": values[25],
                                "native_winner_supported": index < 25,
                                **({"candidate_top_k": list(map_scores(values[:25], gh_classes(), GH_TCN_MODEL))} if reason else {}),
                                "accept_threshold": ACCEPT_THRESHOLD})

    def rgb_prediction(self, result, selected, phase, boundary, common):
        duration = selected[-1][0] - selected[0][0]
        if duration < 700 or boundary in ('max_duration', 'frame_gap'):
            self.last_label, self.stable_updates = None, 0
            return replace(result, status='insufficient_data', error_code='incomplete_sign',
                           rejection_reason='Capture one complete sign, then hold still.', quality=common)
        probabilities, elapsed = self.model.infer([item[1][2] for item in selected])
        label = max(range(100), key=probabilities.__getitem__)
        self.stable_updates = self.stable_updates + 1 if self.last_label == label else 1
        self.last_label = label
        top, quality, reason = decide(probabilities, phase=phase, duration_ms=duration,
                                      stable_updates=self.stable_updates, boundary=boundary)
        return replace(result, status='rejected' if reason else 'ok', top_k=top,
                       error_code='uncertain_sign' if reason else None, rejection_reason=reason,
                       latency_ms={'model': elapsed}, quality={**common, **quality, 'device': 'cuda:0',
                           'gpu_name': self.model.device_name,
                           'model_input_transform': 'shortest-edge-224-center-crop-imagenet'})

    def close(self):
        try:
            self.holistic.close()
        finally:
            if self.hand_recovery:
                self.hand_recovery.close()
        self.segmenter.reset()
        self.previous = None
        self.model = None


def run(response_fd, hello_id, configuration):
    engine = None
    try:
        config = decode(configuration.encode("utf-8"))
        require(set(config) in ({"workspace", "python", "stream_id"},
                               {"workspace", "python", "stream_id", "provider_id"}),
                "worker_protocol", "Invalid camera worker configuration")
        model = get_model(config.get('provider_id', VISIGN_MODEL.provider_id))
        require(model in (VISIGN_MODEL, VIDEOMAE_MODEL, GH_TCN_MODEL), 'unsupported_provider', 'Unsupported stream model')
        if model == VIDEOMAE_MODEL:
            from .videomae_provider import bootstrap
            bootstrap(config['workspace'])
        paths = WorkerConfig(workspace=config["workspace"], python=config["python"]).paths(model)
        engine = StreamEngine(paths["checkpoint"], config["stream_id"], model)
        clock = FrameClock()
        with os.fdopen(response_fd, "wb") as output:
            output.write(encode({"protocol_version": STREAM_PROTOCOL, "request_id": hello_id,
                                 "status": "ready", "stream_id": config["stream_id"], "pid": os.getpid(),
                                 'provider_id': model.provider_id}))
            output.flush()
            while raw := sys.stdin.buffer.readline(4097):
                require(len(raw) <= 4096 and raw.endswith(b"\n"), "worker_protocol", "Invalid camera request")
                request = decode(raw)
                require(request.get("protocol_version") == STREAM_PROTOCOL,
                        "worker_protocol", "Invalid camera worker protocol")
                if request.get("operation") == "shutdown":
                    require(set(request) == {"protocol_version", "operation", "request_id"},
                            "worker_protocol", "Invalid camera shutdown request")
                    return 0
                require(set(request) == {"protocol_version", "operation", "request_id", "header", "bytes"}
                        and request["operation"] == "frame" and type(request["bytes"]) is int
                        and 33 <= request["bytes"] <= MAX_FRAME_BYTES,
                        "worker_protocol", "Invalid camera frame request")
                clock.accept(request["header"], time.monotonic())
                require(request["request_id"] == f"{config['stream_id']}-{request['header']['sequence']}",
                        "worker_protocol", "Invalid camera request identity")
                data = sys.stdin.buffer.read(request["bytes"])
                require(len(data) == request["bytes"], "worker_protocol", "Truncated camera frame")
                frame = engine.frame(request["header"], data)
                output.write(encode({"protocol_version": STREAM_PROTOCOL, "request_id": request["request_id"],
                                     "frame": frame}))
                output.flush()
        return 0
    except Exception as error:
        # No pixels, encoded payloads, tokens or user paths in diagnostics.
        failure = runtime_failure(error)
        print(MARKER + (failure.code if failure else 'worker_failure'), file=sys.stderr, flush=True)
        return 2
    finally:
        if engine:
            engine.close()
