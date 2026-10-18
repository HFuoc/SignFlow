"""TCN stream decisions and model-specific landmark reference integrity."""
from dataclasses import replace
import hashlib
import json
from pathlib import Path

import numpy as np
import pytest

from app.desktop_collector.recognition import gh_tcn_provider, references
from app.desktop_collector.recognition.gh_tcn import GH_TCN_MODEL, WORDS
from app.desktop_collector.recognition.stream_worker import StreamEngine
from app.desktop_collector.recognition.streaming import SignSegmenter, stream_prediction
from app.desktop_collector.recognition.contracts import RecognitionError
from app.desktop_collector.vsl_gh_reference_media import select_examples, load_segment


@pytest.mark.parametrize("phase,boundary,index,score,code", [
    ("final", None, 0, 1., None), ("final", None, 0, .9, "uncertain_sign"),
    ("final", None, 25, 1., "outside_vocabulary"),
    ("final", "manual_finish", 0, 1., None),
    ("final", "manual_finish", 0, .9, "uncertain_sign"),
    ("provisional", None, 0, 1., "incomplete_sign"),
    ("final", "max_duration", 0, 1., "incomplete_sign"),
    ("final", "frame_gap", 0, 1., "incomplete_sign"),
])
def test_stream_uses_native_classes_and_rejects_incomplete_sign(monkeypatch, phase, boundary, index, score, code):
    engine = object.__new__(StreamEngine)
    engine.model = object()
    frame = np.zeros((137, 3), np.float32)
    frame[9] = (.3, .4, 0)
    frame[10] = (.6, .4, 0)
    frame[95:116] = (.4, .6, .1)
    selected = [(i * 40, (None, None, frame), True) for i in range(24)]
    values = [0.] * 26
    values[index] = score
    values[24] += 1 - score
    calls = []
    def infer(model, encoded):
        calls.append(encoded)
        return values
    monkeypatch.setattr(gh_tcn_provider, "infer_encoded", infer)
    result = engine.tcn_prediction(stream_prediction("fixture", 1, 1, GH_TCN_MODEL), selected, phase, boundary, {})
    assert result.error_code == code
    if code:
        assert not result.top_k
    else:
        assert result.top_k[0]["label_id"] == "gh_tcn:vsl_gh25:0"
        assert result.top_k[0]["display_name"] == "TÔI"
    assert bool(calls) == (code != "incomplete_sign")


def test_final_only_boundaries_and_gap_discard():
    segmenter = SignSegmenter(end_hold_ms=500, prediction_interval_ms=None, end_on_missing_hands=False, motion_window=3)
    phases = []
    for stamp in range(0, 2000, 40):
        phase, selected, _ = segmenter.sample(stamp, .08 if 400 <= stamp < 1200 else 0., "frame", True)
        if phase:
            phases.append(phase)
            assert selected[0][0] < 400  # Pre-roll preserves the beginning.
    assert phases == ["final"]
    segmenter.reset()
    for stamp in range(0, 800, 40): segmenter.sample(stamp, .08, "frame", True)
    phase, selected, reason = segmenter.sample(2000, .08, "frame", True)
    assert phase is None and not selected and reason == "frame_gap"


@pytest.fixture
def gh_references(tmp_path, monkeypatch):
    root = tmp_path / references.GH_REFERENCE_DIRECTORY
    root.mkdir(parents=True)
    rows = []
    for i, identity in enumerate(references.identities(GH_TCN_MODEL)):
        data = b"\x1a\x45\xdf\xa3synthetic" + bytes([i])
        name = identity["reference_id"] + ".webm"
        (root / name).write_bytes(data)
        rows.append({**identity, "filename": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    manifest = {"schema_version": "gh-landmark-replays-v1", "provider_id": GH_TCN_MODEL.provider_id,
                "source_semantics_verified": False, "references": rows}
    raw = json.dumps(manifest, ensure_ascii=False).encode("utf8")
    (root / "manifest.json").write_bytes(raw)
    monkeypatch.setattr(references, "GH_MANIFEST_SHA256", hashlib.sha256(raw).hexdigest())
    return references.ReferenceCatalog(tmp_path), root


def test_gh_reference_catalog_is_separate_and_fails_closed(gh_references):
    catalog, root = gh_references
    entries = catalog.list(GH_TCN_MODEL.provider_id)
    assert [r["display_name"] for r in entries] == list(WORDS)
    assert all(r["available"] and r["kind"] == "landmark_replay" for r in entries)
    assert catalog.media("gh25-00") == (root / "gh25-00.webm").read_bytes()
    with pytest.raises(RecognitionError): catalog.media("gh25-25")
    with pytest.raises(RecognitionError): catalog.media("../gh25-00")
    (root / "gh25-00.webm").write_bytes(b"bad")
    assert not catalog.list(GH_TCN_MODEL.provider_id)[0]["available"]
    assert all(r["available"] for r in catalog.list(GH_TCN_MODEL.provider_id)[1:])
    with pytest.raises(RecognitionError): catalog.media("gh25-00")


def test_references_select_train_only_and_validate_source_content():
    root = Path(".design-cache/multiuser-data-20261018/gh25")
    audit = root / "background-prepared/audit.json"
    if not audit.is_file(): pytest.skip("Optional local source features unavailable")
    selected = select_examples(json.loads(audit.read_text(encoding="utf8")))
    assert [r["gloss"] for r in selected] == list(WORDS)
    assert all(r["split"] == "train" and r["signer_id"] in ("S01", "S02", "S03", "S04") for r in selected)
    assert load_segment(selected[0], root / "features").shape[1:] == (137, 3)
    with pytest.raises(ValueError): load_segment({**selected[0], "segment_content_sha256": "0" * 64}, root / "features")
