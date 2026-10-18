"""TCN native/background decisions, source layout and host artifact contracts."""
from types import SimpleNamespace
from contextlib import contextmanager
from pathlib import Path
import sys

import numpy as np
import pytest

from app.desktop_collector.recognition.gh_tcn import (
    GH_TCN_MODEL, WORDS, NATIVE_LABELS, ACCEPT_THRESHOLD, acceptance, classes,
)
from app.desktop_collector.recognition import gh_tcn_provider as provider
from app.desktop_collector.recognition.contracts import RecognitionError, PredictionResult, prediction_identity
from app.desktop_collector.recognition.captures import CaptureStore, resolve_capture
from app.desktop_collector.recognition.jobs import RecognitionCatalog
from app.desktop_collector.recognition.service import RecognitionService
from app.desktop_collector.recognition.worker_client import WorkerConfig
from app.desktop_collector.vsl_gh_experiment import encode_segment


def test_native_threshold_boundary_and_other_are_not_renormalized():
    # This threshold lies between float32 values: comparison must preserve Python float precision.
    for score, accepted in [(ACCEPT_THRESHOLD, True), (ACCEPT_THRESHOLD - 1e-8, False),
                            (float(np.float32(ACCEPT_THRESHOLD)), False)]:
        values = [score] + [0.] * 24 + [1 - score]
        index, reason = acceptance(values)
        assert index == 0 and (reason is None) == accepted
    assert acceptance([0.] * 25 + [1.])[1].startswith("Sign outside")
    assert acceptance([.5] + [0.] * 24 + [.5])[1] is not None
    for values in ([1.] * 26, [float("nan")] * 26, [0.] * 25, [-1.] + [0.] * 25):
        with pytest.raises(RecognitionError): acceptance(values)


def test_source_pose_and_hand_slots_match_encoder():
    points = [SimpleNamespace(x=i / 100 + .1, y=i / 50 + .1, z=-i / 100) for i in range(33)]
    landmarks = SimpleNamespace(pose_landmarks=SimpleNamespace(landmark=points),
                                left_hand_landmarks=SimpleNamespace(landmark=points[:21]),
                                right_hand_landmarks=None)
    packed = provider.pack_landmarks(landmarks)
    assert packed.shape == (137, 3) and packed.dtype == np.float32
    np.testing.assert_allclose(packed[9], [.21, .32, -.11])
    np.testing.assert_allclose(packed[10], [.22, .34, -.12])
    np.testing.assert_allclose(packed[95], [.1, .1, 0])
    assert not packed[25:95].any() and not packed[116:].any()
    encoded, _ = encode_segment(np.stack([packed] * 4))
    with_face = np.stack([packed] * 4)
    with_face[:, 25:95] = 99
    np.testing.assert_array_equal(encoded, encode_segment(with_face)[0])


def test_capture_vocabulary_transform_and_optional_artifacts():
    config = WorkerConfig()
    paths = config.paths(GH_TCN_MODEL)
    assert len(WORDS) == len(set(WORDS)) == 25 and len(NATIVE_LABELS) == 26
    assert paths["checkpoint"].name == "tcn.pt"
    store = CaptureStore()
    try:
        identity = store.create(b"\x1a\x45\xdf\xa3fixture")
        video = resolve_capture(store.root, identity, paths["assets"], GH_TCN_MODEL)
        assert video.classes == classes() and video.ref.sample_id is None
        assert video.classes[0]["label"] == "TÔI"
        assert video.provenance["model_input_transform"] == "resize-360-square-holistic-gh137"
    finally:
        store.close()
    if (paths["assets"] / "normalization.npz").is_file():
        assert provider.load_normalization(paths["assets"] / "normalization.npz")[0].shape == (279,)


def test_catalog_requires_normalization_and_does_not_accept_manifest_samples(tmp_path, monkeypatch):
    config = WorkerConfig(workspace=tmp_path)
    paths = config.paths(GH_TCN_MODEL)
    paths["python"].parent.mkdir(parents=True)
    paths["python"].write_bytes(b"fixture")
    (paths["python"].parent.parent / "pyvenv.cfg").write_text("fixture")
    checked = []
    def verify(path, *args):
        checked.append(path.name)
        if path.name == "normalization.npz":
            raise RecognitionError("model_hash", "Missing normalization")
        return b"fixture"
    monkeypatch.setattr("app.desktop_collector.recognition.jobs.verified_file", verify)
    with RecognitionService(config) as service:
        catalog = RecognitionCatalog(service)
        item = next(m for m in catalog.models() if m["provider_id"] == GH_TCN_MODEL.provider_id)
        assert item["availability"] == "unavailable" and item["requires_topic"] is False
        assert "normalization.npz" in checked
        assert item["supported_words"] == list(WORDS)
        with pytest.raises(RecognitionError, match="camera captures only"):
            catalog.validate("kvsl:do_vat:W00395", GH_TCN_MODEL.provider_id)


def test_tcn_stream_is_bound_to_its_new_vocabulary():
    from app.desktop_collector.recognition.streaming import StreamingService
    from app.desktop_collector.recognition.streaming import stream_prediction
    service = StreamingService(WorkerConfig())
    lease = service.acquire("fixture-owner", GH_TCN_MODEL.provider_id)
    assert lease.model == GH_TCN_MODEL
    prediction = stream_prediction(lease.stream_id, 1, 1, GH_TCN_MODEL)
    assert prediction.topic_id == "vsl_gh25" and prediction.preprocessing_id.startswith(GH_TCN_MODEL.preprocessing_id)
    lease.worker.shutdown()


@pytest.mark.parametrize("change", ["labels", "scale", "shape", "nan", "extra"])
def test_normalization_fails_closed(tmp_path, monkeypatch, change):
    arrays = dict(mean=np.zeros(279, np.float32), scale=np.ones(279, np.float32), labels=np.asarray(NATIVE_LABELS))
    if change == "labels": arrays["labels"] = arrays["labels"][::-1]
    elif change == "scale": arrays["scale"][0] = 0
    elif change == "shape": arrays["mean"] = np.zeros(278, np.float32)
    elif change == "nan": arrays["mean"][0] = np.nan
    else: arrays["extra"] = np.zeros(1)
    path = tmp_path / "normalization.npz"
    np.savez(path, **arrays)
    monkeypatch.setattr(provider, "verified_file", lambda *args: path.read_bytes())
    with pytest.raises(RecognitionError): provider.load_normalization(path)


def test_normalization_hash_mismatch(tmp_path):
    path = tmp_path / "normalization.npz"
    path.write_bytes(b"invalid")
    with pytest.raises(RecognitionError) as error: provider.load_normalization(path)
    assert error.value.code == "model_hash"


@pytest.mark.parametrize("native_index,confidence,error", [(0, 1., None), (0, .9, "uncertain_sign"),
                                                         (25, 1., "outside_vocabulary")])
def test_capture_pipeline_resizes_and_hides_rejected_words(monkeypatch, native_index, confidence, error):
    class Capture:
        index = 0
        released = False
        def isOpened(self): return True
        def get(self, prop): return {1: 640, 2: 480, 3: self.index * 40}[prop]
        def read(self):
            self.index += 1
            return (True, np.zeros((480, 640, 3), np.uint8)) if self.index <= 6 else (False, None)
        def release(self): self.released = True
    capture = Capture()
    monkeypatch.setitem(sys.modules, "cv2", SimpleNamespace(VideoCapture=lambda _: capture,
        CAP_PROP_FRAME_WIDTH=1, CAP_PROP_FRAME_HEIGHT=2, CAP_PROP_POS_MSEC=3, COLOR_BGR2RGB=4,
        resize=lambda frame, size: np.zeros((*size, 3), np.uint8), cvtColor=lambda frame, _: frame))
    points = [SimpleNamespace(x=.1 + i / 100, y=.2 + i / 50, z=-i / 100) for i in range(33)]
    landmarks = SimpleNamespace(pose_landmarks=SimpleNamespace(landmark=points),
        left_hand_landmarks=SimpleNamespace(landmark=points[:21]), right_hand_landmarks=None)
    def process(frame):
        assert frame.shape == (360, 360, 3)
        return landmarks
    @contextmanager
    def clip(): yield SimpleNamespace(process=process)
    checkpoint = Path("tcn.pt")
    runtime = SimpleNamespace(gh_tcn_model=(checkpoint, object()), visign_clip=clip)
    values = [0.] * 26
    values[native_index] = confidence
    values[24] += 1 - confidence
    def infer(loaded, encoded):
        assert encoded.shape == (32, 279) and np.isfinite(encoded).all()
        return values
    monkeypatch.setattr(provider, "infer_encoded", infer)
    video = SimpleNamespace(path=Path("synthetic.webm"), classes=classes())
    expected = PredictionResult(request_id="fixture", sample_id=None, **prediction_identity(GH_TCN_MODEL))
    result = provider.predict(video, checkpoint, expected, runtime)
    assert capture.released and result.quality["cache_hit"] is True
    assert result.quality["frames_decoded"] == 6
    assert result.error_code == error
    if error:
        assert result.status == "rejected" and not result.top_k
        assert len(result.quality["candidate_top_k"]) == 3
        assert result.quality["native_winner_supported"] == (native_index != 25)
        assert result.quality["candidate_top_k"][0]["score"] == max(values[:25])
        from app.desktop_collector.recognition.service import validate_prediction
        from app.desktop_collector.recognition.contracts import decode, encode
        validate_prediction(decode(encode(result.to_dict())), expected, classes())
    else:
        assert result.status == "ok" and result.top_k[0]["display_name"] == "TÔI"


@pytest.mark.parametrize("corruption", ["label", "score", "order", "duplicate", "status", "mass", "native"])
def test_diagnostic_candidates_are_validated_and_cannot_be_success(corruption):
    from dataclasses import replace
    from app.desktop_collector.recognition.contracts import map_scores, decode, encode
    from app.desktop_collector.recognition.service import validate_prediction
    expected = PredictionResult(request_id="fixture", sample_id=None, **prediction_identity(GH_TCN_MODEL))
    candidates = list(map_scores([.6, .2, .1] + [0.] * 22, classes(), GH_TCN_MODEL))
    value = decode(encode(replace(expected, status="rejected", error_code="uncertain_sign", rejection_reason="Uncertain sign",
                    quality={"candidate_top_k": candidates, "native_winner_supported": True}).to_dict()))
    validate_prediction(value, expected, classes())
    candidates = value["quality"]["candidate_top_k"]
    if corruption == "label": candidates[0]["display_name"] = "Unregistered word"
    elif corruption == "score": candidates[0]["score"] = float("nan")
    elif corruption == "order": candidates.reverse()
    elif corruption == "duplicate": candidates[1] = candidates[0].copy()
    elif corruption == "status": value.update(status="ok", top_k=candidates, error_code=None, rejection_reason=None)
    elif corruption == "mass": candidates[1]["score"] = .55
    else: value["quality"]["native_winner_supported"] = "false"
    with pytest.raises(RecognitionError): validate_prediction(value, expected, classes())
