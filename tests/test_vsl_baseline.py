import copy
import subprocess
import sys

import numpy as np
import pytest

from app.desktop_collector.vsl_baseline import encode_clip, fit_ridge, main, metrics, research_split, scores
from app.desktop_collector.vsl_data_audit import AuditError


def curation():
    groups, records = [], []
    for label in ("Ăn", "Uống"):
        for i in range(8):
            key = f"{label}-{i}"
            split = "train" if i < 6 else "test"
            members = [key] if i else [key, key+"-copy"]
            groups.append({"group_id": key, "members": members, "split": split,
                           "labels": [label], "quarantine_reasons": []})
            records.extend({"sha256": sha, "label": label, "status": "screened_pending_semantics",
                            "proposed_split": split} for sha in members)
    records.append({"sha256": "bad", "label": "Ăn", "status": "quarantine", "proposed_split": None})
    groups.append({"group_id":"bad", "members":["bad"],"split":None,"labels":["Ăn"],"quarantine_reasons":["quality"]})
    return {"records": records, "groups": groups}


def test_split_repairs_val_by_whole_group_preserves_test_and_excludes_quarantine():
    source = curation()
    before = copy.deepcopy(source)
    split = research_split(source)
    assert source == before
    assert len(split["changes"]) == 4
    assert "bad" not in {r["sha256"] for r in split["records"]}
    for label in ("Ăn", "Uống"):
        assert len({r["group_id"] for r in split["records"] if r["label"] == label and r["split"] == "val"}) == 2
    old_test = {r["sha256"] for r in source["records"] if r["proposed_split"] == "test"}
    assert old_test == {r["sha256"] for r in split["records"] if r["split"] == "test"}
    for group in source["groups"]:
        assert len({r["split"] for r in split["records"] if r["sha256"] in group["members"]}) <= 1
    source["groups"].reverse()
    source["records"].reverse()
    assert research_split(source) == split


def test_insufficient_train_groups_fail_instead_of_borrowing_from_test():
    source = curation()
    source["groups"] = [g for g in source["groups"] if g["group_id"] not in ["Ăn-0","Ăn-1","Ăn-2"]]
    with pytest.raises(AuditError, match="Insufficient"):
        research_split(source)


def clip():
    xyz = np.zeros((30,75,3), dtype=np.float32)
    xyz[:,:,0] = np.linspace(.2,.8,75)
    xyz[:,:,1] = .5
    xyz[:,11,0], xyz[:,12,0] = .3, .7
    present = np.ones((30,75), dtype=np.bool_)
    present[:,33:54] = False
    xyz[:,33:54] = 0
    return xyz, present


def test_encoding_preserves_missing_mask_and_is_translation_invariant():
    xyz, present = clip()
    encoded = encode_clip(xyz,present)
    assert encoded.shape == (3600,) and np.isfinite(encoded).all()
    shifted = xyz.copy()
    shifted[:,:,:2] += [.1,-.1]
    shifted[~present] = 0
    np.testing.assert_allclose(encode_clip(shifted,present), encoded, atol=1e-6)
    assert not encoded[:2400].reshape(16,75,2)[:,33:54].any()
    assert not encoded[2400:].reshape(16,75)[:,33:54].any()


@pytest.mark.parametrize("problem", ["nan", "empty", "no_points", "wrong_mask"])
def test_bad_features_fail(problem):
    xyz, present = clip()
    if problem == "nan": xyz[0,0,0] = np.nan
    if problem == "empty": xyz, present = xyz[:0], present[:0]
    if problem == "no_points": present[:] = False
    if problem == "wrong_mask": present = present.astype(float)
    with pytest.raises(AuditError): encode_clip(xyz,present)


def test_ridge_normalization_is_train_only_and_saved_arrays_roundtrip(tmp_path):
    x = np.array([[-2.,1],[-1.,1],[1.,1],[2.,1]])
    y = np.array([0,0,1,1])
    model = fit_ridge(x,y,1.,2)
    np.testing.assert_array_equal(model["mean"],x.mean(axis=0))
    assert np.isfinite(model["weight"]).all()
    np.testing.assert_array_equal(scores(model,x).argmax(axis=1), y)
    before = copy.deepcopy(model)
    scores(model,np.array([[1000.,-1000.]]))
    for key in model: np.testing.assert_array_equal(model[key],before[key])
    path = tmp_path/"model.npz"
    np.savez(path,**model)
    with np.load(path,allow_pickle=False) as data:
        np.testing.assert_array_equal(scores(dict(data),x),scores(model,x))


def test_metrics_include_rare_classes_and_known_confusion():
    result = metrics(np.array([0,0,1,1]),np.array([0,1,1,1]),["Ăn","Uống"])
    assert result["confusion_matrix"] == [[1,1],[0,2]]
    assert result["accuracy"] == .75
    assert result["macro_f1"] == pytest.approx((2/3+4/5)/2)


@pytest.mark.parametrize("kind", ["existing","source","raw"])
def test_cli_refuses_unsafe_output_before_any_training(tmp_path,kind):
    source = tmp_path/"source"/"index.json"
    source.parent.mkdir()
    source.write_text("{}")
    out = {"existing":tmp_path,"source":source.parent/"run","raw":tmp_path/"data"/"raw"/"run"}[kind]
    args = [a for key in ("pilot","features","groups","rgb","curation") for a in (f"--{key}",str(source))]
    with pytest.raises(SystemExit) as error:
        main([*args,"--output-dir",str(out),"--allow-unreviewed-source-labels"])
    assert error.value.code == 2
    assert source.read_text() == "{}"


def test_import_does_not_load_training_or_ui_dependencies():
    result = subprocess.run([sys.executable,"-c",
        "import sys; import app.desktop_collector.vsl_baseline; assert not any(n in sys.modules for n in ['numpy','torch','mediapipe','threadpoolctl','PySide6','webview'])"],capture_output=True,text=True)
    assert result.returncode == 0, result.stderr
