"""Hand recovery must not guess identity or recycle missing-hand coordinates."""
from types import SimpleNamespace as NS

import pytest

from app.desktop_collector.recognition.tracker import HandRecovery, associate_hands, recovery_targets


def group(x, y, count=21):
    return NS(landmark=[NS(x=x, y=y, z=0., visibility=1.) for _ in range(count)])


def result():
    pose = group(.5, .5, 33)
    pose.landmark[11].x, pose.landmark[12].x = .3, .7
    pose.landmark[15].x, pose.landmark[16].x = .25, .75
    return NS(pose_landmarks=pose, left_hand_landmarks=None, right_hand_landmarks=None)


def test_associates_by_current_pose_not_screen_order_or_mirrored_handedness():
    r = result()
    r.pose_landmarks.landmark[15].x, r.pose_landmarks.landmark[16].x = .75, .25
    left, right = group(.76, .5), group(.24, .5)
    merged, recovered = associate_hands(r, [right, left])
    assert set(recovered) == {"left", "right"}
    assert merged.left_hand_landmarks is left and merged.right_hand_landmarks is right
    assert r.left_hand_landmarks is None  # Never overwrite the original result.


@pytest.mark.parametrize("kind", ["ambiguous", "far", "nonfinite", "outside", "short", "invisible", "duplicate"])
def test_rejects_unreliable_matches(kind):
    r, hand = result(), group(.26, .5)
    if kind == "ambiguous": r.pose_landmarks.landmark[16].x = .27
    if kind == "far": hand = group(.5, .5)
    if kind == "nonfinite": hand.landmark[5].z = float("nan")
    if kind == "outside": hand.landmark[5].x = 1.01
    if kind == "short": hand = group(.26, .5, 20)
    if kind == "invisible": r.pose_landmarks.landmark[15].visibility = .49
    if kind == "duplicate": r.right_hand_landmarks = group(.28, .5)
    merged, recovered = associate_hands(r, [hand])
    assert merged.left_hand_landmarks is None and recovered == []


def test_missing_pose_never_gets_hands_from_another_person():
    r = result(); r.pose_landmarks = None
    assert recovery_targets(r) == []
    assert associate_hands(r, [group(.25, .5)])[1] == []


def test_recovery_is_bounded_fresh_and_resets_on_a_gap():
    calls = []
    class Graph:
        def process(self, frame):
            calls.append(frame)
            return NS(multi_hand_landmarks=[group(.25, .5)] if frame['image'] == 'frame0' else [])
        def reset(self): calls.append("reset")
    recovery = object.__new__(HandRecovery)
    recovery.graph, recovery.last_attempt = Graph(), None
    recovery.active = False
    r = result()
    merged, names, attempted = recovery.process("frame0", r, 0)
    assert names == ["left"] and attempted and merged.left_hand_landmarks
    unchanged, names, attempted = recovery.process("frame1", r, 17)
    assert unchanged.left_hand_landmarks is None and names == [] and attempted  # Fresh check, not held points.
    recovery.process("frame2", r, 100)
    assert calls == [{'image': 'frame0'}, {'image': 'frame1'}]  # Failed search cooldown.
    recovery.reset()
    recovery.process("frame3", r, 101)
    assert calls[-2] == "reset" and calls[-1] == {"image": "frame3"}


def test_existing_detected_hands_are_preserved():
    r = result(); hand = group(.25, .5); r.left_hand_landmarks = hand
    merged, recovered = associate_hands(r, [group(.26, .5)])
    assert merged.left_hand_landmarks is hand and recovered == []


def test_recovery_stream_cannot_be_mistaken_for_capture_preprocessing():
    from app.desktop_collector.recognition.gh_tcn import GH_TCN_MODEL
    from app.desktop_collector.recognition.streaming import stream_prediction
    prediction = stream_prediction("test", 1, 0, GH_TCN_MODEL)
    assert prediction.preprocessing_id == GH_TCN_MODEL.preprocessing_id + "-stream-palm-recovery-v2"
    assert prediction.model_sha256 == GH_TCN_MODEL.model_sha256
