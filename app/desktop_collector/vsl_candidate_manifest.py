"""Prepare an offline VSL-GH segment review index; never a training-ready dataset."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re

from .kvsl_manifest import ManifestError, write_manifest
from .vsl_data_audit import AuditError, GH_ID, SPLITS, audit_vsl_gh, overlaps, read_json, read_source

SCHEMA = "smartglove-vsl-candidate-manifest-v1"


def prepare_candidates(metadata: Path, tree_path: Path, candidates: Path) -> dict:
    """Retain original splits/boundaries and exclude ambiguous feature groups."""
    audit = audit_vsl_gh(metadata, tree_path)
    rows, meta_provenance = read_json(metadata)
    tree, tree_provenance = read_json(tree_path)
    selection, selection_provenance = read_json(candidates)
    if audit["sources"] != [meta_provenance, tree_provenance]:
        raise AuditError("Sources changed during preparation")
    tree_sha = tree.get("sha")
    if not isinstance(tree_sha, str) or not re.fullmatch(r"[0-9a-f]{40}", tree_sha):
        raise AuditError("Git tree must identify the source tree SHA")
    if not isinstance(selection, dict) or selection.get("source") != tree_sha:
        raise AuditError("Candidate selection must reference the same source tree SHA")
    labels = selection.get("labels")
    if not isinstance(labels, list) or not labels:
        raise AuditError("Expected nonempty candidate labels")
    glosses = [label.get("gloss") if isinstance(label, dict) else None for label in labels]
    if any(not isinstance(g, str) or not g.strip() for g in glosses):
        raise AuditError("Invalid candidate gloss")
    if len(set(glosses)) != len(glosses):
        raise AuditError("Duplicate candidate gloss; labels must remain distinct")
    selected = set(glosses)
    known = {entry["gloss"] for entry in audit["gloss_coverage"]}
    if selected - known:
        raise AuditError("Candidate gloss absent from consistent source annotations")

    blobs = {entry["path"]: entry["sha"] for entry in tree["tree"]
             if isinstance(entry, dict) and entry.get("type") == "blob"}
    raw_metadata, current_provenance = read_source(metadata)
    metadata_blob = hashlib.sha1(b"blob " + str(len(raw_metadata)).encode("ascii") + b"\0" + raw_metadata).hexdigest()
    if current_provenance != meta_provenance or blobs.get("data/dataset.json") != metadata_blob:
        raise AuditError("Metadata bytes do not match the pinned Git blob")

    consistent = set(audit["consistent_ids"])
    groups = defaultdict(list)
    signer_splits = {s: set() for s in SPLITS}
    for index, row in enumerate(rows):
        rid = row.get("id")
        if isinstance(rid, str):
            blob = blobs.get(f"data/keypoints/{rid}.npy")
            if blob:
                groups[blob].append((index, row))
        # Include quarantined rows and every declared/filename signer, before
        # vocabulary filtering; invalid annotations cannot conceal split leakage.
        if row.get("split") in SPLITS:
            match = GH_ID.fullmatch(rid) if isinstance(rid, str) else None
            for signer in (row.get("signer_id"), row.get("signer"), match["signer"] if match else None):
                if isinstance(signer, str):
                    signer_splits[row["split"]].add(signer)
    signer_overlap = overlaps(signer_splits)
    blocked_signers = {s for entry in signer_overlap for s in entry["values"]}

    excluded, aliases, records, segments = [], [], [], []
    for blob, members in sorted(groups.items()):
        valid = [r for _, r in members if r.get("id") in consistent]
        if not valid:
            continue
        reasons = []
        if len(valid) != len(members):
            reasons.append("feature shared with quarantined metadata")
        if len({json.dumps(r.get("split"), sort_keys=True) for _, r in members}) != 1:
            reasons.append("feature shared across splits")
        if len({r.get("signer_id", r.get("signer")) for r in valid}) != 1:
            reasons.append("feature has conflicting signer identities")
        if any(r.get("signer_id", r.get("signer")) in blocked_signers for r in valid):
            reasons.append("signer appears across splits")
        signatures = {json.dumps([r["gloss_sequence"], r["gloss_frame_boundaries"]],
                                 sort_keys=True, ensure_ascii=False) for r in valid}
        if len(signatures) != 1:
            reasons.append("identical features have conflicting full annotations")
        if reasons:
            excluded.append({"feature_git_blob": blob, "reasons": reasons,
                             "rows": [{"row_index": i, "id": r.get("id")} for i, r in members]})
            continue
        ordered = sorted(valid, key=lambda r: r["id"])
        canonical, siblings = ordered[0], ordered[1:]
        rid = canonical["id"]
        if siblings:
            aliases.append({"canonical_id": rid, "feature_git_blob": blob,
                            "alias_ids": [r["id"] for r in siblings]})
        if not selected.intersection(canonical["gloss_sequence"]):
            continue
        split, signer = canonical["split"], canonical.get("signer_id", canonical.get("signer"))
        records.append({"recording_id": rid, "split": split, "signer_id": signer,
                        "feature_path": f"data/keypoints/{rid}.npy", "feature_git_blob": blob,
                        "alias_ids": [r["id"] for r in siblings]})
        for index, boundary in enumerate(canonical["gloss_frame_boundaries"]):
            if boundary["gloss"] in selected:
                segments.append({"segment_id": f"{rid}:{index}", "recording_id": rid,
                                 "boundary_index": index, "split": split, "signer_id": signer,
                                 "feature_git_blob": blob, "gloss": boundary["gloss"],
                                 "source_start": boundary["start"], "source_end": boundary["end"],
                                 "alias_segment_ids": [f"{r['id']}:{index}" for r in siblings]})
    records.sort(key=lambda r: r["recording_id"])
    segments.sort(key=lambda r: (r["recording_id"], r["boundary_index"]))
    coverage = []
    for gloss in glosses:
        matching = [s for s in segments if s["gloss"] == gloss]
        coverage.append({"gloss": gloss, "splits": {split: {
            "segments": sum(s["split"] == split for s in matching),
            "unique_feature_blobs": len({s["feature_git_blob"] for s in matching if s["split"] == split}),
            "signer_ids": sorted({s["signer_id"] for s in matching if s["split"] == split}),
        } for split in SPLITS}})
    return {
        "schema_version": SCHEMA, "dataset": "VSL-GH", "source_tree_sha": tree_sha,
        "source_commit_verification": "not_established_by_tree_input",
        "sources": [meta_provenance, tree_provenance, selection_provenance],
        "metadata_git_blob": metadata_blob, "status": "review_only", "training_ready": False,
        "frame_boundary_convention": "unverified_source_values_no_slicing",
        "semantic_review": "pending", "media_validation": "pending",
        "split_policy": "preserve_source_splits_exclude_conflicts_before_label_filtering",
        "unverified": ["source RGB and sign correctness", "frame index base and end convention",
                       "full feature decode and frame bounds", "near-duplicates and signer provenance",
                       "usage rights", "idle and unknown-sign coverage", "target camera generalization"],
        "summary": {"source_rows": len(rows), "structurally_consistent_rows": len(consistent),
                    "metadata_quarantined_rows": len(audit["quarantined"]),
                    "excluded_feature_groups": len(excluded), "source_deduplicated_groups": len(aliases),
                    "candidate_recordings": len(records), "candidate_segments": len(segments),
                    "segments_by_split": dict(Counter(s["split"] for s in segments))},
        "metadata_quarantine": audit["quarantined"], "signer_overlap": signer_overlap,
        "excluded_feature_groups": excluded, "duplicate_aliases": aliases,
        "coverage": coverage, "recordings": records, "segments": segments,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("metadata", "tree", "candidates", "output"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        inputs = (args.metadata, args.tree, args.candidates)
        if any(args.output.resolve() == path.resolve() for path in inputs):
            raise AuditError("Output must not replace an input")
        if any(args.output.resolve().is_relative_to(path.parent.resolve())
               for path in (args.metadata, args.tree)):
            raise AuditError("Output must stay outside source metadata/tree directories")
        report = prepare_candidates(*inputs)
        status = write_manifest(report, args.output)
    except (AuditError, ManifestError, OSError) as exc:
        parser.exit(2, f"Candidate preparation failed: {exc}\n")
    print(json.dumps({"status": status, "training_ready": False, **report["summary"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
