"""Feature qualification preserves missingness, immutable source bytes and runtime isolation."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace

import numpy as np
import pytest

from app.desktop_collector.vsl_data_audit import AuditError
from app.desktop_collector.vsl_features import main, pack_landmarks, validate_candidates


def source(tmp_path):
    root = tmp_path / "source"
    (root / "videos").mkdir(parents=True)
    data = b"fixture bytes only; validation does not decode"
    sha = hashlib.sha256(data).hexdigest()
    path = root / "videos" / f"{sha}.mp4"
    path.write_bytes(data)
    pilot = {"schema": "smartglove-visign-local-pilot-v1", "candidates": [
        {"sha256": sha, "local_file": f"videos/{sha}.mp4", "label": "Ăn", "decoded_frames": 30}]}
    return root, path, pilot


def landmark_group(count, value=0.0):
    return SimpleNamespace(landmark=[SimpleNamespace(x=value, y=value, z=value, visibility=.9)
                                     for _ in range(count)])


def test_absent_hand_is_distinct_from_real_zero_coordinates():
    result = SimpleNamespace(pose_landmarks=landmark_group(33),
                             left_hand_landmarks=None, right_hand_landmarks=landmark_group(21))
    xyz, mask, visibility = pack_landmarks(result)
    assert xyz.shape == (75, 3) and xyz.dtype == np.float32
    assert not xyz.any()  # Both emitted zero coordinates and missing values can be zero.
    assert mask[:33].all() and not mask[33:54].any() and mask[54:].all()
    np.testing.assert_allclose(visibility, .9)


def test_all_missing_frame_is_preserved_without_interpolation():
    xyz, mask, visibility = pack_landmarks(SimpleNamespace(
        pose_landmarks=None, left_hand_landmarks=None, right_hand_landmarks=None))
    assert not xyz.any() and not mask.any() and not visibility.any()


@pytest.mark.parametrize("problem", ["nan", "count", "visibility"])
def test_invalid_landmarks_cannot_be_published(problem):
    result = SimpleNamespace(pose_landmarks=landmark_group(33),
                             left_hand_landmarks=landmark_group(21), right_hand_landmarks=None)
    if problem == "nan": result.left_hand_landmarks.landmark[0].x = float("nan")
    if problem == "count": result.left_hand_landmarks.landmark.pop()
    if problem == "visibility": result.pose_landmarks.landmark[0].visibility = float("inf")
    with pytest.raises(AuditError):
        pack_landmarks(result)


@pytest.mark.parametrize("problem", ["bytes", "path", "duplicate", "frame_bool", "label", "schema"])
def test_source_failures_rejected_before_extraction(tmp_path, problem):
    root, path, pilot = source(tmp_path)
    if problem == "bytes": path.write_bytes(b"changed")
    if problem == "path": pilot["candidates"][0]["local_file"] = "../outside.mp4"
    if problem == "duplicate": pilot["candidates"].append(pilot["candidates"][0].copy())
    if problem == "frame_bool": pilot["candidates"][0]["decoded_frames"] = True
    if problem == "label": pilot["candidates"][0]["label"] = " "
    if problem == "schema": pilot["schema"] = "other"
    with pytest.raises(AuditError):
        validate_candidates(pilot, root)


@pytest.mark.parametrize("kind", ["source", "ancestor", "raw", "existing"])
def test_outputs_never_overwrite_source_or_prior_runs(tmp_path, kind):
    root, path, pilot = source(tmp_path)
    document = root / "pilot.json"
    document.write_text(json.dumps(pilot), encoding="utf-8")
    output = {"source":root/"features", "ancestor":tmp_path,
              "raw":tmp_path/"data"/"raw"/"features", "existing":tmp_path/"old-run"}[kind]
    if kind == "existing": output.mkdir()
    before = path.read_bytes()
    with pytest.raises(SystemExit) as error:
        main(["--pilot", str(document), "--output-dir", str(output)])
    assert error.value.code == 2 and path.read_bytes() == before


def test_import_does_not_load_ml_or_ui_runtime():
    command = "import sys; import app.desktop_collector.vsl_features; assert not any(x in sys.modules for x in ['mediapipe','cv2','torch','PySide6','webview'])"
    result = subprocess.run([sys.executable, "-c", command], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
