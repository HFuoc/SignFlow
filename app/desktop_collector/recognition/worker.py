"""Isolated ML entry point. Never imported by desktop startup or orchestration."""
from __future__ import annotations

import ast
from contextlib import contextmanager
from dataclasses import replace
import hashlib
import importlib.metadata
import io
import os
from pathlib import Path
import re
import sys
import time
import traceback
from app.desktop_collector.kvsl_manifest import REPOSITORY

from .adapter import KVSLVideoAdapter, contained, verified_file
from .registry import get_model, runtime_providers
from .contracts import (prediction_identity, MODEL, PROTOCOL, FeatureSequence, PredictionResult,
                        RecognitionError, decode, encode, map_scores, require)
from .contracts import PERSISTENT_PROTOCOL, WORKER_IDENTITY, WORKER_VERSION
from .contracts import FEATURE_SCHEMA, PREPROCESSING
from .captures import resolve_capture, MAX_CAPTURE_SECONDS
from .experimental import VISIGN_MODEL
from .gh_tcn import GH_TCN_MODEL
from .runtime_errors import MARKER, runtime_failure

# UTF-8 source hashes after universal-newline normalization, verified at SOURCE_COMMIT.
SOURCE_HASHES = {
    "data/constants.py": "996d20bfec5b6b7beb2bbe128feecf908b7ef7d350e2bacb5c7b83bf371c0a4f",
    "data/checkpoint_extraction.py": "210f86957c4c28b6fb1d8c099b4e1236a3ab98856b8dba6aac0dc46398a343c6",
    "app/backend/src/models/gcn_model.py": "736beaefcd0719cce8f50e8aebfe95786cc3a724e92d1e176973d100bdc158c0",
    "app/backend/src/services/prediction_gcn.py": "2c0218cd4695c0714db363da49ffb9afaafa6ff2b1704405e03d4af717be49ad",
}
RUNTIME = {"torch": "2.5.1+cpu", "torch-geometric": "2.4.0", "mediapipe": "0.10.14",
           "numpy": "1.26.4", "opencv-contrib-python": "4.10.0.84"}


def load_sources(root: Path) -> dict:
    sources = {}
    for name, expected in SOURCE_HASHES.items():
        try:
            text = contained(root, name).read_text(encoding="utf-8")
        except OSError:
            raise RecognitionError("missing_source", "Pinned local KVSL source is unavailable") from None
        require(hashlib.sha256(text.encode("utf-8")).hexdigest() == expected,
                "source_hash", "KVSL implementation differs from verified source", "rejected")
        sources[name] = text
    return sources


def compile_functions(text: str, names: set, scope: dict) -> None:
    nodes = [n for n in ast.parse(text).body if isinstance(n, ast.FunctionDef) and n.name in names]
    require({n.name for n in nodes} == names, "source_contract", "Missing pinned function")
    exec(compile(ast.Module(body=nodes, type_ignores=[]), "<pinned-kvsl-functions>", "exec"), scope)


def validate_weights(weights, model=MODEL) -> None:
    require("fc.weight" in weights and tuple(weights["fc.weight"].shape) == (model.class_count, 256),
            "output_class_count", "Checkpoint output class count mismatch", "rejected")
    require("conv1.lin.weight" in weights and tuple(weights["conv1.lin.weight"].shape) == (256, 180),
            "feature_mismatch", "Checkpoint input shape mismatch", "rejected")


class KVSLGCNProvider:
    def __init__(self, checkpoint: Path, sources: dict, video, request_id: str, model=MODEL):
        self.descriptor = model
        # Hash the bytes actually loaded; no second unverified checkpoint read.
        data = verified_file(checkpoint, model.model_sha256, "model_hash")
        import torch
        from torch_geometric.data import Batch, Data
        self.torch, self.Batch, self.Data = torch, Batch, Data
        torch.set_num_threads(1)
        scope = {}
        exec(compile(sources["app/backend/src/models/gcn_model.py"], "<pinned-kvsl-model>", "exec"), scope)
        weights = torch.load(io.BytesIO(data), map_location="cpu", weights_only=True)
        validate_weights(weights, model)
        self.model = scope["STGCN"](num_node_features=180, num_classes=model.class_count)
        try:
            self.model.load_state_dict(weights, strict=True)
        except RuntimeError:
            raise RecognitionError("model_compatibility", "Checkpoint architecture mismatch", "rejected") from None
        self.model.eval()
        compile_functions(sources["app/backend/src/services/prediction_gcn.py"],
                          {"create_fully_connected_edge_index"}, scope)
        self.edge = scope["create_fully_connected_edge_index"](65)
        self.video, self.request_id = video, request_id

    def describe(self):
        return self.descriptor

    def predict(self, sequence: FeatureSequence) -> PredictionResult:
        sequence.validate(self.descriptor)
        require((sequence.source_sample_id, sequence.source_recording_id, sequence.topic_id,
                 sequence.source_provenance) ==
                (self.video.ref.sample_id, self.video.ref.recording_id, self.video.ref.topic_id, self.video.provenance),
                "feature_mismatch", "Feature source identity mismatch", "rejected")
        torch = self.torch
        x = torch.tensor(sequence.values, dtype=torch.float32).permute(1, 0, 2).reshape(65, 180)
        batch = self.Batch.from_data_list([self.Data(x=x, edge_index=self.edge)])
        start = time.perf_counter()
        with torch.inference_mode():
            logits = self.model(batch)
            require(tuple(logits.shape) == self.descriptor.expected_output_shape,
                    "output_class_count", "Model output shape mismatch", "rejected")
            scores = torch.softmax(logits, dim=1)[0].tolist()
        return PredictionResult(request_id=self.request_id, sample_id=sequence.source_sample_id,
                                source_kind=sequence.source_provenance.get("source_kind", "manifest_sample"),
                                capture_id=sequence.source_provenance.get("capture_id"),
                                recording_id=sequence.source_recording_id, topic_id=sequence.topic_id,
                                **prediction_identity(self.descriptor), status="ok", top_k=map_scores(scores, self.video.classes, self.descriptor),
                                source_provenance=sequence.source_provenance,
                                latency_ms={"model": (time.perf_counter() - start) * 1000})


def preprocess(video, sources: dict, model=MODEL, *, runtime=None) -> tuple[FeatureSequence, dict, float]:
    import cv2
    import mediapipe as mp
    import numpy as np

    scope = {"np": np, "cv2": cv2}
    exec(compile(sources["data/constants.py"], "<pinned-kvsl-constants>", "exec"), scope)
    compile_functions(sources["data/checkpoint_extraction.py"],
                      {"mediapipe_detection", "extract_keypoints", "interpolate_keypoints"}, scope)
    start = time.perf_counter()
    cap = cv2.VideoCapture(str(video.path))
    frames, masks = [], []
    capture_times = []
    missing = {"pose": 0, "left_hand": 0, "right_hand": 0}
    try:
        require(cap.isOpened(), "video_decode", "Cannot decode referenced video", "insufficient_data")
        fps = cap.get(cv2.CAP_PROP_FPS)
        live = video.provenance.get("source_kind") == "live_camera_capture"
        if live:
            width, height = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            require(np.isfinite(width) and np.isfinite(height) and min(width, height) >= 16 and width * height <= 1920 * 1080,
                    "capture_media", "Camera resolution exceeds limit", "rejected")
        processing = (runtime.clip() if runtime else mp.solutions.holistic.Holistic(
            model_complexity=1, min_detection_confidence=0.7,
            min_tracking_confidence=0.7, smooth_landmarks=True))
        with processing as holistic:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                if live:
                    require(frame.shape[0] * frame.shape[1] <= 1920 * 1080 and min(frame.shape[:2]) >= 16,
                            "capture_media", "Camera resolution exceeds limit", "rejected")
                    stamp = float(cap.get(cv2.CAP_PROP_POS_MSEC)) / 1000
                    require(np.isfinite(stamp) and stamp >= 0 and
                            (not capture_times or stamp >= capture_times[-1]),
                            "capture_media", "Invalid camera timestamps", "rejected")
                    capture_times.append(stamp)
                    require(len(frames) < 720 and stamp - capture_times[0] <= MAX_CAPTURE_SECONDS,
                            "capture_duration", "Camera clip exceeds six seconds", "rejected")
                _, result = scope["mediapipe_detection"](frame, holistic)
                frames.append(scope["extract_keypoints"](result))
                mask = []
                for group, count in (("pose", 23), ("left_hand", 21), ("right_hand", 21)):
                    valid = getattr(result, group + "_landmarks") is not None
                    missing[group] += int(not valid)
                    mask.extend([valid] * count)
                masks.append(tuple(mask))
    finally:
        cap.release()
    require(bool(frames), "empty_video", "No frames decoded", "insufficient_data")
    if live:
        require(len(frames) >= 5, "capture_short", "Too few decoded camera frames", "insufficient_data")
        require(capture_times[-1] > capture_times[0], "capture_media", "Camera duration unavailable", "rejected")
    selected = np.linspace(0, len(frames) - 1, 60).astype(int)
    values = scope["interpolate_keypoints"](frames)
    require(values.shape == (60, 65, 3) and np.isfinite(values).all(),
            "feature_mismatch", "Preprocessor output mismatch", "rejected")
    # Preserve upstream float64 extraction until the same float32 model boundary.
    values = values.astype(np.float32)
    usable_fps = bool(np.isfinite(fps) and fps > 0)
    sequence = FeatureSequence(
        source_sample_id=video.ref.sample_id, source_recording_id=video.ref.recording_id,
        topic_id=video.ref.topic_id, values=tuple(tuple(tuple(p) for p in f) for f in values.tolist()),
        valid_mask=tuple(masks[i] for i in selected),
        timestamps=tuple(capture_times[i] if live else float(i / fps) if usable_fps else None for i in selected),
        source_provenance=video.provenance,
        source_dataset="live_camera_capture" if live else REPOSITORY,
    )
    sequence.validate(model)
    quality = {"frames_decoded": len(frames), "frames_selected": 60, "missing_group_frames": missing,
               "selected_frame_indices": selected.tolist(), "fps": float(fps) if usable_fps else None,
               "timestamp_basis": "frame_index/fps_seconds" if usable_fps else "unavailable",
               "warnings": [] if usable_fps else ["Video frame rate unavailable"], "runtime": RUNTIME}
    quality["feature_sha256"] = hashlib.sha256(values.tobytes()).hexdigest()
    quality["feature_shape"] = list(values.shape)
    if live:
        quality.update(timestamp_basis="decoded_presentation_timestamp_seconds",
                       decoded_span_seconds=capture_times[-1] - capture_times[0],
                       resolution=[int(width), int(height)])
    return sequence, quality, (time.perf_counter() - start) * 1000


class WorkerRuntime:
    """One runtime, isolated clip tracking, ten KVSL providers and one research model."""
    def __init__(self):
        for package, version in RUNTIME.items():
            require(importlib.metadata.version(package) == version, "runtime_version",
                    "Isolated runtime differs from verified environment", "rejected")
        import torch
        import torch_geometric
        import cv2
        import numpy
        import mediapipe as mp
        torch.set_num_threads(1)
        self.holistic = mp.solutions.holistic.Holistic(
            model_complexity=1, min_detection_confidence=0.7,
            min_tracking_confidence=0.7, smooth_landmarks=True)
        self.used = False
        self.providers = {}
        self.hits = self.misses = 0
        self.visign_holistic = None
        self.visign_model = None
        self.gh_tcn_model = None

    @contextmanager
    def visign_clip(self):
        if self.visign_holistic is None:
            import mediapipe as mp
            self.visign_holistic = mp.solutions.holistic.Holistic(
                static_image_mode=False, model_complexity=1,
                min_detection_confidence=0.5, min_tracking_confidence=0.5, smooth_landmarks=True)
        else:
            self.visign_holistic.reset()
        yield self.visign_holistic

    @contextmanager
    def clip(self):
        # Restart the graph run between independent recordings: tracking/filter state
        # must never flow from one signer/video to the next.
        if self.used:
            self.holistic.reset()
        self.used = True
        yield self.holistic

    def provider(self, checkpoint, sources, video, request_id, model):
        require(get_model(model.provider_id) == model and model.feature_schema_id == FEATURE_SCHEMA and
                model.preprocessing_id == PREPROCESSING and model.expected_input_shape == (65, 180) and
                model.expected_output_shape == (1, model.class_count),
                "model_hash", "Provider descriptor is not the verified contract", "rejected")
        start = time.perf_counter()
        cached = self.providers.get(model.provider_id)
        hit = cached is not None
        if hit:
            provider, pinned_path = cached
            require(pinned_path == checkpoint and provider.descriptor == model,
                    "model_hash", "Cached provider identity changed", "rejected")
            self.hits += 1
        else:
            # Constructor hashes the exact bytes loaded, validates input/output shapes
            # and strict architecture. Only successful verified models enter the cache.
            provider = KVSLGCNProvider(checkpoint, sources, video, request_id, model)
            self.providers[model.provider_id] = (provider, checkpoint)
            self.misses += 1
            print(f"provider_load request_id={request_id} provider_id={model.provider_id}", file=sys.stderr)
        # Execution is serial. Refresh per-request identity even on a cache hit.
        provider.video, provider.request_id = video, request_id
        return provider, hit, (time.perf_counter()-start)*1000

    def close(self):
        self.holistic.close()
        if self.visign_holistic is not None:
            self.visign_holistic.close()
        self.visign_model = None
        self.gh_tcn_model = None
        self.providers.clear()


def handle(request: dict, runtime=None, capture_root=None) -> PredictionResult:
    live = request.get("operation") == "predict_live_capture" and runtime is not None
    source_key = "capture_id" if live else "sample_id"
    require(set(request) == {"protocol_version", "operation", "request_id", source_key, "provider_id", "config", "workspace"}
            and request["protocol_version"] == (PERSISTENT_PROTOCOL if runtime else PROTOCOL)
            and request["operation"] == ("predict_live_capture" if live else "predict_manifest_sample")
            and isinstance(request["request_id"], str) and re.fullmatch(r"[A-Za-z0-9-]{1,64}", request["request_id"]),
            "worker_protocol", "Unsupported worker request")
    result = PredictionResult(request_id=request["request_id"], sample_id=request.get("sample_id"),
                              source_kind="live_camera_capture" if live else "manifest_sample",
                              capture_id=request.get("capture_id"))
    try:
        model = get_model(request["provider_id"])
        result = replace(result, **prediction_identity(model))
        require(model.requires_topic or live, "unsupported_input", "Research model accepts camera captures only", "unsupported")
        root = Path(request["workspace"]).resolve()
        config = request["config"]
        require(set(config) == {"manifest", "upstream", "assets", "checkpoint"}, "worker_protocol", "Invalid worker configuration")
        paths = {k: Path(v).resolve() for k, v in config.items()}
        require(all(p.is_relative_to(root) for p in paths.values()) and
                paths["checkpoint"].is_relative_to(paths["assets"]), "path_escape", "Worker path escapes trusted root")
        video = (resolve_capture(capture_root, request["capture_id"], paths["assets"], model) if live else
                 KVSLVideoAdapter(paths["manifest"], paths["assets"], model).resolve(request["sample_id"]))
        result = replace(result, recording_id=video.ref.recording_id, topic_id=video.ref.topic_id,
                         source_provenance=video.provenance)
        if model == GH_TCN_MODEL:
            from .gh_tcn_provider import predict
            return predict(video, paths["checkpoint"], result, runtime)
        if model == VISIGN_MODEL:
            from .visign_provider import predict
            return predict(video, paths["checkpoint"], result, runtime)
        if model.family == 'videomae':
            from .videomae_provider import predict
            require(runtime is not None and hasattr(runtime, 'rgb_model'), 'runtime_version',
                    'VideoMAE requires its isolated CUDA worker')
            return predict(video, paths['checkpoint'], result, runtime)
        sources = load_sources(paths["upstream"])
        if runtime:
            provider, hit, load_ms = runtime.provider(paths["checkpoint"], sources, video, result.request_id, model)
        else:
            for package, version in RUNTIME.items():
                require(importlib.metadata.version(package) == version, "runtime_version",
                        "Isolated runtime differs from verified environment", "rejected")
            provider = KVSLGCNProvider(paths["checkpoint"], sources, video, result.request_id, model)
        sequence, quality, latency = preprocess(video, sources, model, runtime=runtime)
        result = provider.predict(sequence)
        if runtime:
            quality.update(cache_hit=hit, cache_hits=runtime.hits, cache_misses=runtime.misses,
                           loaded_providers=len(runtime.providers))
            result = replace(result, latency_ms={**result.latency_ms, "provider_load": load_ms})
        return replace(result, quality=quality, latency_ms={**result.latency_ms, "preprocess": latency})
    except RecognitionError as exc:
        return replace(result, status=exc.status, error_code=exc.code, rejection_reason=str(exc))
    except importlib.metadata.PackageNotFoundError:
        return replace(result, error_code="missing_runtime", rejection_reason="Required isolated ML dependency is unavailable")
    except Exception as error:
        failure = runtime_failure(error)
        if failure:
            return replace(result, error_code=failure.code, rejection_reason=str(failure))
        traceback.print_exc(file=sys.stderr)
        return replace(result, error_code="worker_inference", rejection_reason="Isolated inference failed; inspect worker diagnostics")


def persistent_main(response_fd, hello_id, configuration, *, cuda=False):
    runtime = None
    try:
        from .worker_client import WorkerConfig
        bootstrap = decode(configuration.encode("utf-8"))
        require(set(bootstrap) in ({"workspace", "manifest", "upstream", "assets", "checkpoint"},
                                  {"workspace", "manifest", "upstream", "assets", "checkpoint", "capture_root"}),
                "worker_configuration", "Invalid trusted startup configuration")
        config = WorkerConfig(**bootstrap)
        config.paths()
        with os.fdopen(response_fd, "wb") as output:
            if cuda:
                from .videomae_provider import bootstrap, ClipRuntime
                bootstrap(config.workspace)
                runtime = ClipRuntime()
            else:
                runtime = WorkerRuntime()
            output.write(encode({"protocol_version": PERSISTENT_PROTOCOL, "request_id": hello_id,
                                 "status": "ready", "worker_identity": WORKER_IDENTITY,
                                 "worker_version": WORKER_VERSION,
                                 "providers": runtime_providers(cuda=cuda),
                                 "runtime_ready": True, "pid": os.getpid()}))
            output.flush()
            while raw := sys.stdin.buffer.readline(65537):
                require(len(raw) <= 65536 and raw.endswith(b"\n"), "worker_protocol", "Invalid request frame")
                request = decode(raw)
                require(request.get("protocol_version") == PERSISTENT_PROTOCOL and
                        isinstance(request.get("request_id"), str) and
                        re.fullmatch(r"[A-Za-z0-9-]{1,64}", request["request_id"]),
                        "worker_protocol", "Invalid request identity")
                if request.get("operation") == "shutdown":
                    require(set(request) == {"protocol_version", "operation", "request_id"},
                            "worker_protocol", "Invalid shutdown request")
                    return 0
                source_key = "capture_id" if request.get("operation") == "predict_live_capture" else "sample_id"
                require(set(request) == {"protocol_version", "operation", "request_id", source_key, "provider_id"},
                        "worker_protocol", "Prediction requests accept IDs only")
                model = get_model(request["provider_id"])
                require((model.family == 'videomae') == cuda, 'unsupported_provider',
                        'Provider does not belong to this isolated runtime')
                paths = config.paths(model)
                # Paths come only from trusted startup configuration and the registry,
                # never from a prediction request, Studio or the public API.
                result = handle({**request, "workspace": config.workspace,
                                 "config": {k: str(v) for k, v in paths.items() if k != "python"}}, runtime, config.capture_root)
                output.write(encode({"protocol_version": PERSISTENT_PROTOCOL, "request_id": request["request_id"],
                                     "prediction": result.to_dict()}))
                output.flush()
        return 0
    except Exception as error:
        failure = runtime_failure(error)
        if failure:
            print(MARKER + failure.code, file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        return 2
    finally:
        if runtime:
            runtime.close()


def main() -> int:
    # Redirect at the OS descriptor level too: native INFO and Python prints cannot corrupt IPC.
    response_fd = os.dup(sys.stdout.fileno())
    os.dup2(sys.stderr.fileno(), sys.stdout.fileno())
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
    if len(sys.argv) == 4 and sys.argv[1] == "--stream":
        from .stream_worker import run
        return run(response_fd, sys.argv[2], sys.argv[3])
    if len(sys.argv) == 4 and sys.argv[1] == "--persistent":
        return persistent_main(response_fd, sys.argv[2], sys.argv[3])
    if len(sys.argv) == 4 and sys.argv[1] == '--videomae':
        return persistent_main(response_fd, sys.argv[2], sys.argv[3], cuda=True)
    try:
        raw = sys.stdin.buffer.read(65537)
        require(len(raw) <= 65536, "worker_protocol", "Worker request exceeds limit")
        request = decode(raw)
        result = handle(request)
        with os.fdopen(response_fd, "wb") as output:
            output.write(encode({"protocol_version": PROTOCOL, "request_id": request["request_id"],
                                 "prediction": result.to_dict()}))
        return 0
    except Exception:
        traceback.print_exc(file=sys.stderr)
        os.close(response_fd)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
