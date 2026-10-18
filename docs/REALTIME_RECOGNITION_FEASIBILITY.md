# Realtime recognition feasibility and data audit

Follow-up: [VSL data qualification](VSL_DATA_QUALIFICATION.md) adds implemented audit
tooling, actual media probes, candidate coverage and source-access findings. This
feasibility report remains the earlier measurement snapshot.

Date: 2026-10-11. Status: implementation authorized; data qualification in progress.

The user requested implementation of stable camera recognition for 20–30 common
isolated VSL signs, without topic selection, and a result less than 1000 ms after
the gesture ends. The user also authorized considering supplementary datasets and
requested scanning the project for their additional videos. Exact vocabulary is
still unconfirmed. This report does not certify the target as achieved.

## Local project scan

Read-only scan of `D:\Smart-Gloves`, including hidden/ignored project files and
archive member listings. Excluded dependency installations and Git object internals;
the existing pinned manifest and Phase 4 audit cover historical KVSL Git assets.
One directory, `.design-cache/kvsl-phase3a/pytest-tmp`, was inaccessible. No files
outside the project were searched. No archives were extracted or source data modified.

- Enumerated 28,704 file paths before downloading supplementary metadata.
- Listed 66 project ZIP/RAR archives (24,190 entries), plus two nested ZIP archives
  (140 and 136 entries). No additional video/CSV/NPY/NPZ dataset found in those archives.
- Found 102 loose video files: 45 KVSL reference videos; 12 One UI reference copies;
  45 WebM files in UI/recognition test evidence. Test recordings are not training data.
- The 45 local KVSL assets have 45 distinct SHA-256 values.
- Existing manifest contains 169 original recordings / 175 topic memberships.
  All 175 topic-local classes have exactly one reference recording. Signer and split
  metadata are absent for all 169 recordings.
- Pinned Git inventory contains 309 historical video paths, including 140 outside
  the manifest. These do not acquire labels merely because they exist. Earlier
  [KVSL evaluation](KVSL_EVALUATION.md) documents the historical hash audit.
- Ten relevant CSV files are current/historical KVSL metadata, not a new dataset.

Conclusion: no separate labeled multi-signer dataset was found in the accessible
project. This does not establish whether the user's videos exist elsewhere.
Existing references support regression tests, not an independent accuracy claim.

## Measured streaming prototype

Local executable prototype: `.design-cache/realtime-feasibility-20261011/benchmark.py`.
It reuses pinned Python MediaPipe and existing feature packing/GCN; no new runtime or
application dependency. W00395 and D0098 are reference replays, not webcam recordings.

| Measurement | Result |
| --- | --- |
| Full-resolution per-frame mean | 35.08 / 37.01 ms |
| Full-resolution per-frame p95 | 37.86 / 40.92 ms |
| Feature packing plus classifier after last frame | 9.24–14.62 ms across four runs |
| Exact full-resolution feature parity | Both references pass |
| Resized 640×360 feature parity | Both fail; top label stays the same in these two cases |
| Runtime initialization | 3335 ms |
| Paced 15 Hz replay, 20 seconds per resolution | 299/300 frames processed; one replaced; at most one pending frame |
| Full-resolution paced arrival-to-feature p95 | 40.74 ms |

The prototype suggests processing landmarks during the gesture can remove most of
the current post-recording extraction delay. It does not measure camera transport,
automatic boundaries, UI delivery, long-term thermal behavior, or physical accuracy.
Exact parity was tested on full reference clips with graph reset, not on continuous
tracking or dropped-frame input. Reducing resolution is not a feature-equivalent
optimization. The subsecond end-to-display target remains unverified.

## Supplementary data checked

### Multi-VSL: preferred candidate for isolated signs, acquisition unresolved

[Official repository](https://github.com/Etdihatthoc/Multi-VSL_WACV_2025), inspected
revision `943eed8954f761e02e76b17b8b2322bb5243615c`.

Downloaded only the three center-view CSV splits. Each covers 1000 numeric classes:
20,161 train rows (21 signer IDs), 3,713 validation rows (4 signer IDs), and 4,538 test
rows (5 signer IDs). Signer IDs parsed from filenames do not overlap across splits.
Per class: 15–24 train rows, 2–5 validation rows, 2–5 test rows. This is metadata
evidence, not verification that every video exists, decodes, or has a correct label.

The linked Google Drive folder resolves with title `Videos_demo`; full video access,
text gloss mapping and dataset usage terms have not been verified. No LICENSE file
was found in the inspected repository tree. Do not assume access to the complete
dataset, infer words from numeric IDs, or treat multiple views as independent samples.
For this application, qualify the frontal view and keep signer/recording groups intact.

### VSL-GH: accessible features, metadata problems prevent direct import

[Repository](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation),
inspected source tree SHA `6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a`.
This cached Git Trees API identity is not independently verified commit provenance.

Repository tree has 6,030 keypoint files and no MP4 files; all 4,200 metadata IDs have
corresponding keypoint paths. Metadata assigns S01–S04 to train, S05 validation and
S06 test. README advertises 466 glosses, but downloaded `dataset.json` contains only
231 distinct nonempty sequence labels. Its second 2,100 rows have empty sequence
labels; 2,092 disagree with their frame-boundary labels and eight lack boundaries.
`dataset_stats.json` describes an older 2,100-row subset. These discrepancies must
be resolved before an import; do not report README counts as verified local coverage.

The extraction source uses 137 landmarks, 360×360 resizing and detection/tracking
thresholds .5, differing from pinned KVSL features. Its MIT license and source are
available, but provenance, annotation correctness and RGB availability still need
qualification. Sentence-derived segments require boundary review before use as
isolated-word examples. No external Python code or serialized pickle was executed.

## Next data and model gate

1. Obtain a usable source with actual media/features, text gloss mapping, provenance
   and permission appropriate to the project; resolve metadata conflicts explicitly.
2. Select the initial 20–30 common signs based on semantic review and per-signer
   coverage. Keep untouched signer-separated evaluation data, plus idle and out-of-
   vocabulary examples. Augmentations and multiple camera views stay with originals.
3. Train and evaluate a unified vocabulary classifier with unknown rejection. Do not
   combine unrelated topic softmax scores or hide the current topic selector to imply
   global recognition. Publish per-class errors and rejected/missed inputs.
4. Integrate a bounded streaming worker, one frame awaiting extraction, timestamped
   feature history and measured sign boundaries. Preserve bridge authentication,
   cancellation and shutdown. Measure physical end-to-display p50/p95/worst alongside
   errors; cold readiness is separate. Retain current pipeline as regression baseline.

No product accuracy threshold is invented here. Phase 5B physical validation remains
open after the user's report of wrong words; history, sentence translation, sensors
and Raspberry Pi are outside this task.

## Evidence and validation

Ignored evidence under `.design-cache/realtime-feasibility-20261011/`:
`benchmark.py`, `benchmark.json`, `scan_data.py`, `project-data-audit.json`,
`external-metadata-provenance.json`, pinned repository trees, downloaded metadata,
`external-data-audit.json`, and `final-review.json`.

Benchmark completed successfully in the existing isolated ML environment. The local
scan completed with the inaccessible test directory reported above. Archive listings,
metadata counts and split comparisons ran successfully. Initial audit-script errors
(manifest count type and mixed metadata schemas) were corrected before these results.
Network metadata retrieval initially hit sandbox restrictions; the authorized
escalated read succeeded. No production source, model, dependency, API, UI or launcher
changed in this feasibility/data-audit step; application tests were not rerun for it.
