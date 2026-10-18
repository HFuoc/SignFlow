"""Offline source-label ridge baseline; never a production model registration."""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import importlib.metadata
import json
from pathlib import Path
import time

from .kvsl_manifest import ManifestError, write_manifest
from .vsl_curation import build_curation
from .vsl_data_audit import AuditError, read_json

SCHEMA = "visign-source-label-baseline-v1"
SEED = "visign-research-v1"
ALPHAS = (0.1, 1.0, 10.0, 100.0)


def research_split(curation):
    """Preserve test; supply at least two validation groups per label before fitting."""
    groups = [g for g in curation["groups"] if g["split"] is not None]
    members = [sha for g in groups for sha in g["members"]]
    if len(set(members)) != len(members):
        raise AuditError("Duplicate research group membership")
    assignments = {g["group_id"]: g["split"] for g in groups}
    moves = []
    for label in sorted({r["label"] for r in curation["records"]}):
        subset = [g for g in groups if g["labels"] == [label]]
        if any(g["quarantine_reasons"] for g in subset):
            raise AuditError("Quarantined group has a split")
        train = [g for g in subset if g["split"] == "train"]
        val = [g for g in subset if g["split"] == "val"]
        test = [g for g in subset if g["split"] == "test"]
        needed = max(0, 2 - len(val))
        if not test or len(train) - needed < 2:
            raise AuditError(f"Insufficient groups for research partitions: {label}")
        train.sort(key=lambda g: hashlib.sha256(f"{SEED}:{g['group_id']}".encode()).hexdigest())
        for group in train[:needed]:
            assignments[group["group_id"]] = "val"
            moves.append({"group_id": group["group_id"], "label": label,
                          "from": "train", "to": "val", "reason": "minimum_two_validation_groups"})
    records = []
    group_by_sha = {sha: g for g in groups for sha in g["members"]}
    for r in curation["records"]:
        if r["status"] == "quarantine":
            if r["sha256"] in group_by_sha:
                raise AuditError("Quarantined record found in retained group")
            continue
        group = group_by_sha[r["sha256"]]
        if group["labels"] != [r["label"]] or group["split"] != r["proposed_split"]:
            raise AuditError("Research record/group mismatch")
        records.append({"sha256": r["sha256"], "label": r["label"],
                        "group_id": group["group_id"], "split": assignments[group["group_id"]]})
    return {"schema_version": "visign-research-split-v1", "seed": SEED,
            "status": "fixed_for_this_experiment_only", "source_semantics_verified": False,
            "signer_independence": "not_established", "test_membership_preserved": True,
            "changes": moves, "records": sorted(records, key=lambda r:r["sha256"]),
            "counts": dict(Counter(r["split"] for r in records))}


def encode_clip(xyz, present):
    """16 nearest temporal samples, body-relative XY plus explicit presence; no depth."""
    import numpy as np
    if (xyz.ndim != 3 or xyz.shape[1:] != (75, 3) or present.shape != xyz.shape[:2]
            or len(xyz) == 0 or present.dtype != np.bool_ or not np.isfinite(xyz).all()):
        raise AuditError("Invalid baseline input arrays")
    xy = xyz[:, :, :2].astype(np.float64)
    shoulders = present[:, 11] & present[:, 12]
    if shoulders.any():
        center = np.median((xy[shoulders, 11] + xy[shoulders, 12]) / 2, axis=0)
        scale = float(np.median(np.linalg.norm(xy[shoulders, 11] - xy[shoulders, 12], axis=1)))
    elif present.any():
        center = np.median(xy[present], axis=0)
        scale = float(np.median(np.linalg.norm(xy[present] - center, axis=1)))
    else:
        raise AuditError("No present landmarks")
    scale = max(scale, .05)
    normalized = np.clip((xy - center) / scale, -4, 4)
    normalized[~present] = 0
    indices = np.linspace(0, len(xy)-1, 16).astype(int)
    return np.concatenate([normalized[indices].reshape(-1), present[indices].astype(float).reshape(-1)])


def fit_ridge(x, y, alpha, classes):
    import numpy as np
    mean = x.mean(axis=0)
    scale = np.maximum(x.std(axis=0), .05)
    z = (x - mean) / scale
    targets = np.eye(classes)[y]
    bias = targets.mean(axis=0)
    dual = np.linalg.solve(z @ z.T + alpha * np.eye(len(z)), targets - bias)
    return {"mean": mean, "scale": scale, "weight": z.T @ dual, "bias": bias}


def scores(model, x):
    return ((x - model["mean"]) / model["scale"]) @ model["weight"] + model["bias"]


def metrics(y, predicted, labels):
    import numpy as np
    matrix = np.zeros((len(labels), len(labels)), dtype=np.int64)
    for actual, guess in zip(y, predicted, strict=True):
        matrix[int(actual), int(guess)] += 1
    tp = matrix.diagonal()
    support, guessed = matrix.sum(axis=1), matrix.sum(axis=0)
    f1 = np.divide(2*tp, support+guessed, out=np.zeros(len(labels)), where=(support+guessed)>0)
    recall = np.divide(tp, support, out=np.zeros(len(labels)), where=support>0)
    return {"samples": len(y), "accuracy": float(tp.sum()/len(y)), "macro_f1": float(f1.mean()),
            "balanced_accuracy": float(recall.mean()), "confusion_matrix": matrix.tolist(),
            "per_class": [{"label": label, "support": int(support[i]),
                           "recall": float(recall[i]), "f1": float(f1[i])} for i,label in enumerate(labels)]}


def run_experiment(curation, features, feature_dir, out):
    import numpy as np
    split = research_split(curation)
    write_manifest(split, out / "split.json")  # Fixed before any fitting/scoring.
    labels = sorted({r["label"] for r in split["records"]})
    indexed = {r["video_sha256"]: r for r in features["records"]}
    partitions = {}
    for name in ("train", "val", "test"):
        records = [r for r in split["records"] if r["split"] == name]
        vectors = []
        for record in records:
            f = indexed[record["sha256"]]
            path = (feature_dir / f["feature_file"]).resolve()
            if not path.is_relative_to(feature_dir.resolve()):
                raise AuditError("Feature path escape")
            with path.open("rb") as handle:
                if hashlib.file_digest(handle, "sha256").hexdigest() != f["feature_sha256"]:
                    raise AuditError("Feature hash changed")
            with np.load(path, allow_pickle=False) as data:
                vectors.append(encode_clip(data["xyz"], data["present"]))
        partitions[name] = (np.stack(vectors), np.array([labels.index(r["label"]) for r in records]), records)
    train_x, train_y, _ = partitions["train"]
    val_x, val_y, _ = partitions["val"]
    candidates = []
    models = []
    for alpha in ALPHAS:
        model = fit_ridge(train_x, train_y, alpha, len(labels))
        result = metrics(val_y, scores(model, val_x).argmax(axis=1), labels)
        candidates.append({"alpha": alpha, "validation": result})
        models.append(model)
        print(json.dumps({"alpha": alpha, "validation_accuracy": result["accuracy"],
                          "validation_macro_f1": result["macro_f1"]}), flush=True)
    best = max(range(len(candidates)), key=lambda i:(candidates[i]["validation"]["macro_f1"],
                candidates[i]["validation"]["accuracy"], candidates[i]["alpha"]))
    model = models[best]
    with (out / "model.npz").open("xb") as handle:
        np.savez_compressed(handle, **model, labels=np.array(labels))
    with np.load(out / "model.npz", allow_pickle=False) as data:
        restored = {key: data[key].copy() for key in model}
        if not np.allclose(scores(restored, val_x), scores(model, val_x), rtol=0, atol=0):
            raise AuditError("Saved model round-trip mismatch")
    results, predictions = {}, []
    for name, (x, y, rows) in partitions.items():
        logits = scores(restored, x)
        guesses = logits.argmax(axis=1)
        results[name] = metrics(y, guesses, labels)
        for i, row in enumerate(rows):
            ranked = np.argsort(-logits[i], kind="stable")[:3]
            predictions.append({**row, "prediction": labels[int(guesses[i])],
                "correct_against_source_label": bool(guesses[i] == y[i]),
                "top3": [labels[int(j)] for j in ranked],
                "score_margin_not_probability": float(logits[i, ranked[0]]-logits[i, ranked[1]])})
    # Pure classifier microbenchmark, excludes camera, extraction and boundary detection.
    for _ in range(10): scores(restored, val_x[:1])
    durations = []
    for _ in range(100):
        start = time.perf_counter()
        scores(restored, val_x[:1])
        durations.append((time.perf_counter()-start)*1000)
    report = {"schema_version": SCHEMA, "state": "complete", "production_ready": False,
              "source_semantics_verified": False, "signer_independence": "not_established",
              "labels": labels, "feature_encoding": "16-nearest-body-relative-xy-plus-mask-v1",
              "feature_dimensions": int(train_x.shape[1]), "model": "multiclass_ridge_least_squares",
              "selection": "validation macro_f1 then accuracy then larger alpha; test not used",
              "selected_alpha": candidates[best]["alpha"], "candidates": candidates,
              "metrics_against_source_labels": results,
              "majority_train_class_test_accuracy": float((partitions["test"][1] == Counter(train_y).most_common(1)[0][0]).mean()),
              "classifier_only_ms": {"median":float(np.median(durations)), "p95":float(np.percentile(durations,95)),
                                     "physical_end_to_display_verified":False},
              "model_sha256": hashlib.sha256((out/"model.npz").read_bytes()).hexdigest(),
              "versions": {p: importlib.metadata.version(p) for p in ("numpy", "threadpoolctl")}}
    write_manifest({"records": predictions, "scores_are_probabilities": False}, out / "predictions.json")
    # Review selection is validation-only so later review cannot silently tune this test set.
    queue = sorted([p for p in predictions if p["split"] == "val"],
                   key=lambda p:(p["correct_against_source_label"], p["score_margin_not_probability"], p["sha256"]))
    write_manifest({"scope": "validation_only", "semantic_review": "pending", "records": queue}, out / "review-priority.json")
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("pilot", "features", "groups", "rgb", "curation", "output-dir"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    parser.add_argument("--allow-unreviewed-source-labels", action="store_true", required=True)
    args = parser.parse_args(argv)
    try:
        inputs = (args.pilot, args.features, args.groups, args.rgb, args.curation)
        out = args.output_dir.resolve()
        if out.exists() or any(out.is_relative_to(p.resolve().parent) or p.resolve().is_relative_to(out) for p in inputs):
            raise AuditError("Use a new output directory separate from all inputs")
        parts = [p.lower() for p in out.parts]
        if any(parts[i:i+2] == ["data", "raw"] for i in range(len(parts)-1)):
            raise AuditError("Research output cannot be in data/raw")
        actual = build_curation(*inputs[:4])
        curation, receipt = read_json(args.curation)
        if actual != curation:
            raise AuditError("Curation differs from reconstructed verified inputs")
        features, feature_receipt = read_json(args.features)
        out.mkdir(parents=True)
        write_manifest({"schema_version":SCHEMA,"state":"prepared_not_completed", "source":receipt,
                        "research_exception":"explicit_unreviewed_source_labels", "alphas":ALPHAS,
                        "seed":SEED, "production_ready":False}, out/"run-input.json")
        from threadpoolctl import threadpool_limits
        with threadpool_limits(limits=2):
            report = run_experiment(curation, features, args.features.resolve().parent, out)
        report["sources"] = [receipt, feature_receipt]
        write_manifest(report, out/"report.json")
        print(json.dumps({"selected_alpha":report["selected_alpha"],
                          "test":report["metrics_against_source_labels"]["test"]}), flush=True)
    except (AuditError, ManifestError, OSError, ValueError, KeyError) as exc:
        parser.exit(2, f"Baseline failed: {exc}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
