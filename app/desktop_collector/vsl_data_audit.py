"""Offline qualification of external VSL metadata; never trains or repairs labels."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
import hashlib
import io
import json
from pathlib import Path
import re

from .kvsl_manifest import ManifestError, write_manifest

SCHEMA = "smartglove-vsl-data-audit-v1"
SPLITS = ("train", "val", "test")
MULTI_NAME = re.compile(r"[^/\\]+_center_device[^/\\]+_signer(?P<signer>\d+)_center_ord1_(?P<label>\d+)\.mp4")
GH_ID = re.compile(r"SENT\d{3}_(?P<signer>S\d{2})_R\d{2}_F")


class AuditError(ValueError):
    """An input cannot be interpreted without guessing its contract."""


def read_source(path: Path) -> tuple[bytes, dict]:
    data = path.read_bytes()
    return data, {"name": path.name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def read_json(path: Path) -> tuple[object, dict]:
    data, provenance = read_source(path)
    def unique_fields(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"Duplicate JSON field: {key}")
            result[key] = value
        return result

    def reject_constant(value):
        raise ValueError(f"Non-finite JSON number: {value}")

    try:
        return json.loads(data.decode("utf-8-sig"), object_pairs_hook=unique_fields,
                          parse_constant=reject_constant), provenance
    except (ValueError, UnicodeError) as exc:
        raise AuditError(f"Invalid JSON: {path.name}") from exc


def overlaps(groups: dict[str, set[str]]) -> list[dict]:
    return [{"splits": [a, b], "values": sorted(groups[a] & groups[b])}
            for i, a in enumerate(SPLITS) for b in SPLITS[i + 1:] if groups[a] & groups[b]]


def base_report(dataset: str) -> dict:
    return {"schema_version": SCHEMA, "dataset": dataset, "audit_scope": "metadata_only",
            "training_ready": False, "sources": [], "issues": [],
            "unverified": ["sign correctness", "usage rights", "media quality",
                           "idle and unknown-sign coverage", "target camera generalization"]}


def audit_multivsl(split_dir: Path, inventory: Path | None = None) -> dict:
    report = base_report("Multi-VSL center view")
    report["unverified"].append("authoritative numeric-ID to gloss mapping")
    names = {s: set() for s in SPLITS}
    signers = {s: set() for s in SPLITS}
    video_ids = {s: set() for s in SPLITS}
    rows_by_split = {}
    label_names: dict[str, set[str]] = defaultdict(set)
    report["splits"] = {}
    for split in SPLITS:
        path = split_dir / f"{split}_1_1000_center_ord1.csv"
        data, provenance = read_source(path)
        report["sources"].append(provenance)
        try:
            reader = csv.DictReader(io.StringIO(data.decode("utf-8-sig")), strict=True)
            if reader.fieldnames != ["name", "label", "video_lb_id"]:
                raise AuditError(f"Unexpected CSV columns: {path.name}")
            rows = list(reader)
        except (UnicodeError, csv.Error) as exc:
            raise AuditError(f"Invalid CSV: {path.name}") from exc
        if not rows:
            raise AuditError(f"Empty split: {split}")
        counts = Counter()
        usable = []
        for number, row in enumerate(rows, 2):
            if None in row or any(row.get(k) is None for k in ("name", "label", "video_lb_id")):
                raise AuditError(f"Incomplete CSV row: {path.name}:{number}")
            name, label = row["name"], row["label"]
            match = MULTI_NAME.fullmatch(name)
            problems = []
            if not match or any(c in name for c in "/\\:\0") or not label.isascii() or not label.isdecimal():
                problems.append("invalid filename or numeric label")
            elif int(match["label"]) != int(label) or not 0 <= int(label) < 1000:
                problems.append("filename/label mismatch or out-of-range label")
            if not row["video_lb_id"].isascii() or not row["video_lb_id"].isdecimal():
                problems.append("invalid video_lb_id")
            else:
                video_ids[split].add(str(int(row["video_lb_id"])))
            if name in names[split]:
                problems.append("duplicate filename within split")
            names[split].add(name)
            label_names[name].add(label)
            if problems:
                report["issues"].append({"split": split, "row": number, "name": name, "reasons": problems})
            if match:
                signers[split].add(str(int(match["signer"])))
            if not problems:
                row = {**row, "label": str(int(label))}
                usable.append(row)
                counts[label] += 1
        rows_by_split[split] = usable
        report["splits"][split] = {"rows": len(rows), "unique_names": len(names[split]),
            "parsed_unique_rows": len(usable), "classes": len(counts),
            "signers": sorted(signers[split]), "per_class": dict(sorted(counts.items(), key=lambda p: int(p[0])))}
    report["filename_overlap"] = overlaps(names)
    report["signer_overlap"] = overlaps(signers)
    report["video_id_overlap"] = overlaps(video_ids)
    report["conflicting_labels"] = [{"name": n, "labels": sorted(ls)}
                                      for n, ls in sorted(label_names.items()) if len(ls) > 1]
    report["inventory"] = None
    if inventory is not None:
        listing, provenance = read_json(inventory)
        report["sources"].append(provenance)
        if not isinstance(listing, dict) or not isinstance(listing.get("files"), list):
            raise AuditError("Inventory must contain a files list")
        listed = set()
        duplicate_titles = set()
        for item in listing["files"]:
            if not isinstance(item, dict) or not isinstance(item.get("title"), str) or not item["title"]:
                raise AuditError("Inventory entries require a nonempty title")
            if item["title"] in listed:
                duplicate_titles.add(item["title"])
            listed.add(item["title"])
        coverage = {}
        label_sets = {}
        for split in SPLITS:
            count = Counter(r["label"] for r in rows_by_split[split] if r["name"] in listed)
            label_sets[split] = set(count)
            coverage[split] = {"listed_rows": sum(count.values()), "listed_classes": len(count),
                               "per_class": dict(sorted(count.items(), key=lambda p: int(p[0])))}
        report["inventory"] = {"status": "observed_listing_not_proof_of_complete_dataset",
            "listed_files": len(listing["files"]), "duplicate_titles": sorted(duplicate_titles),
            "media_download_verified": False, "splits": coverage,
            "classes_listed_in_all_splits": sorted(set.intersection(*label_sets.values()), key=int)}
    return report


def audit_vsl_gh(metadata: Path, tree_path: Path) -> dict:
    report = base_report("VSL-GH")
    data, source = read_json(metadata)
    tree, tree_source = read_json(tree_path)
    report["sources"] = [source, tree_source]
    report["unverified"].extend(["temporal alignment with original RGB", "keypoint extraction compatibility"])
    if not isinstance(data, list) or not isinstance(tree, dict) or not isinstance(tree.get("tree"), list):
        raise AuditError("Expected metadata list and Git tree object")
    if tree.get("truncated") is not False:
        raise AuditError("Git tree must explicitly be complete (truncated=false)")
    blobs = {}
    for entry in tree["tree"]:
        if isinstance(entry, dict) and entry.get("type") == "blob":
            path, sha = entry.get("path"), entry.get("sha")
            if not isinstance(path, str) or not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha):
                raise AuditError("Malformed Git blob entry")
            if path in blobs:
                raise AuditError("Duplicate Git tree path")
            blobs[path] = sha
    ids = Counter(r.get("id") for r in data if isinstance(r, dict) and isinstance(r.get("id"), str))
    report["quarantined"] = []
    accepted = []
    signer_splits = {s: set() for s in SPLITS}
    blob_splits = {s: set() for s in SPLITS}
    blob_records: dict[str, list[dict]] = defaultdict(list)
    per_gloss: dict[str, dict[str, set[str]]] = defaultdict(lambda: {s: set() for s in SPLITS})
    per_gloss_signers: dict[str, dict[str, set[str]]] = defaultdict(lambda: {s: set() for s in SPLITS})
    per_gloss_blobs: dict[str, dict[str, set[str]]] = defaultdict(lambda: {s: set() for s in SPLITS})
    for index, row in enumerate(data):
        if not isinstance(row, dict):
            raise AuditError(f"Metadata row {index} is not an object")
        rid = row.get("id")
        match = GH_ID.fullmatch(rid) if isinstance(rid, str) else None
        signer, split = row.get("signer_id", row.get("signer")), row.get("split")
        reasons = []
        if not match or signer != match["signer"] or split not in SPLITS:
            reasons.append("invalid identity, signer or split")
        if isinstance(rid, str) and ids[rid] > 1:
            reasons.append("duplicate recording ID")
        if "signer_id" in row and "signer" in row and row["signer_id"] != row["signer"]:
            reasons.append("conflicting signer fields")
        sequence = row.get("gloss_sequence")
        if not isinstance(sequence, list) or not sequence or any(not isinstance(g, str) or not g.strip() for g in sequence):
            reasons.append("empty or invalid sequence labels")
        boundaries = row.get("gloss_frame_boundaries")
        if not isinstance(boundaries, list) or not boundaries:
            reasons.append("missing boundaries")
        else:
            previous_end = 0
            glosses = []
            for boundary in boundaries:
                if not isinstance(boundary, dict):
                    reasons.append("invalid boundary")
                    continue
                start, end = boundary.get("start"), boundary.get("end")
                glosses.append(boundary.get("gloss"))
                if type(start) is not int or type(end) is not int or start < previous_end or end <= start:
                    reasons.append("invalid or overlapping frame range")
                else:
                    previous_end = end
            if glosses != sequence:
                reasons.append("sequence/boundary label conflict")
        blob = blobs.get(f"data/keypoints/{rid}.npy") if match else None
        if blob is None:
            reasons.append("missing keypoint path")
        if split in SPLITS and isinstance(signer, str):
            signer_splits[split].add(signer)
            if blob:
                blob_splits[split].add(blob)
                blob_records[blob].append({"id": rid, "split": split, "signer": signer})
        if reasons:
            report["quarantined"].append({"row_index": index, "id": rid, "reasons": sorted(set(reasons))})
            continue
        accepted.append(row)
        for gloss in set(sequence):
            per_gloss[gloss][split].add(rid)
            per_gloss_signers[gloss][split].add(signer)
            per_gloss_blobs[gloss][split].add(blob)
    report["signer_overlap"] = overlaps(signer_splits)
    report["feature_blob_overlap"] = overlaps(blob_splits)
    report["feature_duplicate_groups"] = [{"git_blob": blob, "records": records}
        for blob, records in sorted(blob_records.items()) if len(records) > 1]
    report["rows"] = len(data)
    report["structurally_consistent_rows"] = len(accepted)
    report["consistent_ids"] = sorted(r["id"] for r in accepted)
    report["consistent_split_counts"] = dict(Counter(r["split"] for r in accepted))
    report["gloss_coverage"] = [{"gloss": g,
        "recordings": {s: len(v) for s, v in per_gloss[g].items()},
        "unique_feature_blobs": {s: len(v) for s, v in per_gloss_blobs[g].items()},
        "signers": {s: len(v) for s, v in per_gloss_signers[g].items()}}
        for g in sorted(per_gloss)]
    report["consistency_is_semantic_approval"] = False
    return report


def audit_cropped_vsl(train: Path, test: Path, raw: list[Path],
                     augmented: Path | None = None) -> dict:
    """Join public cropped metadata to raw identities without inventing signer IDs.

    The train/test JSON files omit signer_id. Matching requires both the original
    video ID and exact gloss; a numeric filename alone is not provenance. Unknown
    origins remain unknown. This report never approves training or usage rights.
    """
    from .recognition.experimental import WORDS

    report = base_report("Kaggle cropped VSL")
    report["schema_version"] = "smartglove-vsl-cropped-audit-v1"
    report["unverified"].extend(["redistribution authority for VSL400-derived media",
                                 "unmatched recording origins and signer IDs"])
    raw_by_id = {}
    for path in raw:
        rows, provenance = read_json(path)
        report["sources"].append(provenance)
        if not isinstance(rows, list):
            raise AuditError("Raw metadata must be a list")
        for row in rows:
            if not isinstance(row, dict) or any(not isinstance(row.get(k), str) or not row[k].strip()
                    for k in ("video_id", "signer_id", "gloss")):
                raise AuditError("Raw rows require video_id, signer_id and gloss strings")
            rid = row["video_id"]
            if rid in raw_by_id:
                raise AuditError(f"Ambiguous duplicate raw video ID: {rid}")
            raw_by_id[rid] = row

    def inspect(rows, split=None):
        if not isinstance(rows, list):
            raise AuditError("Processed metadata must be a list")
        result = []
        seen = set()
        for row in rows:
            if not isinstance(row, dict) or any(not isinstance(row.get(k), str) or not row[k].strip()
                    for k in ("videoid", "gloss")):
                raise AuditError("Processed rows require videoid and gloss strings")
            part = split or row.get("split")
            if part not in ("train", "test"):
                raise AuditError("Processed split must be train or test")
            if (part, row["videoid"]) in seen:
                raise AuditError("Duplicate processed video ID within split")
            seen.add((part, row["videoid"]))
            is_augmented = row.get("is_augmented", False)
            if type(is_augmented) is not bool:
                raise AuditError("is_augmented must be boolean")
            parent = row.get("source_videoid", row["videoid"])
            if not isinstance(parent, str) or not parent.strip() or (is_augmented and "source_videoid" not in row):
                raise AuditError("Augmented rows require an explicit source_videoid")
            if not is_augmented and parent != row["videoid"]:
                raise AuditError("Unaugmented rows cannot borrow another recording identity")
            source = raw_by_id.get(parent)
            conflict = source is not None and source["gloss"] != row["gloss"]
            result.append({"video_id": row["videoid"], "recording_id": parent,
                           "gloss": row["gloss"], "split": part, "augmented": is_augmented,
                           "signer_id": source["signer_id"] if source and not conflict else None,
                           "origin": "raw_metadata_match" if source and not conflict else "unverified",
                           "raw_gloss_conflict": conflict})
        return result

    def summarize(rows):
        signers = {s: {r["signer_id"] for r in rows if r["split"] == s and r["signer_id"]}
                   for s in SPLITS}
        ids = {s: {r["recording_id"] for r in rows if r["split"] == s} for s in SPLITS}
        return {"rows": len(rows), "classes": len({r["gloss"] for r in rows}),
                "split_counts": dict(Counter(r["split"] for r in rows)),
                "unmatched_rows": sum(r["signer_id"] is None for r in rows),
                "raw_gloss_conflicts": [r for r in rows if r["raw_gloss_conflict"]],
                "signers": {s: sorted(v) for s, v in signers.items() if v},
                "signer_overlap": overlaps(signers), "recording_overlap": overlaps(ids),
                "augmented_rows": sum(r["augmented"] for r in rows),
                "augmented_evaluation_rows": sum(r["augmented"] and r["split"] != "train" for r in rows)}

    canonical = []
    for split, path in (("train", train), ("test", test)):
        rows, provenance = read_json(path)
        report["sources"].append(provenance)
        canonical.extend(inspect(rows, split))
    report["canonical"] = summarize(canonical)
    report["raw"] = {"rows": len(raw_by_id), "classes": len({r["gloss"] for r in raw_by_id.values()}),
                     "signers": sorted({r["signer_id"] for r in raw_by_id.values()})}
    report["vocabulary_policy"] = "existing 25 labels, exact match; no synonym/region merging"
    report["target_coverage"] = []
    for word in WORDS:
        chosen = [r for r in canonical if r["gloss"] == word]
        report["target_coverage"].append({"gloss": word, "processed_rows": len(chosen),
            "matched_raw_rows": sum(r["signer_id"] is not None for r in chosen),
            "known_signers": len({r["signer_id"] for r in chosen if r["signer_id"]}),
            "unknown_signer_rows": sum(r["signer_id"] is None for r in chosen)})
    report["candidate_records"] = [r for r in canonical if r["gloss"] in WORDS]
    report["augmented"] = None
    if augmented:
        rows, provenance = read_json(augmented)
        report["sources"].append(provenance)
        report["augmented"] = summarize(inspect(rows))
    report["split_recommendation"] = (
        "Rebuild partitions by verified signer before augmentation; keep all views and derivatives "
        "of one recording together. Unmatched identities cannot support an unseen-signer claim.")
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="kind", required=True)
    multi = commands.add_parser("multi-vsl")
    multi.add_argument("--split-dir", required=True, type=Path)
    multi.add_argument("--inventory", type=Path)
    gh = commands.add_parser("vsl-gh")
    gh.add_argument("--metadata", required=True, type=Path)
    gh.add_argument("--tree", required=True, type=Path)
    cropped = commands.add_parser("cropped-vsl")
    cropped.add_argument("--train", required=True, type=Path)
    cropped.add_argument("--test", required=True, type=Path)
    cropped.add_argument("--raw", required=True, nargs="+", type=Path)
    cropped.add_argument("--augmented", type=Path)
    for subparser in (multi, gh, cropped):
        subparser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        if args.kind == "multi-vsl":
            if args.output.resolve().is_relative_to(args.split_dir.resolve()):
                raise AuditError("Output must stay outside source split directory")
            inputs = [args.inventory] if args.inventory else []
            report = audit_multivsl(args.split_dir, args.inventory)
        elif args.kind == "vsl-gh":
            inputs = [args.metadata, args.tree]
            report = audit_vsl_gh(args.metadata, args.tree)
        else:
            inputs = [args.train, args.test, *args.raw] + ([args.augmented] if args.augmented else [])
            report = audit_cropped_vsl(args.train, args.test, args.raw, args.augmented)
        if any(args.output.resolve() == p.resolve() for p in inputs):
            raise AuditError("Output must not replace an input")
        status = write_manifest(report, args.output)
    except (AuditError, ManifestError, OSError) as exc:
        parser.exit(2, f"VSL audit failed: {exc}\n")
    print(json.dumps({"status": status, "schema_version": report["schema_version"], "training_ready": False}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
