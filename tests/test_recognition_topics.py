"""Multi-topic whitelist, mapping and API regressions; no ML dependency."""
from dataclasses import replace
import hashlib
import sys
import importlib.util

import pytest
from starlette.testclient import TestClient

from app.desktop_collector.recognition import registry, service, worker_client
from app.desktop_collector.recognition.adapter import KVSLVideoAdapter
from app.desktop_collector.recognition.contracts import MODEL, RecognitionError, encode, map_scores
from app.desktop_collector.recognition.jobs import RecognitionCatalog
from app.desktop_collector.recognition.service import RecognitionService
from app.desktop_collector.server import create_app
from test_recognition import sample


def test_verified_whitelist_and_isolation():
    assert len(registry.REGISTRY) == 13
    assert len(registry.VERIFIED_MODELS) == 10
    assert sum(m.class_count for m in registry.VERIFIED_MODELS) == 175
    assert registry.get_model(MODEL.provider_id) == MODEL
    for name in ("torch", "mediapipe", "torch_geometric"):
        assert name not in sys.modules and importlib.util.find_spec(name) is None
    with pytest.raises(RecognitionError, match="not verified"):
        registry.get_model("kvsl-gcn-unverified")
    with pytest.raises(RecognitionError, match="unique"):
        registry.build_registry([MODEL, MODEL])


@pytest.mark.parametrize("change", [
    {"class_count": 19}, {"preprocessing_id": "unknown"}, {"expected_input_shape": (65, 120)},
    {"checkpoint_path": "../model.pth"}, {"label_map_sha256": "bad"},
])
def test_invalid_descriptor_rejected(change):
    with pytest.raises(RecognitionError):
        registry.build_registry([replace(MODEL, **change)])


@pytest.fixture
def topics(sample, monkeypatch):
    manifest, path, assets, config = sample
    first = registry.get_model(MODEL.provider_id)
    second = registry.get_model("kvsl-gcn-cau-hoi")
    classes = [{"class_index": i, "label_id": f"kvsl:cau_hoi:{i}", "label": f"câu hỏi {i}?"} for i in range(10)]
    mapping = encode({c["label"]: c["class_index"] for c in classes})
    (assets / "cau_hoi.json").write_bytes(mapping)
    second = replace(second, label_map_sha256=hashlib.sha256(mapping).hexdigest())
    models = registry.build_registry([first, second])
    monkeypatch.setattr(registry, "REGISTRY", models)
    monkeypatch.setattr(service, "REGISTRY", models)
    manifest["topics"].append({"topic_id": "cau_hoi", "classes": classes, "label_map": {
        "sha256": second.label_map_sha256, "commit": second.source_commit,
        "path": "app/backend/Model/cau_hoi.json"}})
    manifest["recordings"][0]["annotations"].append({**classes[0], "topic_id": "cau_hoi", "source_rows": [{"record_number": 2}]})
    path.write_bytes(encode(manifest))
    catalog = RecognitionCatalog(RecognitionService(config))
    monkeypatch.setattr(catalog, "models", lambda: [{"provider_id": m.provider_id, "availability": "available"} for m in models.values()])
    return catalog, second, path, assets, config


def test_topic_listing_mapping_and_cross_topic_rejection(topics):
    catalog, model, path, assets, config = topics
    listing = catalog.samples(model.provider_id)
    assert len(listing) == 1 and listing[0]["supported"]
    assert listing[0]["topic_id"] == "cau_hoi" and listing[0]["provider_id"] == model.provider_id
    catalog.validate(listing[0]["sample_id"], model.provider_id)
    with pytest.raises(RecognitionError) as error:
        catalog.validate(listing[0]["sample_id"], MODEL.provider_id)
    assert error.value.code == "unsupported_topic"
    video = KVSLVideoAdapter(path, assets, model).resolve(listing[0]["sample_id"])
    assert map_scores([.1] * 10, video.classes, model)[0]["display_name"] == "câu hỏi 0?"
    with pytest.raises(RecognitionError):
        map_scores([.05] * 20, video.classes, model)
    assert config.paths(model)["checkpoint"] == assets / "cau_hoi.pth"


def test_new_provider_bad_hash_before_process(topics, monkeypatch):
    _, model, _, assets, config = topics
    executable = config.paths()["python"]
    executable.parent.mkdir(parents=True)
    executable.write_bytes(b"fixture")
    (executable.parent.parent / "pyvenv.cfg").write_text("fixture")
    (assets / "cau_hoi.pth").write_bytes(b"wrong checkpoint")
    monkeypatch.setattr(worker_client.subprocess, "run", lambda *a, **k: pytest.fail("Must reject before process"))
    with pytest.raises(RecognitionError) as error:
        worker_client.invoke(config, "test", "kvsl:cau_hoi:W00395", provider_id=model.provider_id)
    assert error.value.code == "model_hash"


def test_missing_one_provider_does_not_hide_others(tmp_path, monkeypatch):
    config = worker_client.WorkerConfig(workspace=tmp_path)
    paths = config.paths()
    paths["python"].parent.mkdir(parents=True)
    paths["python"].write_bytes(b"fixture")
    (paths["python"].parent.parent / "pyvenv.cfg").write_text("fixture")
    paths["manifest"].parent.mkdir(parents=True, exist_ok=True)
    paths["manifest"].write_text("{}")
    for name in ("data/constants.py", "data/checkpoint_extraction.py", "app/backend/src/models/gcn_model.py", "app/backend/src/services/prediction_gcn.py"):
        p = paths["upstream"] / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text("")
    from app.desktop_collector.recognition import jobs
    def verify(path, *args):
        if path.name == "cau_hoi.pth": raise RecognitionError("missing_model", "Missing")
        return b""
    monkeypatch.setattr(jobs, "verified_file", verify)
    models = RecognitionCatalog(RecognitionService(config)).models()
    assert next(m for m in models if m["topic_id"] == "do_vat")["availability"] == "available"
    assert next(m for m in models if m["topic_id"] == "cau_hoi")["availability"] == "unavailable"


def test_multitopic_api(topics, tmp_path, monkeypatch):
    catalog, model, _, _, _ = topics
    origin = "http://127.0.0.1:43123"
    app = create_app(session_token="test-only", port=43123, allowed_origins=(origin,),
                     development=True, database_path=tmp_path / "identity.sqlite3")
    jobs = app.state.runtime.recognition
    jobs.catalog = catalog
    captured = []
    def submit(owner, sample_id, provider_id):
        catalog.validate(sample_id, provider_id)
        captured.append((sample_id, provider_id))
        return {"status": "queued"}
    monkeypatch.setattr(jobs, "submit", submit)
    headers = {"Authorization": "Bearer test-only", "Origin": origin}
    with TestClient(app, base_url=origin) as client:
        password = "Test only password 2026"
        assert client.post("/api/v1/auth/setup", headers=headers, json={"username": "admin",
            "password": password, "password_confirmation": password}).status_code == 201
        base = "/api/v1/recognition"
        assert len(client.get(base + "/models", headers=headers).json()["models"]) == 2
        response = client.get(base + "/samples", params={"provider_id": model.provider_id}, headers=headers)
        samples = response.json()["samples"]
        assert len(samples) == 1 and samples[0]["topic_id"] == model.topic_id
        payload = {"sample_id": samples[0]["sample_id"], "provider_id": model.provider_id}
        assert client.post(base + "/jobs", headers=headers, json=payload).status_code == 202
        assert captured == [(payload["sample_id"], model.provider_id)]
        assert client.post(base + "/jobs", headers=headers, json={**payload, "provider_id": MODEL.provider_id}).status_code == 422
        assert client.get(base + "/samples", headers=headers, params={"provider_id": "unverified"}).status_code == 422
        assert client.post(base + "/jobs", headers=headers, json={**payload, "provider_id": "unverified"}).status_code == 422
