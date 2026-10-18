"""Versioned, framework-neutral offline contracts. Scores are uncalibrated."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
import math
from typing import Protocol

from app.desktop_collector.kvsl_manifest import ARTIFACT_COMMIT, REPOSITORY, SOURCE_COMMIT

FEATURE_SCHEMA = "mediapipe-pose23-left21-right21-xyz-v1"
PREPROCESSING = "kvsl-gcn-do-vat-60x65x3-v1"
PROTOCOL = "smartglove-recognition-worker-v1"
PERSISTENT_PROTOCOL = "smartglove-recognition-worker-v3"
WORKER_IDENTITY = "smartglove-kvsl-gcn"
WORKER_VERSION = "3"


class RecognitionError(ValueError):
    def __init__(self, code: str, message: str, status: str = "error"):
        super().__init__(message)
        self.code, self.status = code, status


def require(condition: bool, code: str, message: str, status: str = "error") -> None:
    if not condition:
        raise RecognitionError(code, message, status)


def encode(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"),
                       allow_nan=False) + "\n").encode("utf-8")


def decode(value: bytes) -> dict:
    def pairs(items):
        result = {}
        for key, item in items:
            if key in result:
                raise ValueError("Duplicate JSON key")
            result[key] = item
        return result
    result = json.loads(value.decode("utf-8"), object_pairs_hook=pairs,
                        parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Nonfinite JSON")))
    if not isinstance(result, dict):
        raise ValueError("Expected JSON object")
    # Also reject escaped unpaired surrogates.
    encode(result)
    return result


@dataclass(frozen=True, slots=True)
class ModelDescriptor:
    schema_version: str = "smartglove-model-descriptor-v1"
    provider_id: str = "kvsl-gcn-do-vat"
    model_id: str = "kvsl-gcn-do-vat"
    model_version: str = ARTIFACT_COMMIT
    topic_id: str = "do_vat"
    class_count: int = 20
    display_name: str = "Đồ vật"
    checkpoint_source: str = REPOSITORY
    checkpoint_commit: str = ARTIFACT_COMMIT
    checkpoint_path: str = "app/backend/Model/gcn/do_vat.pth"
    model_sha256: str = "ea64129ba9a3f66a955a65b65340906ede701ff4d2f1f97bb4031979817eaade"
    source_commit: str = SOURCE_COMMIT
    artifact_commit: str = ARTIFACT_COMMIT
    modality: str = "mediapipe_keypoints"
    feature_schema_id: str = FEATURE_SCHEMA
    preprocessing_id: str = PREPROCESSING
    preprocessing_version: int = 1
    expected_input_shape: tuple = (65, 180)
    expected_output_shape: tuple = (1, 20)
    label_map_sha256: str = "050f8b0781ecf6a37a0971560a765555ed63c3c6ba211506096861ba528db47e"
    family: str = "kvsl"
    experimental: bool = False
    requires_topic: bool = True
    supported_words: tuple = ()
    score_kind: str = "uncalibrated_softmax"


MODEL = ModelDescriptor()


@dataclass(frozen=True, slots=True)
class ManifestSampleRef:
    sample_id: str
    recording_id: str
    topic_id: str


@dataclass(frozen=True, slots=True)
class FeatureSequence:
    source_sample_id: str | None
    source_recording_id: str | None
    topic_id: str
    values: tuple
    valid_mask: tuple
    timestamps: tuple
    source_provenance: dict
    schema_version: str = "smartglove-feature-sequence-v1"
    modality: str = "mediapipe_keypoints"
    feature_schema_id: str = FEATURE_SCHEMA
    source_dataset: str = REPOSITORY
    sequence_length: int = 60
    feature_shape: tuple = (65, 3)
    dtype: str = "float32"
    preprocessing_id: str = PREPROCESSING
    preprocessing_version: int = 1

    def validate(self, model: ModelDescriptor = MODEL) -> None:
        require((self.schema_version, self.modality, self.feature_schema_id,
                 self.preprocessing_id, self.preprocessing_version, self.topic_id,
                 self.sequence_length, self.feature_shape, self.dtype, self.source_dataset) ==
                ("smartglove-feature-sequence-v1", MODEL.modality, FEATURE_SCHEMA,
                 model.preprocessing_id, model.preprocessing_version, model.topic_id, 60, (65, 3), "float32",
                 "live_camera_capture" if self.source_provenance.get("source_kind") == "live_camera_capture" else REPOSITORY),
                "feature_mismatch", "Feature contract is incompatible", "rejected")
        try:
            if not len(self.values) == len(self.valid_mask) == len(self.timestamps) == 60:
                raise ValueError()
            for frame, mask in zip(self.values, self.valid_mask):
                if not len(frame) == len(mask) == 65:
                    raise ValueError()
                for point, valid in zip(frame, mask):
                    if not (type(valid) is bool and len(point) == 3 and
                            all(type(x) in (float, int) and math.isfinite(x) for x in point) and
                            (valid or all(x == 0 for x in point))):
                        raise ValueError()
            if not (all(t is None for t in self.timestamps) or all(
                    type(t) in (float, int) and math.isfinite(t) and t >= 0 for t in self.timestamps)):
                raise ValueError()
            if self.timestamps[0] is not None:
                if list(self.timestamps) != sorted(self.timestamps):
                    raise ValueError()
        except (TypeError, ValueError):
            raise RecognitionError("feature_mismatch", "Invalid feature values/mask/timebase", "rejected") from None


@dataclass(frozen=True, slots=True)
class PredictionResult:
    request_id: str
    sample_id: str | None
    source_kind: str = "manifest_sample"
    capture_id: str | None = None
    recording_id: str | None = None
    topic_id: str | None = None
    status: str = "error"
    top_k: tuple = ()
    quality: dict = field(default_factory=dict)
    latency_ms: dict = field(default_factory=dict)
    rejection_reason: str | None = None
    error_code: str | None = None
    source_provenance: dict = field(default_factory=dict)
    schema_version: str = "smartglove-prediction-result-v1"
    provider_id: str = MODEL.provider_id
    model_id: str = MODEL.model_id
    model_version: str = MODEL.model_version
    model_sha256: str = MODEL.model_sha256
    modality: str = MODEL.modality
    feature_schema_id: str = FEATURE_SCHEMA
    preprocessing_id: str = PREPROCESSING
    preprocessing_version: int = 1
    vocabulary_id: str = "kvsl:do_vat:" + MODEL.label_map_sha256
    score_kind: str = "uncalibrated_softmax"

    def to_dict(self) -> dict:
        return asdict(self)


class RecognitionModelProvider(Protocol):
    def describe(self) -> ModelDescriptor: ...
    def predict(self, sequence: FeatureSequence) -> PredictionResult: ...


def map_scores(scores: list, classes: list, model: ModelDescriptor = MODEL) -> tuple:
    require(len(scores) == len(classes) == model.class_count, "output_class_count",
            "Model output must match the provider class count", "rejected")
    require(model.score_kind in ("uncalibrated_softmax", "uncalibrated_softmax_subset", "raw_ridge"),
            "invalid_scores", "Unsupported score kind", "rejected")
    require(all(type(s) in (float, int) and math.isfinite(s) and
                (model.score_kind == "raw_ridge" or 0 <= s <= 1) for s in scores),
            "invalid_scores", "Invalid model scores", "rejected")
    if model.score_kind == "uncalibrated_softmax":
        require(abs(sum(scores) - 1) < 1e-5, "invalid_scores", "Softmax scores must sum to one", "rejected")
    elif model.score_kind == "uncalibrated_softmax_subset":
        require(sum(scores) <= 1 + 1e-5, "invalid_scores", "Subset scores exceed native probability mass", "rejected")
    order = sorted(range(len(scores)), key=lambda index: (-scores[index], index))[:3]
    return tuple({"label_id": classes[i]["label_id"], "display_name": classes[i]["label"],
                  "source_class_index": i, "score": scores[i]} for i in order)


def prediction_identity(model: ModelDescriptor) -> dict:
    return {"provider_id": model.provider_id, "model_id": model.model_id,
            "model_version": model.model_version, "model_sha256": model.model_sha256,
            "modality": model.modality, "feature_schema_id": model.feature_schema_id,
            "preprocessing_id": model.preprocessing_id, "preprocessing_version": model.preprocessing_version,
            "vocabulary_id": f"{model.family}:{model.topic_id}:{model.label_map_sha256}",
            "score_kind": model.score_kind}
