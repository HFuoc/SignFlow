"""Screen an offline ViSign proposal without approving signs or changing source media."""
from __future__ import annotations

import argparse
from collections import Counter
import copy
import json
from pathlib import Path

from .kvsl_manifest import ManifestError, write_manifest
from .vsl_data_audit import AuditError, read_json
from .vsl_feature_review import build_review
from .vsl_features import validate_candidates

SCHEMA = "visign-curation-review-v1"
RGB_RULE = "max spatial standard deviation of each decoded BGR channel <= 1.0 on 0..255 pixels"


def screen_groups(candidates, feature_records, rgb_records, proposal):
    """Quarantine whole related groups; preserve prior assignments for retained clips."""
    rows = {r["sha256"]: r for r in candidates}
    features = {r["video_sha256"]: r for r in feature_records}
    rgb = {r["sha256"]: r for r in rgb_records}
    if (not rows or len(rows) != len(candidates) or len(features) != len(feature_records)
            or len(rgb) != len(rgb_records) or set(rows) != set(features) or set(rows) != set(rgb)):
        raise AuditError("Curation requires complete, unique source/feature/RGB coverage")
    flags = {}
    for sha, row in rows.items():
        f, image = features[sha], rgb[sha]
        frames = row["decoded_frames"]
        if type(frames) is not int or not 1 <= frames <= 720:
            raise AuditError("Invalid source frame count")
        for other in (f, image):
            if (other["label"] != row["label"] or other["archive_path"] != row["archive_path"]
                    or type(other["frames"]) is not int or other["frames"] != frames):
                raise AuditError("Curation annotation/frame mismatch")
        count = f["either_hand_frames"]
        if (type(count) is not int or not 0 <= count <= frames
                or f["either_hand_coverage"] != count / frames):
            raise AuditError("Invalid hand coverage")
        flat = image["flat_frame_indices"]
        if (not isinstance(flat, list) or any(type(i) is not int or not 0 <= i < frames for i in flat)
                or flat != sorted(set(flat))):
            raise AuditError("Invalid flat-frame index list")
        flags[sha] = (["flat_frames"] if flat else []) + (["hand_coverage_below_half"] if count / frames < .5 else [])

    groups = copy.deepcopy(proposal["groups"])
    members = [sha for group in groups for sha in group["members"]]
    if len(members) != len(rows) or set(members) != set(rows):
        raise AuditError("Group membership must cover every candidate exactly once")
    for group in groups:
        if not group["members"] or group["split"] not in (None, "train", "val", "test"):
            raise AuditError("Invalid proposed group")
        if group["labels"] != sorted({rows[sha]["label"] for sha in group["members"]}):
            raise AuditError("Group labels mismatch")
        if len(group["labels"]) > 1 and not group["quarantine_reasons"]:
            raise AuditError("Cross-label group cannot be accepted")
        group["previous_proposed_split"] = group["split"]
        group["quality_flags"] = {sha: flags[sha] for sha in group["members"] if flags[sha]}
        if group["quality_flags"]:
            group["quarantine_reasons"].append("quality flag in related recording group")
        if group["quarantine_reasons"]:
            group["split"] = None
        group["status"] = "quarantine" if group["split"] is None else "screened_pending_semantics"
    lookup = {sha: group for group in groups for sha in group["members"]}
    records = [{"sha256": sha, "label": row["label"], "local_file": row["local_file"],
                "archive_path": row["archive_path"], "group_id": lookup[sha]["group_id"],
                "proposed_split": lookup[sha]["split"], "status": lookup[sha]["status"],
                "quality_flags": flags[sha], "flat_frame_indices": rgb[sha]["flat_frame_indices"],
                "either_hand_coverage": features[sha]["either_hand_coverage"],
                "semantic_review": "pending", "boundary_review": "pending",
                "tracking_review": "pending"} for sha, row in sorted(rows.items())]
    coverage = []
    for label in sorted({r["label"] for r in candidates}):
        subset = [r for r in records if r["label"] == label]
        counts = Counter(r["proposed_split"] or "quarantine" for r in subset)
        retained_groups = {r["group_id"] for r in subset if r["proposed_split"]}
        coverage.append({"label": label, "clips": len(subset), "clips_by_split": dict(counts),
                         "retained_groups": len(retained_groups),
                         "all_development_partitions_nonempty": all(counts[s] for s in ("train", "val", "test"))})
    return {"schema_version": SCHEMA, "status": "screened_not_approved", "training_ready": False,
            "signer_independence": "not_established", "semantic_review": "pending",
            "policy": {"any_flat_frame_quarantines_group": True, "minimum_hand_coverage": .5,
                       "preserve_prior_proposed_assignments": True, "source_frames_modified": False},
            "groups": groups, "records": records, "coverage": coverage,
            "summary": {"clips": len(records), "groups": len(groups),
                        "directly_flagged_clips": sum(bool(v) for v in flags.values()),
                        "clips_by_split": dict(Counter(r["proposed_split"] or "quarantine" for r in records)),
                        "classes_with_all_partitions": sum(c["all_development_partitions_nonempty"] for c in coverage)}}


def build_curation(pilot_path, feature_path, group_path, rgb_path):
    pilot, pilot_receipt = read_json(pilot_path)
    features, feature_receipt = read_json(feature_path)
    groups, group_receipt = read_json(group_path)
    rgb, rgb_receipt = read_json(rgb_path)
    validate_candidates(pilot, pilot_path.resolve().parent)
    # Recompute from actual NPZ bytes. Compare JSON forms because serialized pairs are lists.
    actual = build_review(pilot_path, feature_path)
    if json.dumps(actual, sort_keys=True) != json.dumps(groups, sort_keys=True):
        raise AuditError("Group proposal differs from verified source features")
    if (rgb.get("schema") != "visign-flat-frame-diagnostic-v1"
            or rgb.get("pilot_sha256") != pilot_receipt["sha256"] or rgb.get("rule") != RGB_RULE):
        raise AuditError("RGB diagnostic schema/source/rule mismatch")
    report = screen_groups(pilot["candidates"], features["records"], rgb["records"], groups)
    report["sources"] = [pilot_receipt, feature_receipt, group_receipt, rgb_receipt]
    report["rgb_validation_scope"] = "source-pinned diagnostic input; pixels not recomputed by this command"
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("pilot", "features", "groups", "rgb", "output"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        inputs = (args.pilot, args.features, args.groups, args.rgb)
        if any(args.output.resolve().is_relative_to(p.resolve().parent) for p in inputs):
            raise AuditError("Curation output must stay outside all input directories")
        report = build_curation(*inputs)
        status = write_manifest(report, args.output)
    except (AuditError, ManifestError, OSError, ValueError, KeyError, TypeError) as exc:
        parser.exit(2, f"Curation failed: {exc}\n")
    print(json.dumps({"status": status, **report["summary"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
