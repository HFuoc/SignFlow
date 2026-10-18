"""Stream contracts, motion boundaries and ownership without ML dependencies."""
import math
import struct

import pytest

from app.desktop_collector.recognition.contracts import RecognitionError, encode
from app.desktop_collector.recognition.streaming import (
    FrameClock, MAX_FPS, MAX_FRAME_BYTES, MAX_HISTORY, PNG_SIGNATURE, SignSegmenter,
    StreamingService, unpack_frame, validate_png)
from app.desktop_collector.recognition.stream_worker import hand_motion


def png(width=32, height=24):
    # Header-only fixture deliberately never reaches a decoder in these unit tests.
    return PNG_SIGNATURE + b"\x00\x00\x00\rIHDR" + struct.pack(">II", width, height) + b"\x08\x02" + b"\0" * 7


def packet(sequence=0, stamp=0, image=None):
    header = encode({"type": "frame", "sequence": sequence, "timestamp_ms": stamp})
    return struct.pack(">I", len(header)) + header + (png() if image is None else image)


def test_binary_frame_roundtrip_and_predecode_dimensions():
    header, image = unpack_frame(packet(2, 125.5))
    assert header == {"type": "frame", "sequence": 2, "timestamp_ms": 125.5}
    assert validate_png(image) == (32, 24)
    for data in (b"jpeg", png(8192, 8192), png(8, 24), png(1921, 1080), png(1080, 1920)):
        with pytest.raises(RecognitionError):
            validate_png(data)


def test_manual_finish_header_requires_a_positive_segment_identity():
    from app.desktop_collector.recognition.streaming import validate_frame_header
    base = {"type": "frame", "sequence": 1, "timestamp_ms": 50}
    for media in ({}, {"format": "rgba8", "width": 32, "height": 24}):
        validate_frame_header({**base, **media, "finish_segment": 1})
        for invalid in (True, False, 0, -1, 1.0, "1", None, 10_000_001):
            with pytest.raises(RecognitionError):
                validate_frame_header({**base, **media, "finish_segment": invalid})


def test_manual_finish_ends_noisy_segment_once_and_rearms_when_hands_lowered():
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None, end_on_missing_hands=False)
    for stamp in range(0, 1000, 50):
        assert segmenter.sample(stamp, .1, stamp, True)[0] is None
    phase, selected, reason = segmenter.sample(1000, .1, 1000, True, finish_segment=1)
    assert phase == "final" and reason == "manual_finish" and selected[-1][0] == 1000
    assert selected[0][0] == 0 and segmenter.await_quiet
    for stamp in range(1050, 1700, 50):
        assert segmenter.sample(stamp, .1, stamp, False, finish_segment=1)[0] is None
    assert not segmenter.await_quiet
    for stamp in range(1700, 2400, 50):
        assert segmenter.sample(stamp, .1, stamp, True, finish_segment=1)[0] is None
    assert segmenter.segment_id == 2  # Late/repeated click cannot finish the next sign.
    assert segmenter.sample(2400, .1, 2400, True, finish_segment=2)[2] == "manual_finish"


def test_manual_finish_cannot_override_gap_maximum_or_start_a_segment_at_idle():
    segmenter = SignSegmenter(prediction_interval_ms=None, end_on_missing_hands=False)
    for stamp in range(0, 500, 50):
        assert segmenter.sample(stamp, 0., stamp, True, finish_segment=1)[0] is None
    for stamp in range(500, 5600, 50):
        segmenter.sample(stamp, .1, stamp, True)
    assert segmenter.sample(5600, .1, 5600, True, finish_segment=1)[2] == "max_duration"
    segmenter.reset()
    for stamp in range(6000, 6500, 50):
        segmenter.sample(stamp, .1, stamp, True)
    phase, selected, reason = segmenter.sample(8000, .1, 8000, True, finish_segment=segmenter.segment_id)
    assert phase is None and not selected and reason == "frame_gap"


@pytest.mark.parametrize("data", [b"", b"\0\0\0\0", b"\0\0\x04\x01garbage", b"\0\0\0\x01x" + png(),
                                b"\0" * (MAX_FRAME_BYTES + 1029)],
                         ids=["empty", "zero-header", "long-header", "invalid-json", "oversized"])
def test_malformed_and_oversized_transport_rejected(data):
    with pytest.raises(RecognitionError):
        unpack_frame(data)


@pytest.mark.parametrize("field,value", [("sequence", True), ("sequence", -1), ("timestamp_ms", math.nan),
                                       ("timestamp_ms", math.inf), ("timestamp_ms", -1), ("type", "path")])
def test_frame_clock_rejects_untrusted_metadata(field, value):
    header = {"type": "frame", "sequence": 0, "timestamp_ms": 0, field: value}
    with pytest.raises(RecognitionError):
        FrameClock().accept(header, 0)


def test_order_and_rate_limits():
    clock = FrameClock()
    def frame(seq, stamp, arrival):
        clock.accept({"type": "frame", "sequence": seq, "timestamp_ms": stamp}, arrival)
    frame(0, 200, 0)
    for seq, stamp in ((0, 300), (2, 300), (1, 200), (1, 205)):
        with pytest.raises(RecognitionError):
            frame(seq, stamp, .1)
    for i in range(1, MAX_FPS + 1):
        frame(i, 200 + i * 100, .1)
    with pytest.raises(RecognitionError, match="60 FPS"):
        frame(MAX_FPS + 1, 10000, .1)
    frame(MAX_FPS + 1, 10000, 1.1)


def test_rgba_transport_is_exact_and_validates_dimensions_length_and_format():
    metadata = {"type": "frame", "sequence": 0, "timestamp_ms": 0,
                "format": "rgba8", "width": 32, "height": 24}
    pixels = bytes(range(256)) * 12
    def raw(header, image=pixels):
        encoded = encode(header)
        return struct.pack(">I", len(encoded)) + encoded + image
    assert unpack_frame(raw(metadata)) == (metadata, pixels)
    for change in ({"width": True}, {"height": 1920}, {"width": 0}, {"format": "jpeg"}, {"extra": 1}):
        with pytest.raises(RecognitionError):
            unpack_frame(raw({**metadata, **change}))
    for image in (pixels[:-1], pixels + b"x"):
        with pytest.raises(RecognitionError):
            unpack_frame(raw(metadata, image))
    big = {**metadata, "width": 1920, "height": 1080}
    assert len(unpack_frame(raw(big, b"\0" * (1920 * 1080 * 4)))[1]) == 8294400


def test_sixty_fps_retains_full_gesture_onset_and_preroll():
    segmenter = SignSegmenter()
    final = None
    for i in range(361):
        stamp = i * 1000 / 60
        phase, selected, _ = segmenter.sample(stamp, .1 if stamp >= 400 else 0, stamp, True)
        if phase == "final":
            final = selected
            break
    assert final is not None and final[0][0] == 0
    assert len(final) > 300 and len(final) <= MAX_HISTORY
    assert final[-1][0] - final[0][0] >= 5500


def test_provisional_during_motion_keeps_onset_then_trims_quiet_tail():
    segmenter = SignSegmenter()
    events = []
    for stamp in range(0, 1501, 100):
        phase, frames, reason = segmenter.sample(stamp, .1 if 400 <= stamp <= 900 else 0, stamp, True)
        if phase:
            events.append((stamp, phase, frames, reason))
    provisional = [item for item in events if item[1] == "provisional"]
    assert provisional and provisional[0][0] < 900
    assert provisional[0][2][0][0] == 0  # 400ms onset history before first moving sample.
    final = [item for item in events if item[1] == "final"]
    assert len(final) == 1 and final[0][0] == 1400
    assert final[0][2][-1][0] == 1000  # Most stationary tail excluded from encoding.
    assert all(item[2][-1][0] <= 1000 for item in provisional if item[0] > 1000)
    assert segmenter.state == "ready"


def test_short_motion_not_replaced_by_two_seconds_of_stillness():
    segmenter = SignSegmenter()
    updates = []
    for stamp in range(0, 1301, 100):
        phase, frames, _ = segmenter.sample(stamp, .1 if 400 <= stamp <= 700 else 0, stamp, True)
        if phase:
            updates.append((stamp, phase, frames))
    assert updates[0][1] == "provisional" and updates[0][0] <= 700
    assert updates[-1][1] == "final" and updates[-1][0] == 1200
    assert max(item[0] for item in updates[-1][2]) == 800


@pytest.mark.parametrize('inference_delay_ms', [100, 900, 1600])
def test_final_only_keeps_motion_and_next_sign_despite_slow_classifier(inference_delay_ms):
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None)
    stamp, finals = 0, []
    for attempt in range(2):
        start = stamp
        for _ in range(30):
            relative = stamp - start
            phase, selected, reason = segmenter.sample(
                stamp, .1 if 400 <= relative <= 1400 else 0, stamp, True)
            # The real worker can call the classifier only when phase is set.
            assert phase != 'provisional'
            if phase:
                assert phase == 'final' and reason is None
                assert selected[0][0] == start
                assert selected[-1][0] == start + 1500
                finals.append(selected)
                stamp += inference_delay_ms
                break
            stamp += 100
        else:
            pytest.fail('The gesture did not complete')
    assert len(finals) == 2 and segmenter.segment_id == 2


def test_onset_survives_neutral_motion_but_still_needs_repeated_active_samples():
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None)
    for stamp, motion in [(0, 0), (50, .055), (100, .1009), (150, .0276), (200, .0419)]:
        segmenter.sample(stamp, motion, stamp, True)
    assert segmenter.state == 'moving' and segmenter.segment_id == 1
    assert segmenter.started == 0
    # A single spike followed by neutral/quiet samples must not start a segment.
    for remainder in (.025, .01):
        segmenter = SignSegmenter(prediction_interval_ms=None)
        segmenter.sample(0, .1, 0, True)
        for stamp in range(50, 1000, 50):
            assert segmenter.sample(stamp, remainder, stamp, True)[0] is None
        assert segmenter.segment_id == 0


def test_rgb_occlusion_keeps_one_segment_and_neutral_tail_can_finish():
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None,
                              end_on_missing_hands=False)
    finals = []
    for stamp in range(0, 3100, 100):
        hands = not 900 <= stamp <= 1700
        motion = .1 if 400 <= stamp <= 2200 else (.025 if stamp == 2500 else 0)
        phase, selected, reason = segmenter.sample(stamp, motion, stamp, hands)
        if phase:
            finals.append((stamp, selected, reason))
    assert len(finals) == 1 and finals[0][0] == 2800
    selected = finals[0][1]
    assert selected[0][0] == 0 and selected[-1][0] == 2300
    assert any(not item[2] for item in selected)  # Retain RGB during tracking occlusion.
    assert segmenter.segment_id == 1


def test_rgb_boundary_filter_ignores_isolated_spikes_and_completes_after_motion():
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None,
                              end_on_missing_hands=False, motion_window=3)
    finals = []
    for stamp in range(0, 4200, 50):
        # Real motion, followed by a stationary tail with isolated tracker jumps.
        motion = .1 if 400 <= stamp <= 1600 or stamp in (1850, 2050, 2400, 3000, 3800) else .01
        phase, frames, reason = segmenter.sample(stamp, motion, stamp, True)
        if phase:
            finals.append((stamp, frames, reason))
    assert segmenter.segment_id == 1 and len(finals) == 1
    assert finals[0][0] <= 2250 and finals[0][2] is None
    assert finals[0][1][0][0] <= 400 and finals[0][1][-1][0] >= 1600
    # Reset cannot carry past motion into the next candidate.
    segmenter.reset()
    for stamp in range(5000, 6000, 50):
        segmenter.sample(stamp, .1 if stamp == 5000 else 0, stamp, True)
    assert segmenter.segment_id == 1 and segmenter.state == 'ready'


def test_rgb_permanent_tracking_loss_is_bounded_and_cannot_accept_a_word():
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None,
                              end_on_missing_hands=False)
    finals = []
    for stamp in range(0, 9000, 100):
        phase, selected, reason = segmenter.sample(stamp, .1, stamp, stamp < 1000)
        if phase:
            finals.append(reason)
    assert finals == ['max_duration'] and not segmenter.await_quiet
    assert segmenter.state == 'ready'  # Lowered hands rearm, but never classify idle.


def test_final_only_still_rejects_missing_motion_and_bounds_continuous_motion():
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None)
    for stamp in range(0, 1000, 100):
        assert segmenter.sample(stamp, .1, stamp, True)[0] is None
    assert segmenter.sample(2000, 0, 2000, True) == (None, (), 'frame_gap')
    finals = []
    for stamp in range(2100, 15000, 100):
        phase, selected, reason = segmenter.sample(stamp, .1, stamp, True)
        if phase:
            finals.append((phase, selected, reason))
        assert len(segmenter.history) <= MAX_HISTORY
    assert len(finals) == 1 and finals[0][0] == 'final' and finals[0][2] == 'max_duration'
    assert segmenter.await_quiet


def test_idle_jitter_nohands_and_single_spike_do_not_start_signs():
    for motion, hands in ((.01, True), (.4, False), (0, True)):
        segmenter = SignSegmenter()
        for stamp in range(0, 20000, 100):
            assert segmenter.sample(stamp, motion, stamp, hands)[0] is None
            assert len(segmenter.history) <= MAX_HISTORY
        assert segmenter.segment_id == 0
    segmenter = SignSegmenter()
    for stamp in range(0, 2000, 100):
        assert segmenter.sample(stamp, .1 if stamp == 500 else 0, stamp, True)[0] is None


def test_frame_gap_discards_old_gesture_and_slow_activity_can_restart():
    segmenter = SignSegmenter()
    for stamp in range(0, 1000, 100):
        segmenter.sample(stamp, .1, stamp, True)
    phase, frames, reason = segmenter.sample(2000, 0, 2000, True)
    assert phase is None and frames == () and reason == "frame_gap"
    assert segmenter.state == "ready" and len(segmenter.history) == 1
    for stamp in range(2100, 2600, 100):
        phase, frames, _ = segmenter.sample(stamp, .04, stamp, True)
    assert any(item[0] == 2000 for item in segmenter.history)


def test_continuous_motion_is_bounded_and_cannot_emit_repeated_finals_until_quiet():
    segmenter = SignSegmenter()
    finals = []
    for stamp in range(0, 30000, 100):
        phase, frames, reason = segmenter.sample(stamp, .2, stamp, True)
        if phase == "final":
            finals.append((frames, reason))
        assert len(segmenter.history) <= MAX_HISTORY
    assert len(finals) == 1 and finals[0][1] == "max_duration"
    assert segmenter.await_quiet
    for stamp in range(30000, 30600, 100):
        segmenter.sample(stamp, 0, stamp, True)
    assert not segmenter.await_quiet
    for stamp in range(30600, 31000, 100):
        segmenter.sample(stamp, .2, stamp, True)
    assert segmenter.segment_id == 2


def landmarks():
    xyz = [[.5, .5, 0] for _ in range(75)]
    xyz[11], xyz[12] = [.4, .5, 0], [.6, .5, 0]
    return xyz, [True] * 75


def test_hand_motion_tracks_fingers_and_translation_not_only_wrists():
    previous = landmarks()
    current = landmarks()
    for point in range(34, 54):
        current[0][point][0] += .02
    assert current[0][33] == previous[0][33]  # Stationary wrist, moving fingers.
    assert hand_motion(previous, current, 100) > .09
    shifted = ([[p[0] + .1, p[1], p[2]] for p in previous[0]], previous[1])
    assert hand_motion(previous, shifted, 100) < 1e-12  # Whole-body translation removed.
    assert hand_motion(previous, current, 200) == pytest.approx(hand_motion(previous, current, 100) / 2)
    assert hand_motion(previous, current, 1000) == 0
    assert hand_motion(previous, (current[0], [False] * 75), 100) == 0


class FakeWorker:
    instances = []
    def __init__(self, config, stream_id):
        self.stream_id, self.closed = stream_id, False
        self.instances.append(self)
    def exchange(self, header=None, png=None, cancel_event=None):
        if cancel_event.is_set():
            raise RecognitionError("cancelled", "Stopped")
        if header is None:
            return None
        return {**header, "state": "ready", "phase": None, "segment_id": 0, "prediction": None, "quality": {}}
    def shutdown(self):
        self.closed = True


def test_global_ownership_cleanup_reconnect_and_shutdown():
    service = StreamingService(factory=FakeWorker)
    first = service.acquire("owner-a")
    assert first.start()["stream_id"] == first.stream_id
    assert first.frame(packet())["sequence"] == 0
    for owner in ("owner-a", "owner-b"):
        with pytest.raises(RecognitionError, match="already active"):
            service.acquire(owner)
    service.release(first)
    assert first.cancelled.is_set() and first.worker.closed
    second = service.acquire("owner-b")
    assert second.stream_id != first.stream_id and second.owner == "owner-b"
    service.shutdown()
    service.release(second)  # Socket finally racing shutdown remains safe.
    assert second.worker.closed and service.active is None
    with pytest.raises(RecognitionError, match="stopped"):
        service.acquire("owner-a")


def test_session_timeout_and_cancel_prevent_worker_frames(monkeypatch):
    service = StreamingService(factory=FakeWorker)
    lease = service.acquire("a")
    lease.created -= 1801
    with pytest.raises(RecognitionError, match="time limit"):
        lease.frame(packet())
    lease.cancel()
    with pytest.raises(RecognitionError, match="stopped"):
        lease.frame(packet())
    service.release(lease)


def test_failed_teardown_retains_ownership_until_cleanup_succeeds(monkeypatch):
    service = StreamingService(factory=FakeWorker)
    lease = service.acquire("owner")
    close = lease.worker.shutdown
    def fail():
        raise RuntimeError("Process teardown could not be verified")
    monkeypatch.setattr(lease.worker, "shutdown", fail)
    with pytest.raises(RuntimeError):
        service.release(lease)
    assert lease.cancelled.is_set() and service.active is lease
    with pytest.raises(RecognitionError, match="already active"):
        service.acquire("another-owner")
    monkeypatch.setattr(lease.worker, "shutdown", close)
    service.shutdown()
    assert service.active is None and lease.worker.closed
