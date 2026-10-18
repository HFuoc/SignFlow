"""Propose conservative recording groups and development splits; never certify signers."""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path, PurePosixPath
import re

from .kvsl_manifest import ManifestError, write_manifest
from .vsl_data_audit import AuditError, read_json
from .vsl_features import CONTRACT

SCHEMA = "visign-recording-group-review-v1"


def group_and_split(candidates: list[dict], near_pairs: list[tuple[str, str]], seed="visign-review-v1") -> dict:
    """Union every alias family and visual hint before proposing any partitions."""
    rows = {r["sha256"]: r for r in candidates}
    if len(rows) != len(candidates):
        raise AuditError("Repeated candidate IDs")
    parent = {sha: sha for sha in rows}

    def find(sha):
        while parent[sha] != sha:
            parent[sha] = parent[parent[sha]]
            sha = parent[sha]
        return sha

    def union(a, b):
        a, b = find(a), find(b)
        parent[max(a, b)] = min(a, b)

    families = {}
    family_edges = []
    for sha, r in sorted(rows.items()):
        for name in [r["archive_path"], *r.get("duplicate_aliases", [])]:
            # Original archive path supplies class and filename; no identity inference.
            path = PurePosixPath(name)
            key = (str(path.parent), re.sub(r"_\d+$", "", path.stem))
            if key in families:
                other = families[key]
                union(sha, other)
                if sha != other:
                    family_edges.append([other, sha])
            else:
                families[key] = sha
    for a, b in near_pairs:
        if a not in rows or b not in rows:
            raise AuditError("Visual pair references unknown candidate")
        union(a, b)
    groups = defaultdict(list)
    for sha in sorted(rows):
        groups[find(sha)].append(sha)
    output = []
    for members in groups.values():
        labels = sorted({rows[sha]["label"] for sha in members})
        group_id = hashlib.sha256("\n".join(members).encode("ascii")).hexdigest()
        reasons = []
        if len(labels) > 1:
            reasons.append("cross-label similarity group requires review")
        if any(rows[sha].get("all_hands_missing") for sha in members):
            reasons.append("group contains clip with no hand detections")
        output.append({"group_id": group_id, "members": members, "labels": labels,
                       "split": None, "quarantine_reasons": reasons})
    by_label = defaultdict(list)
    for g in output:
        if not g["quarantine_reasons"]:
            by_label[g["labels"][0]].append(g)
    coverage = []
    for label in sorted({r["label"] for r in candidates}):
        eligible = by_label[label]
        eligible.sort(key=lambda g: hashlib.sha256(f"{seed}:{g['group_id']}".encode()).hexdigest())
        if len(eligible) < 5:
            for group in eligible:
                group["quarantine_reasons"].append("fewer than five eligible recording groups in class")
        else:
            holdout = max(1, len(eligible) // 5)
            for index, group in enumerate(eligible):
                group["split"] = "test" if index < holdout else "val" if index < 2*holdout else "train"
        coverage.append({"label": label, "groups": len(eligible),
                         "clips_by_split": dict(Counter(g["split"] or "quarantine"
                             for g in output if label in g["labels"] for sha in g["members"] if rows[sha]["label"] == label))})
    return {"schema_version": SCHEMA, "status": "proposal_not_frozen", "seed": seed,
            "training_ready": False, "signer_independence": "not_established",
            "near_duplicate_absence": "not_established", "groups": sorted(output, key=lambda g:g["group_id"]),
            "filename_family_edges": family_edges, "visual_similarity_pairs": near_pairs,
            "coverage": coverage,
            "summary": {"clips": len(rows), "groups": len(output),
                        "cross_label_groups": sum(len(g["labels"])>1 for g in output),
                        "clips_by_split": dict(Counter(g["split"] or "quarantine" for g in output for _ in g["members"]))}}


def build_review(pilot_path: Path, report_path: Path):
    import numpy as np
    pilot, pilot_receipt = read_json(pilot_path)
    features, feature_receipt = read_json(report_path)
    if features.get("schema_version") != CONTRACT or features.get("state") != "complete":
        raise AuditError("Require complete feature report")
    if features.get("source") != pilot_receipt:
        raise AuditError("Feature report does not reference these exact pilot bytes")
    candidates = pilot["candidates"]
    indexed = {r["video_sha256"]: r for r in features["records"]}
    if len(indexed) != len(features["records"]) or set(indexed) != {r["sha256"] for r in candidates}:
        raise AuditError("Feature report coverage mismatch")
    signatures, enriched = [], []
    for record in candidates:
        f = indexed[record["sha256"]]
        if f["label"] != record["label"] or f["archive_path"] != record["archive_path"]:
            raise AuditError("Feature annotation mismatch")
        path = (report_path.parent / f["feature_file"]).resolve()
        if not path.is_relative_to(report_path.parent.resolve()):
            raise AuditError("Feature path escapes report directory")
        with path.open("rb") as handle:
            if hashlib.file_digest(handle,"sha256").hexdigest() != f["feature_sha256"]:
                raise AuditError("Feature bytes changed")
        with np.load(path, allow_pickle=False) as data:
            frames = record["decoded_frames"]
            xyz, mask, visible = data["xyz"], data["present"], data["pose_visibility"]
            signature = data["visual_signature"]
            if (xyz.shape != (frames,75,3) or xyz.dtype != np.float32
                    or mask.shape != (frames,75)
                    or mask.dtype != np.bool_ or visible.shape != (frames,33)
                    or visible.dtype != np.float32
                    or signature.shape != (8,32,32) or signature.dtype != np.uint8
                    or not np.isfinite(xyz).all() or not np.isfinite(visible).all()
                    or not np.array_equal(data["frame_index"],np.arange(frames))
                    or np.any(xyz[~mask] != 0)
                    or np.any(visible[~mask[:,:33]] != 0)
                    or any(np.any(mask[:,start:end] != mask[:,start:start+1])
                           for start,end in ((0,33),(33,54),(54,75)))):
                raise AuditError("Feature shape, finiteness, frame or missing-mask contract failed")
            coverage = float((mask[:,33] | mask[:,54]).mean())
            if coverage != f["either_hand_coverage"]:
                raise AuditError("Feature quality report mismatch")
            signatures.append(signature.copy())
        enriched.append({**record, "all_hands_missing": coverage == 0})
    pixels = np.stack(signatures).astype(np.int16)
    pairs = []
    for index in range(len(candidates)-1):
        errors = np.abs(pixels[index+1:] - pixels[index]).mean(axis=(2,3))
        matches = np.flatnonzero((errors.mean(axis=1) <= 2.0) & (errors.max(axis=1) <= 4.0))
        pairs.extend((candidates[index]["sha256"], candidates[index+1+int(j)]["sha256"]) for j in matches)
    report = group_and_split(enriched, pairs)
    report.update(sources=[pilot_receipt, feature_receipt],
                  visual_similarity_rule={"sampled_frames":8,"grayscale_size":[32,32],
                                          "mean_absolute_error_max":2.0,"per_frame_mean_error_max":4.0,
                                          "pixel_range":[0,255],"role":"conservative_group_hint_not_identity"})
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pilot", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        if any(args.output.resolve().is_relative_to(p.resolve().parent) for p in (args.pilot, args.features)):
            raise AuditError("Review output must stay outside source and feature run directories")
        report = build_review(args.pilot, args.features)
        status = write_manifest(report, args.output)
    except (AuditError, ManifestError, OSError, ValueError, KeyError) as exc:
        parser.exit(2, f"Feature review failed: {exc}\n")
    print(json.dumps({"status": status, **report["summary"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
