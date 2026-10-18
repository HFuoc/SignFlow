"""Offline VSL-GH source-label experiment; never registers an application model.

Source layout: 25 selected pose points, 70 face points, 21 left/21 right hand.
Source frame labels use round(timestamp * fps), then zero-based [start:end].
RGB alignment/semantics and generalization to physical webcams remain unverified.
NumPy/PyTorch are imported only by explicitly invoked research operations.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import io
import json
from pathlib import Path
import time

from .kvsl_manifest import write_manifest
from .vsl_baseline import metrics
from .vsl_data_audit import AuditError

SCHEMA = "smartglove-vsl-gh-experiment-v1"
PARTITION = {"train": {"S01", "S02", "S03", "S04"}, "val": {"S05"}, "test": {"S06"}}
BODY = (0, 9, 10, 11, 12, 13, 14, 19, 20)
POINTS = (*BODY, *range(95, 137))
CHANNELS = 279  # 51 global XY + 51 masks + 42 hand-local XYZ.


def sha256(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def new_output(path, protected=()):
    path = Path(path).resolve()
    parts = tuple(p.casefold() for p in path.parts)
    if any(parts[i:i + 2] == ("data", "raw") for i in range(len(parts) - 1)):
        raise AuditError("Research output must stay outside immutable data/raw")
    if any(path.is_relative_to(Path(p).resolve()) for p in protected):
        raise AuditError("Research output must stay outside source directories")
    path.mkdir(parents=True, exist_ok=False)
    return path


def selected_segments(manifest):
    """Fixed cap within each gloss/signer; independent of values/predictions."""
    groups = defaultdict(list)
    ids = set()
    for row in manifest["segments"]:
        if row["segment_id"] in ids:
            raise AuditError("Duplicate segment ID")
        ids.add(row["segment_id"])
        if row["signer_id"] not in PARTITION.get(row["split"], set()):
            raise AuditError("Unexpected signer/split assignment")
        groups[row["gloss"], row["signer_id"]].append(row)
    selected = []
    for group in groups.values():
        selected.extend(sorted(group, key=lambda r: hashlib.sha256(
            ("gh25-v1:" + r["segment_id"]).encode()).hexdigest())[:40])
    return sorted(selected, key=lambda r: r["segment_id"])


def timestamp_frame(value, fps):
    hours, minutes, seconds = value.split(":")
    return round((int(hours) * 3600 + int(minutes) * 60 + float(seconds)) * fps)


def validate_recording(data, row, blob):
    """Validate the complete recording before using any of its selected segments."""
    import numpy as np
    actual = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
    if actual != blob:
        raise AuditError("Feature Git blob mismatch")
    x = np.load(io.BytesIO(data), allow_pickle=False)
    if (not isinstance(x, np.ndarray) or x.ndim != 2 or x.shape[1] != 411
            or not 4 <= len(x) <= 3000 or x.dtype != np.float32 or not np.isfinite(x).all()):
        raise AuditError("Invalid finite float32 (T,411) features")
    bounds, details = row["gloss_frame_boundaries"], row["glosses_detail"]
    if len(bounds) != len(details) or not bounds:
        raise AuditError("Inconsistent timestamp annotations")
    previous_end = 0
    for b, d in zip(bounds, details, strict=True):
        if (type(b["start"]) is not int or type(b["end"]) is not int
                or not previous_end <= b["start"] < b["end"] <= len(x)):
            raise AuditError("Full recording boundary out of range or overlapping")
        if (b["gloss"] != d["gloss"] or b["start"] != timestamp_frame(d["start_time"], row["fps"])
                or b["end"] != timestamp_frame(d["end_time"], row["fps"])):
            raise AuditError("Frame boundary differs from source timestamp")
        previous_end = b["end"]
    return x.reshape(-1, 137, 3)


def encode_segment(x):
    """Position/scale-normalized body XY, missing masks, hand-local XYZ; 32 frames.

    Pose shoulder indices are9/10 in THIS subset, not11/12 (which are elbows).
    Local hand depth stays in the hand coordinate system, never mixed with pose Z.
    Missing landmarks stay missing; nearest sampling does not interpolate them.
    """
    import numpy as np
    if x.ndim != 3 or x.shape[1:] != (137, 3) or len(x) < 4 or not np.isfinite(x).all():
        raise AuditError("Invalid or too short segment")
    present = np.any(x != 0, axis=2)
    shoulders = present[:, 9] & present[:, 10]
    hand_present = present[:, 95:].any(axis=1)
    if not shoulders.any() or not hand_present.any():
        raise AuditError("No shoulders or no hands in segment")
    xy = x[:, :, :2].astype(np.float64)
    center = np.median((xy[shoulders, 9] + xy[shoulders, 10]) * .5, axis=0)
    scale = float(np.median(np.linalg.norm(xy[shoulders, 9] - xy[shoulders, 10], axis=1)))
    if scale < .02:
        raise AuditError("Degenerate shoulder scale")
    mask = present[:, POINTS]
    global_xy = np.clip((xy[:, POINTS] - center) / scale, -4, 4)
    global_xy[~mask] = 0
    local_hands = []
    for start in (95, 116):
        hand = x[:, start:start + 21].astype(np.float64)
        hand_mask = present[:, start:start + 21]
        palm_valid = hand_mask[:, [0, 5, 9, 17]].all(axis=1)
        local = hand - hand[:, :1]
        if palm_valid.any():
            palm = np.median(np.linalg.norm(local[palm_valid][:, [5, 9, 17]], axis=2))
            if palm > 1e-5:
                local = np.clip(local / palm, -4, 4)
                local[~hand_mask] = 0
                local[~hand_mask[:, 0]] = 0
            else:
                local[:] = 0
        else:
            local[:] = 0
        local_hands.append(local.reshape(len(x), -1))
    features = np.concatenate([global_xy.reshape(len(x), -1), mask, *local_hands], axis=1)
    indices = np.linspace(0, len(x) - 1, 32).astype(int)
    encoded = features[indices].astype(np.float32)
    assert encoded.shape == (32, CHANNELS) and np.isfinite(encoded).all()
    return encoded, {"frames": len(x), "hand_present_fraction": float(hand_present.mean()),
                     "shoulder_present_fraction": float(shoulders.mean())}


def deduplicate_segments(rows, vectors):
    """Exclude shared content across splits/signers/labels, collapse exact aliases."""
    groups = defaultdict(list)
    for i, row in enumerate(rows):
        groups[row["segment_content_sha256"]].append(i)
    keep, excluded = set(range(len(rows))), []
    for digest, indices in groups.items():
        if len(indices) < 2:
            continue
        signature = {(rows[i]["split"], rows[i]["signer_id"], rows[i]["gloss"]) for i in indices}
        removed = indices if len(signature) != 1 else indices[1:]
        reason = "identical segment conflicts across split/signer/label" if len(signature) != 1 else "duplicate segment alias"
        for i in removed:
            keep.discard(i)
            excluded.append({"segment_id": rows[i]["segment_id"], "reason": reason, "sha256": digest})
    # Also catch exact normalized/resampled copies with different source bytes.
    feature_groups = defaultdict(list)
    for i in sorted(keep):
        feature_groups[hashlib.sha256(vectors[i].tobytes()).hexdigest()].append(i)
    for digest, indices in feature_groups.items():
        if len({(rows[i]["split"], rows[i]["signer_id"], rows[i]["gloss"]) for i in indices}) > 1:
            for i in indices:
                keep.discard(i)
                excluded.append({"segment_id": rows[i]["segment_id"], "reason": "identical encoded segment conflicts",
                                 "sha256": digest})
    return [rows[i] for i in sorted(keep)], [vectors[i] for i in sorted(keep)], excluded


def prepare(manifest_path, metadata_path, plan_path, feature_dir, protocol_path, out):
    import numpy as np
    manifest, plan, protocol = map(read_json, (manifest_path, plan_path, protocol_path))
    if sha256(manifest_path) != plan["candidate_manifest_sha256"]:
        raise AuditError("Candidate manifest hash changed")
    raw = Path(metadata_path).read_bytes()
    if hashlib.sha1(f"blob {len(raw)}\0".encode() + raw).hexdigest() != manifest["metadata_git_blob"]:
        raise AuditError("Source metadata changed")
    if plan["segments"] != selected_segments(manifest):
        raise AuditError("Plan differs from frozen sampling rule")
    if manifest["signer_overlap"]:
        raise AuditError("Source signer overlap")
    labels = protocol["labels"]
    if len(labels) != 25 or len(set(labels)) != 25:
        raise AuditError("Expected25 distinct source labels")
    metadata = {r["id"]: r for r in json.loads(raw)}
    candidates = {r["recording_id"]: r for r in manifest["recordings"]}
    if plan["recordings"] != [r for r in manifest["recordings"]
                              if r["recording_id"] in {s["recording_id"] for s in plan["segments"]}]:
        raise AuditError("Recording plan mismatch")
    # New artifact directory only: no overwriting a previous experiment/source.
    out = new_output(out, (feature_dir, Path(metadata_path).parent))
    by_recording = defaultdict(list)
    for s in plan["segments"]:
        by_recording[s["recording_id"]].append(s)
    rows, encoded, failures, receipts = [], [], [], []
    for rid, segments in sorted(by_recording.items()):
        record, source = candidates[rid], metadata[rid]
        if any(s["split"] != source["split"] or s["signer_id"] != source["signer_id"]
               or s["feature_git_blob"] != record["feature_git_blob"] for s in segments):
            raise AuditError("Segment/source provenance mismatch")
        path = (Path(feature_dir) / (rid + ".npy")).resolve()
        if not path.is_relative_to(Path(feature_dir).resolve()) or not path.is_file():
            raise AuditError("Missing or escaping feature path")
        if path.stat().st_size > 5_000_000:
            raise AuditError("Feature exceeds size bound")
        data = path.read_bytes()
        try:
            x = validate_recording(data, source, record["feature_git_blob"])
        except (AuditError, ValueError) as exc:
            failures.append({"recording_id": rid, "segments": len(segments), "reason": str(exc)})
            continue
        receipts.append({"recording_id": rid, "sha256": hashlib.sha256(data).hexdigest(),
                         "git_blob": record["feature_git_blob"], "frames": len(x)})
        for s in segments:
            b = source["gloss_frame_boundaries"][s["boundary_index"]]
            if (b["start"], b["end"], b["gloss"]) != (s["source_start"], s["source_end"], s["gloss"]):
                raise AuditError("Segment boundary provenance mismatch")
            try:
                vector, quality = encode_segment(x[b["start"]:b["end"]])
            except AuditError as exc:
                failures.append({"segment_id": s["segment_id"], "reason": str(exc)})
                continue
            encoded.append(vector)
            content_hash = hashlib.sha256(x[b["start"]:b["end"]].tobytes()).hexdigest()
            rows.append({**s, "quality": quality, "segment_content_sha256": content_hash})
    rows, encoded, duplicates = deduplicate_segments(rows, encoded)
    failures.extend(duplicates)
    coverage = []
    for label in labels:
        split_counts = {split: sum(r["gloss"] == label and r["split"] == split for r in rows)
                        for split in PARTITION}
        signers = {r["signer_id"] for r in rows if r["gloss"] == label}
        if not split_counts["train"] or min(split_counts["val"], split_counts["test"]) < 3 or len(signers) != 6:
            raise AuditError(f"Lost class/signer coverage: {label}")
        coverage.append({"gloss": label, **split_counts})
    arrays = {}
    for split in PARTITION:
        indices = [i for i, r in enumerate(rows) if r["split"] == split]
        arrays[split + "_x"] = np.stack([encoded[i] for i in indices])
        arrays[split + "_y"] = np.array([labels.index(rows[i]["gloss"]) for i in indices], dtype=np.int64)
        arrays[split + "_ids"] = np.array([rows[i]["segment_id"] for i in indices])
    with (out / "dataset.npz").open("xb") as handle:
        np.savez_compressed(handle, **arrays)
    report = {"schema": SCHEMA, "labels": labels, "source_tree_sha": manifest["source_tree_sha"],
              "manifest_sha256": sha256(manifest_path), "protocol_sha256": sha256(protocol_path),
              "dataset_sha256": sha256(out / "dataset.npz"), "feature_contract": "gh137-body-hands279-32-v1",
              "counts": dict(Counter(r["split"] for r in rows)), "coverage": coverage,
              "records": rows, "feature_receipts": receipts, "quarantined": failures,
              "boundary_convention": "source_verified_zero_based_end_exclusive",
              "semantic_review": "not_performed", "rgb_alignment_review": "not_performed",
              "allowed_use": "authorized_offline_source_label_research_only", "production_ready": False}
    write_manifest(report, out / "audit.json")
    return report


def make_tcn(channels, classes):
    import torch.nn as nn
    return nn.Sequential(nn.Conv1d(channels, 64, 5, padding=2), nn.GELU(), nn.Dropout(.25),
                         nn.Conv1d(64, 64, 5, padding=2), nn.GELU(), nn.Dropout(.25),
                         nn.Conv1d(64, 64, 3, padding=1), nn.GELU(),
                         nn.AdaptiveAvgPool1d(1), nn.Flatten(), nn.Linear(64, classes))


def validate_training_inputs(arrays, audit):
    """Reject array/provenance mismatches and split leakage before fitting."""
    import numpy as np
    labels = audit["labels"]
    if len(labels) != len(set(labels)) or len(labels) < 2:
        raise AuditError("Invalid training labels")
    records = audit["records"]
    by_id = {r["segment_id"]: r for r in records}
    if len(by_id) != len(records):
        raise AuditError("Duplicate training segment IDs")
    seen_ids, signatures = set(), {}
    for split, signers in PARTITION.items():
        x, y, ids = (arrays[split + suffix] for suffix in ("_x", "_y", "_ids"))
        if (x.ndim != 3 or x.shape[1:] != (32, CHANNELS) or x.dtype != np.float32
                or not np.isfinite(x).all() or y.shape != (len(x),) or y.dtype != np.int64
                or ids.shape != (len(x),) or ids.dtype.kind != "U" or len(x) == 0
                or y.min() < 0 or y.max() >= len(labels)):
            raise AuditError("Invalid encoded training arrays")
        if (np.bincount(y, minlength=len(labels)) < (1 if split == "train" else 3)).any():
            raise AuditError("Insufficient per-class training/evaluation support")
        for vector, target, sid in zip(x, y, ids, strict=True):
            sid = str(sid)
            row = by_id.get(sid)
            if sid in seen_ids or row is None:
                raise AuditError("Duplicate or unrecorded encoded segment")
            seen_ids.add(sid)
            if row["split"] != split or row["signer_id"] not in signers or row["gloss"] != labels[int(target)]:
                raise AuditError("Encoded segment/signer/label provenance mismatch")
            digest = hashlib.sha256(vector.tobytes()).hexdigest()
            signature = (split, row["signer_id"], int(target))
            if digest in signatures and signatures[digest] != signature:
                raise AuditError("Exact encoded content leaks across split/signer/label")
            signatures[digest] = signature
    if seen_ids != set(by_id):
        raise AuditError("Audit contains unencoded segments")


def train(dataset_path, audit_path, out):
    """Both families/TCN epochs chosen only on validation; evaluate test afterward."""
    import numpy as np
    import torch
    audit = read_json(audit_path)
    if sha256(dataset_path) != audit["dataset_sha256"]:
        raise AuditError("Encoded dataset changed")
    out = new_output(out, (Path(dataset_path).parent,))
    started = time.perf_counter()
    torch.set_num_threads(4)
    torch.manual_seed(20261018)
    np.random.seed(20261018)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True
    torch.backends.cuda.matmul.allow_tf32 = False
    device = "cuda" if torch.cuda.is_available() else "cpu"
    labels = audit["labels"]
    classes = len(labels)
    with np.load(dataset_path, allow_pickle=False) as f:
        arrays = {k: f[k].copy() for k in f.files}
    validate_training_inputs(arrays, audit)
    x, y = arrays["train_x"], arrays["train_y"]
    vx, vy = arrays["val_x"], arrays["val_y"]
    mean, scale = x.mean(axis=(0, 1)), np.maximum(x.std(axis=(0, 1)), .05)
    normalize = lambda a: ((a - mean) / scale).astype(np.float32)
    tx = torch.from_numpy(normalize(x)).to(device)
    tv = torch.from_numpy(normalize(vx)).to(device)
    ty = torch.from_numpy(y).to(device)
    # Balanced least squares: each class contributes equal total training weight.
    weights = len(y) / (classes * np.bincount(y, minlength=classes))
    sw = torch.tensor(weights[y] ** .5, device=device, dtype=torch.float64)
    z, vz = tx.flatten(1).double(), tv.flatten(1).double()
    center = (z * sw.square()[:, None]).sum(0) / sw.square().sum()
    z, vz = z - center, vz - center
    target = torch.nn.functional.one_hot(ty, classes).double() - 1 / classes
    weighted = z * sw[:, None]
    kernel = weighted @ weighted.T
    eig, basis = torch.linalg.eigh(kernel)
    rhs = basis.T @ (target * sw[:, None])
    ridge_candidates, ridge_models = [], []
    for alpha in (.1, 1., 10., 100.):
        dual = basis @ (rhs / (eig.clamp_min(0)[:, None] + alpha))
        weight = weighted.T @ dual
        pred = (vz @ weight + 1 / classes).argmax(1).cpu().numpy()
        result = metrics(vy, pred, labels)
        ridge_candidates.append({"alpha": alpha, "validation": result})
        ridge_models.append(weight.cpu().numpy())
        print(json.dumps({"model": "ridge", "alpha": alpha, "val_macro_f1": result["macro_f1"]}), flush=True)
    best_ridge = max(range(4), key=lambda i: ridge_candidates[i]["validation"]["macro_f1"])
    ridge_weight = ridge_models[best_ridge]
    ridge_center = center.cpu().numpy()
    with (out / "ridge.npz").open("xb") as f:
        np.savez_compressed(f, weight=ridge_weight, center=ridge_center, mean=mean, scale=scale,
                            labels=np.array(labels), alpha=ridge_candidates[best_ridge]["alpha"])
    del z, vz, kernel, eig, basis, rhs, dual, weighted, weight, center, ridge_models
    model = make_tcn(CHANNELS, classes).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=.01)
    loss_fn = torch.nn.CrossEntropyLoss(weight=torch.tensor(weights, dtype=torch.float32, device=device))
    history, best_state, best_f1, best_epoch = [], None, -1., 0
    for epoch in range(1, 61):
        model.train()
        order = torch.randperm(len(tx), device=device)
        losses = []
        for indices in order.split(64):
            opt.zero_grad(set_to_none=True)
            logits = model(tx[indices].transpose(1, 2))
            loss = loss_fn(logits, ty[indices])
            if not torch.isfinite(loss):
                raise AuditError("Nonfinite training loss")
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 5.)
            opt.step()
            losses.append(float(loss.detach()))
        model.eval()
        with torch.inference_mode():
            pred = model(tv.transpose(1, 2)).argmax(1).cpu().numpy()
        result = metrics(vy, pred, labels)
        history.append({"epoch": epoch, "loss": float(np.mean(losses)), "validation": result})
        if result["macro_f1"] > best_f1:
            best_f1, best_epoch = result["macro_f1"], epoch
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        if epoch == 1 or epoch % 5 == 0:
            print(json.dumps({"model": "tcn", "epoch": epoch, "loss": history[-1]["loss"],
                              "val_macro_f1": result["macro_f1"]}), flush=True)
    with (out / "tcn.pt").open("xb") as f:
        torch.save(best_state, f)
    np.savez_compressed(out / "normalization.npz", mean=mean, scale=scale, labels=np.array(labels))
    selected = "tcn" if best_f1 > ridge_candidates[best_ridge]["validation"]["macro_f1"] else "ridge"
    # Persist selection before normalizing/scoring test inputs. Never select on test.
    write_manifest({"selected": selected, "tcn_epoch": best_epoch,
                    "ridge_alpha": ridge_candidates[best_ridge]["alpha"],
                    "selection_metric": "validation_macro_f1"}, out / "selection.json")
    restored = torch.load(out / "tcn.pt", map_location="cpu", weights_only=True)
    model.load_state_dict(restored, strict=True)
    model.eval()
    with np.load(out / "ridge.npz", allow_pickle=False) as f:
        if not np.array_equal(f["weight"], ridge_weight):
            raise AuditError("Ridge artifact round-trip mismatch")
    reports, predictions = {}, {}
    for split in PARTITION:
        data = normalize(arrays[split + "_x"])
        actual = arrays[split + "_y"]
        ridge_pred = ((data.reshape(len(data), -1).astype(np.float64) - ridge_center)
                      @ ridge_weight + 1 / classes).argmax(1)
        with torch.inference_mode():
            tcn_pred = model(torch.from_numpy(data).to(device).transpose(1, 2)).argmax(1).cpu().numpy()
        reports[split] = {"ridge": metrics(actual, ridge_pred, labels), "tcn": metrics(actual, tcn_pred, labels)}
        predictions[split] = [{"id": str(i), "label": labels[int(t)], "ridge": labels[int(r)], "tcn": labels[int(c)]}
                              for i, t, r, c in zip(arrays[split + "_ids"], actual, ridge_pred, tcn_pred, strict=True)]
    result = {"schema": SCHEMA, "selected_model": selected, "labels": labels,
              "audit_sha256": sha256(audit_path), "dataset_sha256": sha256(dataset_path),
              "device": device, "device_name": torch.cuda.get_device_name(0) if device == "cuda" else "cpu",
              "torch_version": torch.__version__, "numpy_version": np.__version__, "seed": 20261018,
              "ridge_candidates": ridge_candidates, "tcn_history": history, "tcn_best_epoch": best_epoch,
              "metrics": reports, "elapsed_seconds": time.perf_counter() - started,
              "artifact_sha256": {n: sha256(out / n) for n in ("ridge.npz", "tcn.pt", "normalization.npz", "selection.json")},
              "interpretation": "closed_set_source_label_matches_only; one validation signer and one test signer; source sentence contexts overlap",
              "semantic_review": "not_performed", "physical_webcam_test": "not_performed",
              "unknown_idle_test": "not_performed", "production_ready": False}
    write_manifest(predictions, out / "predictions.json")
    write_manifest(result, out / "results.json")
    return result


def load_saved_models(model_dir, device="cpu"):
    """Load numeric normalization and locally generated state with pinned hashes."""
    import numpy as np
    import torch
    root = Path(model_dir)
    result = read_json(root / "results.json")
    for name in ("ridge.npz", "normalization.npz", "tcn.pt", "selection.json"):
        if sha256(root / name) != result["artifact_sha256"][name]:
            raise AuditError(f"Saved artifact hash mismatch: {name}")
    with np.load(root / "ridge.npz", allow_pickle=False) as f:
        ridge = {k: f[k].copy() for k in f.files}
    with np.load(root / "normalization.npz", allow_pickle=False) as f:
        normalization = {k: f[k].copy() for k in f.files}
    for saved in (ridge, normalization):
        if saved["labels"].tolist() != result["labels"]:
            raise AuditError("Saved label order mismatch")
        if (saved["mean"].shape != (CHANNELS,) or saved["scale"].shape != (CHANNELS,)
                or not np.isfinite(saved["mean"]).all() or not np.isfinite(saved["scale"]).all()
                or (saved["scale"] <= 0).any()):
            raise AuditError("Invalid saved normalization")
    if not all(np.array_equal(ridge[k], normalization[k]) for k in ("mean", "scale", "labels")):
        raise AuditError("Models have different normalization/labels")
    if (ridge["center"].shape != (32 * CHANNELS,) or ridge["weight"].shape != (32 * CHANNELS, len(result["labels"]))
            or not np.isfinite(ridge["center"]).all() or not np.isfinite(ridge["weight"]).all()):
        raise AuditError("Invalid saved ridge model")
    tcn = make_tcn(CHANNELS, len(result["labels"]))
    tcn.load_state_dict(torch.load(root / "tcn.pt", map_location="cpu", weights_only=True), strict=True)
    tcn.eval().to(device)
    return ridge, normalization, tcn, result


def replay(model_dir, dataset_path, output):
    """Separate process replay: every input/normalization/weight comes from disk."""
    import numpy as np
    import torch
    torch.set_num_threads(4)
    ridge, normalization, tcn, result = load_saved_models(model_dir)
    if sha256(dataset_path) != result["dataset_sha256"]:
        raise AuditError("Replay dataset hash mismatch")
    expected = read_json(Path(model_dir) / "predictions.json")
    counts = {}
    with np.load(dataset_path, allow_pickle=False) as f, torch.inference_mode():
        for split in PARTITION:
            x = f[split + "_x"]
            z = ((x - normalization["mean"]) / normalization["scale"]).astype(np.float32)
            rp = ((z.reshape(len(z), -1).astype(np.float64) - ridge["center"])
                  @ ridge["weight"] + 1 / len(result["labels"])).argmax(1)
            tp = tcn(torch.from_numpy(z).transpose(1, 2)).argmax(1).numpy()
            actual = [{"id": str(i), "label": result["labels"][int(y)],
                       "ridge": result["labels"][int(r)], "tcn": result["labels"][int(t)]}
                      for i, y, r, t in zip(f[split + "_ids"], f[split + "_y"], rp, tp, strict=True)]
            if actual != expected[split]:
                raise AuditError(f"Saved artifact prediction replay differs: {split}")
            counts[split] = len(actual)
    report = {"schema": SCHEMA, "stage": "independent_cpu_saved_artifact_replay", "counts": counts,
              "models": ["ridge", "tcn"], "prediction_match": True,
              "results_sha256": sha256(Path(model_dir) / "results.json"),
              "dataset_sha256": sha256(dataset_path), "predictions_sha256": sha256(Path(model_dir) / "predictions.json")}
    output = Path(output).resolve()
    if output in {Path(dataset_path).resolve(), *(p.resolve() for p in Path(model_dir).iterdir())}:
        raise AuditError("Replay output must not overwrite artifacts")
    write_manifest(report, output)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    prep = sub.add_parser("prepare")
    for name in ("manifest", "metadata", "plan", "features", "protocol", "output"):
        prep.add_argument("--" + name, type=Path, required=True)
    fit = sub.add_parser("train")
    for name in ("dataset", "audit", "output"):
        fit.add_argument("--" + name, type=Path, required=True)
    repeat = sub.add_parser("replay")
    for name in ("model-dir", "dataset", "output"):
        repeat.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args(argv)
    if args.command == "prepare":
        report = prepare(args.manifest, args.metadata, args.plan, args.features, args.protocol, args.output)
        print(json.dumps({"counts": report["counts"], "quarantined": len(report["quarantined"])}))
    elif args.command == "train":
        report = train(args.dataset, args.audit, args.output)
        print(json.dumps({"selected": report["selected_model"], "test": {
            name: {k: v[k] for k in ("samples", "accuracy", "macro_f1")}
            for name, v in report["metrics"]["test"].items()}}))
    else:
        print(json.dumps(replay(args.model_dir, args.dataset, args.output)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
