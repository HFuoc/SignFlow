"""Framework-neutral orchestration for offline callers and background jobs."""
from dataclasses import fields, replace
import math
import logging
import time
import uuid
import threading

from .adapter import KVSLVideoAdapter
from .registry import REGISTRY, get_model
from .contracts import prediction_identity, MODEL, PredictionResult, RecognitionError, encode, require
from .worker_client import WorkerConfig
from .persistent_client import PersistentRecognitionWorkerClient
from .captures import CaptureStore, resolve_capture
from .videomae import VIDEOMAE_MODEL


def _validate_ranking(top, classes, score_kind):
    require(isinstance(top, list) and len(top) == 3, "worker_protocol", "Invalid ranking")
    seen, order = set(), []
    for item in top:
        require(isinstance(item, dict) and set(item) == {"source_class_index", "label_id", "display_name", "score"},
                "worker_protocol", "Invalid prediction entry")
        i, score = item["source_class_index"], item["score"]
        require(type(i) is int and 0 <= i < len(classes) and i not in seen and
                item["label_id"] == classes[i]["label_id"] and item["display_name"] == classes[i]["label"] and
                type(score) in (float, int) and math.isfinite(score) and
                (score_kind == "raw_ridge" or 0 <= score <= 1),
                "worker_protocol", "Invalid prediction class/score")
        seen.add(i)
        order.append((-score, i))
    require(order == sorted(order), "worker_protocol", "Unstable top-k order")


def validate_prediction(value: dict, expected: PredictionResult, classes: list) -> PredictionResult:
    require(expected.score_kind in ("uncalibrated_softmax", "uncalibrated_softmax_subset", "raw_ridge"),
            "worker_protocol", "Unsupported score kind")
    require(set(value) == {f.name for f in fields(PredictionResult)}, "worker_protocol", "Prediction fields differ from contract")
    for key in ("schema_version", "request_id", "sample_id", "source_kind", "capture_id", "recording_id", "topic_id", "provider_id", "model_id",
                "model_version", "model_sha256", "modality", "feature_schema_id", "preprocessing_id",
                "preprocessing_version", "vocabulary_id", "score_kind", "source_provenance"):
        require(value[key] == expected.to_dict()[key], "worker_protocol", "Prediction identity/provenance mismatch")
    require(value["status"] in ("ok", "rejected", "insufficient_data", "unsupported", "error"),
            "worker_protocol", "Unknown prediction status")
    require(isinstance(value["quality"], dict) and isinstance(value["latency_ms"], dict) and
            all(type(v) in (float, int) and math.isfinite(v) and v >= 0 for v in value["latency_ms"].values()),
            "worker_protocol", "Invalid quality/latency metadata")
    top = value["top_k"]
    require(isinstance(top, list), "worker_protocol", "Invalid top-k")
    if value["status"] == "ok":
        require(len(top) == 3 and value["error_code"] is None and value["rejection_reason"] is None,
                "worker_protocol", "Invalid successful prediction")
        _validate_ranking(top, classes, expected.score_kind)
    else:
        require(not top and isinstance(value["error_code"], str) and 0 < len(value["error_code"]) <= 64 and
                isinstance(value["rejection_reason"], str) and 0 < len(value["rejection_reason"]) <= 256,
                "worker_protocol", "Invalid failure response")
    if "candidate_top_k" in value["quality"]:
        require(value["status"] == "rejected" and expected.provider_id in ("vsl-gh-tcn-25", "visign-videomae-25")
                and value["error_code"] in ("uncertain_sign", "outside_vocabulary")
                and type(value["quality"].get("native_winner_supported")) is bool,
                "worker_protocol", "Invalid diagnostic candidates")
        candidates = value["quality"]["candidate_top_k"]
        _validate_ranking(candidates, classes, expected.score_kind)
        require(sum(item["score"] for item in candidates) <= 1 + 1e-5,
                "worker_protocol", "Invalid diagnostic probability mass")
    encode(value)
    return PredictionResult(**{**value, "top_k": tuple(top)})


class RecognitionService:
    def __init__(self, config: WorkerConfig | None = None):
        self.config = config or WorkerConfig()
        self.captures = CaptureStore()
        self.config = replace(self.config, capture_root=str(self.captures.root))
        self.worker = PersistentRecognitionWorkerClient(self.config)
        self.gpu_worker = PersistentRecognitionWorkerClient(self.config, cuda=True)
        self._mode_lock = threading.Lock()
        self._mode_owner = None

    def reserve_stream(self, stream_id):
        """Reserve model memory without interrupting a running manual prediction."""
        with self._mode_lock:
            require(self._mode_owner is None, 'recognition_busy', 'Wait for the current prediction to finish.')
            self._mode_owner = stream_id
        try:
            self.worker.invalidate()
            self.gpu_worker.invalidate()
        except BaseException:
            self.release_stream(stream_id)
            raise

    def release_stream(self, stream_id):
        with self._mode_lock:
            if self._mode_owner == stream_id:
                self._mode_owner = None

    def shutdown(self):
        self.worker.shutdown()
        self.gpu_worker.shutdown()
        self.captures.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.shutdown()

    def describe(self):
        return tuple(REGISTRY.values())

    def recognize(self, sample_id: str, provider_id: str = MODEL.provider_id,
                  *, cancel_event: threading.Event | None = None, capture_id: str | None = None) -> PredictionResult:
        start = time.perf_counter()
        result = PredictionResult(request_id=str(uuid.uuid4()), sample_id=sample_id, provider_id=provider_id)
        if capture_id is not None:
            result = replace(result, sample_id=None, source_kind="live_camera_capture", capture_id=capture_id)
        reserved = False
        try:
            with self._mode_lock:
                require(self._mode_owner is None, 'recognition_busy', 'Stop Auto or wait for the current prediction to finish.')
                self._mode_owner = result.request_id
                reserved = True
            model = get_model(provider_id)
            result = replace(result, **prediction_identity(model))
            paths = self.config.paths(model)
            video = (resolve_capture(self.config.capture_root, capture_id, paths["assets"], model) if capture_id else
                     KVSLVideoAdapter(paths["manifest"], paths["assets"], model).resolve(sample_id))
            result = replace(result, recording_id=video.ref.recording_id, topic_id=video.ref.topic_id,
                             source_provenance=video.provenance)
            options = {"capture_id": capture_id} if capture_id else {}
            if model == VIDEOMAE_MODEL:
                # Retain the GPU model between clips; streaming releases idle clip workers.
                self.worker.invalidate()
                reply = self.gpu_worker.invoke(result.request_id, sample_id, cancel_event, provider_id=provider_id, **options)
            else:
                self.gpu_worker.invalidate()
                reply = self.worker.invoke(result.request_id, sample_id, cancel_event, provider_id=provider_id, **options)
            logging.getLogger(__name__).debug("Recognition worker diagnostics: %s", reply.diagnostics)
            result = validate_prediction(reply.prediction, result, video.classes)
            result = replace(result, quality={**result.quality, "worker_exit_status": reply.exit_status})
        except RecognitionError as exc:
            if exc.code == "worker_protocol":
                self.worker.invalidate()
                self.gpu_worker.invalidate()
            result = replace(result, status=exc.status, error_code=exc.code, rejection_reason=str(exc), top_k=())
        except (TypeError, ValueError, KeyError, OSError):
            self.worker.invalidate()
            self.gpu_worker.invalidate()
            result = replace(result, status="error", error_code="worker_protocol", rejection_reason="Invalid configuration or worker result", top_k=())
        finally:
            if reserved:
                self.release_stream(result.request_id)
        return replace(result, latency_ms={**result.latency_ms, "total": (time.perf_counter() - start) * 1000})
