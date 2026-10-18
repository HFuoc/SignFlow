"""GPU provider contract, abstention and routing without requiring CUDA in unit tests."""
from dataclasses import replace
import json
import pickle
import io

import pytest

from app.desktop_collector.recognition.contracts import PredictionResult, RecognitionError, prediction_identity
from app.desktop_collector.recognition.experimental import classes, VISIGN_MODEL
from app.desktop_collector.recognition.service import RecognitionService, validate_prediction
from app.desktop_collector.recognition.registry import runtime_providers
from app.desktop_collector.recognition.streaming import StreamingService, stream_prediction
from app.desktop_collector.recognition.videomae import VIDEOMAE_MODEL, decide
from app.desktop_collector.recognition.videomae_provider import NumericReader
from app.desktop_collector.recognition.worker_client import WorkerConfig


def probabilities(index, score=.96):
    values = [(1 - score) / 99] * 100
    values[index] = score
    return values


def test_preserves_native_probability_mass_and_canonical_wake_up_identity():
    top, quality, reason = decide(probabilities(73))
    assert reason is None and top[0]['display_name'] == 'Thức dậy'
    assert top[0]['source_class_index'] == 14 and top[0]['label_id'] == 'visign:visign25:14'
    assert top[0]['score'] == .96 and quality['subset_mass'] < 1
    expected = PredictionResult(request_id='check', sample_id=None, **prediction_identity(VIDEOMAE_MODEL))
    result = replace(expected, status='ok', top_k=top, quality=quality)
    assert validate_prediction(json.loads(json.dumps(result.to_dict())), expected, classes()).top_k == top


@pytest.mark.parametrize('values,options', [
    (probabilities(0, .99), {}),  # Native winner outside supported vocabulary: never force a V25 word.
    (probabilities(73, .70), {}),
    (probabilities(73), {'duration_ms': 400}),
    (probabilities(73), {'boundary': 'max_duration'}),
    (probabilities(73), {'boundary': 'frame_gap'}),
    (probabilities(73), {'phase': 'provisional', 'duration_ms': 1400, 'stable_updates': 1}),
])
def test_unsupported_uncertain_or_incomplete_sign_never_emits_a_word(values, options):
    top, quality, reason = decide(values, **options)
    assert top == () and reason
    if not options:
        assert len(quality['candidate_top_k']) == 3
        assert quality['candidate_top_k'][0]['score'] <= max(values)
        expected = PredictionResult(request_id='check', sample_id=None, **prediction_identity(VIDEOMAE_MODEL))
        result = replace(expected, status='rejected', top_k=top, quality=quality,
                         error_code='uncertain_sign', rejection_reason=reason)
        validate_prediction(json.loads(json.dumps(result.to_dict())), expected, classes())
    else:
        assert 'candidate_top_k' not in quality


def test_tentative_prediction_needs_duration_and_repeated_label():
    top, _, reason = decide(probabilities(16), phase='provisional', duration_ms=1400, stable_updates=2)
    assert reason is None and top[0]['display_name'] == 'Chào'


@pytest.mark.parametrize('values', [[float('nan')] * 100, [float('inf')] * 100, [-.01] * 100, [.5] * 100, [1.]])
def test_invalid_native_outputs_fail_closed(values):
    with pytest.raises(RecognitionError):
        decide(values)


def test_numeric_checkpoint_reader_rejects_executable_pickle_global():
    payload = pickle.dumps(eval)
    with pytest.raises(RecognitionError, match='Unsupported checkpoint global'):
        NumericReader(io.BytesIO(payload)).load()


def test_stream_provider_is_bound_and_legacy_default_is_preserved():
    seen = []
    class Worker:
        def __init__(self, config, stream_id, model=VISIGN_MODEL): seen.append(model)
        def exchange(self, **kwargs): pass
        def shutdown(self): pass
    service = StreamingService(factory=Worker)
    lease = service.acquire('owner', VIDEOMAE_MODEL.provider_id)
    ready = lease.start()
    assert ready['provider_id'] == VIDEOMAE_MODEL.provider_id and ready['end_hold_ms'] == 500
    assert stream_prediction('s', 1, 0, VIDEOMAE_MODEL).modality == 'rgb_video'
    service.release(lease)
    lease = service.acquire('owner')
    assert lease.model == VISIGN_MODEL
    service.release(lease)
    assert seen == [VIDEOMAE_MODEL, VISIGN_MODEL]
    with pytest.raises(RecognitionError): service.acquire('owner', 'kvsl-gcn-do-vat')
    service.shutdown()


def test_new_checkpoint_does_not_replace_legacy_artifact():
    config = WorkerConfig()
    assert config.paths(VIDEOMAE_MODEL)['checkpoint'] != config.paths(VISIGN_MODEL)['checkpoint']
    assert VIDEOMAE_MODEL.supported_words == VISIGN_MODEL.supported_words
    assert VIDEOMAE_MODEL.expected_input_shape == (1, 16, 3, 224, 224)
    assert VIDEOMAE_MODEL.provider_id not in runtime_providers()
    assert runtime_providers(cuda=True) == [VIDEOMAE_MODEL.provider_id]


def test_stream_reservation_prevents_overlapping_model_allocation(monkeypatch):
    with RecognitionService() as service:
        released = []
        monkeypatch.setattr(service.worker, 'invalidate', lambda: released.append('cpu'))
        monkeypatch.setattr(service.gpu_worker, 'invalidate', lambda: released.append('gpu'))
        service.reserve_stream('stream-a')
        assert released == ['cpu', 'gpu']
        result = service.recognize(None, VIDEOMAE_MODEL.provider_id)
        assert result.error_code == 'recognition_busy'
        service.release_stream('different-owner')
        with pytest.raises(RecognitionError, match='current prediction'):
            service.reserve_stream('stream-b')
        service.release_stream('stream-a')
        service.reserve_stream('stream-b')
        service.release_stream('stream-b')


def test_failed_reservation_releases_ownership(monkeypatch):
    with RecognitionService() as service:
        def failed(): raise OSError('test failure')
        monkeypatch.setattr(service.worker, 'invalidate', failed)
        with pytest.raises(OSError): service.reserve_stream('stream')
        assert service._mode_owner is None
