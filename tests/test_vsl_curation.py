import copy
import json
import subprocess
import sys

import pytest

from app.desktop_collector import vsl_curation
from app.desktop_collector.vsl_curation import main, screen_groups
from app.desktop_collector.vsl_data_audit import AuditError
from app.desktop_collector.vsl_feature_review import group_and_split


def fixture():
    rows = [{"sha256": f"{i:064x}", "label": "Ăn", "decoded_frames": 10,
             "archive_path": f"dataset/train/Ăn/{i}.mp4", "local_file": f"videos/{i:064x}.mp4"}
            for i in range(10)]
    features = [{"video_sha256": r["sha256"], "label": r["label"], "archive_path": r["archive_path"],
                 "frames": 10, "either_hand_frames": 10, "either_hand_coverage": 1.0} for r in rows]
    rgb = [{"sha256": r["sha256"], "label": r["label"], "archive_path": r["archive_path"],
            "frames": 10, "flat_frame_indices": []} for r in rows]
    groups = group_and_split(rows, [(rows[0]["sha256"], rows[1]["sha256"])])
    return rows, features, rgb, groups


def test_quality_flag_quarantines_whole_group_and_preserves_other_assignments():
    rows, features, rgb, groups = fixture()
    rgb[0]["flat_frame_indices"] = [0]
    before = copy.deepcopy(groups)
    report = screen_groups(rows, features, rgb, groups)
    assert groups == before
    assert report["summary"]["directly_flagged_clips"] == 1
    assert report["summary"]["clips_by_split"]["quarantine"] == 2
    for group, old in zip(report["groups"], groups["groups"]):
        assert group["members"] == old["members"]
        if rows[0]["sha256"] not in group["members"]:
            assert group["split"] == old["split"]
    assert not report["training_ready"]
    assert all(r["semantic_review"] == "pending" for r in report["records"])


def test_half_threshold_is_inclusive_and_low_coverage_is_quarantined():
    rows, features, rgb, groups = fixture()
    features[2].update(either_hand_frames=5, either_hand_coverage=.5)
    features[3].update(either_hand_frames=4, either_hand_coverage=.4)
    report = screen_groups(rows, features, rgb, groups)
    records = {r["sha256"]: r for r in report["records"]}
    assert records[rows[2]["sha256"]]["proposed_split"]
    assert records[rows[3]["sha256"]]["proposed_split"] is None


@pytest.mark.parametrize("problem", ["duplicate_rgb", "missing_rgb", "foreign_rgb", "label", "frames",
    "flat_bool", "flat_duplicate", "flat_order", "flat_range", "bad_hand_count", "bad_coverage",
    "duplicate_member", "foreign_member", "group_label"])
def test_inconsistent_reports_fail_closed(problem):
    rows, features, rgb, groups = fixture()
    if problem == "duplicate_rgb": rgb.append(rgb[0])
    if problem == "missing_rgb": rgb.pop()
    if problem == "foreign_rgb": rgb[0]["sha256"] = "f"*64
    if problem == "label": rgb[0]["label"] = "Đi"
    if problem == "frames": rgb[0]["frames"] = True
    if problem == "flat_bool": rgb[0]["flat_frame_indices"] = [True]
    if problem == "flat_duplicate": rgb[0]["flat_frame_indices"] = [1, 1]
    if problem == "flat_order": rgb[0]["flat_frame_indices"] = [2, 1]
    if problem == "flat_range": rgb[0]["flat_frame_indices"] = [10]
    if problem == "bad_hand_count": features[0]["either_hand_frames"] = -1
    if problem == "bad_coverage": features[0]["either_hand_coverage"] = .9
    if problem == "duplicate_member": groups["groups"][0]["members"].append(rows[0]["sha256"])
    if problem == "foreign_member": groups["groups"][0]["members"][0] = "f"*64
    if problem == "group_label": groups["groups"][0]["labels"] = ["Đi"]
    with pytest.raises(AuditError):
        screen_groups(rows, features, rgb, groups)


def test_cli_does_not_write_into_source_directories(tmp_path):
    original = tmp_path / "source.json"
    original.write_text("{}", encoding="utf-8")
    args = [item for key in ("pilot", "features", "groups", "rgb") for item in (f"--{key}", str(original))]
    with pytest.raises(SystemExit) as error:
        main([*args, "--output", str(original)])
    assert error.value.code == 2
    assert original.read_text() == "{}"


def test_import_is_independent_of_ml_and_ui():
    result = subprocess.run([sys.executable, "-c",
        "import sys; import app.desktop_collector.vsl_curation; assert not any(n in sys.modules for n in ['numpy','cv2','mediapipe','torch','PySide6','webview'])"], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


@pytest.mark.parametrize("problem", ["rgb_source", "rgb_rule", "group_assignment"])
def test_curation_rejects_wrong_provenance_or_modified_group_proposal(tmp_path, monkeypatch, problem):
    import hashlib
    rows, features, rgb_rows, groups = fixture()
    pilot = tmp_path / "pilot.json"
    pilot.write_text(json.dumps({"candidates": rows}), encoding="utf-8")
    rgb = {"schema": "visign-flat-frame-diagnostic-v1", "rule": vsl_curation.RGB_RULE,
           "pilot_sha256": hashlib.sha256(pilot.read_bytes()).hexdigest(), "records": rgb_rows}
    expected = copy.deepcopy(groups)
    if problem == "rgb_source": rgb["pilot_sha256"] = "0"*64
    if problem == "rgb_rule": rgb["rule"] = "different threshold"
    if problem == "group_assignment": groups["groups"][0]["split"] = None
    paths = []
    for name, value in (("features", {"records": features}), ("groups", groups), ("rgb", rgb)):
        path = tmp_path / f"{name}.json"
        path.write_text(json.dumps(value), encoding="utf-8")
        paths.append(path)
    # Lower-level source/NPZ validation is covered by its own suite; isolate linkage here.
    monkeypatch.setattr(vsl_curation, "validate_candidates", lambda *args: rows)
    monkeypatch.setattr(vsl_curation, "build_review", lambda *args: expected)
    with pytest.raises(AuditError):
        vsl_curation.build_curation(pilot, *paths)
