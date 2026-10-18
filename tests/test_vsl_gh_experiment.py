import copy
import hashlib
import io

import numpy as np
import pytest

from app.desktop_collector.vsl_data_audit import AuditError
from app.desktop_collector.vsl_gh_experiment import (
    CHANNELS, deduplicate_segments, encode_segment, new_output, selected_segments,
    timestamp_frame, validate_recording, validate_training_inputs,
)


def feature_clip():
    x = np.zeros((40, 137, 3), dtype=np.float32)
    x[:, :25, 0] = np.linspace(.2, .8, 25)
    x[:, :25, 1] = .5
    x[:, 9, 0], x[:, 10, 0] = .3, .7
    for start in (95, 116):
        x[:, start:start + 21, 0] = np.linspace(.4, .6, 21)
        x[:, start:start + 21, 1] = .6
        x[:, start:start + 21, 2] = np.linspace(0, -.1, 21)
    x[:4, 95:116] = 0
    return x


def encoded_source(x=None):
    buf = io.BytesIO()
    np.save(buf, (feature_clip() if x is None else x).reshape(-1, 411), allow_pickle=False)
    data = buf.getvalue()
    blob = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
    row = {"fps": 30, "gloss_frame_boundaries": [{"start": 0, "end": 30, "gloss": "A"}],
           "glosses_detail": [{"gloss": "A", "start_time": "00:00:00.000", "end_time": "00:00:01.000"}]}
    return data, row, blob


def test_encoding_uses_subset_shoulders_and_preserves_missing_hands():
    x = feature_clip()
    encoded, quality = encode_segment(x)
    assert encoded.shape == (32, CHANNELS)
    # Global point1/2 are the correctly selected shoulders, centered at0.5.
    np.testing.assert_allclose(encoded[:, :102].reshape(32, 51, 2)[:, 1, 0], -.5, atol=1e-6)
    assert not encoded[0, :102].reshape(51, 2)[9:30].any()
    assert not encoded[0, 102:153][9:30].any()
    assert not encoded[0, 153:216].any()
    assert quality["hand_present_fraction"] == 1


def test_encoding_invariant_to_translation_scale_and_does_not_mutate_input():
    x = feature_clip()
    before = x.copy()
    mask = np.any(x != 0, axis=2)
    transformed = x.copy() * 1.4
    transformed[:, :, :2] += [.1, -.2]
    transformed[~mask] = 0
    np.testing.assert_allclose(encode_segment(x)[0], encode_segment(transformed)[0], atol=2e-6)
    np.testing.assert_array_equal(x, before)


@pytest.mark.parametrize("bad", ["nan", "short", "no_hands", "no_shoulders", "degenerate"])
def test_invalid_segments_rejected(bad):
    x = feature_clip()
    if bad == "nan": x[0, 0, 0] = np.nan
    if bad == "short": x = x[:3]
    if bad == "no_hands": x[:, 95:] = 0
    if bad == "no_shoulders": x[:, 9:11] = 0
    if bad == "degenerate": x[:, 10] = x[:, 9]
    with pytest.raises(AuditError):
        encode_segment(x)


def test_source_frame_convention_and_blob_are_checked():
    data, row, blob = encoded_source()
    assert timestamp_frame("00:00:01.240", 30) == 37
    assert validate_recording(data, row, blob).shape == (40, 137, 3)
    with pytest.raises(AuditError, match="blob"):
        validate_recording(data + b"x", row, blob)
    row["gloss_frame_boundaries"][0]["end"] = 31
    with pytest.raises(AuditError, match="timestamp"):
        validate_recording(data, row, blob)


def test_full_annotation_checked_even_when_selected_segment_in_bounds():
    data, row, blob = encoded_source()
    row["gloss_frame_boundaries"].append({"start": 30, "end": 60, "gloss": "OTHER"})
    row["glosses_detail"].append({"gloss": "OTHER", "start_time": "00:00:01.000", "end_time": "00:00:02.000"})
    with pytest.raises(AuditError, match="out of range"):
        validate_recording(data, row, blob)


@pytest.mark.parametrize("change", ["nonfinite", "dtype"])
def test_invalid_arrays_rejected_after_valid_hash(change):
    x = feature_clip()
    if change == "nonfinite": x[0, 0, 0] = np.inf
    if change == "dtype": x = x.astype(np.float64)
    data, row, blob = encoded_source(x)
    with pytest.raises(AuditError, match="float32"):
        validate_recording(data, row, blob)


def test_selection_is_deterministic_per_signer_without_split_leakage():
    rows = [{"segment_id": f"a{i}", "gloss": "A", "signer_id": "S01", "split": "train"} for i in range(70)]
    rows += [{"segment_id": "b", "gloss": "A", "signer_id": "S05", "split": "val"}]
    first = selected_segments({"segments": rows})
    assert len(first) == 41 and first == selected_segments({"segments": list(reversed(rows))})
    assert next(r for r in first if r["segment_id"] == "b")["split"] == "val"
    rows[-1]["split"] = "train"
    with pytest.raises(AuditError, match="signer/split"):
        selected_segments({"segments": rows})


def test_duplicate_segment_ids_rejected():
    row = {"segment_id": "a", "gloss": "A", "signer_id": "S01", "split": "train"}
    with pytest.raises(AuditError, match="Duplicate"):
        selected_segments({"segments": [row, row]})


def test_exact_segment_leakage_excluded_even_with_distinct_recording_hashes():
    rows = [{"segment_id": "a", "gloss": "A", "signer_id": "S01", "split": "train", "segment_content_sha256": "same"},
            {"segment_id": "b", "gloss": "A", "signer_id": "S06", "split": "test", "segment_content_sha256": "same"}]
    kept, vectors, excluded = deduplicate_segments(rows, [np.ones(2), np.ones(2)])
    assert kept == vectors == [] and len(excluded) == 2
    # Distinct raw bytes but same encoded input must not leak across partitions either.
    rows[1]["segment_content_sha256"] = "different"
    assert len(deduplicate_segments(rows, [np.ones(2), np.ones(2)])[2]) == 2


def test_same_signer_alias_collapsed_but_label_conflict_quarantines_both():
    a = {"segment_id": "a", "gloss": "A", "signer_id": "S01", "split": "train", "segment_content_sha256": "same"}
    b = {**a, "segment_id": "b"}
    before = copy.deepcopy([a, b])
    kept, _, excluded = deduplicate_segments([a, b], [np.ones(2), np.ones(2)])
    assert len(kept) == len(excluded) == 1 and [a, b] == before
    b["gloss"] = "B"
    assert deduplicate_segments([a, b], [np.ones(2), np.ones(2)])[0] == []


def test_output_guards_preserve_raw_sources_and_previous_experiments(tmp_path):
    raw = tmp_path / "data" / "raw" / "session"
    with pytest.raises(AuditError, match="data/raw"):
        new_output(raw)
    assert not raw.exists()
    source = tmp_path / "source"
    source.mkdir()
    with pytest.raises(AuditError, match="source"):
        new_output(source / "output", (source,))
    output = new_output(tmp_path / "experiment")
    (output / "keep.txt").write_text("keep", encoding="utf-8")
    with pytest.raises(FileExistsError):
        new_output(output)
    assert (output / "keep.txt").read_text('utf-8') == "keep"


def training_fixture():
    arrays, rows = {}, []
    rng = np.random.default_rng(7)
    for split, signer in (("train", "S01"), ("val", "S05"), ("test", "S06")):
        arrays[split + "_x"] = rng.normal(size=(6, 32, CHANNELS)).astype(np.float32)
        arrays[split + "_y"] = np.array([0, 0, 0, 1, 1, 1], dtype=np.int64)
        arrays[split + "_ids"] = np.array([f"{split}{i}" for i in range(6)])
        rows.extend({"segment_id": f"{split}{i}", "gloss": "A" if i < 3 else "B",
                     "split": split, "signer_id": signer} for i in range(6))
    return arrays, {"labels": ["A", "B"], "records": rows}


def test_training_arrays_match_recorded_provenance():
    arrays, audit = training_fixture()
    validate_training_inputs(arrays, audit)


@pytest.mark.parametrize("bad", ["leaked_values", "signer", "label", "unrecorded", "nan", "support"])
def test_training_rejects_leakage_and_inconsistent_artifacts(bad):
    arrays, audit = training_fixture()
    if bad == "leaked_values": arrays["test_x"][0] = arrays["train_x"][0]
    if bad == "signer": audit["records"][-1]["signer_id"] = "S01"
    if bad == "label": audit["records"][-1]["gloss"] = "A"
    if bad == "unrecorded": audit["records"].pop()
    if bad == "nan": arrays["val_x"][0, 0, 0] = np.nan
    if bad == "support": arrays["val_y"][0] = 1
    with pytest.raises(AuditError):
        validate_training_inputs(arrays, audit)
