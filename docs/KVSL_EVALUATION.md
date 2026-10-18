# Phase 4 Result

PASS

## Evaluation Eligibility

**D — no defensible accuracy evaluation from current data.** No actual checkpoint-linked
train/test membership, ordered training NPZ inventory, augmentation realization, or signer
metadata was recovered. Published code defines a leakage-prone sample split, but its actual
test population is unavailable. C would describe a recovered non-independent evaluation set;
here only convenience compatibility probes are available. Unknown membership is not held-out.
No benchmark, random split, macro metrics, confusion matrix, or confidence threshold was created.

## Provenance Findings

| Item | Status | Evidence and limit |
| --- | --- | --- |
| Actual training manifest | UNKNOWN | Committed extraction input is 21 do_vat rows / 20 videos, not an actual per-checkpoint run manifest. |
| Actual test/validation manifest | UNKNOWN | None in all four local commits, notebooks, CSVs, or unreachable-object check. |
| Published split logic | VERIFIED / DIRECT | Stratified sample-level 95/5, random_state=42, after augmentation. Actual checkpoint run settings UNKNOWN. |
| Signer/session identity | UNKNOWN | No corresponding fields; ID is a CSV/download identifier, not signer identity. |
| Augmentation algorithm | VERIFIED / DIRECT | Up to 1,500 derived sequences plus original per CSV row; no recording-group split. |
| Actual augmentation lineage | UNKNOWN | No NPZ outputs, seeds, lineage manifest, or execution log. |
| Training overlap | UNKNOWN | 0 confirmed training, 0 confirmed held-out, 175 unknown memberships / 169 recordings. All carry possible-training risk. |
| Checkpoint byte provenance | VERIFIED / DIRECT | Ten immutable artifacts at 4634b5d9..., matching existing provider pins. This does not prove training-run provenance. |
| Dataset/video origin | INFERRED / STRONG INFERENCE | README, downloader and metadata agree on qipedc dictionary provenance; original download receipts unavailable. |
| Semantic annotation correctness | UNKNOWN | CSV/maps agree; no independent annotation adjudication. |
| Code/video/weight redistribution | UNKNOWN | No project license recovered. ChromeDriver license concerns that third-party component only. |

Evidence levels are separately encoded in provenance.json: DIRECT, STRONG INFERENCE,
WEAK INFERENCE, UNKNOWN. Filename-family similarity is weak evidence only. No signer IDs
were invented or inferred from appearance. Signer-independent evaluation cannot be established.
This phase used local artifact evidence; no external public research or current Drive access
is claimed. Prior reports recorded inaccessible Drive links; they were not retested here.

## Dataset / Split Evidence

Full non-shallow local history: 4634b5d9f695f1118f99a6d09c9487f81bde0b3c (first commit),
563052297b3be016109f7e81a1338fa6a600e9c2 (ignore rules),
629f55ceb1737ac283dc6f8a04a5a6c92d0d4141 (artifact removal), and
e5165d79f373a12a4964e2c3d1bf59c911416667 (empty-directory markers).
Inspected 830 tree entries, 43 unique textual blobs, five CSVs and two notebooks.
`git fsck --full --no-reflogs --unreachable` completed without findings. No fetch or checkout.
All eleven key source/metadata paths listed in provenance.json have identical blobs in all
four commits. There is no alternate historical training version to substitute.

- `data/train-gcn.py` blob `0456c73485b5b34c856b2ac0b11fb82903c51e26`:
  lines 14–19 select `/kaggle/input/tu-thong-dung/Data`, output tu_thong_dung.pth, seven
  epochs and TEST_SIZE=.05. Lines 23–30 load label_map and unsorted `*/*.npz` glob;
  lines 69–91 load integer labels and discard malformed/wrong-shaped files;
  lines 105–120 filter failures then stratify by label with random_state=42.
  Lines 125–126 shuffle training batches, not test batches. No signer/recording grouping,
  separate validation set, full augmentation/model seed, or saved split.
  Lines 175–199 print per-epoch loss and argmax correct/total (Test Acc), not macro F1.
  Line 201 saves final state_dict, without optimizer/split/run metadata. No logged result
  establishes which execution produced the artifacts, nor whether test feedback influenced tuning.
- `data/checkpoint_extraction.py` blob `2dfaae8a3c0d5eaaa06d2c27d29c96685da98eb3`:
  lines 131–154 randomly compose augmentations without a recorded seed; lines 167–180
  bind CSV ID/label/video; lines 200–207 create up to 1,500 variants, append original,
  then write `Data/<row ID>/<index>.npz` containing sequence and label only.
  Lines 214–234 use Dataset/data.csv and alphabetically sorted unique labels; the
  helper also writes do_vat.json. This is source configuration, not evidence all ten
  checkpoints were trained from this exact CSV.
- `data/augment_function.py` blob `f1b8200d7242572cb9bf1f147eaf34db7dd2d927` supplies
  scale, rotation, translation, time stretch, inter-hand distance, Gaussian noise and
  dropout. Actual generated parameters/siblings were not persisted in Git.
- `data/Dataset/adj.ipynb` blob `8dd0bd0886829e9b13d8840a8a8f5b4cd1cb26e6`
  joins cleared.csv with label.csv **on LABEL**, then filters Đồ vật and reassigns row IDs.
  Its stored output reports 169 referenced / 309 folder videos. This join is not a
  recording-level origin receipt and does not prove Vimeo URL bytes equal local MP4 bytes.
- `app/backend/Model/adj.ipynb` blob `9710d144747e5121fb92e25d510cfb64ec5379bc`
  contains a cleanup attempt ending in KeyError VIDEO, not training/evaluation evidence.
  Neither notebook was executed.
- CSVs: backend data.csv 187 rows; cleared.csv 175; extraction data.csv 21;
  label.csv 175; fix.csv header only. No signer/split columns. Exact full-row duplicates
  zero; repeated recording/topic annotations 12. Label.csv and manifest agree on all
  169 recording labels; this establishes consistency, not linguistic correctness.
- README describes topic-wise extraction, Kaggle training and two Drive folders.
  `data/download_data.py` derives MP4 filenames from qipedc thumbnail IDs and assigns
  sequential CSV IDs. Neither filename suffixes nor LEVEL establish signer/session IDs.

Historical files and exact hashes are retained in history/, history-inventory.json,
history-search.json, csv-inventory.json and notebooks.json. No upstream worktree edits.

## Leakage Analysis

The published workflow augments **before** splitting individual NPZ samples. Siblings
can cross train/test; neither recording nor signer grouping prevents it. This is a
verified structural risk, not proof of a specific checkpoint's realized leaked rows.
Seed 42 cannot reconstruct the split without ordered NPZ inputs, filtered failures and
the random augmentation realization. Re-extracting features would not recover those inputs.

Six recordings have two topic memberships: D0127, W00050, W00051, W00426, W01298,
W01378N. Twelve repeated annotation rows do not create new recordings. The do_vat
extraction CSV itself has 21 rows for 20 recordings, so different row IDs can produce
additional siblings. Leakage groups in evaluation-index.json connect shared recording
identity and exact hashes, including transitive matches; no records are merged.

All 309 historical video objects have different SHA-256 values and basenames. Thus
zero exact-byte renamed copies were found. Eighteen filename-stem families are flagged
as possible related variants, **not** confirmed augmentation or signer relationships.
Perceptual near-duplicates and actual signer overlap remain unverified.

## Evaluation Population

| Population | Count |
| --- | ---: |
| Manifest memberships / original recordings | 175 / 169 |
| Eligible benchmark samples | 0 |
| Already-local memberships / recordings | 49 / 45 |
| Missing-local memberships / recordings | 126 / 124 |
| Referenced recordings recoverable from pinned Git | 169 |
| Restored videos | 0 |
| Benchmark attempted / successful / failed | 0 / 0 / 0 |
| Fresh targeted diagnostic attempted / successful / failed | 1 / 1 / 0 |
| Compatibility evidence memberships / recordings, including reused results | 47 / 45 |
| Represented eligible classes / total model classes | 0 / 175 |
| Classes represented in compatibility probes | 47 |

Every model class has one manifest recording membership and zero eligible test support.
class-support.json exposes all 175 rows, including zero support. Local availability:
cau_hoi 3/10, chu_cai 3/34, do_vat 20/20, gia_dinh 3/24, hanh_dong 3/18,
nghe_nghiep 3/6, so_dem 3/27, thoi_tiet 3/10, tinh_cach 5/19, tu_thong_dung 3/7.
The two additional local tinh_cach memberships were not separately inferred; their
recordings already have quality evidence through another topic. All 126 missing-local
memberships have verified Git objects; missing local assets are not the eligibility blocker.

## Metrics

Not computed: no eligible evaluation set or denominator. Macro precision/recall/F1,
weighted F1, top-1/top-3 accuracy and confusion matrices are intentionally absent.
Per-probe annotation agreement/top-three inclusion are retained for error tracing only.
No pooled 175-class metric: these are ten independent topic-local output spaces.
No failed samples were silently removed. Fresh decode and diagnostic failure counts
are explicit; historical evidence is labeled reused rather than newly measured.

## Confusion Findings

D0532 is the only annotation mismatch in the retained convenience probes. These probes
were selected by earlier phases for compatibility, not randomly sampled for evaluation.
No confusion frequency, statistical accuracy, score-distribution comparison or calibration
claim is justified. Zero eligible class support makes topic confusion matrices misleading.

## Data Quality

Fresh OpenCV scan: all 45 already-local recordings readable, 5,178 frames decoded,
zero empty returned frames and no reported-versus-decoded frame-count discrepancy.
All are 1280×720; decoded durations span about 2.60–5.21 seconds. This does not rule out
every form of media corruption: OpenCV read failure can represent EOF or decode failure.

Reused landmark diagnostics, with fresh D0532 replacing its prior probe, cover those
same 45 recordings once each: pose missing 2/5,178 frames (~0.04%); left hand
2,967/5,178 (~57.3%); right hand 2,060/5,178 (~39.8%). Zero-filled group events:
5,029/15,534 (~32.4%). Counts describe full decoded frames, not just 60 selected frames.
Per-sample ratios and detection coverage are in landmark-quality.json and predictions.json.
Missing hands can reflect a one-handed sign, visibility, or detector behavior; no arbitrary
rejection threshold or causal diagnosis was applied. Remaining 124 original recordings
were not decoded. No new whole-dataset extraction was justified by eligibility.

## D0532 Analysis

Dataset annotation **3**; fresh persistent-worker top-three uncalibrated scores:
**5 .3812088668346405 → 3 .3682466447353363 → 8 .17298847436904907**.
Exactly preserves the previously recorded order/scores. Annotation maps to so_dem index 4;
5 maps to index 7 and 8 to index 9. Pinned vocabulary, source and model validation pass;
no mapping defect observed. No label, model or preprocessing repair was made.

108 decoded frames, 29.970 fps, about 3.60 seconds, 1280×720; no frame-count discrepancy.
Pose missing 0/108; left hand missing 108/108; right hand missing 58/108 (~53.7%).
Thus 166/324 group events are zero-filled (~51.2%). Possible landmark/partial-hand
detection limitation is supported; poor visibility, gesture similarity, annotation error
and the causal reason for the 5-versus-3 ordering remain UNKNOWN. No visual signer inference.
Fresh preprocess 4047.36ms, model 29.08ms, total including cold start 14796.85ms.
One persistent worker request completed; graceful worker shutdown exit 0.
Feature hash: 71f1cfed1f4368b60c5419d0f1bb613357b7df31186106f9fffc14f539837737.

## Claims Allowed

- The current pinned pipeline has reproducible topic-specific compatibility evidence.
- The published augmentation/split code permits recording-sibling leakage.
- Current evidence cannot establish independent performance; all actual training memberships remain unknown.
- All 169 referenced video objects can be recovered from pinned Git; 45 local recordings passed a bounded decode scan.
- Known D0532 error and substantial undetected-hand/zero-fill diagnostics are retained honestly.

## Claims NOT Allowed

Independent accuracy, signer-independent accuracy, generalization accuracy, a 175-class
benchmark accuracy, calibrated confidence, an official recovered test split, complete
annotation correctness, or proven rights to redistribute videos/weights. KVSL video GCN
results do not establish future glove sensor accuracy. Prior smoke annotation matches
and this audit PASS are not model performance endorsements.

## Reproducibility

Evaluation schema `smartglove-kvsl-evaluation-v1`; scripts v1, sorted sample_id order.
Manifest SHA-256 `b266b70af7408d944c3c7713537a60b0770a7dcd79b5a25bb767c343d59a99a6`.
Source commit `e5165d79f373a12a4964e2c3d1bf59c911416667`.
Artifact commit `4634b5d9f695f1118f99a6d09c9487f81bde0b3c`.
Preprocessing `kvsl-gcn-do-vat-60x65x3-v1`; feature schema
`mediapipe-pose23-left21-right21-xyz-v1`. No new split definition.
UTC execution timestamps are recorded in provenance.json, data-quality.json and
d0532-diagnostic.json; user-facing session date is 2026-10-10 Asia/Saigon.

Scripts: audit.py, quality.py, diagnose.py, analyze.py, test_evidence.py, document.py,
review.py under .design-cache/kvsl-phase4/. Index: evaluation-index.json. Final review
records script hashes, model/map/manifest pin verification and changed-file hashes.

| Provider | SHA-256 |
| --- | --- |
| kvsl-gcn-do-vat | `ea64129ba9a3f66a955a65b65340906ede701ff4d2f1f97bb4031979817eaade` |
| kvsl-gcn-cau-hoi | `f4748abdb2b76fa53ce73e6f8cebb8acc867056ab57212682fc91eb8870f2ef7` |
| kvsl-gcn-chu-cai | `68b3c19a7fb4ba066e191779f99b3cf15322b6015804d98919f6755a61fb4482` |
| kvsl-gcn-gia-dinh | `be4ca3d0b04bfb1a91995af4ff95634cd146eafb8d8e5eddacddf8ae1c09fc58` |
| kvsl-gcn-hanh-dong | `dca3f8fcb208ecb6510c3b08d0e345d310fe17ad6cc0440cc6398657de9f60b6` |
| kvsl-gcn-nghe-nghiep | `93b7bf6d668e07008901da8cd5e229c5e62bdda1aa5af9df21c5ebb9671c6692` |
| kvsl-gcn-so-dem | `c0cd7f22594f1bfe65a4d974a7ef20ed894103d2f9f08141c75ec63cccd82643` |
| kvsl-gcn-thoi-tiet | `9aaae9592be191942b8fc4c006e95f0296bfcc2c1fb6be29201eaf9aff8ba973` |
| kvsl-gcn-tinh-cach | `7e2b6077176cad6d12f836fcc47014af386a671cd30049818d1b0b01f393dc6a` |
| kvsl-gcn-tu-thong-dung | `ea644f150b4afae7834fd2996948bf943ba96665edfd03ac6b77902f91bdbb18` |

## Files Changed

- Durable source: none. No production tests, dependencies, model/registry/API/UI,
  preprocessing, manifest, simulator, SensorPacket or hardware changes.
- Tests: local evidence test_evidence.py only.
- Documentation: new docs/KVSL_EVALUATION.md; prepend Phase 4 findings to
  PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md, docs/SESSION_LOG.md,
  docs/WORK_SESSION_HANDOFF.md and docs/RECOGNITION_CONTRACT.md.
- Local evidence: ignored .design-cache/kvsl-phase4/ scripts, baseline, immutable text
  extracts, Git inventories, provenance, split decision, sample/support indexes, quality,
  reused predictions with origins, fresh D0532 diagnostic, reports and final review.

## Tests / Checks

Fresh successful commands from repository root:

1. `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase4/audit.py` — four-commit
   inventory, hash verification of 309 MP4 blobs, 175-row index; exit 0.
2. `.design-cache/kvsl-phase0a/extraction-env/Scripts/python.exe -X utf8 .design-cache/kvsl-phase4/quality.py`
   — 45 readable videos, zero scan failures; exit 0.
3. `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase4/diagnose.py` — one real
   D0532 persistent-worker diagnostic, successful inference and worker shutdown exit 0.
4. `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase4/analyze.py` — 47 evidence
   memberships / 45 unique quality recordings reconciled; exit 0.
5. `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase4/test_evidence.py` — six
   tests passed: unknown classification, transitive leakage/order, exact duplicates,
   quality arithmetic, real index counts, zero-support/no-fabricated-metric behavior.
6. `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase4/review.py` — exit 0:
   six modified docs, one new doc, 272 baseline files unchanged, no deletions or
   added-line whitespace errors. All ten model/map hashes and manifest pin match;
   upstream status/diff checks empty. Quality recording identities and frame totals
   reconcile exactly. Six evidence tests rerun successfully inside this final check.

No unrelated frontend/backend regression suite or training run was performed. Production
source did not change. Root git status reports no repository; root Git clean is not claimed.
Baseline hashes/direct diffs and upstream read-only status/diff checks replace root Git review.
The initial broad rg search encountered an inaccessible prior-phase pytest temporary folder;
subsequent bounded evidence reads succeeded. No automatic approval rejection occurred.

## Risks Remaining

License/redistribution unknown; signer identity unavailable; official split and training
overlap unknown; generalization unsupported; scores uncalibrated. LSTM and continuous
segmentation unresolved; sensor recognition and Raspberry Pi deployment unverified.
Near-duplicates, semantic annotation correctness and original URL-to-byte identity remain
unverified. Checkpoint-compatible code does not prove the exact historical training run.

## Next Recommendation

**A. Build an independent evaluation dataset**, subject to separate user authorization.
Proposed protocol, not collected: freeze all existing weights/mappings/preprocessing first;
record consent/license, pseudonymous signer IDs, session IDs, original recording IDs,
timestamps, device/video properties and SHA-256. Cover every topic-local label with
multiple signers and repetitions; predeclare target support and sample-size rationale.
Use documented lighting/background and full hand/body visibility guidance while retaining
realistic variation. Obtain qualified VSL annotation and independent adjudication.

Keep recording siblings, exact duplicates and every augmentation derivative within one
logical split; keep each known signer within one partition. Reserve separate development/
calibration data and a locked final test set; never tune on it. Prospective original clips
recorded after checkpoint freeze can support recording independence. **Signer independence
from the old training set still cannot be proven without recovering its signer roster**;
signer-disjoint prospective partitions alone do not establish that stronger claim.

Predeclare per-topic top-1/top-3, macro convention (supported classes, explicit zero-support
rows), weighted F1, confusion matrices, failure handling and uncertainty reporting. Preserve
all attempts/failures; distinguish attempted denominator from successful-inference-only
metrics. Do not repurpose the 140 unreferenced historical clips as labeled held-out data.
No next task is automatically started; all unrelated visual/cutover/hardware gates remain.
