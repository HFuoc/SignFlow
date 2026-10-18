"""Research registration, score semantics and artifact integrity at the host boundary."""
from dataclasses import replace
import json

import numpy as np
import pytest

from app.desktop_collector.recognition.contracts import MODEL, PredictionResult, RecognitionError, map_scores, prediction_identity
from app.desktop_collector.recognition.experimental import VISIGN_MODEL, WORDS, classes
from app.desktop_collector.recognition.captures import CaptureStore, resolve_capture
from app.desktop_collector.recognition.jobs import RecognitionCatalog
from app.desktop_collector.recognition.service import RecognitionService, validate_prediction
from app.desktop_collector.recognition.worker_client import WorkerConfig
from app.desktop_collector.recognition import visign_provider


def test_pinned_model_and_camera_vocabulary():
    config = WorkerConfig()
    if not config.paths(VISIGN_MODEL)["checkpoint"].is_file():
        pytest.skip("Optional local research checkpoint is not installed")
    model = visign_provider.load_model(config.paths(VISIGN_MODEL)["checkpoint"])
    assert model["weight"].shape == (3600, 25)
    assert len(WORDS) == len(set(WORDS)) == 25
    store = CaptureStore()
    try:
        identity = store.create(b"\x1a\x45\xdf\xa3fixture")
        video = resolve_capture(store.root, identity, config.paths(VISIGN_MODEL)["assets"], VISIGN_MODEL)
        assert video.classes == classes() and video.ref.sample_id is None
        assert video.provenance["model_input_transform"] == "none"
    finally:
        store.close()


def test_signed_ridge_scores_do_not_weaken_softmax_validation():
    values = [-2.] * 25
    values[0:3] = [1.4, -.1, -.1]
    top = map_scores(values, classes(), VISIGN_MODEL)
    assert [item["source_class_index"] for item in top] == [0, 1, 2]
    expected = PredictionResult(request_id="test", sample_id=None, **prediction_identity(VISIGN_MODEL))
    value = json.loads(json.dumps(replace(expected, status="ok", top_k=top).to_dict()))
    assert validate_prediction(value, expected, classes()).top_k == top
    value["score_kind"] = "uncalibrated_softmax"
    with pytest.raises(RecognitionError): validate_prediction(value, expected, classes())
    with pytest.raises(RecognitionError): map_scores(values[:20], classes()[:20], MODEL)
    for score in [float("nan"), float("inf")]:
        with pytest.raises(RecognitionError): map_scores([score] * 25, classes(), VISIGN_MODEL)


def test_catalog_missing_checkpoint_is_unavailable(tmp_path):
    config = WorkerConfig(workspace=tmp_path)
    paths = config.paths(VISIGN_MODEL)
    paths["python"].parent.mkdir(parents=True)
    paths["python"].write_bytes(b"fixture")
    (paths["python"].parent.parent / "pyvenv.cfg").write_text("fixture")
    with RecognitionService(config) as service:
        model = next(m for m in RecognitionCatalog(service).models() if m["provider_id"] == VISIGN_MODEL.provider_id)
        assert model["availability"] == "unavailable"
        assert model["requires_topic"] is False and model["experimental"] is True
        assert model["supported_words"] == list(WORDS)
        with pytest.raises(RecognitionError, match="camera captures only"):
            RecognitionCatalog(service).validate("kvsl:do_vat:W00395", VISIGN_MODEL.provider_id)


def test_checkpoint_hash_rejected(tmp_path):
    path = tmp_path / "model.npz"
    path.write_bytes(b"wrong checkpoint")
    with pytest.raises(RecognitionError) as error: visign_provider.load_model(path)
    assert error.value.code == "model_hash"


@pytest.mark.parametrize("change", ["labels", "scale", "weight", "nan", "extra"])
def test_invalid_numeric_checkpoint_rejected(tmp_path, monkeypatch, change):
    path = tmp_path / "model.npz"
    arrays = dict(mean=np.zeros(3600), scale=np.ones(3600), weight=np.zeros((3600, 25)),
                  bias=np.zeros(25), labels=np.asarray(WORDS))
    if change == "labels": arrays["labels"] = arrays["labels"][::-1]
    elif change == "scale": arrays["scale"][0] = 0
    elif change == "weight": arrays["weight"] = np.zeros((3600, 24))
    elif change == "nan": arrays["mean"][0] = np.nan
    else: arrays["extra"] = np.zeros(1)
    np.savez(path, **arrays)
    monkeypatch.setattr(visign_provider, "verified_file", lambda *args: path.read_bytes())
    with pytest.raises(RecognitionError): visign_provider.load_model(path)
