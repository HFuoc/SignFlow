"""Contract/adapter tests run without ML; synthetic media bytes are never inference evidence."""
from dataclasses import asdict, replace
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import pytest

from app.desktop_collector.kvsl_manifest import ARTIFACT_COMMIT, REPOSITORY, SCHEMA, SOURCE_COMMIT
from app.desktop_collector.recognition import adapter
from app.desktop_collector.recognition import registry, service
from app.desktop_collector.recognition.contracts import (
    MODEL, FeatureSequence, PredictionResult, RecognitionError, decode, encode, map_scores,
)
from app.desktop_collector.recognition.service import RecognitionService, validate_prediction
from app.desktop_collector.recognition.worker_client import WorkerConfig


@pytest.fixture
def sample(tmp_path, monkeypatch):
    assets = tmp_path / "assets"
    assets.mkdir()
    classes = [{"class_index": i, "label_id": f"kvsl:do_vat:{i}", "label": f"nhãn {i}"} for i in range(20)]
    mapping = encode({c["label"]: c["class_index"] for c in classes})
    (assets / "do_vat.json").write_bytes(mapping)
    map_hash = hashlib.sha256(mapping).hexdigest()
    monkeypatch.setattr(adapter, "MODEL", replace(MODEL, label_map_sha256=map_hash))
    models = {**registry.REGISTRY, MODEL.provider_id: replace(MODEL, label_map_sha256=map_hash)}
    monkeypatch.setattr(registry, "REGISTRY", models)
    monkeypatch.setattr(service, "REGISTRY", models)
    data = b"synthetic bytes, not a decodable video"
    (assets / "W00395.mp4").write_bytes(data)
    annotation = {**classes[7], "topic_id": "do_vat", "source_rows": [{"record_number": 1}]}
    manifest = {"schema_version": SCHEMA, "source": {"repository": REPOSITORY,
        "source_commit": SOURCE_COMMIT, "artifact_commit": ARTIFACT_COMMIT},
        "topics": [{"topic_id": "do_vat", "classes": classes, "label_map": {
            "sha256": map_hash, "commit": SOURCE_COMMIT, "path": "app/backend/Model/do_vat.json"}}],
        "recordings": [{"recording_id": "kvsl:W00395", "video_filename": "W00395.mp4",
            "modality": "video", "simulated": False, "annotations": [annotation],
            "asset_status": "verified_git_blob", "asset": {
                "commit": ARTIFACT_COMMIT, "path": "app/backend/Model/Videos/W00395.mp4",
                "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
                "git_blob": hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()}}]}
    path = tmp_path / "manifest.json"
    path.write_bytes(encode(manifest))
    config = WorkerConfig(workspace=tmp_path, manifest="manifest.json", assets="assets")
    return manifest, path, assets, config


def test_manifest_sample_and_unicode_mapping(sample):
    _, path, assets, _ = sample
    video = adapter.KVSLVideoAdapter(path, assets).resolve("kvsl:do_vat:W00395")
    assert video.ref.recording_id == "kvsl:W00395"
    scores = [.05] * 20
    top = map_scores(scores, video.classes)
    assert [p["source_class_index"] for p in top] == [0, 1, 2]
    assert top[0]["display_name"] == "nhãn 0"
    assert decode(encode({"top_k": top}))["top_k"] == list(top)


@pytest.mark.parametrize("sample_id,provider,code", [
    ("kvsl:do_vat:absent", MODEL.provider_id, "unknown_sample"),
    ("kvsl:chu_cai:W00395", MODEL.provider_id, "unsupported_topic"),
    ("kvsl:do_vat:W00395", "lstm", "unsupported_provider"),
    ("../../W00395.mp4", MODEL.provider_id, "unknown_sample"),
    ("kvsl:do_vat:W00395;exit", MODEL.provider_id, "unknown_sample"),
])
def test_early_rejections(sample, sample_id, provider, code):
    result = RecognitionService(sample[3]).recognize(sample_id, provider)
    assert result.error_code == code and not result.top_k


@pytest.mark.parametrize("mutation,code", [
    (lambda m: m.update(schema_version="bad"), "manifest_schema"),
    (lambda m: m["source"].update(repository="other"), "manifest_source"),
    (lambda m: m["recordings"][0].update(asset_status="missing_at_artifact_commit"), "missing_asset"),
    (lambda m: m["recordings"][0].update(video_filename="../W00395.mp4"), "recording_identity"),
    (lambda m: m["recordings"][0]["asset"].update(git_blob="0" * 40), "asset_hash"),
    (lambda m: m["recordings"][0]["annotations"][0].update(class_index=6), "label_mapping"),
    (lambda m: m["topics"][0]["classes"][0].update(label="fabricated"), "label_mapping"),
    (lambda m: m["topics"][0]["classes"].pop(), "label_mapping"),
    (lambda m: m["recordings"].append(m["recordings"][0]), "unknown_sample"),
    (lambda m: m.update(topics=None), "invalid_manifest"),
])
def test_manifest_rejections(sample, mutation, code):
    manifest, path, _, config = sample
    mutation(manifest)
    path.write_bytes(encode(manifest))
    assert RecognitionService(config).recognize("kvsl:do_vat:W00395").error_code == code


def test_missing_referenced_asset(sample):
    (sample[2] / "W00395.mp4").unlink()
    assert RecognitionService(sample[3]).recognize("kvsl:do_vat:W00395").error_code == "missing_asset"


@pytest.mark.parametrize("field,value", [("manifest", "../escape.json"), ("checkpoint", "../outside.pth"),
                                          ("worker_module", "os"), ("python", "C:/other/python.exe"),
                                          ("timeout_s", float("nan"))])
def test_configuration_rejections(sample, field, value):
    result = RecognitionService(replace(sample[3], **{field: value})).recognize("kvsl:do_vat:W00395")
    assert result.error_code in ("path_escape", "worker_configuration")


def feature():
    return FeatureSequence("kvsl:do_vat:W00395", "kvsl:W00395", "do_vat",
        tuple(tuple((0., 0., 0.) for _ in range(65)) for _ in range(60)),
        tuple((False,) * 65 for _ in range(60)), (None,) * 60, {})


def test_feature_contract():
    feature().validate()


@pytest.mark.parametrize("field,value", [("feature_schema_id", "flex"), ("topic_id", "chu_cai"),
    ("preprocessing_version", 2), ("feature_shape", (65, 2)), ("dtype", "float64"),
    ("values", ()), ("valid_mask", ()), ("timestamps", (float("nan"),) * 60)])
def test_feature_incompatibility(field, value):
    with pytest.raises(RecognitionError, match="Feature|feature"):
        replace(feature(), **{field: value}).validate()


def test_output_class_count():
    with pytest.raises(RecognitionError) as error:
        map_scores([.1] * 10, [{}] * 20)
    assert error.value.code == "output_class_count"


@pytest.mark.parametrize("data", [b'{"x":NaN}', b'{"x":1,"x":2}', b'{"x":"\xff"}', b'{"x":"\\ud800"}'])
def test_strict_json(data):
    with pytest.raises((ValueError, UnicodeError)):
        decode(data)


def test_validate_prediction_and_corruption(sample):
    video = adapter.KVSLVideoAdapter(sample[1], sample[2]).resolve("kvsl:do_vat:W00395")
    expected = PredictionResult("req", video.ref.sample_id, video.ref.recording_id, "do_vat",
                                source_provenance=video.provenance)
    success = replace(expected, status="ok", top_k=map_scores([.05] * 20, video.classes))
    value = decode(encode(success.to_dict()))
    assert validate_prediction(value, expected, video.classes).status == "ok"
    for key, wrong in [("model_sha256", "wrong"), ("request_id", "stale"), ("preprocessing_version", 2),
                        ("status", "maybe"), ("latency_ms", {"model": -1})]:
        with pytest.raises(RecognitionError):
            validate_prediction({**value, key: wrong}, expected, video.classes)
    value["top_k"][0]["display_name"] = "free-form label"
    with pytest.raises(RecognitionError):
        validate_prediction(value, expected, video.classes)


def test_dependency_guard_fresh_process():
    code = '''
import importlib.abc, importlib.util, sys
blocked = ('torch','mediapipe','torch_geometric')
class Guard(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, *args):
        if fullname.split('.')[0] in blocked: raise AssertionError(fullname)
sys.meta_path.insert(0, Guard())
import app.desktop_collector.main
import app.desktop_collector.shell
import app.desktop_collector.kvsl_manifest
import app.desktop_collector.recognition.service
import app.desktop_collector.recognition.cli
assert not any(m.split('.')[0] in blocked for m in sys.modules)
print('no ML imports')
'''
    result = subprocess.run([sys.executable, "-c", code], capture_output=True, timeout=30)
    assert result.returncode == 0, result.stderr.decode(errors="replace")


def test_source_only_missing_executable(sample):
    assert RecognitionService(sample[3]).recognize("kvsl:do_vat:W00395").error_code == "missing_executable"
