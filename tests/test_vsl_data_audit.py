"""Data qualification must expose leakage and never silently repair source labels."""
import csv
import json
from pathlib import Path

import pytest

from app.desktop_collector.vsl_data_audit import (
    AuditError, audit_cropped_vsl, audit_multivsl, audit_vsl_gh, main,
)


def video(signer="01", label="0"):
    return f"sample_center_device11_signer{signer}_center_ord1_{label}.mp4"


def make_splits(root, extra=()):
    root.mkdir()
    for i, split in enumerate(("train", "val", "test"), 1):
        with (root / f"{split}_1_1000_center_ord1.csv").open("w", newline="", encoding="utf-8") as out:
            writer = csv.writer(out)
            writer.writerow(["name", "label", "video_lb_id"])
            writer.writerow([video(f"{i:02}", "0"), "0", str(i)])
            if split == "train":
                writer.writerows(extra)
    return root


def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return path


def cropped_sources(root):
    raw = dump(root / "raw.json", [
        {"video_id": "000001", "signer_id": "001", "gloss": "Ăn"},
        {"video_id": "000002", "signer_id": "001", "gloss": "Ăn"},
        {"video_id": "000003", "signer_id": "002", "gloss": "Ăn"},
    ])
    train = dump(root / "train.json", [{"videoid": "000001", "gloss": "Ăn"},
                                       {"videoid": "999999", "gloss": "Chào"}])
    test = dump(root / "test.json", [{"videoid": "000002", "gloss": "Ăn"}])
    return train, test, [raw]


def test_cropped_different_files_can_leak_the_same_signer(tmp_path):
    report = audit_cropped_vsl(*cropped_sources(tmp_path))
    assert report["canonical"]["recording_overlap"] == []
    assert report["canonical"]["signer_overlap"] == [{"splits": ["train", "test"], "values": ["001"]}]
    assert report["canonical"]["unmatched_rows"] == 1
    chao = next(r for r in report["target_coverage"] if r["gloss"] == "Chào")
    assert chao["known_signers"] == 0
    assert chao["unknown_signer_rows"] == 1
    assert report["training_ready"] is False
    assert len(report["target_coverage"]) == 25


def test_cropped_numeric_id_does_not_override_conflicting_gloss(tmp_path):
    train, test, raw = cropped_sources(tmp_path)
    dump(test, [{"videoid": "000002", "gloss": "Uống"}])
    report = audit_cropped_vsl(train, test, raw)
    assert report["canonical"]["raw_gloss_conflicts"][0]["signer_id"] is None
    assert report["canonical"]["unmatched_rows"] == 2
    assert report["canonical"]["signer_overlap"] == []


def test_cropped_duplicate_raw_identity_is_ambiguous(tmp_path):
    train, test, raw = cropped_sources(tmp_path)
    with pytest.raises(AuditError, match="duplicate raw"):
        audit_cropped_vsl(train, test, raw + raw)


def test_cropped_tracks_augmentation_parent_leakage(tmp_path):
    train, test, raw = cropped_sources(tmp_path)
    augmented = dump(tmp_path / "aug.json", [
        {"videoid": "aug_000001", "source_videoid": "000001", "is_augmented": True,
         "gloss": "Ăn", "split": "train"},
        {"videoid": "000001", "gloss": "Ăn", "split": "test"},
    ])
    report = audit_cropped_vsl(train, test, raw, augmented)
    assert report["augmented"]["recording_overlap"] == [{"splits": ["train", "test"], "values": ["000001"]}]
    assert report["augmented"]["augmented_rows"] == 1


@pytest.mark.parametrize("row", [
    {"videoid": "x", "gloss": "Ăn", "is_augmented": True},
    {"videoid": "x", "gloss": "Ăn", "is_augmented": "true"},
    {"videoid": 1, "gloss": "Ăn"},
    {"videoid": "x", "gloss": "Ăn", "source_videoid": "000001"},
])
def test_cropped_rejects_unreliable_identity_contract(tmp_path, row):
    train, test, raw = cropped_sources(tmp_path)
    dump(train, [row])
    with pytest.raises(AuditError):
        audit_cropped_vsl(train, test, raw)


def test_cropped_cli_never_overwrites_source(tmp_path):
    train, test, raw = cropped_sources(tmp_path)
    before = train.read_bytes()
    with pytest.raises(SystemExit) as exc:
        main(["cropped-vsl", "--train", str(train), "--test", str(test),
              "--raw", str(raw[0]), "--output", str(train)])
    assert exc.value.code == 2
    assert train.read_bytes() == before


def gh_sources(root, mutate=None, shared_blob=False):
    rows, entries = [], []
    for i, split in enumerate(("train", "val", "test"), 1):
        rid = f"SENT001_S{i:02}_R01_F"
        rows.append({"id": rid, "signer_id": f"S{i:02}", "split": split,
                     "gloss_sequence": ["TÔI", "MUỐN"], "gloss_frame_boundaries": [
                         {"start": 0, "end": 5, "gloss": "TÔI"},
                         {"start": 5, "end": 10, "gloss": "MUỐN"}]})
        entries.append({"path": f"data/keypoints/{rid}.npy", "type": "blob",
                        "sha": ("a" if shared_blob else str(i)) * 40})
    if mutate:
        mutate(rows, entries)
    return dump(root / "metadata.json", rows), dump(root / "tree.json", {"tree": entries, "truncated": False})


def test_missing_inventory_means_unknown_not_no_media(tmp_path):
    report = audit_multivsl(make_splits(tmp_path / "source"))
    assert report["inventory"] is None
    assert report["signer_overlap"] == []
    assert report["training_ready"] is False
    assert len(report["sources"]) == 3
    assert all(len(s["sha256"]) == 64 for s in report["sources"])


def test_partial_inventory_does_not_claim_dataset_completeness(tmp_path):
    source = make_splits(tmp_path / "source")
    inventory = dump(tmp_path / "inventory.json", {"files": [{"title": video()}]})
    report = audit_multivsl(source, inventory)
    inv = report["inventory"]
    assert inv["splits"]["train"]["listed_rows"] == 1
    assert inv["splits"]["test"]["listed_rows"] == 0
    assert inv["classes_listed_in_all_splits"] == []
    assert inv["media_download_verified"] is False
    assert "not_proof" in inv["status"]


def test_leakage_and_duplicate_labels_are_visible(tmp_path):
    source = make_splits(tmp_path / "source", [(video("02"), "0", "2"), (video(), "1", "1")])
    report = audit_multivsl(source)
    assert report["filename_overlap"]
    assert report["signer_overlap"]
    assert report["video_id_overlap"]
    assert report["conflicting_labels"] == [{"name": video(), "labels": ["0", "1"]}]
    assert len(report["issues"]) == 1


@pytest.mark.parametrize("name,label", [("../x.mp4", "0"), (video(), "1"), (video(), ""), (video("01", "1000"), "1000")])
def test_invalid_identity_does_not_contribute_to_class_counts(tmp_path, name, label):
    report = audit_multivsl(make_splits(tmp_path / "source", [(name, label, "9")]))
    assert report["issues"]
    assert report["splits"]["train"]["parsed_unique_rows"] == 1


def test_wrong_csv_schema_fails_without_output(tmp_path):
    source = make_splits(tmp_path / "source")
    (source / "train_1_1000_center_ord1.csv").write_text("name,label,label\nx,1,2\n")
    with pytest.raises(AuditError, match="columns"):
        audit_multivsl(source)


def test_valid_gh_metadata_keeps_unicode_and_counts_recordings(tmp_path):
    report = audit_vsl_gh(*gh_sources(tmp_path))
    assert report["structurally_consistent_rows"] == 3
    assert {g["gloss"] for g in report["gloss_coverage"]} == {"TÔI", "MUỐN"}
    assert report["consistency_is_semantic_approval"] is False
    assert report["training_ready"] is False


@pytest.mark.parametrize("problem", ["empty", "mismatch", "overlap", "missing", "duplicate", "identity", "bool_boundary"])
def test_gh_conflicts_are_quarantined_without_repair(tmp_path, problem):
    def mutate(rows, entries):
        if problem == "empty": rows[0]["gloss_sequence"] = [""]
        if problem == "mismatch": rows[0]["gloss_sequence"][0] = "KHÁC"
        if problem == "overlap": rows[0]["gloss_frame_boundaries"][1]["start"] = 4
        if problem == "missing": entries.pop(0)
        if problem == "duplicate": rows.append(rows[0].copy())
        if problem == "identity": rows[0]["signer_id"] = "S99"
        if problem == "bool_boundary": rows[0]["gloss_frame_boundaries"][0]["start"] = False
    inputs = gh_sources(tmp_path, mutate)
    before = [p.read_bytes() for p in inputs]
    report = audit_vsl_gh(*inputs)
    assert report["structurally_consistent_rows"] == 2
    assert report["quarantined"]
    assert before == [p.read_bytes() for p in inputs]


def test_gh_exact_feature_leakage_is_detected_even_with_different_signers(tmp_path):
    report = audit_vsl_gh(*gh_sources(tmp_path, shared_blob=True))
    assert report["signer_overlap"] == []
    assert len(report["feature_blob_overlap"]) == 3
    assert len(report["feature_duplicate_groups"]) == 1


def test_same_split_feature_copies_do_not_inflate_unique_feature_coverage(tmp_path):
    def duplicate(rows, entries):
        other_id = "SENT001_S01_R02_F"
        rows.append({**rows[0], "id": other_id})
        entries.append({**entries[0], "path": f"data/keypoints/{other_id}.npy"})
    report = audit_vsl_gh(*gh_sources(tmp_path, duplicate))
    assert report["structurally_consistent_rows"] == 4
    assert report["gloss_coverage"][0]["recordings"]["train"] == 2
    assert report["gloss_coverage"][0]["unique_feature_blobs"]["train"] == 1
    assert report["feature_blob_overlap"] == []


def test_truncated_tree_cannot_be_treated_as_missing_data(tmp_path):
    metadata, tree = gh_sources(tmp_path)
    d = json.loads(tree.read_text()); d["truncated"] = True; dump(tree, d)
    with pytest.raises(AuditError, match="complete"):
        audit_vsl_gh(metadata, tree)


@pytest.mark.parametrize("payload", ['[{"id":"first","id":"second"}]', '[{"id":NaN}]', '[{"id":Infinity}]'])
def test_ambiguous_json_is_rejected_without_last_value_winning(tmp_path, payload):
    metadata, tree = gh_sources(tmp_path)
    metadata.write_text(payload, encoding="utf-8")
    with pytest.raises(AuditError, match="Invalid JSON"):
        audit_vsl_gh(metadata, tree)


def test_cli_preserves_existing_report_and_identical_rerun(tmp_path):
    source = make_splits(tmp_path / "source")
    output = tmp_path / "audit.json"
    args = ["multi-vsl", "--split-dir", str(source), "--output", str(output)]
    assert main(args) == 0
    before = (output.read_bytes(), output.stat().st_mtime_ns)
    assert main(args) == 0
    assert (output.read_bytes(), output.stat().st_mtime_ns) == before
    output.write_text("user-owned data")
    with pytest.raises(SystemExit) as failure:
        main(args)
    assert failure.value.code == 2
    assert output.read_text() == "user-owned data"


@pytest.mark.parametrize("destination", ["source/new.json", "data/raw/session/audit.json"])
def test_cli_rejects_source_and_raw_outputs(tmp_path, destination):
    source = make_splits(tmp_path / "source")
    with pytest.raises(SystemExit) as failure:
        main(["multi-vsl", "--split-dir", str(source), "--output", str(tmp_path / destination)])
    assert failure.value.code == 2
    assert not (tmp_path / destination).exists()


def test_cli_rejects_replacing_input(tmp_path):
    metadata, tree = gh_sources(tmp_path)
    before = metadata.read_bytes()
    with pytest.raises(SystemExit):
        main(["vsl-gh", "--metadata", str(metadata), "--tree", str(tree), "--output", str(metadata)])
    assert metadata.read_bytes() == before
