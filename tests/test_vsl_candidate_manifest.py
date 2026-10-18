"""Candidate preparation must not turn annotation consistency into data approval."""

import copy
import hashlib
import json

import pytest

from app.desktop_collector.vsl_candidate_manifest import main, prepare_candidates
from app.desktop_collector.vsl_data_audit import AuditError

REVISION = "f" * 40


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
    return path


def sources(tmp_path, mutate=None, glosses=None):
    root = tmp_path / "source"
    root.mkdir()
    rows, entries = [], []
    for i, split in enumerate(("train", "val", "test"), 1):
        rid = f"SENT001_S{i:02}_R01_F"
        rows.append({"id": rid, "signer_id": f"S{i:02}", "split": split,
                     "gloss_sequence": ["TÔI", "CHỜ", "TÔI"],
                     "gloss_frame_boundaries": [{"start": 0, "end": 5, "gloss": "TÔI"},
                                                {"start": 5, "end": 9, "gloss": "CHỜ"},
                                                {"start": 9, "end": 15, "gloss": "TÔI"}]})
        entries.append({"type": "blob", "path": f"data/keypoints/{rid}.npy", "sha": str(i) * 40})
    if mutate:
        mutate(rows, entries)
    meta = dump(root / "dataset.json", rows)
    raw = meta.read_bytes()
    entries.append({"type": "blob", "path": "data/dataset.json",
                    "sha": hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()})
    tree = dump(root / "tree.json", {"sha": REVISION, "tree": entries, "truncated": False})
    selection = dump(root / "selection.json", {"source": REVISION,
                     "labels": [{"gloss": g} for g in (glosses or ["TÔI", "CHỜ"])]})
    return meta, tree, selection


def duplicate_train(rows, entries):
    row = copy.deepcopy(rows[0])
    row["id"] = "SENT001_S01_R02_F"
    rows.append(row)
    entries.append({**entries[0], "path": f"data/keypoints/{row['id']}.npy"})


def test_repeated_unicode_glosses_keep_distinct_identity_and_original_boundaries(tmp_path):
    paths = sources(tmp_path)
    before = [p.read_bytes() for p in paths]
    report = prepare_candidates(*paths)
    assert report["summary"]["candidate_segments"] == 9
    assert len({s["segment_id"] for s in report["segments"]}) == 9
    assert [s["source_start"] for s in report["segments"][:3]] == [0, 5, 9]
    assert report["coverage"][0]["splits"]["train"] == {
        "segments": 2, "unique_feature_blobs": 1, "signer_ids": ["S01"]}
    assert report["training_ready"] is False
    assert report["source_tree_sha"] == REVISION
    assert report["source_commit_verification"] == "not_established_by_tree_input"
    assert report["frame_boundary_convention"] == "unverified_source_values_no_slicing"
    assert report["semantic_review"] == report["media_validation"] == "pending"
    assert before == [p.read_bytes() for p in paths]


def test_identical_repetitions_are_one_feature_record_with_explicit_aliases(tmp_path):
    report = prepare_candidates(*sources(tmp_path, duplicate_train))
    assert report["summary"]["candidate_recordings"] == 3
    assert report["summary"]["candidate_segments"] == 9
    assert report["duplicate_aliases"][0]["alias_ids"] == ["SENT001_S01_R02_F"]
    assert report["segments"][0]["alias_segment_ids"] == ["SENT001_S01_R02_F:0"]


def test_conflicting_unselected_annotation_excludes_entire_duplicate_group(tmp_path):
    def mutate(rows, entries):
        duplicate_train(rows, entries)
        rows[-1]["gloss_frame_boundaries"][1]["start"] = 6  # CHỜ is not selected.
    report = prepare_candidates(*sources(tmp_path, mutate, ["TÔI"]))
    assert not any(s["split"] == "train" for s in report["segments"])
    assert "conflicting full annotations" in report["excluded_feature_groups"][0]["reasons"][0]


def test_cross_split_features_cannot_contribute_to_either_split(tmp_path):
    def mutate(rows, entries):
        entries[2]["sha"] = entries[0]["sha"]
    report = prepare_candidates(*sources(tmp_path, mutate))
    assert {s["split"] for s in report["segments"]} == {"val"}
    assert "feature shared across splits" in report["excluded_feature_groups"][0]["reasons"]


@pytest.mark.parametrize("conflict", ["shared_blob", "same_signer", "alias_signer"])
def test_quarantined_rows_cannot_hide_leakage(tmp_path, conflict):
    def mutate(rows, entries):
        rows[2]["gloss_sequence"] = []
        if conflict == "shared_blob":
            entries[2]["sha"] = entries[0]["sha"]
        elif conflict == "same_signer":
            rows[2]["signer_id"] = "S01"  # Invalid filename/identity still informs leakage.
        else:
            rows[2]["signer"] = "S01"  # Even the conflicting alias field matters.
    report = prepare_candidates(*sources(tmp_path, mutate))
    assert {s["split"] for s in report["segments"]} == {"val"}
    assert report["summary"]["metadata_quarantined_rows"] == 1


def test_duplicate_features_with_different_signers_are_excluded_within_one_split(tmp_path):
    def mutate(rows, entries):
        rows[1]["split"] = "train"
        entries[1]["sha"] = entries[0]["sha"]
    report = prepare_candidates(*sources(tmp_path, mutate))
    assert {s["split"] for s in report["segments"]} == {"test"}


@pytest.mark.parametrize("start,end", [(False, 5), (0, 4.5), (-1, 5), (0, 0), (0, 7)])
def test_invalid_ranges_never_become_segments(tmp_path, start, end):
    def mutate(rows, entries):
        rows[0]["gloss_frame_boundaries"][0].update(start=start, end=end)
    report = prepare_candidates(*sources(tmp_path, mutate))
    assert not any(s["split"] == "train" for s in report["segments"])


@pytest.mark.parametrize("problem", ["metadata_bytes", "revision", "duplicate_gloss", "unknown_gloss", "truncated"])
def test_untrusted_inputs_fail_before_publication(tmp_path, problem):
    paths = sources(tmp_path)
    meta, tree, selection = paths
    if problem == "metadata_bytes":
        meta.write_bytes(meta.read_bytes() + b"\n")
    elif problem == "truncated":
        value = json.loads(tree.read_text(encoding="utf-8"))
        value["truncated"] = True
        dump(tree, value)
    else:
        value = json.loads(selection.read_text(encoding="utf-8"))
        if problem == "revision": value["source"] = "e" * 40
        if problem == "duplicate_gloss": value["labels"].append(value["labels"][0])
        if problem == "unknown_gloss": value["labels"][0]["gloss"] = "tôi"
        dump(selection, value)
    with pytest.raises(AuditError):
        prepare_candidates(*paths)


def arguments(paths, output):
    return ["--metadata", str(paths[0]), "--tree", str(paths[1]),
            "--candidates", str(paths[2]), "--output", str(output)]


def test_publication_is_repeatable_no_overwrite_and_keeps_sources_untouched(tmp_path):
    paths = sources(tmp_path)
    output = tmp_path / "review" / "manifest.json"
    assert main(arguments(paths, output)) == 0
    raw, mtime = output.read_bytes(), output.stat().st_mtime_ns
    assert main(arguments(paths, output)) == 0
    assert output.read_bytes() == raw and output.stat().st_mtime_ns == mtime
    selection = json.loads(paths[2].read_text(encoding="utf-8"))
    selection["labels"].pop()
    dump(paths[2], selection)
    with pytest.raises(SystemExit) as exc:
        main(arguments(paths, output))
    assert exc.value.code == 2 and output.read_bytes() == raw


@pytest.mark.parametrize("location", ["input", "source_dir", "raw"])
def test_protected_destinations_are_refused(tmp_path, location):
    paths = sources(tmp_path)
    before = [p.read_bytes() for p in paths]
    output = {"input": paths[0], "source_dir": paths[0].parent / "report.json",
              "raw": tmp_path / "data" / "raw" / "report.json"}[location]
    with pytest.raises(SystemExit) as exc:
        main(arguments(paths, output))
    assert exc.value.code == 2
    assert before == [p.read_bytes() for p in paths]
    if location != "input": assert not output.exists()
