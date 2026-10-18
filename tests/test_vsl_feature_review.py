import hashlib
import json

import numpy as np
import pytest

from app.desktop_collector.vsl_data_audit import AuditError, read_json
from app.desktop_collector.vsl_feature_review import build_review, group_and_split
from app.desktop_collector.vsl_features import CONTRACT


def record(index, label="Ăn"):
    return {"sha256": f"{index:064x}", "label": label,
            "archive_path": f"dataset/train/{label}/{index}.mp4", "duplicate_aliases": []}


def test_aliases_and_transitive_visual_links_never_cross_partitions():
    rows = [record(i) for i in range(12)]
    rows[0]["duplicate_aliases"] = ["dataset/train/Ăn/1_2.mp4"]
    rows[2]["duplicate_aliases"] = ["dataset/train/Ăn/3_1.mp4"]
    report = group_and_split(rows, [(rows[1]["sha256"], rows[2]["sha256"])])
    group = next(g for g in report["groups"] if rows[0]["sha256"] in g["members"])
    assert set(group["members"]) == {r["sha256"] for r in rows[:4]}
    assert group["split"] in ("train", "val", "test")
    assert len({sha for g in report["groups"] for sha in g["members"]}) == 12


def test_cross_label_similarity_and_missing_hands_quarantine_whole_groups():
    rows = [record(i) for i in range(10)] + [record(20, "Đi")]
    rows[2]["all_hands_missing"] = True
    report = group_and_split(rows, [(rows[0]["sha256"], rows[-1]["sha256"]),
                                    (rows[1]["sha256"], rows[2]["sha256"])])
    bad = {rows[i]["sha256"] for i in (0,1,2,-1)}
    for group in report["groups"]:
        if bad.intersection(group["members"]):
            assert group["split"] is None and group["quarantine_reasons"]
    assert report["signer_independence"] == "not_established"
    assert report["training_ready"] is False


def test_split_proposal_is_order_independent_and_insufficient_classes_stay_unassigned():
    rows = [record(i) for i in range(10)] + [record(i, "Đi") for i in range(20,24)]
    left, right = group_and_split(rows, []), group_and_split(list(reversed(rows)), [])
    assert left == right
    assert all(g["split"] is None for g in left["groups"] if g["labels"] == ["Đi"])
    assert {g["split"] for g in left["groups"] if g["labels"] == ["Ăn"]} == {"train","val","test"}


def test_unknown_visual_pair_fails():
    with pytest.raises(AuditError):
        group_and_split([record(1)], [(record(1)["sha256"], record(2)["sha256"])])


def feature_fixture(tmp_path, problem=None):
    row = record(1)
    row["decoded_frames"] = 2
    pilot = tmp_path / "pilot.json"
    pilot.write_text(json.dumps({"candidates":[row]}), encoding="utf-8")
    _, receipt = read_json(pilot)
    mask = np.ones((2,75), dtype=np.bool_)
    xyz = np.zeros((2,75,3), dtype=np.float32)
    if problem == "missing_mask":
        mask[0,33] = False
        xyz[0,33,0] = 1
    if problem == "nan": xyz[0,0,0] = np.nan
    if problem == "dtype": xyz = xyz.astype(np.float64)
    if problem == "partial_group": mask[0,34] = False
    feature = tmp_path / "sample.npz"
    np.savez(feature, xyz=xyz, present=mask, pose_visibility=np.ones((2,33),dtype=np.float32),
             frame_index=np.array([0,1] if problem != "frames" else [0,0]),
             visual_signature=np.zeros((8,32,32), dtype=np.uint8))
    report = {"schema_version":CONTRACT,"state":"complete","source":receipt,"records":[
        {"video_sha256":row["sha256"],"label":row["label"],"archive_path":row["archive_path"],
         "feature_file":feature.name,"feature_sha256":hashlib.sha256(feature.read_bytes()).hexdigest(),
         "either_hand_coverage":1.0}]}
    if problem == "source": report["source"]["sha256"] = "0"*64
    if problem == "hash": report["records"][0]["feature_sha256"] = "0"*64
    if problem == "partial": report["state"] = "prepared_not_completed"
    if problem == "annotation": report["records"][0]["label"] = "Đi"
    if problem == "coverage": report["records"][0]["either_hand_coverage"] = .5
    path = tmp_path / "feature-report.json"
    path.write_text(json.dumps(report),encoding="utf-8")
    return pilot, path


@pytest.mark.parametrize("problem", ["missing_mask","nan","dtype","partial_group","frames","source","hash","partial","annotation","coverage"])
def test_invalid_artifacts_cannot_be_split(tmp_path, problem):
    with pytest.raises(AuditError):
        build_review(*feature_fixture(tmp_path,problem))


def test_small_valid_review_reports_insufficient_groups_instead_of_fake_split(tmp_path):
    report = build_review(*feature_fixture(tmp_path))
    assert report["summary"]["clips_by_split"] == {"quarantine":1}
    assert report["groups"][0]["split"] is None
