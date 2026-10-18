# Immediately available Vietnamese sign video data — 2026-10-12

**Delivered: the complete public ViSignLanguage-Video archive is downloaded locally,
its published SHA-256 matches, and every video entry decodes.** No VSL400 application
or waiting period was needed. This is usable input for local research preparation;
it is not an independently validated production training/evaluation set.

## Experimental app testing — latest 2026-10-12 continuation

The user now explicitly authorizes adding the research model for webcam testing,
with a selector to retain KVSL access. Start the existing `run_app.ps1`, open Studio,
Open Dataset, Live Camera, and select **ViSign · 25 signs (Experimental)**. It is the
initial camera selection when its pinned local checkpoint/environment are available.
Expand **25 supported signs**, start the camera, then Capture sign or Auto on.
Manual capture gives a three-second countdown and records four seconds. Auto requires
holding still for calibration, performing one sign and holding still again; wait for
ready status before the next sign. Model switching is disabled while recording,
processing or Auto on. Select **KVSL · topic models** to use the old topic models.
W00395 belongs to the old KVSL vocabulary; use a listed ViSign word for the new model.

The new provider reuses the trained encoder, signed ridge scores and isolated pinned
MediaPipe environment. It does not retrain, alter source labels or replace the old
checkpoints. No-hand clips are rejected; visible-hand idle and unknown signs can still
receive a vocabulary word. Predictions remain experimental, not semantic approval.

Actual derived-reference worker probe: Chào,30frames from a validation source reencoded
to VP8 WebM. Both repetitions returned Chào with identical scores. First total12.93s
(cold startup11.14s); warm total1.47s(preprocessing1.45s). These are one clip's observed
processing times under concurrent tests, excluding recording/browser/display; NOT
new-person accuracy or physical latency. The under1s product target remains unmet.
Synthetic no-hand clip rejected; switching back to KVSL, cancellation, worker recovery,
temporary capture cleanup and shutdown were verified. Evidence:
`.design-cache/visign-app-20261012/worker-probe.json` and `probe-source.json`.

## Source-label research baseline — historical offline-only authorization

User approved training experiments with source labels before exhaustive manual review.
The experiment is now completed; semantic flags remain pending and the production
model is unchanged. `vsl_baseline.py` implements a reproducible ridge classifier on
body-relative XY landmarks and presence masks, using the existing isolated environment.

Kept all 593 screened clips and 25 labels, excluded all 231 quarantined clips.
Moved six whole train groups to validation: two Chúng ta, two Uống, one Giúp and one
Xin lỗi. This supplies at least two validation groups per class. Prior test membership
is unchanged; the new experiment split is **360 train /116 validation /117 test**.
All changes were fixed and recorded before fitting. Related known groups stay together;
unidentified signer/recording overlap may still inflate performance.

| Partition / reference | Source-label accuracy | Macro-F1 | Samples |
| --- | ---: | ---: | ---: |
| Train | 100.00% | 1.0000 | 360 |
| Validation | 76.72% | 0.7322 | 116 |
| Test | **81.20% (95/117)** | **0.6954** | 117 |
| Always predict largest training class, on test | 5.13% | — | 117 |

Four alpha values were compared using validation only; alpha10 selected. Test balanced
accuracy is70.93%. Train100% versus lower held-out performance signals limited
generalization; aggregate81.20% must not hide weak classes. Test recall is0 for Chúng ta
(2 samples), Có thể(1), Xe đạp(2) and Xin lỗi(1). Sample sizes are too small for strong
per-class claims. No source relabeling, class dropping based on test, or further test-
guided parameter adjustment was performed. Future revisions need fresh evaluation.

Model artifact: `.design-cache/visign-baseline-20261012/run1/model.npz` (502,667 bytes),
numeric arrays plus Unicode label map, no pickle. `report.json` contains complete
metrics/confusion matrices, candidate scores, hash and versions. `split.json` records
membership and all moves; `predictions.json` traces every prediction to its source.
The model correctly round-trips and independent reload reproduces all593 predictions.
Train-only normalization, retained test membership and known-group separation verified.
The single-vector classifier microbenchmark reports median0.0318ms/p950.0341ms on this
host; it excludes extraction, encoding, gesture boundaries and rendering and therefore
does **not** demonstrate the user's subsecond realtime goal.

Manual work can now start with **51 validation clips**, rather than824:27 model/source
disagreements plus24 deterministically sampled matching predictions(one per class
where available). See `.design-cache/visign-baseline-20261012/review-shortlist.html`
and `.csv`; full validation priority is in `run1/review-priority.json`. Errors may be
model failures or source problems; no automatic semantic conclusion is made. No VSL
reviewer is currently available. Browser playback of this local report is untested.

Executed:

```powershell
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 -m app.desktop_collector.vsl_baseline --pilot .design-cache/vsl-immediate-20261012/local-pilot.json --features .design-cache/visign-features-20261012/run2/feature-report.json --groups .design-cache/visign-features-20261012/group-review.json --rgb .design-cache/visign-features-20261012/rgb-quality.json --curation .design-cache/visign-curation-20261012/curation.json --output-dir .design-cache/visign-baseline-20261012/run1 --allow-unreviewed-source-labels
```

**147 affected tests passed in18.21s**, plus actual training and saved-model verification.
No new production dependencies; runtime remains NumPy1.26.4/threadpoolctl3.7.0 in the
existing isolated environment. Original KVSL model manifest unchanged. Research training
permission supersedes the old manual-review prerequisite below; quality/independent
camera/unknown-idle evaluation still gates production integration.

## Conservative curation — earlier 2026-10-12 continuation

The user confirmed **no VSL-competent reviewer is currently available**. Automatic
checks continue; semantic acceptance remains pending. Added `vsl_curation` to apply
the previously measured flags to complete recording groups while preserving prior
assignments for remaining clips. It revalidates source bytes/features/groups and
pins the RGB diagnostic; it never trims video or silently accepts source labels.

Actual outcome: **231 clips quarantined, 593 screened but not approved**, distributed
as **366 train / 110 validation / 117 test** in the unfrozen proposal. All 25 source
labels remain indexed. Only 23 labels still have entries in every proposed partition:
`Chúng ta` retains 6 train / 0 validation / 2 test; `Uống` 9 / 0 / 3. No reassignment
was made to hide these gaps. Even some other classes have only one validation/test
clip; nonempty partitions do not establish sufficient or independent evaluation.

New artifacts: `.design-cache/visign-curation-20261012/curation.json` and
`review/index.html`. The local review pack has 25 word pages with all 824 original
videos, source labels, technical status, hand coverage and flagged frame indices.
`review/annotations.csv` has one row per clip and pending semantic/boundary/tracking
fields; it contains no invented reviewer decisions. It is ready for a future reviewer
and does not upload media. Remaining color casts, blur, transformed duplicates, sign
boundaries and true meanings still need review; 593 is not a certified clean count.

Executed command:

```powershell
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 -m app.desktop_collector.vsl_curation --pilot .design-cache/vsl-immediate-20261012/local-pilot.json --features .design-cache/visign-features-20261012/run2/feature-report.json --groups .design-cache/visign-features-20261012/group-review.json --rgb .design-cache/visign-features-20261012/rgb-quality.json --output .design-cache/visign-curation-20261012/curation.json
```

Verification: **134 affected pytest tests pass in 34.45s**; CLI help and actual full
curation pass. All 824 source video hashes rechecked when building the pack, 26 HTML
pages and their local links checked, 824 CSV rows/counts/pending states verified,
pack hashes and original KVSL pin verified. Browser playback was not tested. No app,
model, dependency or launcher change. Source/semantic quality and independent evaluation
remain the explicit training gate; no classifier has been trained on this proposal.

## Full feature qualification — earlier 2026-10-12 continuation

Implemented reusable offline CLIs `app.desktop_collector.vsl_features` and
`app.desktop_collector.vsl_feature_review`. Full extraction now covers **824 clips /
24,653 frames**, with finite coordinates, explicit missing-point masks, source and
feature hashes, and complete frame-count checks. The output uses a new documented
75-landmark contract; it is not declared compatible with existing KVSL models.

Observed detection availability:

- Pose: 22,229 frames; left hand: 15,561; right hand: 17,989.
- At least one hand: **19,236 / 24,653 frames (78.0%)**.
- **8 clips have no detected hand**; **143 clips have coverage below 50%** (including
  those eight); **327 clips have coverage below 80%**.
- These are detection-presence counts, not correct-hand tracking, sign recognition
  accuracy, semantic approval or realtime latency. No missing coordinates are filled.

Conservative image comparison finds three close pairs within `Cứu`, `Trường học` and
`Thức ăn`, producing **821 connected groups**. No additional filename-family edge or
cross-label group is found in this subset under the stated rules. This does not prove
absence of transformed duplicates. Four actual frames per clip were visually inspected
for the eight no-hand clips and six paired clips. Several no-hand clips contain flat
color/black frames or strong blue cast. Thus successful decoding and some hand presence
are insufficient quality checks; source visual review remains necessary.

A subsequent full RGB scan found **2,422 nearly uniform frames in 188 clips**, across
all 25 labels. The reproducible diagnostic marks a frame when spatial standard
deviation in every BGR channel is at most 1.0 on the 0–255 scale. This is a review
flag, not proof of the cause or permission to trim sign boundaries. Eighty-eight of
these clips nevertheless have hand coverage of at least 50%. The union of flat-frame
clips and clips below half hand coverage is **231 clips**, prioritized in the review
CSV; the remaining 593 are not automatically accepted. The scan does not detect all
blur, color cast, temporal edits or mislabeled signs. No original frames were removed.

The preliminary group proposal assigns 510 clips to train, 153 to validation, 153 to
test and quarantines eight no-hand clips. **This proposal is not frozen or approved for
training, and does not yet filter flat-color frames or low-coverage clips.** Supplied
signer/session IDs remain absent; these partitions cannot measure unseen-signer
generalization. Keep them as diagnostic artifacts pending source review, recording
group refinement and an independent evaluation plan. All 25 words remain proposed.

Artifacts under `.design-cache/visign-features-20261012/`:

| Artifact | Purpose |
| --- | --- |
| `run2/features/<video-sha256>.npz` | 824 numeric feature files; source video unchanged |
| `run2/feature-report.json` | Complete extraction receipt, feature hashes and per-clip coverage |
| `group-review.json` | Conservative connected groups and unfrozen development split proposal |
| `quality-summary.json` | Aggregate/per-class counts and source/pinned-manifest verification |
| `manual-review.csv` | Every clip, local video path, coverage, group, pending review fields |
| `review-frames.jpg` / `.json` | Actual source frame sheet and row/frame provenance |
| `rgb-quality.json` | Full source-frame diagnostic with flagged frame indices and mean colors |

Reproduce using the existing isolated environment (choose a fresh extraction directory):

```powershell
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 -m app.desktop_collector.vsl_features --pilot .design-cache/vsl-immediate-20261012/local-pilot.json --output-dir .design-cache/visign-features-20261012/run2 --workers 2
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 -m app.desktop_collector.vsl_feature_review --pilot .design-cache/vsl-immediate-20261012/local-pilot.json --features .design-cache/visign-features-20261012/run2/feature-report.json --output .design-cache/visign-features-20261012/group-review.json
```

Both CLIs completed; all 824 feature hashes/contracts and source candidate hashes
were verified, and the original KVSL manifest hash remains unchanged. **113 affected
pytest tests passed in 26.14s**; both CLI help paths run in the collector environment
without importing MediaPipe. The initial process-pool run failed with
`BrokenProcessPool`; retained `run1` has no complete report. The successful `run2` uses
two threads with independent per-clip Holistic instances. Its complete report and
subsequent verification establish completion after the interactive tool session ended.
No new production dependency, model training, UI, launcher or bridge change.
Local inspection scripts `audit_rgb.py`, `inspect_frames.py` and `summarize.py`
completed successfully. RGB screening is a separate diagnostic, not included in the
CLI split proposal; inspect `manual-review.csv` before any future split freeze.

## Source and local files

Source: [star092304/ViSignLanguage-Video](https://huggingface.co/datasets/star092304/ViSignLanguage-Video),
pinned Hugging Face commit `906306d7cc9c684b034bc8e96494ce9a99bc1bfc`.
API reported `private=false`, `gated=false`; the archive download required no account.
The card attributes the data to PTIT AI Challenge and declares CC-BY-4.0. These are
publisher claims; an upstream participant/license provenance chain is not established.
The `namwu` mirror references the same archive hash, not an independent dataset.

All downloaded/derived data remains under ignored `.design-cache/vsl-immediate-20261012/`:

| File | Purpose |
| --- | --- |
| `visign-dataset.zip` | Original, unchanged 863,939,416-byte archive |
| `download-receipt.json` | Pinned URL, size and verified SHA-256 |
| `videos/<sha256>.mp4` | Extracted unique video bytes; no video modification |
| `labelled-videos.csv` | 3,875 source training entries, readable Vietnamese labels, local paths and hashes |
| `local-pilot.json` | Complete labeled inventory and deduplicated 25-word candidate index |
| `archive-audit.json` | Per-entry full decode, file/pixel hashes, directory duplication and CSV comparison |
| `landmark-probe.json` | Technical MediaPipe spot check; not recognition accuracy |
| `sample-contact-sheet.jpg` / `.json` | Actual midpoint frames and their source paths for local visual inspection |

Archive SHA-256:
`cdfec1080e8b75cf10a972a4d7cf54fcfa4bf1b874002d28eae8405188a2a308`.
Download completed in 147.2 seconds on this execution, not a future speed guarantee.

## What is actually available

- **8,364 MP4 entries**, of which 6,137 have distinct file bytes and decoded pixels.
- **3,875 labeled training entries / 100 word classes**, representing **2,776 distinct
  video/pixel sequences**. All are 224×224. Frame counts across the archive are16–30,
  mostly30; training FPS ranges0.85–30.018. This release is temporally/spatially processed.
- **1,630 `public_test` and 2,859 `private_test` entries have no supplied word labels**.
  Both folders are physically present in the public archive. Their folder names are
  not class labels, and no label is inferred from similarity or another source.
- All8,364 entries fully decode to their reported frame count; ZIP extraction verifies
  CRC and archive SHA-256. This does not prove linguistic or image quality.
- **156 exact pixel groups overlap training and the unlabeled folders.** Do not treat
  these supplied folders as an independent evaluation benchmark.
- Two pixel groups have conflicting training labels (`Chào` versus `Chậm lại`), covering
  five paths. Both groups are excluded from the proposed subset.

There is no signer/session ID roster. Multiple recording appearances are visible in
sample frames, but no individual identities are inferred and no signer-disjoint claim
is made. Filename suffixes and exact duplicates must not become independent examples.

## Labels and 25-word working subset

The external CSV has corrupted Vietnamese strings for some classes: only3,047 rows
join archive folder labels by NFC-normalized label plus filename. Matched frame counts
agree. The archive folders contain readable Vietnamese labels and agree across all100
classes with `label_mapping.pkl`. That file was **not unpickled or executed**: only its
small, whitelisted primitive string/integer dictionary opcode grammar was inspected.
The local index takes folder labels, cross-checks the mapping, and applies Unicode NFC
only. The downloaded CSV and original archive remain unchanged.

The proposed subset contains **824 distinct decoded video sequences across25 labels**:

| Word | Distinct video sequences | Word | Distinct video sequences |
| --- | ---: | --- | ---: |
| Ăn | 40 | Uống | 19 |
| Cảm ơn | 46 | Xin lỗi | 14 |
| Chào | 22 | Tôi | 36 |
| Chúng ta | 12 | Đi | 45 |
| Nghe | 47 | Nhìn | 37 |
| Nói | 21 | Giúp | 30 |
| Cứu | 37 | Mua | 26 |
| Nhà | 50 | Trường học | 49 |
| Nghỉ ngơi | 49 | Thức dậy | 50 |
| Đồng ý | 36 | Có thể | 15 |
| Đâu | 39 | Nhớ | 40 |
| Thăm | 13 | Thức ăn | 38 |
| Xe đạp | 13 | | |

This replaces neither the earlier VSL-GH candidate vocabulary nor the application's
current model vocabulary. It is a separate proposed research subset for the available
RGB source. Exact duplicate aliases, source labels/IDs and paths remain traceable.
No train/validation/test assignment is invented. Forty-eight candidates also occur in
unlabeled folders; that fact is recorded, not used to label those folders.

## Technical readiness and limitations

Used the existing isolated MediaPipe0.10.14 environment on one clip per proposed label
(25 clips,750 frames), with Holistic model_complexity1 and detection/tracking confidence
0.5. Pose was present on636 frames; at least one hand on593. Every tested clip had some
hand detections, but per-clip hand coverage ranged from7/30 to30/30. This supports
starting feature experiments, while exposing substantial missing-landmark risk in some
224×224 clips. These counts are not accuracy, hand-tracking correctness, or latency
measurements for physical camera use. No classifier was trained and no features were
declared compatible with the existing KVSL model.

Next work can proceed from local RGB without waiting for VSL400: review the25 selected
signs and sample boundaries, evaluate extraction quality across the subset, group exact
and near-duplicate recording families, and establish honest development/evaluation
partitions. A signer-independent claim still requires verified signer grouping or a
separate independently collected evaluation set. Add idle/unknown inputs before claiming
realtime recognition stability. The current subset has `training_ready=false` until
the documented quality gate is satisfied; no claim of reliable real-user accuracy.

## Reproduction and checks actually run

From the repository root:

```powershell
.\.venv\Scripts\python.exe -X utf8 .design-cache/vsl-immediate-20261012/download_visign.py
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 .design-cache/vsl-immediate-20261012/audit_archive.py
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 .design-cache/vsl-immediate-20261012/prepare_local_pilot.py
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 .design-cache/vsl-immediate-20261012/probe_landmarks.py
```

All four completed successfully. Decode work processes unique bytes once and records
the result for every alias. A local16-frame contact sheet was visually inspected;
it is evidence of video appearance only, not qualified sign-language annotation review.
Scripts are local inspection artifacts, not a production importer or foreign code.
No production dependency/code/UI/model/launcher changes; application tests were not
rerun for this dataset/documentation task.

The prior attempt was not executed because automatic approval review hit a usage
limit. After the user resumed, an explicitly escalated retry was approved and succeeded.
The alternative `vsltranslation/visl_98` API returned HTTP401; no access bypass or
download from that source occurred. No dataset-owner messages or access requests sent.
