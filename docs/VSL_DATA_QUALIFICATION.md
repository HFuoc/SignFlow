## 2026-10-18 - Multi-user dataset research and training scope approved

User explicitly requires recognition for multiple users, an extensible 25-sign MVP,
and immediately accessible public datasets; additional offline research training
is authorized. This supersedes the earlier personal-only interpretation and the
statement that multi-user investigation/training is unapproved. No vocabulary
replacement, numerical acceptance threshold or production model cutover has been
approved. Current 25 labels remain until an explicit vocabulary decision.

Verified public Kaggle/GitHub metadata and downloaded 50 VSL-word RGB clips.
Cropped-VSL v8 has 26,446 canonical rows/472 labels; both canonical and augmented
train/test share all 26 recovered signer IDs. Its current-vocabulary subset has
1,342 rows, of which 786 have matched raw signer metadata across only 13 labels.
The other 556 share label/filename identities with the existing ViSign archive;
do not count them as newly independent data without media comparison.
A metadata-only signer split proposal for those 786 rows gives 586 train,112 val,
88 test from 20/3/3 disjoint signers. The missing 12 labels remain explicit.

VSL50: 4,846 CSV rows/50 labels/20 signers; all rows match VSL400 IDs, labels
and signers. Train/test share 19 signers; val/test contain augmentations.
Kaggle mirror license declarations conflict with the official VSL400 controlled
access/DUA record; authority to redistribute has not been established. Only
metadata was acquired from VSL400-derived sources; no media fitting performed.

Pinned existing VideoMAE replay on 50 deterministically selected public VSL-word
clips: top-one source-label matches16/50; per10 clips An3,Uong8,Chao5,CamOn0,
XinLoi0. All50 fail the existing score policy. This bypasses hand-coverage and
Auto boundaries, so it is not a full app-policy or physical-camera test. All
2,258 frames decode;50 unique file hashes,0 exact file-hash overlaps against
the prior ViSign archive. Signer independence, transformed overlap and source
semantics remain unverified; these50 are now diagnostics, not a hidden test set.

Detailed source links, counts, limitations, workflow and commands:
[VSL_MULTIUSER_DATASET_REVIEW.md](VSL_MULTIUSER_DATASET_REVIEW.md).
Evidence: .design-cache/multiuser-data-20261018/.

## 2026-10-15 - Approved app integration; Capture and Auto evidence differ

The user's approval now permits the experimental candidate in Live Camera.
Provider `visign-videomae-25` runs the previously audited full sequential
checkpoint on CUDA and projects native 100-class scores to the existing 25 labels
without renormalization. The native winner must belong to that vocabulary;
additional heuristic thresholds withhold uncertain/incomplete results.
V25 stays selectable and default; no local retraining occurred.

Training provenance: the pinned publisher `src/pipeline_VideoMAE.ipynb`
sets PHASE1_EPOCHS=5 (head only), PHASE2_EPOCHS=20 (full fine-tuning).
Saved notebook output reaches Phase 1 Epoch 5/5 and Phase 2 Epoch 20/20.
These are publisher training records, not training performed on this machine.
The local V25 baseline was a Ridge linear solve; "few epochs" does not describe
that fit. More epochs are not by themselves evidence of better camera accuracy.

Actual integration probes use the existing derived `visign25-14.webm` reference,
SHA256 `61d3eb723e7cb3cad3e8ba11cc9baace51b2a9385dea1604c85afbd597a83749`.
This is source-overlapping data, not independent test data or a user recording.

- Capture through RecognitionService and the real isolated CUDA worker: native
  ID73 / canonical ID14, Thức dậy, softmax0.986507. One first request took70.49s;
  another cold process took11.33s. The second request in that process reused the
  same worker, with zero process cold-start time: total1418.61ms,
  preprocessing1121.72ms and model235.47ms. Worker/pipes reaped after shutdown.
- Auto through the actual binary worker protocol: 10FPS timestamp-controlled
  replay with repeated first/last frames (not physical frame-to-display timing).
  Initial53-frame replay produced an early rejected final and correct tentative
  Thức dậy later, without completing the main segment before replay ended.
- Extended73-frame replay: startup9597.25ms; same early rejected segment, then
  tentative Thức dậy at frames40/48/56. Final at frame68 has native winner73
  with score0.753568 and is rejected under the0.80 final threshold. This exposes
  boundary/hold sensitivity; it is not a correct Completed-sign result. Do not
  lower thresholds solely to make this one source replay pass.
- Both stream probes complete cleanup; model inference on accepted/rejected
  replay windows is about233-239ms. Inference delays frame acknowledgements.
  No sustained60FPS or subsecond end-to-end physical claim.

Evidence: `.design-cache/videomae-integration-20261015/` contains
manual-probe.json, manual-warm-probe.json, stream-probe.json,
stream-hold-probe.json and integration_probe.py. Browser review uses mocked
inference and is separately labeled in browser/review.json.
297 affected Python tests,73 frontend tests,four distinct browser cases,build and
shell/launcher smoke pass. Physical user/camera, independent accuracy, unknown/
idle rejection and robust automatic boundaries remain unverified.

Next comparison starts with one complete Capture of Chào/Ăn/Thức dậy, then Auto
under the same framing, to separate classification from segmentation. User
initiates any camera capture. No new personal dataset or fine-tuning was run.
C-drive headroom/paging remains a startup risk; preserve pinned audit assets.

## 2026-10-15 - Actual RTX 2050 CUDA feasibility and wake-up prefix replay

The GPU step is now executed. This supersedes earlier untested-GPU statements below
for the isolated probe only; the desktop application still uses V25. User reports
Thức dậy changes words during motion and remains wrong at Completed sign. No user
camera sample was captured, so its exact cause has not been determined.

Environment: NVIDIA GeForce RTX2050, 4096MiB, driver596.21, compute capability8.6.
Installed torch2.6.0+cu124 only into the ignored audit cuda-deps directory using the
[official PyTorch CUDA12.4 wheel index](https://pytorch.org/get-started/previous-versions/).
Retained Transformers4.57.1 and the pinned sequential checkpoint described below.
Original CPU environment and all app dependency declarations remain unchanged.

`gpu_probe.py` strictly loaded all86,305,636 parameters, asserted model/input/output
CUDA placement, disabled TF32, used FP32 and synchronized before/after timing.
The 31 earlier replay clips plus eight additional validation-source Thức dậy clips
produced39/39 source-label matches, covering25 target labels and nine wake-up clips.
All31 CPU-reference top-one predictions agree; maximum common top-three softmax
difference is0.00000203. Shared source/training overlap remains; this is not
independent accuracy or a fair held-out comparison against Ridge.

Warm model-only p50/p95:276.32/289.41ms (39 clips after three warmups). Historical
CPU p50/p95:1298.57/1523.38ms on31 clips, torch2.5.1+cpu, four threads. Different
software versions, clip selection and concurrent system load limit the comparison.
First CUDA warmup1086.34ms; model setup7098.52ms excludes imports. PyTorch allocator
peak410.85MiB allocated/462MiB reserved is not whole-process GPU memory. Decode,
preprocessing, motion-end decision and display are excluded from model-only timing;
no end-to-display subsecond claim. Camo was active during the benchmark.

Additional prefix replay for all nine Thức dậy source clips:

| Fraction of each clip | Matching source label |
| --- | --- |
|25 percent|1/9|
|50 percent|8/9|
|75 percent|9/9|
|100 percent|9/9|

One 25-percent prefix predicts Thức ăn with softmax0.752. Softmax is uncalibrated;
a simple confidence cutoff alone is not proven to solve early false labels. These
source-prefix results support testing complete gesture boundaries plus uncertainty
handling. They do not establish what happened in this user's physical V25 test.
The current worker picks the leading label when hand coverage passes and explicitly
reports unknown_rejection=false; stable_updates does not enforce acceptance.

Receipts: `.design-cache/pretrained-vsl-audit-20261015/gpu-probe.json`,
`gpu-verification.json`. Initial Windows paging error was followed by user-authorized
disposable-cache cleanup and successful CUDA replay. C remains nearly full after
automatic pagefile expansion; see the session handoff for cleanup details.
Next: separate experimental RGB integration, then actual camera/complete-gesture/
unknown-idle evaluation before model replacement. No new large personal dataset
was required for these checks. No camera, training, launcher or milestone change.

## 2026-10-15 - Pretrained VSL model audit and executable source replay

User asked to verify a pretrained Vietnamese sign model before choosing that route,
preferring existing labeled data over building a new personal dataset. Source labels
can support this research under the existing exception; full manual relabeling is not
a prerequisite for this audit. Label presence does not establish camera accuracy.

**Recommended experimental candidate:**
[star092304/vi-sign-language-videomae-base](https://huggingface.co/star092304/vi-sign-language-videomae-base),
pinned revision `9759fc78b5d69625317bb658b4104040f9427fa3`. The public repository
declares MIT and supplies actual weights, configuration, label map and notebooks.
It was fine-tuned on the same ViSignLanguage-Video source already present locally.
Dataset provenance/semantic limitations recorded below are not resolved by that license.

### Candidate comparison

| Candidate | Verified availability / compatibility | Decision for the current 25-word task |
| --- | --- | --- |
| VideoMAE VSL | Public 100-class RGB model; numeric checkpoint downloaded and run locally | First candidate for a separate GPU/camera experiment |
| [ViSignRe](https://github.com/lqh1505/ViSignRe) | Actual Keras/TFLite files; configuration has 11 outputs including Blank, personal names and Xin_chao, but no Ăn | Does not cover the required vocabulary |
| [SIGNTEGRATE](https://github.com/paty0504/SIGNTEGRATE) | Actual H5/TFLite files; checked main.py recognizes 10 fixed phrases | Does not implement the current isolated-word task |
| [v-sign](https://github.com/martinvalentine/v-sign) | Training/inference code; checked repository tree has no model checkpoint and README uses a locally trained output path | No immediately verified replacement weights |
| [AAGCN VSL](https://github.com/NgHngK/AAGCN-Sign-Language-Recognition-100-classes) | Model/training code; checked repository tree has no trained checkpoint | Research reference; no immediately verified replacement weights |

GitHub trees were pinned and not truncated. These findings concern checked files and
README links, not a claim that no private or separately hosted weights exist.

### Weight and label qualification

- Full sequential checkpoint: `classifier_sequential.pth`, 345,300,963 bytes,
  SHA-256 `139dcb459071ea31d2f4a3762d14a2aab6c4a8d9dbffc936a2274c2caee33bff`.
  Download matches the publisher's LFS hash. No training was performed.
- Publisher training/inference uses an extra LayerNorm/Dropout/Linear classifier.
  The standard safetensors header has a plain Linear classifier; the generic pipeline
  is not demonstrated equivalent. The probe recreated the documented sequential head
  and strictly loaded all 86,305,636 parameters, with no missing/unexpected weights.
- Checkpoint metadata was decoded through a restricted numeric-description reader;
  tensor storages were checked for type, shape, contiguous layout and finite values.
  Publisher notebook code was inspected as text, never executed.
- All 100 entries of the primitive publisher label map equal config.label2id.
  18 V25 labels match exactly. Seven explicit text aliases were used for the probe:
  Chào/ChÖo, Chúng ta/Ch£ng ta, Giúp/Gi£p, Nhà/NhÖ, Nhìn/Nhçn, Nói/N¢i, Tôi/Tìi.
  Raw model labels and IDs remain in every result; source files were not relabeled.
  These are documented encoding correspondences, not independent VSL semantic review.
- Video input is 16 uniformly sampled RGB frames with the published 224x224 processor.
  It does not consume the current 75-point landmark vectors. Future integration needs
  a separate versioned RGB path and review of framing on the physical 16:9 camera.

### Executed checks and limits

The first probe ran 3 Chào and 5 Ăn clips: 8/8 source-label matches. A second probe
repeated those and added one validation-source clip for each remaining V25 label:
31 clips across all 25 labels, 31/31 source-label matches. The repeated eight top-three
outputs, including scores, were identical. This is compatibility/source replay only.

The publisher shuffled file indices from its source training directory for an 80/20
split; no signer/group separation is demonstrated. Our local validation clips are
from that same source collection and may have been training examples for VideoMAE.
Do not compare 31/31 to Ridge's held-out result as a fair accuracy improvement or
describe it as independent webcam accuracy. No physical camera or user sample ran.

Measured on the existing CPU-only PyTorch 2.5.1 environment, 4 intra-op threads:
warm model-only p50 1298.57 ms / p95 1523.38 ms in the 31-clip probe. Model setup
took 2613.30 ms, excluding Python/library imports. These timings exclude physical
gesture-end detection, bridge delivery and display. CPU inference therefore does not
meet the current subsecond target. Windows reports an RTX 2050; CUDA inference was
not installed/tested and its latency or memory feasibility is not assumed.

Transformers 4.57.1 and dependencies were installed with uv --target exclusively in
ignored audit storage. The existing worker environment still has no Transformers;
the pinned V25 checkpoint hash is unchanged. No app/API/launcher/dependency declaration,
raw dataset or milestone change. No app regression suite was needed/run for this audit.

Receipts, metadata, scripts, pinned weights, isolated dependencies and both probe
reports: `.design-cache/pretrained-vsl-audit-20261015/`; final checks in verification.json.
Next technical gate is isolated GPU timing, then explicitly started physical-camera
evaluation and unknown/idle testing. The existing 25-word product scope remains.

# VSL data qualification — updated 2026-10-12

## Latest: immediately available RGB source acquired

Latest approved scope: user permitted source-label offline training without exhaustive
manual review. Completed25-class ridge baseline on593screened clips; known groups
kept together, original test retained, six train groups moved to repair validation.
Split360/116/117; test95/117(81.20%) versus source labels, macro-F1 0.6954. Scores are
not independent signer/camera accuracy. Separate experiment and51-clip validation
review shortlist are in `.design-cache/visign-baseline-20261012/`. Production quality
gates remain; earlier statements that all training must await review are superseded
for this explicitly authorized research scope only. No source labels marked reviewed.

Latest curation: 231 clips quarantined as whole connected groups; 593 remain
`screened_pending_semantics`, not accepted training data. Preserved proposal:
366 train /110 validation /117 test. Chúng ta and Uống have no remaining validation
examples; no silent reshuffle. User currently has no VSL reviewer. Local per-word
video review pages and pending CSV are available under
`.design-cache/visign-curation-20261012/review/`. Semantic and independent evaluation
gates remain open. Actual checks: 134 affected tests passed; source/feature/group and
review-pack consistency verified. Browser playback untested.

Continuation: all 824 pilot clips now have verified, mask-preserving offline features.
There are eight no-hand clips, 143 below 50% hand coverage, and source videos with
flat-color/black frames or strong color casts. Three near-image pairs are kept together
in an unfrozen group proposal. This advances technical preparation; it does not close
source/semantic quality or independent evaluation gates. Full measured results and
review files are in [the immediate dataset report](VISIGN_IMMEDIATE_DATASET.md).

The user's no-wait requirement led to a new source: public ViSignLanguage-Video,
downloaded and fully decoded locally. It contains3,875 labeled training videos for100
words (2,776 unique sequences) plus4,489 unlabeled competition clips. A25-word pilot
contains824 distinct nonconflicting sequences. See [verified source/local inventory](VISIGN_IMMEDIATE_DATASET.md)
for hashes, true counts, label recovery, duplicates and MediaPipe spot checks. This is
available RGB for research now; it does not establish independent evaluation or close
the model-quality gate. VSL400 is a supplemental option and no longer the main route.

## Candidate preparation update — 2026-10-12

The offline segment review index is now generated from the previously audited public
VSL-GH metadata. It contains **3279 candidate annotation segments** for the 25 proposed
glosses, from **2037 canonical feature records**: 2801 train, 240 validation and 238 test
segments. These are metadata entries, not newly downloaded/cut/verified video clips.
The original source partitions remain unchanged; the earlier 30-array spot check is
not a claim that all 2037 feature files have been validated.

Full-annotation comparison found **10 groups / 23 rows** with identical feature blobs
but different frame boundaries. All are excluded. Another **30 compatible groups**
have 39 redundant aliases, retained explicitly but not counted as independent records.
These checks run over the source before filtering the chosen vocabulary, including
quarantined metadata for leakage checks. The original 2100 invalid metadata rows
remain quarantined. No labels or source files were repaired.

Repeated words within a sentence have distinct boundary-index IDs. For example, TÔI
has 1695 train segments but only 1681 unique source feature blobs, compared with 1740
nominal train recordings in the earlier, pre-conflict-filter table below. Do not
interpret segment count as independent sample count. MỆT and ĂN still each have only
12 train, one validation and one test record; each candidate has four training signers
and one validation/test signer. This is insufficient evidence of reliable generalization.

The index preserves source start/end integers without declaring their index base or
end inclusivity. It does not slice arrays, convert frames to time, or approve boundaries.
All outputs remain `review_only`, `training_ready=false`. The source metadata bytes
match their Git blob; the supplied tree SHA does not itself establish commit identity.

```powershell
.\.venv\Scripts\python.exe -m app.desktop_collector.vsl_candidate_manifest --metadata .design-cache/realtime-feasibility-20261011/vsl-gh/data/dataset.json --tree .design-cache/realtime-feasibility-20261011/vsl-gh-tree.json --candidates .design-cache/realtime-data-20261011/candidate-25-v2.json --output .design-cache/vsl-data-preparation-20261011/candidate-segments-v2.json
.\.venv\Scripts\python.exe -m pytest tests/test_vsl_candidate_manifest.py tests/test_vsl_data_audit.py tests/test_kvsl_manifest.py tests/test_dependencies.py -q
```

Use `candidate-segments-v2.json`; the first output predates the explicit distinction
between tree SHA and unverified commit identity. Both outputs are immutable. The
[schema](DATA_SCHEMA.md) describes publication and recovery rules. The CLI performs
no network or training operation and adds no dependency to the application.

Final affected checks: **82 tests passed in 15.90s**, including 22 new candidate tests.
CLI help, real-data execution and unchanged rerun pass. Additional checks confirm
every output boundary/alias matches its source, candidate signer/blob partitions are
disjoint, excluded rows are absent and the KVSL manifest hash is unchanged. Hash/direct
review substitutes for unavailable root Git; no app shell or frontend tests rerun.

Next review is concrete: obtain the original RGB corresponding to the indexed records;
confirm feature layout/frame alignment and source terms; have a qualified VSL reviewer
verify each chosen gloss, variant and boundaries; then freeze vocabulary and grouped
partitions. Training-only augmentation cannot replace additional independent people
or idle/unknown-sign examples. The 25 labels remain proposals.

The VSL400 PDF has now been read in full and the actual applicant fields are recorded
in the [request preparation note](VSL_DATA_ACCESS_REQUEST.md). No identity/signature
was supplied and no request was sent. Public-source preparation continues separately;
VSL400 is a supplemental access option. Its dataset page returned HTTP 429 on this
session's refresh; its agreement record remained accessible. No new access is claimed.

## Previous source audit — 2026-10-11

Status: qualification tooling and bounded source audit completed; **training-data
gate remains open**. The user authorized data sourcing and implementation and chose
dataset quality ahead of regional preference. Regional variants remain distinct.
The 25-word list below is a candidate, not a deployed vocabulary or a language-expert
approval. No model was trained or replaced in this step.

## Source decisions based on actual accessible data

| Source | Verified in this session | Decision |
| --- | --- | --- |
| Existing KVSL | Previous local audit: one reference per topic-local class, no signer/split metadata | Preserve for regression; not independent training/evaluation evidence |
| Multi-VSL | Listed 1000 public Drive videos; 352 center, 337 left, 311 right. Three center samples downloaded and fully decoded | Technical reference only until full data and authoritative gloss map are available |
| VSL-GH | 2100 structurally consistent records, 2100 quarantined; 30 downloaded feature arrays checked | Candidate for a research pilot, pending original-video/annotation review and extraction compatibility |
| VOYA_VSL | Public feature archives; inspected a bounded NPZ header; no signer/original-recording fields in that archive | Not suitable for an independent signer-split benchmark without additional provenance |
| VSL400 | Public dataset description and access agreement; video files restricted | Preferred next access request for isolated-word data, not yet accepted or downloaded |

### Multi-VSL

[Official source](https://github.com/Etdihatthoc/Multi-VSL_WACV_2025), pinned source
revision `943eed8954f761e02e76b17b8b2322bb5243615c`. The complete center-view CSVs
contain 20,161 / 3,713 / 4,538 train/validation/test rows, with 1000 numeric classes
in each split. Filename-derived signer IDs do not overlap. This metadata is broader
than the media currently accessible from the linked `Videos_demo` folder.

For the 1000 observed Drive items, exact joins to the center CSVs give:

| Split | Listed center videos | Covered numeric classes |
| --- | ---: | ---: |
| Train | 248 | 212 |
| Validation | 40 | 39 |
| Test | 64 | 63 |

**Zero classes have listed center videos in all three splits.** Counts describe the
observed listing, not proof that no further private/unlisted media exists. The folder
tool caps requests at 1000; a 1100-item request failed, so completeness is not asserted.
The public [full-release issue](https://github.com/Etdihatthoc/Multi-VSL_WACV_2025/issues/1)
also reports demo-only access; it does not grant access to the missing full dataset.

Three actual files, one per split, decode to 91 / 56 / 96 frames at approximately
30 FPS. Hashes and source URLs are retained locally. Decoding validates technical
readability, not the semantic meaning of a sign. No sample is installed in the app.

An additional [AAGCN label table](https://github.com/NgHngK/AAGCN-Sign-Language-Recognition-1000-classes)
was recovered at revision `88f2d002b01317abc443c34a2b09fd779ad8e548`: 1000 rows with
text labels and document IDs 1–1000. Its duplicate ID columns agree. Multi-VSL uses
0–999 classes. Matching the apparent one-index offset has **not** been authoritatively
verified; this table is a lead, not an imported mapping. Repository code license and
data-use terms remain unresolved. No numeric class is guessed into a Vietnamese word.

### VSL-GH

[Source](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation),
source tree SHA `6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a`.
The cached Git Trees API response does not independently establish a commit identity.

The offline auditor checks IDs, signer consistency, split names, nonempty gloss
sequences, ordered non-overlapping integer frame ranges, sequence/boundary agreement,
and keypoint presence in the complete Git tree. It retains original metadata unchanged.

- 2100 consistent rows (SENT001–150): 1800 train, 150 validation, 150 test; 231 glosses.
- 2100 rows are quarantined. They include empty sequence labels, 2092 sequence/boundary
  disagreements and eight missing-boundary records; some also have identity issues.
- Original split assignment stays S01–S04 train, S05 validation, S06 test. No signer
  overlap or exact feature-blob overlap across splits was found in the audited metadata.
- The consistent subset still has 40 groups / 92 paths with identical feature content.
  Repetitions with identical features are not independent examples. The candidate table
  therefore includes unique feature-blob counts as well as recording IDs.
- Five sentences × six signers = 30 downloaded arrays: all match their pinned Git blob
  identities, have `(T, 411)` shape, finite values and annotation ranges inside `T`.
  NPY loading uses `allow_pickle=False`. This is a bounded technical probe, not a full
  media audit or confirmation that the human sign matches its annotation.
- No source RGB video is present in the repository tree or linked by the inspected
  README. Original-video review and temporal alignment remain unresolved. The MIT
  statement is retained as the publisher's claim, not independent provenance proof.
- Extraction uses 137 landmarks (25 pose, 70 face, 42 hands), 360×360 frames and .5
  detection/tracking thresholds. It cannot be silently reshaped into pinned KVSL's
  65-landmark input. A trained model would require its own versioned feature contract.

The data consist of signed sentences, largely health-service conversations. Cropped
glosses may include coarticulation and context; their behavior as isolated signs on a
laptop camera must be measured separately. No sentence-translation scope is introduced.

### Candidate 25-word coverage

Each listed candidate has four train signers, one validation signer and one test signer.
Counts are sentence recordings containing the gloss, not independent isolated clips.
They are derived only from the consistent subset and do not approve semantic labels.
Class imbalance is substantial; especially `MỆT` and `ĂN` have only one recording per
evaluation split. A one-signer test is a limited pilot, not evidence of broad stability.

| Source gloss | Train records / unique feature blobs | Validation | Test |
| --- | ---: | ---: | ---: |
| TÔI | 1740 / 1691 | 145 | 143 |
| MUỐN | 72 / 71 | 6 | 6 |
| CẦN | 72 / 70 | 5 | 6 |
| CÓ | 101 / 101 | 9 | 9 |
| CHƯA | 48 / 42 | 4 | 4 |
| RỒI | 84 / 81 | 7 | 6 |
| ĐẾN | 120 / 118 | 10 | 10 |
| ĐI | 36 / 32 | 3 | 3 |
| CHỜ | 36 / 33 | 3 | 2 |
| ĐỢI | 36 / 34 | 3 | 3 |
| LẠI | 36 / 33 | 3 | 3 |
| ĐÂY | 56 / 49 | 4 | 5 |
| Ở-ĐÂU | 36 / 35 | 3 | 3 |
| GÌ | 24 / 24 | 2 | 2 |
| BAO-NHIÊU | 24 / 24 | 2 | 2 |
| GIÚP | 24 / 19 | 2 | 2 |
| VIẾT | 48 / 42 | 4 | 4 |
| GIẤY | 84 / 80 | 6 | 5 |
| SỐ | 60 / 58 | 4 | 5 |
| 1 | 36 / 36 | 3 | 3 |
| 2 | 48 / 48 | 4 | 4 |
| ĐAU | 36 / 36 | 3 | 3 |
| MỆT | 12 / 12 | 1 | 1 |
| ĂN | 12 / 12 | 1 | 1 |
| UỐNG | 24 / 24 | 2 | 2 |

Keep `CHỜ` and `ĐỢI` separate until a qualified VSL reviewer decides whether they
represent distinguishable target signs. The same rule applies to regional variants
and apparently synonymous labels across sources. Frequency alone does not establish
which signs are most useful to the product. Final vocabulary remains open.

### VOYA_VSL and VSL400

[VOYA_VSL](https://huggingface.co/datasets/Kateht/VOYA_VSL) revision
`9686a7c784846b5ba5008c8bbbbcb97ee889fc4c` lists 161 NPZ archives but 4363 text-label
entries. A bounded 69,931-byte range probe of `class_0023.npz` found only `sequences`
and `labels`: shapes `(1001,60,1605)` float32 and `(1001,)` int32. It carries no signer
or original-recording group IDs. Whether these are independent recordings or variants
is unknown. Do not randomly split rows and report independent accuracy. The full
337 MB sample archive and 56 GB dataset were not downloaded; no foreign loader ran.

[VSL400](https://zenodo.org/records/17943574) describes 400 isolated glosses, 28 signers
and 74,259 synchronized-view clips with gloss/signer metadata. Files are restricted
and require the publisher's [Data Usage Agreement](https://zenodo.org/records/21366957).
The public PDF was downloaded unchanged for review; no agreement was signed or sent.
Its data quality and class coverage cannot be accepted before access and inspection.
An [access-request preparation note](VSL_DATA_ACCESS_REQUEST.md) is ready for the user.

## Reproducible tooling and verification

New standard-library CLI: `app.desktop_collector.vsl_data_audit`. See
[data schema](DATA_SCHEMA.md) for its report contract. This is an offline audit, not a
training importer. It never downloads media, loads external code, alters splits,
repairs annotations or enables a classifier. Every report has `training_ready=false`.

```powershell
.\.venv\Scripts\python.exe -m app.desktop_collector.vsl_data_audit multi-vsl --split-dir .design-cache/realtime-feasibility-20261011/multi-vsl/data/label_1_1000 --inventory .design-cache/realtime-data-20261011/multi-vsl-drive-list.json --output .design-cache/realtime-data-20261011/multi-vsl-audit-v2.json
.\.venv\Scripts\python.exe -m app.desktop_collector.vsl_data_audit vsl-gh --metadata .design-cache/realtime-feasibility-20261011/vsl-gh/data/dataset.json --tree .design-cache/realtime-feasibility-20261011/vsl-gh-tree.json --output .design-cache/realtime-data-20261011/vsl-gh-audit-v2.json
.\.venv\Scripts\python.exe -m pytest tests/test_vsl_data_audit.py tests/test_kvsl_manifest.py tests/test_dependencies.py -q
.\.venv\Scripts\python.exe -m app.desktop_collector.shell --smoke-test
```

Affected tests: **60 passed, 15.61 seconds**, using a fresh workspace `--basetemp`
directory (`.design-cache/realtime-data-20261011/pytest-run3`) for the actual run.
Both real-data CLI paths execute successfully. Identical rerun preserves the output;
different existing output is refused. Smoke initially returned exit 0 but logged a
sandbox read-only SQLite shutdown failure; it is not counted as a pass. The authorized
escalated rerun exited 0 without that failure. No frontend change; frontend tests were
not rerun. The original Phase 5B physical gate remains unresolved.

Ignored evidence: `.design-cache/realtime-data-20261011/`, especially the two `*-v2`
audit reports, `fetch-jobs.json`, `fetch-results.json`, `bounded-media-probe.json`,
`vsl-gh-sample-quality.json`, `candidate-25-v2.json`, `sources/voya-header-probe.json`
and baseline/final review. No external source file, model pin, manifest, raw capture,
runtime dependency, launcher or app UI was modified.

## Remaining gate

Before training a product candidate, obtain inspectable source media and trustworthy
text labels, confirm appropriate usage terms, verify signs/boundaries with a qualified
VSL reviewer, and freeze signer/recording groups. Add real idle, ordinary non-sign
motion and out-of-vocabulary examples. Augment only the training partition; keep
all views, crops and derived features with the original recording's split. Test-set
predictions must not drive vocabulary or threshold tuning.

The current material supports controlled technical exploration. It does not yet
support a claim of accurate, stable recognition for new people or the subsecond
camera requirement. The next external action is obtaining full/verified data access;
no request has been sent to a dataset owner on the user's behalf.
