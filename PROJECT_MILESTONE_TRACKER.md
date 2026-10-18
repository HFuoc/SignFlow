## 2026-10-19 - Webcam endpoint control and diagnostic results integrated

Current user priority: obtain usable webcam recognition after repeated incomplete
and uncertain/outside-vocabulary responses. Shipped Recognize now in Auto and
separate unconfirmed candidate scores. Auto can rearm when hands are lowered after
a final/timed-out segment. These software changes passed regression and one real
worker/browser fixture test; they do NOT close the physical-camera accuracy gate.
No new training, threshold relaxation, model-default or launcher cutover. Next gate:
known25 signs on actual webcams across users, separating segmentation failures,
missing landmarks, wrong native winners and correct-but-rejected classifications.
60fresh FPS, source-semantic verification and unknown/idle validation remain open.

## 2026-10-19 - Tracking optimization prototype integrated; physical gate open

Implemented the user-authorized tracking work: CPU inference threading,
experimental current-frame hand recovery in TCN Auto, fresh-camera scheduling,
stage diagnostics and selectable camera quality. User clarifies the target pose
as edge-on hand presentation. Software regression/benchmark evidence is recorded
in WORK_SESSION_HANDOFF.md; it does not pass the physical-camera accuracy gate.

60fresh tracking outputs/second has NOT been achieved. Next gate: sustained tests
on the user's camera, especially edge-on hands, with FPS/latency and hand coverage
measured together. Original reference semantics, multi-user/unknown acceptance,
default-model and launcher cutover gates remain unchanged. No new model trained.

## 2026-10-19 - Next-session priority:60fps tracking and horizontal-hand detection

Requested by user: improve tracking that lags fast hand movements and misses hands
held horizontally, targeting60fresh tracking updates/second. Status: investigation
prepared; no performance implementation or physical-camera reproduction this turn.
Existing stream cap is already60. No accuracy/performance gate has passed.

Proposed execution order for the next session:
1. Measure sustained per-stage latency, actual camera cadence, tracker cadence,
   frame age, dropped frames and CPU/GPU use on the user's setup.
2. Reduce avoidable full-frame transfer/copy work and evaluate bounded latest-frame
   scheduling without stale-result mixing or unbounded queues.
3. Evaluate a faster hand-focused tracker/ROI strategy and available acceleration;
   verify actual delegate/device support before claiming GPU execution. Preserve
   pose/hand feature schema or explicitly validate and version any change.
4. Compare fresh tracking throughput AND detection continuity for hands rotated
   in-plane, edge-on, arms extended horizontally, fast motion and brief occlusion.
   Also check sign predictions/Auto boundaries against the unchanged baseline.

60fps is the user target; measurement duration/tolerances are proposed evaluation
details, not an already-approved numeric product gate. Report a measured ceiling
and blockers if hardware/runtime cannot sustain it. No default-model cutover implied.

## 2026-10-18 - Experimental Auto and reference visualization delivered

Latest user request expands approved TCN testing to Auto and reference movement.
Delivered final-only Auto with existing gap/duration safeguards and25 labeled
landmark replays selected from train data. Capture remains available. This closes
the software-integration task, not the webcam-accuracy or source-semantic gates.
Next: original human video/competent signer verification, independent multi-user
webcam and unknown/idle evaluation. Default-model cutover remains unapproved.

## 2026-10-18 - Experimental TCN webcam integration

User authorized integrating TCN25+OTHER epoch44 for testing. Capture integration
is the active approved scope. Provider is optional/selectable, with its new25
labels and frozen S05 rejection threshold. No model-default/launcher cutover.
Next gate remains independent multi-user physical-webcam testing including
unknown and idle actions; TCN Auto and production accuracy remain unapproved.
Verification and delivered status are recorded in WORK_SESSION_HANDOFF.md.

## 2026-10-18 - Multi-user25 training and outside-vocabulary experiment completed

Latest user decision permits replacing the original25 with dataset-supported25.
Downloaded1,342 VSL-GH NPY recordings (255,297,560bytes), verifying every Git blob.
After source quarantine/dedup/length checks:1,736train /174validation /176test
segments,25glosses; S01–S04/S05/S06 respectively. Every label retains all6signers
and at least3validation/test samples. Source identities/semantics/RGB alignment
are not independently certified. This is an isolated source-label experiment.

Closed-set validation chooses TCNepoch43: test159/176 (90.34%), macroF1 0.88949.
Ridge baseline scores163/176 (92.61%), macroF1 0.90519 on the same test; do not
claim the TCN outperforms it or replace the validation decision using test scores.
This dataset/vocabulary differs from existing app evaluations; no app improvement
or optimal architecture is established by these source-label numbers.

Exploratory follow-up adds2,055train negatives from outside25; data covers193other
source glosses across all splits.26th training class is __OTHER__, not a26word MVP.
Validation selects TCNepoch44. Thresholds are chosen only onS05 with an experimental
<=5%unknown false-accept budget (not a product gate). On the SAME S06 diagnostic:
closed25:39correct/0wrong/137rejected among176known,11/196unknown falsely accepted;
withOTHER:94correct/1wrong/81rejected among176known,11/196unknown falsely accepted.
Known correct acceptance increases22.16% ->53.41%, but rejection remains46.02%.
The follow-up was designed after inspecting the first test, so it is exploratory,
not fresh independent confirmation. Unknowns share healthcare sentence contexts;
idle, arbitrary motion, automatic boundaries and physical webcam remain untested.

127affected Python tests PASS (16.13s); shell --smoke-test PASS. Separate CPU
processes reload all saved normalization/labels/weights and reproduce both models'
predictions for all2,086initial and4,541follow-up samples. Both prepared datasets
also pass strengthened provenance/split/array checks after review. No training
rerun after test inspection beyond the explicitly labeled follow-up experiment.
No runtime/default/launcher/frontend/dependency changes; no webcam was activated.

Full25labels, metrics, commands, evidence and next workflow:
docs/VSL_MULTIUSER_DATASET_REVIEW.md (latest section).
Evidence root: .design-cache/multiuser-data-20261018/gh25/.
Next gate remains independent multi-user physical-camera, unknown/idle and Auto
evaluation before a model cutover. Further vocabulary approval is not required.
No numerical accuracy target or production acceptance gate has been closed.

## 2026-10-18 - User permits replacing the MVP vocabulary; multi-user experiment active

User explicitly answered: "Có thể chọn lại 25 từ từ dataset tốt". This supersedes
the pending vocabulary question and the requirement to keep the original25.
Select25 source-supported glosses for offline research; keep expansion possible.
Production accuracy acceptance, numerical thresholds and model cutover remain open.

Current experiment: VSL-GH public MIT landmark data,25 source glosses with at least
three source validation/test recordings each. Preserve S01–S04 train, S05 validation,
S06 test; exclude conflicting metadata/duplicate feature annotations before fitting.
Freeze label selection, sampling and evaluation protocol before predictions.
Source-label research is authorized without completed manual semantics review;
this does not establish label correctness, frame alignment or webcam accuracy.

Evidence/protocol: `.design-cache/multiuser-data-20261018/gh25/`.
Dataset: https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation
This decision does not require a second vocabulary approval. Physical multi-user
webcam, unknown/idle and Auto evaluation remain the next model cutover gate.

## 2026-10-18 - Multi-user dataset research and training scope approved

User explicitly requires recognition for multiple users, an extensible 25-sign MVP,
and immediately accessible public datasets; additional offline research training
is authorized. This supersedes the earlier personal-only interpretation and the
statement that multi-user investigation/training is unapproved. No vocabulary
replacement, numerical acceptance threshold or production model cutover has been
approved. Current 25 labels remain until an explicit vocabulary decision.

Active scope is data qualification and offline training experiments for multiple
users. Completed this session: source research, qualification CLI, disjoint-signer
metadata proposal and cross-source classifier diagnostic. Model training and
MVP accuracy acceptance are NOT complete.13/25 labels have matched signer metadata
in the new mirror; full vocabulary coverage/source eligibility remain open.

Next: resolve the current-25 coverage gap (vocabulary preference was asked but
no answer yet) and source eligibility, then acquire/validate the selected data,
freeze signer/recording partitions before augmentation and train a comparable
baseline. Independent multi-user webcam, idle/unknown, temporal boundaries and
latency still gate model cutover. No claim of improved or optimal recognition.
Physical hardware, Qt, launcher and visual gates remain unchanged.

Detailed source links, counts, limitations, workflow and commands:
[VSL_MULTIUSER_DATASET_REVIEW.md](docs/VSL_MULTIUSER_DATASET_REVIEW.md).
Evidence: .design-cache/multiuser-data-20261018/.

## 2026-10-16 - Camera failure repair active; 25-sign MVP acceptance remains open

User reports VideoMAE GPU produces no results with Auto on or off and explicitly
sets the first MVP scope to the existing 25 signs with high accuracy. Continue
runtime repair and evaluation within the approved experimental integration.
The earlier "delivered experimentally" status must not be read as a working,
accepted personal-camera MVP. Physical 25-sign correctness, automatic boundaries,
unknown/idle handling and measured latency remain open. Numerical acceptance
criteria are still TBD; no additional vocabulary or production cutover approved.

Repair verification:311 backend tests,73 frontend tests, five browser cases,
build and shell/launcher smoke pass. Extended real Auto replay has a passing
completed-word case and an earlier no-final timeout; do not close its reliability
gate. The25-reference Capture run accepts24 matching words and withholds one.

## 2026-10-15 - Pretrained GPU integration approved and delivered experimentally

User approved adding the previously audited VideoMAE candidate to the app.
Delivered an explicitly selected experimental RGB/CUDA provider for Capture and
Auto, preserving default V25 and the ten KVSL choices. No local training or
production model cutover is implied. Approved scope is integration and evaluation.

Verification: 297 affected Python tests, 73 frontend tests, four distinct browser
cases, production build, shell and launcher smoke pass. Actual CUDA Capture
replay returns Thức dậy; warm total 1.42s. Auto source replay emits the correct
tentative word but rejects the final extended-hold segment; do not mark automatic
boundary recognition or subsecond end-to-end latency accepted.

Next gate: user comparison on their physical camera, starting with Capture to
separate complete-clip classification from Auto boundaries, then Auto. Semantic
review, independent signer/unknown/idle evaluation and physical accuracy/latency
remain open. Fine-tuning is a possible later step, not a completed task.
All unrelated sensor/Pi/Qt/history/visual-cutover gates remain unchanged.

## 2026-10-12 - Experimental model selector and camera integration authorized

User explicitly requests a model panel and approves adding the 25-sign baseline for
their app test. Experimental integration may proceed; production acceptance is not
inferred. The model is pinned separately and selectable alongside the ten KVSL models.
ViSign camera use has no topic-selection prerequisite. Source semantic review,
independent signer/unknown evaluation, reliable continuous recognition and measured
subsecond physical latency remain open. No later sensor/Pi/history/Qt work is approved.

Delivered the experimental provider and selector;164affected Python tests,56frontend
unit tests, production build, shell/launcher smoke and14distinct browser cases pass.
Derived-reference warm processing1.47s/cold12.93s is not physical webcam evidence.
Manual user app test is now the next gate; no production acceptance or completed
subsecond/realtime claim. Full receipts: docs/WORK_SESSION_HANDOFF.md.

## 2026-10-12 - Source-label research training authorized

User explicitly approved proceeding with experimental training on source labels without
full manual VSL review. This supersedes the earlier semantic-review prerequisite for
offline research only. Preserve quarantine, group separation, source receipts and
explicit unverified semantics. Repair validation coverage before any model fitting;
preserve the previous test groups and record each reassignment. Train/evaluate a local
baseline and prioritize review from validation errors. Production model/UI cutover
still requires quality, unknown/idle and independent real-camera evaluation. No semantic
approval, signer independence or subsecond product claim is inferred.

Completed baseline: 593 screened clips, all25 labels, repaired split360train/116val/
117test with six recorded train-to-val group moves and original test membership kept.
Validation selects ridge alpha10; test95/117 source-label matches(81.20%), macro-F1
0.6954. Model saved separately,147affected tests pass,593saved-model predictions
reproduced. Review shortlist51validation clips. No production cutover: low-support
classes, unknown/idle, semantic uncertainty and independent camera evaluation remain.

## 2026-10-12 - Conservative curation completed; semantic acceptance still open

Completed group-level technical screening and local review pack: 231 quarantined clips,
593 screened pending semantics, preserved proposed assignments 366/110/117. Only 23
of 25 labels retain nonempty train/validation/test; Chúng ta and Uống lack validation.
134 affected tests pass. User confirms no VSL reviewer available. Data/semantic and
independent evaluation gates stay open; no training, vocabulary freeze or topic-free
cutover. Next work needs valid semantic review and adequate evaluation coverage, not
another extraction of the same source. Evidence: docs/VISIGN_IMMEDIATE_DATASET.md.

## 2026-10-12 - Full pilot extraction completed; source quality still blocks training

Completed offline extraction for all 824 proposed ViSign clips (24,653 frames),
verified feature/source hashes and missing-point contracts, and generated conservative
recording groups with an unfrozen split proposal. Eight clips have no detected hands;
143 are below half hand coverage. Full RGB scan flags 2,422 nearly uniform frames in
188 clips; 231 clips have flat frames or low hand coverage. Source inspection also
reveals strong color casts; decode success alone is not source acceptance.
113 affected tests pass. Technical extraction subtask is complete, not quality-gate
approval: semantic review, visual curation, independent evaluation and idle/unknown
data remain unresolved. No training or production topic-free cutover. Evidence and
exact next steps: docs/VISIGN_IMMEDIATE_DATASET.md and docs/WORK_SESSION_HANDOFF.md.

## 2026-10-12 - Public RGB acquisition completed; model-quality gate remains open

Immediate-access data subtask completed: pinned ViSignLanguage-Video archive downloaded,
hash verified, all8,364 video entries decoded. Labeled source100 classes /3,875 entries;
2,776 unique sequences; proposed25-word pilot824 distinct nonconflicting videos.
Actual video is available locally without the VSL400 access wait. Quality gate still
requires semantic review, extraction qualification and independent evaluation grouping.
No signer IDs supplied;156 exact groups overlap train and unlabeled folders. No training,
topic-free cutover or physical-camera performance claim. See docs/VISIGN_IMMEDIATE_DATASET.md.

## 2026-10-12 - Candidate index delivered; training-data gate remains open

Data preparation subtask: offline VSL-GH segment review index generated for 25 proposed
glosses, with 3279 segments from 2037 canonical feature records. Ten conflicting
feature groups excluded; 30 compatible duplicate groups collapsed with explicit aliases.
No training or production integration started. Source RGB/semantic review, boundary
convention, adequate independent evaluation and idle/unknown data remain required.
VSL400 applicant fields are identified, but its agreement is unsigned and unsent.
Phase 5B physical gate and all unrelated scope gates remain unchanged.
Latest checks and artifacts are recorded in docs/WORK_SESSION_HANDOFF.md.

## 2026-10-11 - Data audit implementation verified; source acceptance pending

Completed within approved realtime/data scope: dependency-free offline audit CLI,
quarantine/coverage/duplicate reports, 25-word candidate matrix, bounded actual-media
probes, and local access-request draft. User selected quality-first source selection.
Verification: 60 affected tests pass (15.61s); both real-data CLI audits execute;
identical output rerun is unchanged; shell smoke passes after sandbox DB retry.

Gate is NOT closed: no source yet qualifies as the full product training/evaluation
set. Multi-VSL observed demo has zero center classes in all splits; VSL-GH still needs
original-video/semantic review and richer independent evaluation. VSL400 is controlled
access. Required next gate: source media/labels/rights, qualified VSL annotation review,
frozen independent groups and final 20-30-word vocabulary. No training or app cutover.
Phase 5B physical gate stays open. See [data report](docs/VSL_DATA_QUALIFICATION.md).

## 2026-10-11 - Authorized realtime work: feasibility measured, data gate open

The user authorized implementation and supplementary dataset investigation. Initial
streaming prototype and project data inventory are executed; production topic-free
recognition is not delivered. No separate multi-signer labeled dataset was found in
the accessible project or 66 project archives plus two nested archives. Multi-VSL
center-view metadata has disjoint signer splits; full video access/text label mapping
remain unverified. VSL-GH metadata has empty/conflicting labels and needs qualification.
Next gate: usable labeled data and initial vocabulary, then unified-model evaluation
and physical end-to-display verification. Phase 5B physical/report gate stays open.
No Phase 5C/history, sensor, Pi, release or launcher cutover is included.
Evidence and exact limitations: [feasibility report](docs/REALTIME_RECOGNITION_FEASIBILITY.md).

## 2026-10-11 - Revised product requirement: realtime, improved recognition, no topic prerequisite

User requests stable realtime camera recognition, better word recognition and removal
of mandatory topic selection from the normal camera workflow. This is the confirmed
product goal, not evidence of achieved performance or approval of a specific ML design.
User previously clarified that recording completes but the predicted word is wrong.

Current ten independent topic classifiers cannot satisfy this by hiding the selector.
Their uncalibrated topic-local softmax scores are not a validated cross-topic decision.
Proposed direction: one local streaming landmark extraction path, bounded timestamped
feature history and automatic isolated-sign boundaries; validate feature compatibility
before reusing pinned GCNs. Avoid duplicate frontend/backend landmark extraction.
A unified vocabulary classifier with validated unknown/idle rejection is proposed for
topic-free inference; label reconciliation and suitable training/evaluation data are
required. Existing 175 topic-local classes are not assumed to be 175 unique signs.
No model replacement, retraining, new MediaPipe runtime, transport or contract change
has been implemented or implicitly approved by this requirements discussion.

User confirmed initial scope: 20-30 commonly used signs, then expand; no mandatory
topic selection in normal camera use. Confirmed latency target: less than 1000ms
from the actual end of a gesture to the displayed result. This includes end detection,
remaining feature processing, classification and UI delivery, not just GCN execution.
These are requirements, not achieved measurements. Exact sign list remains TBD.
Proposed next work: local streaming-landmark feasibility measurements, then a reviewed
vocabulary/data plan and unified-classifier design. Measure p50/p95 and worst observed
latency separately, including cold readiness and sustained use; do not hide missed
signs or rejected inputs by timing successful predictions alone.
Acceptance must measure end-to-result latency including tail latency, false triggers,
missed segments, wrong words and rejection, with independent recording/signer splits.
Current Phase 5B remains an experimental integration checkpoint with final physical
validation/report pending; passing integration tests does not meet the new goal.
Do not start Phase 5C history/sentence work automatically.

## 2026-10-11 - Phase 5B implementation; physical review and final handoff pending

Current attached Phase 5B request authorizes automatic isolated-sign segmentation.
Browser-local frame differencing and a pure ActivitySegmenter now drive the existing
CameraSession / authenticated live-jobs / persistent worker path. Manual capture stays.
No backend, model, vocabulary, manifest, preprocessing, dependency or launcher change.

Current configuration: central 80% ROI, 160x90, 10 Hz, mean luminance compensation,
active-pixel ratio above 12 gray levels, EMA alpha .5; 1500ms calibration with bounded
90th-percentile noise thresholds (start .018-.06, end .008-.03), start hold 200ms,
end hold 600ms, min recording 2000ms, max 5500ms, cooldown at least 1000ms plus quiet.
No encoded pre-roll; possible onset loss remains a limitation. States: off, calibrating,
armed, candidate, recording, ending, recognizing, cooldown, error. One inference at a
time; result retained through re-arm. Analysis stops on disable/navigation/hidden page.
Completed clips only go to the existing local backend. No audio or training storage.

Fresh checks: 56 frontend unit tests (17 segmenter, 12 camera); TypeScript/Vite build;
182 backend tests (47.85s, two existing deprecations); 11 browser tests (2.8m), including
3 automatic reference-camera clips through real ML, cancel/recovery, manual and real
dataset regression. Six responsive/theme Axe scans and overflow checks pass.
Real API lifecycle probe passes success/failure/cancel/timeout/recovery/shutdown cleanup;
shutdown 203ms, actual workers/launchers exit and port releases. Shell smoke exit 0.
These counts are actual executions; sandbox temp denial and test-runner teardown
required elevated reruns. One browser selector ambiguity was fixed before final pass.

Fake browser source is local W00395 drawn onto a 640x360 canvas, NOT physical webcam.
Three clips produced cay nen / bat / cap toc (see Unicode values in evidence), unlike
dataset annotation ca. This demonstrates pipeline integration, not recognition accuracy.
Preprocessing 3126-3603ms; model 4.77-5.19ms; warm total 3158-3640ms, cold 7315ms.
Recorder duration 3003-3202ms; candidate-to-start about 195-298ms; re-arm 1009-1073ms.
No real-time claim, no independent accuracy benchmark, no global 175-class classifier.

User now reports physical camera is available, imitation of W00395 is not detected
correctly and response feels slow. This is user-reported qualitative evidence only:
number of physical runs, exact boundaries, predictions and timings are not measured.
Native observer currently contains no camera/job events; it cannot substantiate a
physical end-to-end PASS. User asks whether MediaPipe should be considered. Frontend
MediaPipe remains proposed, not approved/implemented; existing Python MediaPipe already
performs recognition preprocessing. User clarified: recording completes, but the
predicted word is wrong; no specific boundary failure is reported. Prioritize manual
versus automatic capture comparison and landmark/model input diagnostics before
adding a second browser detector. This clarification does not authorize retraining.

Remaining: resolve physical observations, finish final scope/hash review and report.
Do not mark Phase 5B complete yet. Phase 5A physical gate is not silently closed.
No Phase 5C, sensor, Pi, training, release or cutover scope is authorized.
Evidence: .design-cache/kvsl-phase5b/. Root has no .git; baseline/direct diff required.

## 2026-10-11 - Phase 5A live isolated camera: PASS WITH MANUAL CAMERA GATE

Final verification addendum: after the combined browser run (8 passed / 1 opt-in
skip), the real Studio W00395 + cau_hoi test was explicitly enabled and passed
(1 test, 24.9s including harness). Its old per-request exit=0 assertion now correctly
expects null for a live persistent worker. Dataset test evidence now writes to the
Phase 5A folder. Final backend suite: 182 passed, 47.04s; final capture-only check:
14 passed after symlink guard. Source review: 19 existing durable files changed,
six added, no deletions, 255 baseline files unchanged, no added whitespace errors;
all ten model/map hashes and manifest hash match. Build output is reviewed separately.
No physical webcam clips retained; synthetic test-pattern fixture media removed at
handoff and can be regenerated by the retained browser/canvas probes.


The attached Phase 5A-only request and continue messages explicitly authorize this
scope, superseding the older next-task proposal below. Browser/PyWebView now owns
video-only preview and an explicit 3-second countdown / 4-second WebM/VP8 capture.
Studio Dataset has Dataset / Live Camera modes, selected verified topic, cancel,
repeat capture and the shared uncalibrated top-k result view. No automatic camera
start, microphone, continuous inference, segmentation, training or sensor integration.

New authenticated POST /api/v1/recognition/live-jobs?topic_id=... resolves providers
on the backend and feeds existing RecognitionJobService / RecognitionService /
persistent isolated worker. LiveCaptureRef uses capture_id; sample_id/recording_id
are null, never fake manifest identities. Worker-v3 adds an ID-only live operation
and trusted temp-root startup configuration. Ten providers/checkpoints/vocabularies,
manifest and preprocessing tensor semantics are unchanged. Collector remains ML-free.

8 MiB upload limit, 15-second upload timeout, two concurrent uploads, session ownership,
unique OS-temp storage and terminal/shutdown cleanup. Worker validates readable media,
resolution, at least five / at most 720 frames and monotonic decoded PTS span <=6s.
Browser WebM can report FPS=1000: live timestamps use actual decoded PTS; linspace
selection of 60 frames, 65 landmarks, zero-fill and float32 remain unchanged.
Preview mirror is CSS only; captured/model pixels are not mirrored.

Fresh checks: 182 affected backend tests; 37 frontend unit tests; TypeScript/Vite
build; eight browser tests passed, one opt-in real dataset browser test skipped.
Two browser fake-device captures traversed the real worker and reused provider cache.
A portrait VFR canvas clip also passed real inference. These are synthetic pipeline
tests, not performed signs or accuracy evidence. Six responsive/theme Axe scans pass.
Real API probe confirms malformed-media failure, cancel/timeout/recovery, dataset
W00395 unchanged, running+queued shutdown, interpreter/launcher exits and port release.
Cancel ~93ms; shutdown ~219ms. Shell headless smoke exits 0.

A repeated shutdown probe exposed temp-root/terminal-file deletion racing; locking
and idempotent deletion corrected it. Native USB webcam preview/4-second recording
was observed before the VFR fix, but final end-to-end physical recognition remains
unverified: subsequent attempts returned NotReadableError or unresolved source.
Camo is a virtual source, not physical-camera proof. Zero annotated human signs.
No physical video retained. Sudden OS/process termination may leave temp orphans;
normal terminal/shutdown paths are tested, not crash-proof deletion.

Next gate: manually verify actual Studio with the USB webcam and a known sign twice,
cancel once, stop camera, leave Studio and close app. Phase 5B continuous segmentation
is recommended only after this gate and separate authorization. All unrelated visual,
hardware, Qt cleanup/cutover and release gates remain unchanged. No commit/push/release.
Root still has no .git; baseline/direct diff review is used. Detailed contract is in
docs/RECOGNITION_CONTRACT.md; ignored evidence/report is .design-cache/kvsl-phase5a/.

## 2026-10-10 - Phase 4 evaluation/data quality: PASS, eligibility D

The current attached Phase 4-only request explicitly authorizes this audit, superseding
the older next-priority gate below. Prior phases were not repeated. Full four-commit
local KVSL history, five CSVs, two notebooks and 309 exact video objects were inspected.
No actual checkpoint-linked train/test manifest, NPZ split, signer roster or augmentation
realization was recovered. Published code generates up to 1,500 variants plus original
per row, then stratifies individual samples 95/5 with seed 42: recording-sibling leakage
is possible. This code is co-versioned, not proof of each checkpoint's actual training run.

Decision **D: no defensible accuracy evaluation from current data**. Confirmed training
0, confirmed held-out 0, unknown 175 memberships / 169 recordings. No random split,
accuracy, F1, confusion matrix, calibration, retraining or model modification. Six
cross-topic recordings and 12 repeated annotations are recorded; no exact duplicates
among 309 historical MP4s. Eighteen filename families remain possible relatives only.
All 169 referenced Git assets are recoverable, but zero videos were restored because
asset recovery cannot establish evaluation eligibility.

Fresh decode scan: 45 local recordings / 49 memberships, all readable, 5,178 frames,
zero empty returned frames or frame-count discrepancies. Reused landmark evidence with
fresh D0532: pose missing 2, left hand 2,967, right hand 2,060; 5,029 zero-filled group
events out of 15,534. These are detection diagnostics, not causal error or quality labels.
D0532 fresh persistent-worker result preserves 5 / 3 / 8 against annotation 3; pose
missing 0/108, left hand 108/108, right hand 58/108. Mapping agrees; causal explanation
unknown. Worker shutdown exit 0. Six local evidence tests pass; no production source,
test, model, preprocessing, manifest, API/UI, dependency, hardware or launcher change.

Durable findings/protocol/commands: docs/KVSL_EVALUATION.md. Local audit scripts and
machine-readable provenance/index/support/quality/error evidence: .design-cache/kvsl-phase4/.
Root has no .git; baseline hashes/direct diffs are used, not a root clean-status claim.
Remaining unknowns: license, signer identity, official split, actual training overlap,
generalization and calibration. LSTM/continuous segmentation, sensors and Raspberry Pi
remain unresolved/unverified. Video results do not establish glove sensor accuracy.

**Next recommendation: A, independent evaluation dataset, proposed only.** Freeze models,
collect new provenance-controlled recordings, separate signers/recordings/augmentations
and lock the test set. Old-training signer independence still needs its signer roster.
Separate authorization is required before collection or any next task. All unrelated
visual, hardware/data-integrity, Qt cleanup/cutover and release gates remain unchanged.

## 2026-10-10 - Phase 3A: PASS WITH FIXES

Authorization: current attached Persistent Worker / Recognition Latency Optimization
request. It supersedes the older proposed Phase 3A gate below; prior phases were not
repeated. Phase 3A acceptance is complete:

- Lazy isolated worker persists across six normal requests and three providers.
- Verified handshake, ID-only prediction frames, serial execution, pinned model cache.
- Exact W00395 feature/mask/timestamp parity and unchanged top-three scores; correct
  topic switching; known D0532 misclassification preserved.
- Measured warm reductions: W00395 49.1%, D0098 44.2%. No real-time/accuracy claim.
- Real cancellation stops ML, 47ms; next prediction succeeds in a new worker.
- Crash/timeout recovery succeeds without application restart; protocol failures
  and blocked pipes are covered by lightweight real-process tests.
- Running+queued server shutdown 187ms; actual ML interpreters and venv launchers
  exited, executor stopped and loopback port released.
- Collector ML absence confirmed in fresh processes. 168 affected backend tests
  passed; browser 8 passed plus final real two-topic rerun 1 passed; shell smoke exit 0.

No frontend source/build/dependency, model/vocabulary/manifest, auth, SensorPacket,
simulator, hardware, launcher cutover or release change. Root has no .git; final
scope review uses hashes and direct diffs. Details and limitations are in
docs/WORK_SESSION_HANDOFF.md and ignored .design-cache/kvsl-phase3a/REPORT.md.

**Next gate: user priority decision**, not automatic implementation: hardware/sensor
phase; recognition UX/video preview; evaluation/data quality; or Raspberry Pi
preparation. All unrelated visual, hardware/data-integrity, Qt cleanup/cutover,
packaging and release gates retain their existing status.

## 2026-10-10 - Phase 3B: additional KVSL GCN topics verified

The current attached Phase 3B-only request supersedes the older Phase 3 decision
gate below. All ten historical GCN checkpoints passed safe weights-only loading,
strict architecture loading, manifest class-count and immutable topic-map checks.
The co-versioned ten-topic GCN service explicitly uses the same 60x65x3 preprocessing;
extraction, constants, training, model, skeleton and service sources are unchanged
between artifact and source pins. No actual training-run manifest was recovered.

All nine additional topics passed three real manifest-backed RecognitionService /
isolated worker predictions each. Existing do_vat W00395 passed with identical
ca/cày/bộ sách scores. Total candidate/regression checks: 28, every child exit 0.
This is provider compatibility verification, NOT benchmark accuracy. so_dem:D0532
annotation "3" produced top-1 "5" (.381208867), then "3" (.368246645), "8" (.172988474).
Other tested topics produced their annotations in 3/3 checks; do_vat in 1/1.

Coverage: 10 verified topics, 175 topic-local classes, 175 manifest memberships
across 169 original recordings. Locally 49 memberships currently have valid restored
video assets; the other 126 are shown unavailable. This does not claim every class
was tested. No whole-dataset inference or source-label/video/manifest modification.

Implementation: backend-owned immutable static registry, one generic KVSL GCN worker,
provider-specific identity/hash/vocabulary/output validation and topic-aware catalog.
API continues accepting IDs only. Optional provider_id on GET samples filters topics;
unverified IDs and cross-topic jobs are rejected. Missing provider artifacts affect
only that provider. Studio reuses its existing One UI select: topic → filtered sample
→ automatic provider, clears old results, locks switching while queued/running or
submitting. Counts are derived from registry and manifest. No visual redesign.

Model/source/preprocessing pins, do_vat behavior and PredictionResult/worker protocol
versions remain unchanged. ModelDescriptor adds the source Vietnamese display_name;
runtime availability is supplied by the catalog beside descriptor metadata.
The old trusted do_vat checkpoint override remains backward compatible; new providers
resolve <topic_id>.pth under the configured assets root and verify pinned SHA-256.
Registry metadata is durable source, not loaded from Phase 3B audit JSON. Existing
operator-configurable Phase 0 paths remain defaults; packaging is still unverified.

No new dependencies/environments, persistent worker, optimization, training, LSTM,
camera, continuous signs, sensor recognition, SensorPacket/simulator/hardware,
launcher cutover, Qt cleanup or release. Collector remains ML-free.

Exact inventory, hashes, full sample top-k/scores/latencies and source provenance:
docs/RECOGNITION_CONTRACT.md (current section) and ignored .design-cache/kvsl-phase3b/.
Next proposed task: Phase 3A — Persistent Worker / Recognition Latency Optimization.
It requires separate authorization and has not been started. Other gates unchanged.

Result: **PASS WITH FIXES**. Fresh verification, not reused Phase 1/2 counts:

- Artifact audit: all 10 historical PTHs inventoried, SHA-256/state keys/shapes recorded;
  weights_only=True and strict=True passed for all 10. Output counts and immutable
  topic maps match the manifest. Six relevant source files match across both pins.
  Command: isolated extraction-env/Scripts/python.exe -X utf8 .design-cache/kvsl-phase3b/audit.py.
- Backend/unit: `.venv/Scripts/python.exe -m pytest tests/test_recognition.py tests/test_recognition_worker.py tests/test_recognition_jobs.py tests/test_recognition_topics.py tests/test_dependencies.py -q`
  — **80 passed**, 2 pre-existing Starlette/AnyIO deprecation warnings, 12.42s.
  Covers registry duplicates/unknown providers, shape/preprocessing mismatches,
  topic mapping, model hashes, independent unavailable artifacts, API selection/filtering,
  auth/ownership/ID-only requests, cancellation/reaping and bounded shell shutdown.
- Frontend unit: web `npm.cmd test` — **27 passed**, 5 files.
- Build: web `npm.cmd run build` — TypeScript/Vite PASS, 119 modules.
- Real worker: `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase3b/verify_candidates.py`
  — **28 successful predictions**, 3 per additional topic + do_vat W00395, child exits 0.
  Candidate registry was confined to an audit copy until checks passed; production
  registry then received only verified entries. These are not held-out measurements.
- Desktop integration/frontend regression: web `$env:RECOGNITION_REAL='1'; npx.cmd playwright test recognition.spec.ts --trace off`
  — final **8 passed (1.1m)**, exit 0, including real do_vat and cau_hoi through
  Studio/authenticated API/jobs/isolated worker/UI; bridge teardown exit 0.
  Real combined two-topic test took 35.8s. No inference mocks in that test.
  Final service totals: do_vat W00395 18669.812ms; cau_hoi D0098 10201.012ms,
  both child exits 0. A separate socket bind confirmed Vite port 5173 released;
  runtime-verification.json records that check and fresh collector ML absence.
  Other tests cover filtering/provider submission, Unicode, unavailable/unsupported,
  active-job selection lock, result clearing, polling retry and cancellation states.
- Responsive/accessibility: actual app renders in both themes at 1280x720, 1440x900,
  820x1180; no horizontal overflow. Six result-state and two running-state scoped
  Axe scans: zero WCAG A/AA violations. Desktop and portrait screenshots inspected.
- Regression: W00395 retains ca .43561261892318726 / cày .13568049669265747 /
  bộ sách .1329399198293686. Hash and numerical path unchanged.
- Shell: `.venv/Scripts/python.exe -m app.desktop_collector.shell --smoke-test`
  — fresh exit 0. Headless lifecycle check, not native visual acceptance.
- Isolation: fresh test process confirms torch/mediapipe/torch_geometric absent
  from both collector find_spec and sys.modules. No package/environment installation.
- Review: root has no .git. Hash/direct diff review found 18 changed durable files,
  2 added durable files, no source deletions; local generated build index separately
  changed. 362 baseline files unchanged; no added-line whitespace errors. Original
  manifest SHA-256 b266b70af7408d944c3c7713537a60b0770a7dcd79b5a25bb767c343d59a99a6
  preserved. Protected reference catalog unchanged. Upstream Git status/diff check clean.

Failures are retained in the handoff: sandbox permissions, fixture updates and
Windows sandbox test-process teardown. Final browser run outside sandbox exited
normally. PowerShell Stop-Process itself errored; scoped taskkill of the confirmed
test process tree succeeded before the final run. No application lifecycle change
was made to work around test-runner teardown.

<!-- END PHASE3B CURRENT -->

## 2026-10-10 - Phase 2 Desktop Recognition Vertical Slice: PASS WITH FIXES

The attached current request explicitly authorizes Phase 2, superseding the older
Phase 2 proposed/unapproved gate below. Studio Dataset now browses the existing
manifest-backed do_vat subset and submits ID-only asynchronous recognition jobs.
Only kvsl-gcn-do-vat (20 classes) is advertised. Phase 0A/0B were not repeated;
Phase 1 contracts/model/preprocessing and one-process-per-request architecture remain.

RecognitionJobService owns one executor, at most 8 pending/running jobs and 32
terminal snapshots in RAM. Existing bridge token, user session, collector RBAC,
exact Host/Origin and per-session job ownership protect six recognition routes.
Queued cancellation is immediate; running cancellation becomes terminal only after
worker reaping. Shell/lifespan shutdown cancels jobs and stops the executor within
a bounded wait. No ML imports/dependencies enter the collector environment.

Studio reuses existing One UI primitives; dataset annotation and model prediction
are separate, scores are uncalibrated softmax. Polling is abortable and recoverable;
no telemetry coupling. Preview is deferred. No training, camera, sensor recognition,
new topic, LSTM, DB migration, manifest write, hardware or unrelated visual redesign.

Real W00395 via Studio/API/worker reproduced ca/cày/bộ sách and exact Phase 1 scores;
child exit 0, measured total 24.918s. Real cancellation and shutdown reaped children,
released port and left no executor/server running. Fresh affected backend suite:
126 passed; frontend unit: 27 passed; real browser smoke and focused UI checks passed.
Detailed commands, evidence and remaining limits: docs/WORK_SESSION_HANDOFF.md and
docs/RECOGNITION_CONTRACT.md. These are regression checks, not accuracy evidence.

Next gate: Phase 3 — Recognition UX / Provider Expansion Decision. Decide A: UX /
persistent-worker latency, B: verify more KVSL topics, or C: hardware/sensor pipeline.
No Phase 3 implementation is authorized automatically. Existing unrelated visual,
hardware/capture, Qt cleanup/cutover and release gates retain their status.

## 2026-10-10 - Phase 1 Offline Recognition Provider Boundary: PASS

Explicit current request opened only Phase 1. Delivered offline contracts, manifest
adapter, service/CLI and isolated worker for the sole verified do_vat GCN provider.
Acceptance evidence: 89 fresh affected tests passed; real three-sample service check
and CLI check passed, all child exits 0. W00395's mapped top-3 scores exactly match
Phase 0A. Collector ML dependency absence/import isolation verified separately.

Timeout/reaping, malformed output/Unicode, request correlation, missing artifacts,
model hash/input/output compatibility and manifest/mapping rejections are tested.
No benchmark claim, UI/API/hardware/sensor/acquisition changes or Phase 0 repetition.
Contract/evidence/limitations: `docs/RECOGNITION_CONTRACT.md` and current handoff.
Next gate: separate authorization for Phase 2 Desktop Recognition Vertical Slice.
Existing visual acceptance, hardware/capture, Qt cleanup/cutover and release gates
remain unchanged. No push, merge or release is authorized by this delivery.

## 2026-10-10 - Phase 0B KVSL Manifest Importer: COMPLETE

The user's new-session instruction explicitly opens only Phase 0B and supersedes
the earlier same-day proposal status below. Offline module/CLI and versioned manifest
contract are implemented. Final affected suite: 34 passed. Real pinned-source CLI
import and repeat-import/provenance verification passed: 187 rows, 169 original videos,
175 topic memberships, 12 repeated annotation rows, no missing referenced video.

All CSV rows remain traceable, topic indices stay scoped, unknown metadata stays
unknown, source files are untouched and differing output files cannot be overwritten.
Evidence: `.design-cache/kvsl-phase0b/manifest.json`, `verification.json`; portable
contract/command: `docs/DATA_SCHEMA.md`; detailed handoff: `docs/WORK_SESSION_HANDOFF.md`.
No Phase 0A rerun, ML/runtime installation, UI/bridge integration or later phase.
Next gate: explicit scope approval for any subsequent phase. Existing visual, Qt
cleanup, hardware, capture, cutover and release gates retain their current status.

## 2026-10-10 - Bounded software-first Phase 0A: PASS WITH FIXES

Explicit user decision: KVSL is the sole primary repository. The authorized isolated
feasibility check is complete: one real historical GCN checkpoint, one standalone
video and a batch of 20 unique source videos ran end-to-end. Final batch child exit 0;
extractor/resampler parity passed. This is not a benchmark or a closed hardware milestone.
Evidence: .design-cache/kvsl-phase0a/REPORT.md and current WORK_SESSION_HANDOFF.

Phase 0B (KVSL manifest importer) is the proposed next task; no importer or SmartGlove
integration was implemented. LSTM, independent evaluation, artifact licensing and
production packaging remain unverified. No M1 visual review, Phase E Qt cleanup,
M2 hardware, M3 capture, launcher cutover or release gate changes follow from Phase 0A.
The earlier visual review entries below retain their status.

## 2026-10-05 - Capsule motion accepted; small timing adjustment

User accepted the corrected capsule motion ("on roi") and requested a slight speed
increase. The resulting 540ms open / 440ms close adjustment awaits review. This is a
bounded capsule decision, not acceptance of Account or authorization for later scope.

## Current gate - 2026-10-04 bounded Account and Quick Status extension

The user accepts the visual direction as largely complete, with Quick Status motion and
Account functionality as the remaining requested changes. The four-role decision and
personal fields are confirmed, not proposed. This identity extension (including the
necessary profile API/schema) and motion refinement are IMPLEMENTED, awaiting user review.
Samsung font-source research found the draft's download link; runtime embedding remains
unimplemented pending a permitted font source. Existing fallback remains explicitly a
fallback. No Phase E/M2, Studio backend, hardware, launcher/cutover or release gate opens.
See current WORK_SESSION_HANDOFF for exact checks, recovery and limitations.

## Current gate - 2026-09-28 accepted desktop baseline; refinement awaiting review

The user has explicitly accepted the preceding comprehensive desktop composition.
Its visual-acceptance gate is now APPROVED; earlier pending entries below are historical.
The authorized follow-up addresses menu/tab collisions, notification continuity,
checkbox clipping, source identity and modest visual emphasis while preserving scale.

Latest steering rejects mixing 3D illustrations with circular glyphs. Final Search and
Studio use the same sourced line-icon/circle treatment; the title hand is removed.
This follow-up is IMPLEMENTED / AWAITING USER VISUAL REVIEW. It is not yet accepted.
The pre-refinement accepted source is saved in the verified 230-entry checkpoint
listed in docs/WORK_SESSION_HANDOFF.md. No Phase E/M2, Studio backend, hardware,
API/schema, dependency removal, launcher/cutover or release gate is opened.

## 2026-09-27 — Authorized overlay-navigation refinement implemented

User requested an integrated visual pass after reviewing all current pages and the new
Samsung Notes recording. The push-aside rail is superseded by desktop overlay navigation;
narrow bottom navigation and the accepted desktop proportions remain. Shared motion,
icons, feedback and existing Simulator/Statistics/Studio compositions are refined.

Implementation and bounded checks are complete: build, 26 unit tests, 38 runtime checks
plus 5 focused checks, and 14 Axe states with no detected WCAG A/AA violations. The user
visual gate remains OPEN; this result has not been visually accepted. No later feature,
hardware, backend or cutover milestone is opened. Details: docs/WORK_SESSION_HANDOFF.md.

## Current refinement — 2026-09-26

User feedback supersedes the fixed desktop rail: desktop navigation must be toggleable;
narrow windows retain the bottom dock. The current implementation starts the desktop
rail hidden, exposes a permanent40px menu toggle, and retains the user's visibility
choice across page changes and window resizing for the mounted application session.
The approved32px titles,40px actions,44px underline fields and48px Search are retained.

The top telemetry control is now a Live Activity / Expanded Live Notification,
grounded in live One UI1491:6391 and838:4076. Quick Status uses the same truthful
telemetry snapshot, including recent packet gaps, unavailable rates and offline sources.
Checkbox feedback is confined to its artwork; neutral statuses no longer show an info
icon. Studio uses existing Card primitives in a2x2 workflow composition. Dedicated
Channels uses responsive groups without a fixed-height nested scroller. Header brand
opacity follows native scroll, with a soft top fade based on the Samsung recordings.

Figma gate rechecked successfully with whoami (Fish), then meaningful live inspection
of file wzEFGRLl9MU1nB1JxUSyhD. The cover-only StIo1CdCci8HQXMmdhXZG8 remains deliberately
excluded. New icons are exact live exports; no substitute icon library or manually
redrawn geometry. Samsung official design-system, large-screen and motion guidance
was consulted; recordings remain the primary motion source. This visual refinement
is implemented and awaiting user review. Prior feedback is not treated as acceptance.
No Phase E/M2, hardware, backend, dependencies or launcher/cutover gate has opened.

## Current visual language pass — 2026-09-26

The user explicitly accepted the desktop-proportion correction, then authorized a
comprehensive One UI language pass using seven new component references. The accepted
scale remains:40px actions,44px underline form fields,48px Search,32px page titles.
Explicit navigation decision: left rail on desktop, bottom navigation on narrow windows.
Implementation uses the same four destinations, an88px rail at>=1100 CSS px, and the
existing54px bottom navigation below that threshold. No new product destination.

One UI Figma access was verified through live whoami and meaningful inspection across
all11actual pages, style families, modern variants and component notes. Required visual
source remains `wzEFGRLl9MU1nB1JxUSyhD`; cover-only `StIo1CdCci8HQXMmdhXZG8` is
intentionally excluded. Current application source owns functionality and real state;
Samsung recordings own behavior/motion. Static Now Bar frames do not establish exact
animation timing. The local catalog is unchanged.

Delivered: semantic typography/colour roles throughout shared primitives and screens,
theme-aware hand/plot treatment, responsive rail, scroll chrome/fade, paired password
action capsule and a source-aware telemetry Now Bar. Acquisition continues while charts
pause; offline/gap/resync states remain visible, stale rates disappear after bridge loss.

Status: IMPLEMENTED / AWAITING USER VISUAL REVIEW of this new language pass. The earlier
desktop correction is APPROVED; historical pending wording for that correction is
superseded. No Phase E, M2, hardware, backend, dependencies or cutover gate opened.
Evidence, backup and exact file list: `docs/WORK_SESSION_HANDOFF.md` current entry.

## Current update - 2026-09-26 strict normalization delivered

User authorization `7a589557-ebf6-43bd-a7f2-96300c633dfd` supersedes selective
adaptation for generic UI. Implementation and bounded verification are complete;
new visual acceptance remains open. No Phase E/M2 or cutover gate has changed.
Current evidence and recovery details are in docs/WORK_SESSION_HANDOFF.md.

## Current update — 2026-09-26 Design Kit refinement

The user explicitly accepted the completed overhaul as the baseline and authorized a
second-pass conformance audit (`4cffd1dd-36bc-4978-84d0-f7909b9635a1`). That pass is
implemented and verified; current visual review concerns this new refinement. Earlier
overhaul-pending language below is historical. No Phase E/M2 or cutover gate opened.
Build/CSS/targeted overlay tests and real runtime evidence are recorded in the current
`docs/WORK_SESSION_HANDOFF.md` entry. No new visual acceptance is assumed.

# PROJECT MILESTONE TRACKER

> Dự án: Găng tay thu thập dữ liệu và nhận diện ngôn ngữ ký hiệu  
> Workspace: `C:\Users\ASUS\Downloads\Smart-Gloves` (downloaded copy; no local `.git`)
> Cập nhật gần nhất: 2026-09-26
> Trạng thái hiện tại: **Full frontend One UI overhaul đã triển khai; chờ user visual approval; Phase E/M2 chưa mở**

Yêu cầu overhaul `0759753e-b28a-4171-8499-7413f4b6721d` và source correction
cho phép chỉnh toàn bộ frontend trong một pass. One UI Figma đã được kiểm tra live;
SmartGlove Figma cũ chỉ có cover và được chủ động loại khỏi nguồn UI. Baseline là
source hiện tại; backup trước sửa đã kiểm chứng hash/CRC. Không đổi backend,
hardware/protocol, dependency, launcher/cutover hoặc xóa Qt.

**Gate hiện tại: user visual approval của implementation mới.** Build TypeScript/Vite,
CSS parse, 15 unit tests liên quan và kiểm tra runtime có mục tiêu đã chạy. Runtime
đã review Devices/Monitor/Studio/Account/Search, hai theme và nhiều viewport.
Không tuyên bố full E2E/native GUI hoặc shutdown luôn sạch: một lượt harness gặp
Windows SQLite temporary-file lock khi cleanup; lượt cuối đóng exit 0. Chi tiết và
giới hạn bằng chứng: `docs/WORK_SESSION_HANDOFF.md`.

### Historical 2026-09-10 Studio/Search authorization

Attachment `5ae3ecc9-4114-4410-8da0-e1a9a9d85507` từng khóa baseline và mở riêng
Studio/Search. Trạng thái compile/runtime chưa xác minh ở snapshot đó đã được thay
thế bởi evidence mới ở trên. Các quyết định backend/ML/hardware vẫn được bảo vệ.

### Historical 2026-09-09 authorization and verification

Yêu cầu mới trong attachment `0bd30823-fc7c-44c0-a322-bf006bca9409` mở phạm vi
refinement cho shared system và cả hai màn hình. Gate live Figma đã đạt trước sửa
source. Giữ Direction B đang có; không đồng nghĩa người dùng đã duyệt kết quả mới.
Build, Vitest 17/17, targeted real-bridge E2E 5/5, direct/launcher smoke exit 0.
Ảnh thật có hai theme và bốn viewport; axe 0 violation nhưng còn manual-review
targets. Chi tiết hiện hành: `docs/WORK_SESSION_HANDOFF.md`.

**Gate tiếp theo: chỉ user visual approval.** Không mở milestone khác, cutover,
rollback cleanup hoặc release. Các mục Stage1/V.3 bên dưới là lịch sử; phạm vi
Stage1-only và geometry freeze cũ không phủ quyết yêu cầu full-pass mới.

### Historical Stage1 verification snapshot

Authorization mới và contract: `docs/ONE_UI_DESIGN_RULES.md`; checkpoint/verification
đã hoàn tất: `docs/WORK_SESSION_HANDOFF.md`. Chỉ triển khai Device Manager rồi chờ user
visual approval trước rollout. Các geometry freeze bên dưới là lịch sử, không phủ
quyết authorization mới; backend/launcher/acquisition/rollback vẫn được bảo vệ.

Final Stage1: một direct smoke ghi actual Python exit0, một Edge preflight đạt,
production-preview E2E targeted6/6 đạt (không tuyên bố full-suite), một worker/trace off.
Device Manager8states0axe violations/incomplete; Now Bar16tổ hợp/3728frames ổn định,
không scrollbar tạm. Reuse unit17/17, build cuối và launcher exit0 đã ghi trước đó.
Không sửa source/rebuild trong lượt verification cuối. Hai gap pre-edit lịch sử của
runtime test/asset inventory vẫn còn; human review và user visual approval chưa có.

Các kết quả V.3 sau đây là lịch sử, không thay thế evidence Stage1 ở trên:

Browser recovery một lần đã đạt; diagnostic 800px chạy một lần và đã gỡ mã tạm.
Channel panel hiện 467.78px so với baseline 467.8px, không nới assertion. Full V.3
E2E duy nhất 24/28 trước sửa contrast; affected/evidence cuối 17 test có saved result
passed, không lỗi. Không tuyên bố full final-source 28/28. Unit 17/17 tái sử dụng
(chỉ CSS đổi sau đó), build cuối 51 modules, hai smokes exit 0, diff check đạt.
Now Bar 16 tổ hợp/3065 frames giữ 400×60 và 520×325, không scrollbar tạm; 200%/focus/
reduced-motion/axe đạt. Sáu ảnh đã xem native-resolution và một WebM tại
`.design-cache/artifacts/one-ui-v3/`. Human playback, screen-reader speech và native
window visual vẫn chưa xác minh; user visual approval còn mở, không mở Phase E.
Checkpoint và implementation map hiện tại: `docs/WORK_SESSION_HANDOFF.md`, mục V.3.
Các mục dưới là lịch sử trước authorization V.3 mới.

### Production One UI alignment + approved A.1 Now Bar — implemented, awaiting user visual approval — 2026-09-07

- User đã phê duyệt Now Bar A.1 và bounded alignment trong production. Prototype/spec
  cũ được giữ nguyên làm reference; không làm lại prototype và không tạo Goal mới.
- Gate Figma đã gỡ sau reconnect: whoami và context/screenshot đúng LiveActivity
  `1491:6362` trong `wzEFGRLl9MU1nB1JxUSyhD` đều thành công; không scan root.
- Production giữ capsule 400×60 trong lane 78px hiện hữu, overlay tối đa 520px, shared
  content và motion đã duyệt. Bỏ glyph mở rộng/statistics trùng; chart state, acquisition,
  source truth, keyboard/focus/scroll và atomic shell handoff được bảo toàn.
- Shared typography/helper/action hierarchy được chỉnh trong outer bounds đã khóa;
  gradient auth, một theme control, product identity và hybrid terminology giữ nguyên.
  Không có geometry exception còn mở: 308 numeric fields khớp baseline.
- Final Vitest 17/17, build, dependency check, direct PyWebView/SkipBuild smokes đạt.
  Full E2E duy nhất đạt 23/27 TRƯỚC sửa line-height và test measurement; affected/evidence
  cuối đạt 13/13. Không tuyên bố full suite đã pass trên final source.
- Evidence hiện tại: sáu ảnh + một WebM tại
  `.design-cache/artifacts/production-one-ui-alignment/`; provenance, exact files,
  tests và các lỗi iteration nằm trong `docs/WORK_SESSION_HANDOFF.md`.
- Gate tiếp theo chỉ là user visual approval sản phẩm chạy thật. Human motion playback
  và NVDA/Narrator vẫn UNVERIFIED. Không mở P.2 feature khác, V.3, Phase E hoặc M2.

### P.2.1.3 Anchored Now Bar overlay morph — implemented, awaiting P.2.1 visual approval — 2026-09-06

- P.2.1.2 inline expansion đã bị user từ chối về visual và chỉ còn là lịch sử. Collapsed
  Now Bar vẫn là child đầu tiên trong normal flow của `.app-content`, nhưng expanded state
  morph chính cùng surface từ exact collapsed bounds thành shallow anchored overlay;
  placeholder collapsed-size giữ nguyên mọi tọa độ page bên dưới.
- Expanded overlay khóa internal scroll, đặt page siblings inert, trap focus và đóng qua
  header/Escape/transparent outside click bằng reverse morph. Không dim/blur; overlay chỉ
  phủ page content và luôn dưới Top App Bar/rail/bottom navigation. Quick Status, Account,
  theme control và Notification Center thực hiện handoff độc quyền, không chồng surface.
- Runtime reducer/RBAC/RAM-only lifecycle, source/packet truth, single chart-pause state,
  acquisition continuity và frozen shell/chart/command geometry được giữ. Không thêm
  portal, duplicate DOM, animation loop, backend, dependency hoặc feature phase sau.
- Official Samsung pages chỉ hỗ trợ các rule tổng quát về hierarchy, depth, accessibility,
  writing và predictable spatial motion; không trang nào quy định exact Now Bar behavior.
  Một Figma context call cho node `1491:6362` thất bại do tool unavailable nên exact
  expanded anatomy/Figma motion `UNVERIFIED`; prior live nodes chỉ được dùng cho compact
  anatomy, spacing, proportion và states. Chi tiết URL/rule ở current reference audit.
- Automated gates đạt: Vitest 17/17, build 51 modules, affected P.2.1 Playwright 4/4,
  full Playwright 26/26, ba smoke path exit `0`, `npm ls` sạch. Evidence gồm đúng một WebM
  và hai stills tại `.design-cache/artifacts/product-p2-1-3-anchored-overlay/`.
  Normal-speed human video playback, real NVDA/Narrator và user visual approval vẫn
  `UNVERIFIED`; không mở P.2.2, P.3, V.3, Phase E hoặc M2.

### P.2.1.2 Now Bar semantic interaction — implemented, awaiting P.2.1 visual approval — 2026-09-06

- Now Bar hiện là một disclosure/shared live-activity surface, không còn mang cảm giác
  dropdown hoặc navigation launcher. Toàn bộ collapsed header là button thật với
  `aria-expanded`/`aria-controls`; Enter/Space toggle, Escape collapse và trả focus đúng.
- Collapsed state chỉ hiển thị live status, `Live telemetry`, trạng thái nhận cảm biến,
  số nguồn và aggregate sample rate. Expanded state vẫn là cùng container, chỉ thêm dữ
  liệu runtime có thật: trạng thái/rate từng nguồn, packet/loss, chart state và các action
  hiện có `Open Monitor`, pause/resume chart, Notification Center.
- Shared-container transition dùng motion token V.2; reduced motion bỏ shape/position
  interpolation. Không dùng portal, menu/listbox semantics, JS layout measurement,
  persistence, backend/dependency mới hoặc unrelated shell destinations.
- P.2.1.1 normal-flow scroll, frozen Top App Bar/rail/bottom-nav/chart/command geometry,
  single chart-pause state, acquisition continuity, RAM-only activity lifecycle và RBAC
  được giữ. Automated gate đạt tại 1440×900, 1280×720 và 800×1100; evidence gồm đúng ba
  ảnh tại `.design-cache/artifacts/product-p2-1-2-shared-activity/`.
- P.2.1 vẫn `AWAITING USER VISUAL APPROVAL`; real NVDA/Narrator vẫn `UNVERIFIED`. Không
  mở P.2.2, P.3, V.3, Phase E hoặc M2.

### P.2.1.1 Activity lane scroll correction — implemented, awaiting P.2.1 visual approval — 2026-09-06

- Regression được xác nhận do activity lane nằm ngoài internal `.app-content` scroll
  root, nên lane đứng yên dưới Top App Bar trong khi Live Monitor cuộn phía dưới.
- Lane hiện là child đầu tiên trong normal flow của chính scroll root và cuộn khỏi viewport
  cùng page. Top App Bar, rail, compact bottom navigation, card/chart/command geometry,
  runtime activity, Notification Center/focus và pause/acquisition behavior giữ nguyên.
- Gate tự động mới kiểm tra top/middle/lower tại 1440×900, 1280×720 và 800×1100; hai ảnh
  current evidence nằm tại `.design-cache/artifacts/product-p2-1-1-scroll/`.
- Samsung không quy định exact Now Bar anatomy hoặc fixed-vs-flow trong các trang chính
  thức đã kiểm tra. Bảng exact URL → bounded rule vẫn ở
  `.design-cache/artifacts/product-p2-1-alignment/REFERENCE_AUDIT.md`; anatomy/spacing/
  proportion/state tiếp tục chỉ lấy từ năm node Figma live.
- P.2.1 vẫn `AWAITING USER VISUAL APPROVAL`; real NVDA/Narrator vẫn `UNVERIFIED`. Không
  mở P.2.2, P.3, V.3, Phase E hoặc M2.

### P.2.1 Runtime Activity — implemented, awaiting visual approval — 2026-09-06

- Người dùng đã từ chối visual P.2.1 ban đầu vì Now Bar fixed overlay che nội dung,
  copy bị Việt hóa quá mức và hai status chip xanh V.2 bị làm phẳng. Evidence cũ tại
  `.design-cache/artifacts/product-p2-1/` là lịch sử bị từ chối, không phải baseline hiện tại.
- Correction pass được phê duyệt riêng đã đối chiếu trực tiếp Figma file
  `97artOnuCMCiOPdD2r3ST2` tại các node `1491:6362`, `620:1523`, `1003:13022`,
  `744:3668`, `247:613` và hướng dẫn One UI chính thức. Audit phân loại nằm tại
  `.design-cache/artifacts/product-p2-1-alignment/REFERENCE_AUDIT.md`.
- Now Bar giữ nguyên reducer/behavior nhưng nằm trong activity lane có allocation riêng
  ngay dưới Top App Bar; không còn fixed/floating overlay hoặc collision scanner. Hai chip
  tonal mint `Bridge online` và `SIM 2/2` được khôi phục. Copy áp dụng hybrid glossary
  đã ghi trong `docs/ONE_UI_DESKTOP_MOBILE_ADOPTION.md`.
- Activity vẫn RAM-only, tối đa 50 mục và reset khi logout/session invalidation/đổi user/
  thoát app. Quick Status → Notification Center, role filtering, action truth, snackbar
  ownership và chart-only pause/counter continuity không đổi; không thêm backend,
  dependency, audit feed, capture, history/search/settings hoặc phase sau.
- Final verification của correction đạt: targeted Vitest 14/14, full Vitest 17/17,
  TypeScript/Vite build, targeted Playwright 1/1, final full Playwright 23/23 với một
  worker/trace off, direct PyWebView smoke, `-SkipBuild` smoke và clean `npm ls`.
  Browser test xác minh collision với app bar/nav, descriptions, metrics, cards,
  channel panel, plots, simulator và overlay actions tại 1280×720, 1440×900,
  1024×768 và 800×1100; bốn ảnh mới đã được tạo và review tại
  `.design-cache/artifacts/product-p2-1-alignment/`.
- Gate hiện tại vẫn là user visual approval P.2.1. Real NVDA/Narrator vẫn `UNVERIFIED`;
  không mở rộng P.2.1, V.3, Phase E hoặc M2.

### Phê duyệt visual V.2.1 / P.1 — 2026-09-06

- Người dùng đã review và phê duyệt rõ ràng implementation One UI V.2.1 / P.1 hiện tại,
  bao gồm auth light/dark, composition auth V.2, nhãn rail `Tài khoản`, Account, Quick
  Status, Create/Edit User sheet, opening/settling behavior, navigation và responsive
  behavior đã được đại diện trong evidence V.2.1.
- Gate visual-approval V.2.1 / P.1 đã đóng; implementation hiện tại trở thành visual
  baseline được duyệt. Không có yêu cầu polish hoặc redesign bổ sung.
- Task ghi nhận approval chỉ sửa tài liệu; source, test, config và evidence V.2.1 không đổi.
  F42/F43/F44 tiếp tục frozen. Human NVDA/Narrator spoken-output vẫn `UNVERIFIED`.
- M1.1 chưa hoàn thành vì điều kiện cleanup Phase E được tracker định nghĩa vẫn chưa
  được phê duyệt hoặc thực hiện. P.2, V.3, Phase E và M2 không được mở bởi quyết định này.

### Xác nhận V.2.1 — 2026-09-05

- User xác nhận baseline rail target là **54×62px**; 54×50 trong brief là lỗi
  specification, không phải quyền đổi geometry. Rail 88px, icon 24px, threshold
  1260px, destination positions và hit targets giữ nguyên.
- Full Vitest 11/11 và full Playwright 22/22 đạt. Sau tinh chỉnh settle từ 140 xuống
  100ms, targeted overlay/lifecycle 2/2, targeted auth/Create/Edit/rail 2/2 và structural
  Vitest 3/3 đạt; production build và hai shell/launcher smoke paths đạt.
- 268 giá trị geometry so với V.2 có delta 0. Auth contrast toàn dải wash đều >=4.5:1;
  axe không violation, các contrast incomplete do pseudo-element được giữ và review.
- Evidence: `.design-cache/artifacts/one-ui-v2-1/MANIFEST.md`. User đã phê duyệt visual
  ngày 2026-09-06; real NVDA/Narrator acceptance vẫn chưa được xác minh và quyết định
  này không mở P.2, V.3 hoặc Phase E.

## 1. Mục đích của file

File này là bảng theo dõi chung cho toàn bộ dự án. Mỗi phiên Codex sau này phải đọc file này trước khi lập kế hoạch hoặc sửa code.

Quy tắc quan trọng:

- Không xem một phase là hoàn thành chỉ vì code build được; phải đạt test, visual gate và điều kiện duyệt tương ứng.
- Không tự chuyển sang milestone kế tiếp khi còn hardware gate hoặc user approval gate.
- Các mục đánh dấu **ĐÃ KHÓA** là phạm vi đã được thống nhất.
- Các mục đánh dấu **ĐỀ XUẤT** chỉ là định hướng tương lai, chưa được phép triển khai.
- D.2.2 không được phê duyệt visual; D.2.3 là baseline đã hoàn thành; D.2.4 bị từ chối và rollback. Người dùng đã phê duyệt visual D.2.6 Stage 2B.3.1 khi ủy quyền P.1; design foundation tương ứng đã frozen. P.1 không cấp quyền cho Phase E cleanup hoặc P.2.
- Worktree có thay đổi của người dùng; không restore, delete, rename, stash hoặc ghi đè ngoài phạm vi.

## 2. Ký hiệu trạng thái

| Ký hiệu | Ý nghĩa |
| --- | --- |
| ✅ | Đã hoàn thành và có bằng chứng kiểm thử |
| 🟡 | Đang chờ duyệt hoặc cần hoàn thiện |
| ⏳ | Đã lên kế hoạch nhưng chưa triển khai |
| 🔒 | Bị khóa bởi một gate trước đó |
| 🚫 | Ngoài phạm vi hiện tại |
| 🧭 | Roadmap đề xuất, chưa khóa kiến trúc |

## 3. Tổng quan toàn bộ roadmap

| Milestone | Nội dung | Trạng thái | Gate tiếp theo |
| --- | --- | --- | --- |
| M1 | Foundation, simulator và collector PySide | ✅ Hoàn thành | Đã chuyển sang M1.1 |
| M1.1 | Chuyển collector sang React/PyWebView và hoàn thiện One UI | 🟡 V.2.1/P.1 đã được duyệt visual; rollback PySide còn giữ | Phase E cleanup cần phê duyệt trực tiếp riêng |
| P.0 | Launcher hiện tại và product context bền vững | ✅ Hoàn thành kỹ thuật | Đã chuyển sang P.1 |
| P.1 | Local persistence, authentication và RBAC | ✅ Implemented và đã được user phê duyệt visual | Không bắt đầu P.2 trước phê duyệt riêng |
| P.2.1 | Runtime Activity: Now Bar và actionable notifications | 🟡 P.2.1.3 anchored-overlay morph implemented; chờ visual approval | User review một video và hai still P.2.1.3 |
| M2 | Firmware ESP32-C3, protocol v1, Serial và Live Monitor thật | 🔒 Chưa bắt đầu | Chỉ bắt đầu sau khi M1.1 hoàn tất |
| Hardware gate | Thử ESP32-C3 thật với một Flex trên GPIO0 | 🔒 Chưa thực hiện | Người dùng xác nhận kết quả phần cứng |
| M3 | Data Capture, raw storage và crash recovery | 🔒 Chưa bắt đầu | Hardware gate đạt |
| M4 | Calibration, Dataset Browser và Filter Preview | 🔒 Chưa bắt đầu | M3 hoàn thành và raw schema ổn định |
| M5 | Hardening, packaging và bàn giao collector | 🔒 Chưa bắt đầu | M4 hoàn thành |
| Hậu M5 | Training, inference, Raspberry Pi, desktop/mobile sản phẩm | 🧭 Chưa khóa milestone | Lập kế hoạch riêng sau khi dataset đủ chất lượng |

---

## 4. Milestone 1 — Foundation, simulator và thiết kế

**Trạng thái: ✅ HOÀN THÀNH**

### Phạm vi đã hoàn thành

- Python 3.12, `.venv`, `pyproject.toml` và `run_app.ps1`.
- Domain model và abstract `DataSource`.
- Simulator hai găng độc lập, deterministic theo seed.
- Noise và packet loss cấu hình được.
- Mọi packet mô phỏng có `simulated=true`.
- Acquisition controller, rolling buffers và statistics.
- PySide6 Device Manager và Live Monitor.
- 13 kênh trên mỗi găng:
  - 5 Flex.
  - 1 FSR.
  - Accelerometer XYZ.
  - Gyroscope XYZ.
  - Distance.
- Light/dark, keyboard focus, ký hiệu `L/R` và chart controls.
- `configs/gestures.json` cùng validator; chưa có Data Capture UI.
- Tài liệu nền, data directories và test suite.

### Kết quả chốt M1

- `27 passed` tại thời điểm hoàn thành M1.
- Startup smoke test đạt.
- Hai simulator 200 Hz không làm treo UI.
- Pause chart không dừng acquisition.
- Visual QA light/dark tại 1280×720 và 1440×900.

### Giới hạn được giữ lại

- Chưa có firmware.
- Chưa có Serial/protocol v1.
- Chưa ghi raw dataset.
- Chưa calibration/filtering/ML.

---

## 5. Milestone 1.1 — React/PyWebView migration và One UI

**Trạng thái tổng: 🟡 CHƯA HOÀN THÀNH**

React collector đã chạy, đạt parity và trở thành launcher mặc định theo ủy quyền P.0.
PySide, Qt adapter và dependency vẫn được giữ làm rollback. D.2.6 Stage 2B.3.1 đã được
phê duyệt trước đó và V.2.1/P.1 đã nhận phê duyệt visual cuối ngày 2026-09-06;
Milestone 1.1 vẫn chưa hoàn thành vì Phase E cleanup chưa được phê duyệt hoặc thực hiện.

### Phase A — Core preparation

**Trạng thái: ✅ HOÀN THÀNH**

- Tách acquisition core khỏi Qt.
- Giữ Qt adapter làm rollback path.
- Tạo FastAPI health/bootstrap và security boundary.
- Local bridge dùng `127.0.0.1`, port động và token phiên trong RAM.
- Xác thực REST/WebSocket, kiểm tra Host/Origin.
- Tạo Vite + React + TypeScript scaffold và contract/store test.

### Phase B — Vertical slice

**Trạng thái: ✅ HOÀN THÀNH**

- Simulator → Python acquisition → WebSocket → React store.
- Connect/disconnect.
- Raw Flex value và chart đầu tiên.
- Auth, batching, pause và UI heartbeat được xác minh.

### Phase C — Functional parity

**Trạng thái: ✅ HOÀN THÀNH**

- Hai găng độc lập.
- Đủ 13 channel.
- Device Manager và Live Monitor.
- Sample rate, standard deviation, peak-to-peak và packet loss.
- Missing channel hiển thị `—`, không biến thành 0.
- Channel groups/toggles và cửa sổ 5/10/30/60 giây.
- Pause/resume, zoom, cursor và trở lại realtime.
- `L/R`, màu và solid/dashed line.
- Pause biểu đồ không dừng acquisition.

### Phase D — One UI visual implementation

**Trạng thái: ✅ D.2.6 STAGE 2B.3.1 ĐÃ ĐƯỢC USER PHÊ DUYỆT (2026-09-05)**

#### D ban đầu

- React collector light/dark.
- Semantic HTML, keyboard flow, focus state và reduced motion.
- Responsive tại 1280×720 và 1440×900.
- Ảnh review production được lưu dưới `.design-cache/`.

#### Phase D.1 — One UI visual realignment

**Trạng thái: ✅ HOÀN THÀNH KỸ THUẬT**

- Đối chiếu hai master SVG One UI.
- Điều chỉnh shell, app bar, card, control và visual hierarchy.
- Không nhúng master SVG vào production bundle.
- Không thêm dependency.

#### Phase D.2 — Shared design foundation

**Trạng thái: ✅ HOÀN THÀNH**

Đã tạo:

- `app/frontend/shared/one-ui/tokens.css`
- `app/frontend/shared/one-ui/motion.css`
- `app/frontend/shared/one-ui/README.md`

React collector là implementation tham chiếu qua alias `@one-ui-shared`.

Nguồn tham khảo được giới hạn:

- OneUI-Web: chỉ dùng chọn lọc giá trị MIT phù hợp.
- OneUIX: chỉ tham khảo adaptive behavior; không sao chép AGPL code.
- Android-Dex: chỉ tham khảo desktop shell; không sao chép code/asset/binary.

#### Phase D.2.1 — One UI Desktop/DeX shell

**Trạng thái: ✅ HOÀN THÀNH KỸ THUẬT VÀ ĐƯỢC NGƯỜI DÙNG ĐÁNH GIÁ “KHÁ ỔN”**

- Thay navigation rail/top app bar bằng floating bottom taskbar.
- Quick Status có bridge, secure session state, hai găng, tổng sample rate, simulator và theme.
- Keyboard, Escape, outside click, focus return và reduced motion.
- Taskbar không che chart tại 1280×720.
- Không thay backend/acquisition/API/WebSocket.
- Không thêm dependency.

Kết quả kiểm thử gần nhất:

- Python: `42 passed`, 1 warning Starlette có sẵn.
- PySide smoke: exit `0`.
- PyWebView/local bridge smoke: exit `0`.
- Vitest: `2 passed`.
- Playwright/E2E: `3 passed`.
- Vite build: thành công.
- Bộ 10 ảnh light/dark đã được tạo.

Đánh giá trực quan hiện tại:

- Cấu trúc và tính thực dụng tốt.
- Vẫn hơi giống dashboard kỹ thuật.
- Nhiều pill/badge và nested card.
- Typography phụ nhỏ.
- Taskbar/Quick Status chưa thật sự đạt cảm giác Samsung cao cấp.
- Dark surfaces còn hơi phẳng.

#### Phase D.2.2 — Samsung contemporary visual polish

**Trạng thái: ✅ HOÀN THÀNH KỸ THUẬT; KHÔNG ĐƯỢC NGƯỜI DÙNG PHÊ DUYỆT VISUAL**

Kết quả kỹ thuật:

- Giảm nested card, badge và các ô xám nhỏ.
- Tăng typography hierarchy.
- Tận dụng không gian Device Manager tốt hơn.
- Làm chart nổi bật hơn metadata.
- Nâng taskbar và Quick Status theo hướng Samsung/One UI hiện đại.
- Giữ nguyên chức năng, backend, acquisition và dependency.

Kết quả gate:

- Python `42 passed`; hai smoke exit `0`; Vitest `2 passed`; Playwright `3 passed`; Vite build thành công.
- Mười ảnh light/dark đã được tạo cho D.2.2; sau đợt repository hygiene được ủy quyền, bằng chứng còn giữ là contact sheet D.2.2 ↔ D.2.3 tại `.design-cache/artifacts/m1.1-ui-d2-3/contact-sheet-d2-2-vs-d2-3.png`.
- Dù kỹ thuật đạt, giao diện D.2.2 không được người dùng phê duyệt visual và không mở Phase E.

#### Phase D.2.3 — Brand de-genericization và contrast rhythm

**Trạng thái: ✅ HOÀN THÀNH KỸ THUẬT; BASELINE ĐÃ ĐƯỢC KHÔI PHỤC SAU D.2.4**

D.2.3 được yêu cầu vì:

- Logo vuông `SG` mang cảm giác generic/Codex-generated.
- Theme control bị trùng giữa taskbar và Quick Status.
- Thiếu black/inverse CTA có chọn lọc.
- Typography, line-height và spacing chưa đủ thoáng.
- Light mode thiếu alternating contrast rhythm.

Kết quả:

- Taskbar dùng semantic text-only wordmark `Dataset Studio`; không còn square initials logo và không tạo logo asset mới.
- Toàn collector có đúng một interactive theme control tại system-status cluster, có sun/moon icon, mouse/keyboard/focus và preference restore.
- Shared contract có semantic primary/inverse tokens; chỉ `Kết nối tất cả` và simulator `Áp dụng` dùng black/inverse emphasis.
- Simulator configuration là inverse band duy nhất trên Device Manager; Quick Status sample-rate hero dùng inverse surface; Live Monitor giữ chart neutral/dominant.
- Python `42 passed`; hai smoke exit `0`; Vitest `2 passed`; Playwright `4 passed`; Vite build thành công.
- Mười hai ảnh và contact sheet D.2.2 ↔ D.2.3 nằm tại `.design-cache/artifacts/m1.1-ui-d2-3/`.
- Phase E tiếp tục bị khóa cho đến khi người dùng duyệt trực tiếp ảnh D.2.3.

#### Phase D.2.4 — One UI 8.5 tablet composition

**Trạng thái: ❌ VISUALLY REJECTED; ROLLED BACK TO THE VERIFIED D.2.3 BASELINE**

D.2.4 được phê duyệt để sửa khoảng cách giữa dashboard desktop và trải nghiệm tablet One UI 8.5:

- Đã kiểm tra trực tiếp sáu node Figma đã duyệt: Navigation Rail, Top App Bar, Card, Containers, Status Bar và Navigation Bar.
- Floating desktop taskbar được thay bằng adaptive shell: compact rail ở landscape/tablet và bottom navigation ở portrait/narrow.
- Top app bar gom text-only `Dataset Studio`, bridge/session, simulator, đúng một theme control và Quick Status trong các touch target rõ ràng.
- Device Manager dùng paired glove containers và simulator surface responsive; mọi field/action/state/statistic giữ nguyên.
- Live Monitor ưu tiên chart, giữ đủ 13 channel, pause không dừng acquisition và L/R + solid/dashed không phụ thuộc màu.
- Python `42 passed`; hai smoke exit `0`; Vitest `2 passed`; Playwright `6 passed`; Vite build thành công.
- Bộ ảnh light/dark 1280×720, 1440×900, 1024×768, 800×1100 portrait và Quick Status đã được tạo cho lần review bị từ chối; hai bằng chứng cuối được giữ tại `.design-cache/artifacts/m1.1-ui-d2-4/contact-sheet-d2-3-vs-d2-4.png` và `.design-cache/artifacts/m1.1-ui-d2-4/contact-sheet-d2-4-responsive.png`.
- Không thêm dependency, code/asset/font Samsung hoặc Figma-generated code.
- Người dùng từ chối composition D.2.4 sau production review: rail + top app bar + page title tạo hierarchy cạnh tranh, giảm không gian nội dung và không cho cảm giác native One UI tablet ở 1024/portrait.
- Complete rejected patch cùng manifest được giữ trong `.design-cache/backups/d2-4-visually-rejected/`; hai contact sheet cuối của D.2.4 được giữ trong `.design-cache/artifacts/m1.1-ui-d2-4/` để chẩn đoán. Các ảnh rời dư thừa đã được hợp nhất trong đợt repository hygiene được ủy quyền.
- Chỉ `App.tsx`, `styles.css` và `tests/collector.spec.ts` được restore về `HEAD`; fresh rollback đạt Python `42 passed`, hai smoke exit `0`, Vitest `2 passed`, Playwright `4 passed` và Vite build thành công.
- D.2.4 — visually rejected; rolled back to the verified D.2.3 baseline. Phase E tiếp tục bị khóa cho đến khi người dùng duyệt một hướng visual thay thế.

#### Phase D.2.5 — Refined D.2.3 tablet composition

**Trạng thái: `implemented — awaiting explicit user visual approval`**

- Giữ nguyên mô hình full-width ổn định của D.2.3 và cố ý không khôi phục navigation rail, top app bar hoặc hierarchy trùng lặp của D.2.4.
- Bottom application navigation cao 68 px, tối đa 920 px, chỉ có hai destination; `Dataset Studio` xuất hiện đúng một lần dưới dạng text-only identity; toàn ứng dụng chỉ có một theme control.
- Gutter chính là 32 px ở 1280 px trở lên, 24 px ở 1024–1279 px và 16 px trong portrait; title dùng 44/42/40 px. Eyebrow, title, description, metric strip, card và section dùng chung content axis.
- Device Manager giữ hai glove card bằng nhau ở landscape (598 px tại 1280, 678 px tại 1440, 480 px tại 1024) và simulator band phụ cao 132 px; portrait stack trong vùng scroll kết thúc phía trên bottom navigation.
- Live Monitor giữ channel panel 220 px ở landscape; hai chart bằng nhau với plot tối thiểu 330 px tại 1280×720, 430 px tại 1440×900 và 378 px tại 1024×768. Portrait chuyển thành channel grid rồi hai chart xếp dọc.
- Đã đối chiếu có chọn lọc các Figma node Top App Bar `1495:10992`, Card `245:399`, Containers `247:613` và Navigation Bar `1502:19870`; Status Bar và Navigation Rail chỉ là negative reference. Không dùng generated code, logo/font/asset Samsung hoặc Android system chrome.
- Bằng chứng mới nhất: Python `42 passed`; hai smoke exit `0`; Vitest `2 passed`; Playwright `6 passed`; Vite build thành công; `git diff --check` sạch ngoài cảnh báo line-ending có sẵn.
- Ảnh light/dark tại 1280×720, 1440×900, 1024×768, 800×1100, Quick Status và contact sheet D.2.3 ↔ D.2.5 nằm trong `.design-cache/artifacts/m1.1-ui-d2-5/` (ignored).
- Không thay đổi dependency, backend, acquisition, simulator, REST/WebSocket/authentication, `run_app.ps1`, PySide, Qt adapter/dependencies, prototype hoặc production asset. Phase E vẫn khóa cho đến khi người dùng phê duyệt visual D.2.5 trực tiếp.

#### Phase D.2.6 — staged System UI foundation

- Stage 1 shell architecture (system status region, app bar, landscape rail, compact/portrait bottom navigation and responsive mode selection) received explicit visual approval on 2026-09-03. Its geometry is frozen; this approval is not final D.2.6 or Phase E approval.
- Stage 2A's reusable control foundation received explicit visual approval on 2026-09-03. It remains grouped in `one-ui/controls.tsx`: button, icon button, segmented control, labeled/non-color-only status indicator, native numeric text field and checkbox row.
- Device Manager actions/fields/statuses, Live Monitor windows/actions/all 13 channel rows/chart statuses, and the existing theme/Quick Status actions now consume that foundation without changing acquisition, pause, follow-live, zoom or L/R semantics.
- The focused references were Buttons `1497:12222`, Top App Bar `1495:10992`, Slide Navigation `631:2757`, Status Bar `1491:6323`, Live Activity `1491:6362`, Search `1497:12549`, Card `245:399` and Containers `247:613`. Generated code, Samsung fonts/logos/assets and new dependencies were not used.
- Verified evidence: Stage 1 `shell.tsx`/`shell.css` SHA-256 values remain unchanged; Vitest `2 passed`; Vite build succeeded; Playwright `7 passed` with axe, keyboard, reduced-motion, responsive geometry and behavior checks; PyWebView smoke exited `0`.
- Review images and Stage 1 ↔ Stage 2A/responsive contact sheets are ignored under `.design-cache/artifacts/m1.1-ui-d2-6-stage2a/`.
- Stage 2B adds only the grouped overlay/feedback foundation: modal adaptive Quick Status side sheet, one/all disconnect dialogs, resolution-driven snackbars, real indeterminate pending indicators and in-container real state messages. It uses the focused Edge Panel, notification/QS, dialog, toast, Live Activity and Containers references without copying code or assets.
- Stage 2B evidence: shell hashes remain frozen; Vitest `2 passed`; Vite build succeeded; Playwright `9 passed`; Python `42 passed`; PyWebView smoke exited `0`; dependency delta is zero; all 22 classes in the two new stylesheets map to current source.
- Final Stage 2B captures and Stage 2A comparison/state/responsive contact sheets are retained under `.design-cache/artifacts/m1.1-ui-d2-6-stage2b/`.
- Stage 2B was accepted only in overall direction. Stage 2B.1 removes stale uPlot DOM from no-channel/no-source states, sanitizes production error copy, corrects disconnect pending/failure state order and keeps an explicit width-stable pending label without redesigning the frozen shell/control/overlay geometry.
- Stage 2B.1 evidence: Vitest `5 passed`; Vite build succeeded; Playwright `10 passed` with lifecycle, ordering, error-sanitization, axe, keyboard, reduced-motion and responsive gates; PyWebView smoke exited `0`; package manifests and Stage 1 shell hashes are unchanged; dead-selector audit is clean.
- Corrected state images and Stage 2B comparison/state sheets are retained under `.design-cache/artifacts/m1.1-ui-d2-6-stage2b1/`; canonical ZIP SHA-256 is `302ABF34CFFD92B33A608B58C250431B492EAA313319259387911A6B20AED352`.
- Stage 2B.2 applies only the five component-anatomy corrections confirmed by the retained audit: a shared two-region dialog action row, separate time-selector/chart-command groups, a content-hugging landscape application rail, application-owned status-strip semantics without a fake clock, and a single identity/page-title/context hierarchy. The exact three-condition rail query and approved 44/64 px shell rows remain unchanged.
- Stage 2B.2 evidence: Vitest `5 passed`; Vite build succeeded; Playwright `11 passed`; Python `42 passed`; PyWebView smoke exited `0`; axe, keyboard, reduced-motion and effective 200% zoom gates passed; the 97-class selector audit has no unmapped application class after its 15-class uPlot allowlist; dependency manifests and protected user files are unchanged.
- Full/focused light-dark captures, measured responsive geometry and six comparison/reference sheets are retained under `.design-cache/artifacts/m1.1-ui-d2-6-stage2b2/`. The Community kit is a project reference rather than official Samsung certification.
- Stage 2B.3 corrects reuse/adaptation only: one 76 px application-owned Top App Bar replaces the separate 44/64 px rows; the 88 px content-hugging rail and compact navigation reuse two persistent localized icon-plus-label destinations; and chart commands reuse the existing button primitive with product-owned icons while the time selector remains text-only. Cards, charts, simulator, overlays/feedback and domain behavior remain frozen.
- Stage 2B.3 evidence: Vitest `5 passed`; Vite build succeeded; Playwright `11 passed`; Python `42 passed`; PyWebView smoke exited `0`; axe, keyboard, reduced-motion, effective 200% zoom, responsive exclusivity, Quick Status, all-13-channel and chart/acquisition gates passed. Source CSS is 1,067 lines/45,108 bytes and the production CSS/JS bundles are 44,617/290,362 bytes; dependency manifests and protected hashes remain unchanged.
- Full/focused light-dark captures, exact responsive measurements, native-scale Stage 2B.2/Figma/Stage 2B.3 component comparisons and one fixed-scale responsive sheet are retained under `.design-cache/artifacts/m1.1-ui-d2-6-stage2b3/`.
- Stage 2B.3.1 is a narrow correction to the existing pause/resume command only. Both localized labels now remain in intrinsic layout; the inactive state is `visibility: hidden` and `aria-hidden="true"`, so the visible label and icon can switch without changing the button or toolbar geometry. No hardcoded width, text measurement, truncation or component redesign was introduced.
- Stage 2B.3.1 evidence: Vitest `5 passed`; Vite build succeeded; Playwright `12 passed` with trace disabled; direct PyWebView and retained-build launcher smokes exited `0`. Across running, paused, resumed and a second pause/resume cycle at 1280×720 light/dark, 1024×768 and 800×1100, the measured command group, pause action/icon, restore action, time selector, chart cards and plot hosts have maximum delta `0 CSS px`. Keyboard, accessibility, acquisition continuity, follow-live/zoom, 13 channels, Quick Status, responsive navigation and reduced-motion coverage remain green. The 102-class selector audit has one uPlot runtime allowlist entry and zero unmapped classes; dependency and protected-file hashes remain unchanged.
- Stage 2B.3.1 measurement JSON, running/paused/resumed captures and same-scale outlined contact sheets are retained under `.design-cache/artifacts/m1.1-ui-d2-6-stage2b3-1/`.
- User approval: D.2.6 Stage 2B.3.1 được phê duyệt rõ ràng trong brief P.1 ngày
  2026-09-05. Design foundation baseline đã frozen; visual mới của P.1 chưa được suy diễn
  là đã duyệt và Phase E cleanup vẫn cần phê duyệt riêng.

#### One UI Visual + Motion Integration V.2

- Đã xử lý đủ 40 finding Class A/B của audit V.1: 21 `CHANGED`, 17
  `VERIFIED_PRESERVED`, 2 `DEFERRED_WITH_EXPLICIT_REASON`. F39 và phần real-AT của F57
  vẫn chưa xác minh vì NVDA không có và Narrator không thể được đánh giá spoken output
  hợp lệ trong môi trường agent; không tuyên bố pass thay người dùng.
- Semantic tokens, depth, Vietnamese copy, component/icon states, auth/admin local
  composition, snackbar policy, explicit overlay exit lifecycle và reduced motion đã
  được chuẩn hóa. Axe all-severity ở tám context có 0 violation/0 incomplete node;
  forced-colors, grayscale và revocation browser route đạt.
- F42, F43, F44 và toàn bộ geometry đóng băng được giữ trong sai số tối đa 1 CSS px:
  Top App Bar 76px, rail 1260px, chart 900px, effective 200%, device/chart/simulator,
  command group 209×60, restore 88×48 và pause/resume 107×48.
- Verification cuối: Python 63, Vitest 8, Playwright 21, production build và mọi đường
  smoke default/SkipBuild/Legacy/PyWebView/PySide đạt. Không thay dependency, backend,
  auth policy, API/store, acquisition, launcher hoặc rollback.
- Ledger và visual/motion/accessibility/geometry evidence nằm tại
  `.design-cache/artifacts/one-ui-visual-motion-v2/`. V.2.1/P.1 đã được user phê duyệt
  visual ngày 2026-09-06; implementation hiện tại là baseline và không mở V.3, P.2
  hoặc Phase E.

### Phase E — Cutover và cleanup

**Trạng thái: 🔒 CHƯA BẮT ĐẦU — CHỜ PHÊ DUYỆT CLEANUP RIÊNG**

Visual gate Phase D đã đạt. Cleanup vẫn chỉ được bắt đầu sau khi Codex trình đúng danh
sách file/dependency và người dùng phê duyệt trực tiếp riêng.

Product Foundation P.0 đã chuyển `run_app.ps1` sang React/PyWebView mặc định. P.1 xác nhận
visual approval/freeze nhưng không cho phép xóa PySide/Qt. Các bước cleanup của Phase E
vẫn bị khóa và Phase E không được đánh dấu đã bắt đầu.

Trình tự đã khóa:

1. Xác nhận React parity và visual review đạt.
2. Người dùng duyệt trực tiếp ảnh light/dark.
3. Chuyển `run_app.ps1` và default entry sang web shell.
4. Codex trình danh sách chính xác file/dependency PySide đề xuất xóa.
5. Chờ người dùng duyệt cleanup riêng.
6. Chỉ sau khi duyệt mới xóa PySide UI, Qt adapter và Qt dependencies.
7. Chạy lại test, startup, lifecycle và Git artifact checks.

Ứng viên cleanup dự kiến, chưa được phép xóa:

- Các file PySide trong `app/desktop_collector/ui/`.
- `qt_acquisition_adapter.py`.
- `tests/test_acquisition_ui.py`.
- `PySide6`, `pyqtgraph`, `pytest-qt`.

Điều kiện hoàn thành M1.1:

- React là collector UI mặc định.
- `run_app.ps1` mở web shell.
- Không còn Qt adapter/script/dependency không sử dụng sau cleanup được duyệt.
- Python, frontend, E2E, accessibility và lifecycle test đạt.
- Không triển khai phần nào của M2.

---

## 5.1 Product Foundation P.0 — launcher và durable product context

**Trạng thái: ✅ HOÀN THÀNH KỸ THUẬT (2026-09-04)**

- `run_app.ps1` dùng `$PSScriptRoot`, Python 3.12 từ `.venv`, build source React/Vite
  rồi khởi động `app.desktop_collector.shell` theo mặc định.
- `run_app.ps1 -SkipBuild` dùng lại bundle production hợp lệ và báo lỗi rõ nếu bundle
  thiếu; launcher không tự chạy `npm install`/`npm ci` và không fallback sang PySide.
- `run_app.ps1 -Legacy` gọi rõ `app.desktop_collector.main`; PySide UI, Qt adapter và
  dependency không bị thay đổi. `-SmokeTest` cung cấp smoke path hữu hạn cho cả hai.
- [`docs/PRODUCT_CONTEXT.md`](docs/PRODUCT_CONTEXT.md) là nguồn chuẩn cho product intent,
  quyết định một sản phẩm/no-Demo-Mode, vai trò, inventory, quy tắc giao hàng và roadmap.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ghi kiến trúc hiện tại và ranh giới
  tương lai bằng nhãn `Implemented now`, `Planned`, `Decision pending`.
- Checkpoint trước thay đổi đã được khôi phục thử byte-for-byte tại
  `.design-cache/backups/pre-product-foundation-p0/`.
- Verification: PowerShell parser đạt; default/`-SkipBuild`/`-Legacy` launcher smoke
  đều exit `0`; direct PyWebView smoke exit `0`; Vitest `5 passed`; Python `42 passed`
  với một Starlette deprecation warning có sẵn; Vite production build thành công.

Quyết định sản phẩm đã xác nhận:

- Có một sản phẩm tích hợp dần, không có Production/Demo product mode riêng.
- Simulator là adapter developer/researcher hợp lệ; BLE/ESP32 và Recorded Playback là
  adapter planned. Mock/fixture chỉ dùng trong automated test.
- Feature chỉ xuất hiện trong navigation khi có workflow thật, trạng thái phù hợp,
  persistence/state semantics, automated verification và documentation.

Roadmap ban đầu (provisional; không tự cấp quyền triển khai phase kế tiếp):

| Product phase | Scope | Recommended model |
| --- | --- | --- |
| P.0 | Launcher and durable context | Sol High |
| P.1 | Local persistence, authentication and RBAC | Sol High |
| P.2 | P.2.1 Runtime Activity đã được phê duyệt riêng và triển khai; phần còn lại TBD | Sol Medium |
| P.3 | Participant/session/recording workflow | Sol High |
| P.4 | History, search and filters | Sol High |
| P.5 | Kế hoạch cũ cho Now Bar/notifications; đã được thay thế bởi phạm vi P.2.1 được duyệt | Superseded |
| P.6 | Quick actions, settings and preferences | Sol Medium |
| P.7 | Admin/developer console | Sol High |
| P.8 | Dataset quality and AI tooling | Sol High |
| P.9 | Android/Capacitor APK foundation | Sol High |
| P.10 | Native Android BLE integration | Sol High |

P.0 không xác nhận visual cuối, không freeze design system, không triển khai feature
mới và không mở Phase E cleanup.

## 5.2 Product Phase P.1 — local persistence, authentication và RBAC

**Trạng thái: ✅ IMPLEMENTED VÀ ĐÃ ĐƯỢC USER PHÊ DUYỆT VISUAL (2026-09-06)**

- User đã phê duyệt D.2.6 Stage 2B.3.1 và ủy quyền riêng P.1; checkpoint
  `.design-cache/backups/pre-product-p1/` được reconstruct byte-for-byte cho 41 file,
  và `DESIGN_BASELINE.md`/`FILE_HASHES.txt` khóa hash foundation đã duyệt.
- `persistence.py` triển khai SQLite identity ngoài repository, schema version 1,
  migration idempotent, FK, WAL, transaction, UTC/opaque ID và clean shutdown.
- `auth.py` triển khai Argon2id, atomic first admin, generic login failure, bounded
  account backoff, hashed opaque session, idle/absolute expiry, rotation/revocation,
  four-role RBAC, final-admin protection và security audit.
- REST/WebSocket giữ bridge token hiện hữu và thêm user session HttpOnly/SameSite;
  exact Host/Origin/CSRF checks vẫn bắt buộc. Collector chỉ cho researcher,
  administrator, developer; admin API chỉ cho administrator; participant nhận
  functional access-limited account screen.
- React có setup/login/forced password change/account/user management/search/filter,
  create/edit/activate/deactivate/reset/revoke/audit và role-aware navigation. Device
  Manager, Live Monitor, simulator/acquisition và PySide rollback được giữ.
- Contract chi tiết: [`docs/AUTH_PERSISTENCE.md`](docs/AUTH_PERSISTENCE.md). Evidence
  light/dark/responsive nằm trong `.design-cache/artifacts/product-p1/`.
- Verification mới nhất được ghi ở changelog/session log; chỉ P.2.1 được mở theo phê
  duyệt riêng, automated suites đã đạt và đang chờ user visual approval. Phase E không bắt đầu.

---

## 6. Milestone 2 — Firmware, protocol, Serial và Live Monitor thật

**Trạng thái: 🔒 CHƯA BẮT ĐẦU**  
**Phạm vi: ĐÃ KHÓA**

### Firmware ESP32-C3

- PlatformIO firmware cho profile một Flex và năm Flex.
- ESP32-C3 SuperMini dùng cấu hình tương thích ESP32-C3 DevKitM, chỉ điều chỉnh upload setting nếu board thật yêu cầu.
- Profile hiện tại đọc một Flex tại GPIO0.
- Profile tiếp theo dự kiến GPIO0–GPIO4 cho năm Flex.
- Hello message, JSONL framing, sample encoder và CRC32.
- Sensor chưa lắp phải gửi `null` cùng capability/status phù hợp.
- Không giả dữ liệu sensor chưa tồn tại.

### Host protocol và Serial

- Python framing/parser/schema validator.
- CRC32 shared test vectors giữa C++ và Python.
- Sequence tracker xử lý loss, duplicate, out-of-order, wrap và reboot.
- COM scanning và occupied-port diagnostics.
- Serial worker đa thiết bị và safe disconnect/reconnect.
- Legacy adapter cho dòng `ADC: ... | Dien ap: ...` hiện tại.
- Legacy mode chỉ dùng diagnostic/Live Monitor, không được capture dataset chính thức.

### Baud rate

- M1–M2 mặc định `115200`.
- Không tự đổi baud.
- Chỉ cân nhắc `460800` hoặc cao hơn sau benchmark throughput và có người dùng xác nhận.

### M2 acceptance

- Firmware `flex1` và `flex5` compile.
- Python/C++ CRC32 giống nhau trên mọi vector.
- Parser chịu được JSON/UTF-8/CRC/frame lỗi.
- Hai Serial/simulator chạy đồng thời không trộn sequence/timestamp.
- Live Monitor hiển thị raw/statistics/loss/channel status.
- COM bị Arduino Serial Monitor chiếm dụng có thông báo rõ.
- Disconnect không làm treo app.

---

## 7. Hardware gate bắt buộc sau Milestone 2

**Trạng thái: 🔒 CHƯA THỰC HIỆN**

Người dùng phải thử ESP32-C3 thật với một Flex trên GPIO0 và xác nhận:

- [ ] PlatformIO build/upload thành công.
- [ ] COM kết nối/ngắt ổn định ở 115200.
- [ ] Legacy line đọc đúng trong diagnostic mode.
- [ ] Protocol v1 gửi hello và packet hợp lệ.
- [ ] Python và ESP32 cho cùng CRC32.
- [ ] Flex thay đổi đúng trên Live Monitor.
- [ ] Missing sensor trả `null` và capability/status đúng.
- [ ] Sample rate, jitter và packet loss chấp nhận được.
- [ ] UI vẫn phản hồi khi Serial chạy liên tục.
- [ ] Không tự đổi baud.
- [ ] Disconnect/reconnect không treo.

**Không lập hoặc triển khai M3 cho đến khi người dùng xác nhận gate này đạt.**

---

## 8. Milestone 3 — Data Capture và raw storage

**Trạng thái: 🔒 CHƯA BẮT ĐẦU**  
**Phạm vi: ĐÃ KHÓA Ở MỨC KIẾN TRÚC**

### Chức năng

- Data Capture chọn gesture từ catalog; không nhập label tự do trong session.
- Session state machine.
- Manual/auto repetition.
- Countdown, invalid, redo và disconnect policy.
- Append-only writer, periodic flush/fsync và crash recovery.
- Immutable finalize.
- Metadata atomic, SHA-256 và row count.
- Session crash giữ trạng thái `incomplete`, không ghi nối tiếp file cũ.
- Review event, quarantine và CSV export.
- Không overwrite raw data.

### Test chính

- Round-trip session.
- Unlabeled prevention.
- Mixed-source rejection.
- Two-device interleaving.
- Disconnect giữa repetition.
- Periodic flush và crash recovery.
- Finalized raw hash không đổi.

---

## 9. Milestone 4 — Calibration, Dataset Browser và Filter Preview

**Trạng thái: 🔒 CHƯA BẮT ĐẦU**

### Calibration

- Calibration wizard.
- Lưu raw calibration trace.
- Summary P5/P50/P95, bias và axis mapping.
- Gắn firmware, protocol, device, subject và timestamp.
- Không trộn calibration giữa device/subject.

### Dataset Browser

- Danh sách và lọc session/repetition.
- Replay plot.
- Kiểm tra số mẫu, thời lượng, NaN/missing-channel và sequence gap.
- Review overlay và invalid/quarantine state.

### Filter Preview

- Preview filter trên dữ liệu raw mà không sửa raw.
- Lưu filter parameters vào processed export.
- Multi-session export.
- Raw SHA-256 phải không đổi.

---

## 10. Milestone 5 — Hardening, packaging và bàn giao collector

**Trạng thái: 🔒 CHƯA BẮT ĐẦU**

- Kiểm thử toàn bộ domain, firmware protocol, Serial, capture, storage, calibration và filtering.
- Stress `2 × 200 Hz`, UI heartbeat không trễ quá 200 ms.
- Pause chart không dừng writer.
- Storage backlog không mất dữ liệu âm thầm.
- Mất một thiết bị không làm treo ứng dụng.
- Visual QA tại 1280×720, 1440×900, 1920×1080.
- Windows scaling 100%, 125% và 150%.
- Light/dark, keyboard traversal, visible focus, contrast ≥ 4.5:1 và reduced motion.
- Packaging Windows và lifecycle/shutdown sạch.
- Hoàn thiện tài liệu cài/chạy, kiến trúc, firmware, protocol, schema, recovery và giới hạn MVP.

Milestone 5 kết thúc phạm vi **desktop data collector**. Training và inference không nằm trong M1–M5 đã khóa ban đầu.

---

## 11. Roadmap hậu Milestone 5 — Chưa khóa

**Trạng thái: 🧭 ĐỀ XUẤT, KHÔNG ĐƯỢC TỰ TRIỂN KHAI**

Các mục dưới đây phản ánh mục tiêu cuối của dự án nhưng chưa được chốt thành kế hoạch triển khai chính thức.

### Đề xuất M6 — Dataset preparation và model training

- Chốt danh sách 20–30 ký hiệu MVP.
- Chia train/validation/test theo subject/session để tránh leakage.
- Xử lý missing channel và alignment hai tay.
- Baseline model và metric theo từng gesture.
- Confusion matrix để quyết định ký hiệu cần thu thêm.
- Version hóa dataset/model/config.

### Đề xuất M7 — Realtime inference

- Inference pipeline từ hai găng.
- Sliding window và latency budget.
- Confidence threshold, unknown/reject state.
- Debounce/temporal smoothing cho prediction, không sửa raw data.
- Replay offline và realtime phải dùng cùng preprocessing contract.

### Đề xuất M8 — Raspberry Pi 5 integration

- Pi nhận dữ liệu từ hai ESP32 qua BLE.
- Không nối điện trực tiếp hai găng; ghép dữ liệu tại Pi.
- Mỗi ESP32 giữ sequence/timestamp riêng.
- Pi thực hiện alignment, preprocessing, inference và API/Web UI.
- Benchmark throughput, latency, reconnect và startup service.

### Đề xuất M9 — Desktop/mobile product integration

- Desktop app và mobile app dùng shared One UI tokens phù hợp từng form factor.
- Mobile không sao chép nguyên desktop taskbar.
- Hiển thị prediction, trạng thái thiết bị và lịch sử ở mức được duyệt.
- API contract với Pi.
- Packaging, deployment và demo đồ án.

Trước khi khóa M6–M9 cần quyết định:

- Dataset thực tế đã đủ hay chưa.
- Gesture taxonomy và labeling policy.
- Loại mô hình và latency target.
- Pi là inference host bắt buộc hay chỉ là deployment option.
- Phạm vi riêng của desktop, mobile và web.

---

## 12. Trạng thái phần cứng hiện tại

- ESP32-C3 đã upload thành công qua COM8 trong Arduino IDE.
- Core ESP32 `3.3.11` đã cài.
- Một Flex sensor đã đọc được trên GPIO0.
- Giá trị tham khảo:
  - Duỗi thẳng khoảng ADC `3098`, điện áp `2294 mV`.
  - Gập hai đốt khoảng ADC `2937–2939`, điện áp `2185–2186 mV`.
- Mạch thử dùng Flex + điện trở 47 kΩ theo cầu phân áp.
- ADS1115, MPU6050, VL53L0X, năm Flex và FSR chưa được tích hợp hoàn chỉnh vào firmware/protocol chính thức.
- Hai găng chưa có cơ chế đồng bộ clock; host/Pi sẽ ghép theo timestamp/sequence riêng của từng thiết bị.

Thông tin này là trạng thái thử nghiệm, không có nghĩa M2 đã bắt đầu hoặc hardware gate đã đạt.

---

## 13. Hành động tiếp theo tại thời điểm cập nhật

1. [x] Ghi nhận D.2.4 bị từ chối visual, lưu patch/ảnh và rollback có kiểm soát về baseline D.2.3.
2. [x] Triển khai D.2.6 Stage 2B.3 và correction Stage 2B.3.1; pause/resume command geometry ổn định và visual đã được user phê duyệt.
3. [x] Hoàn thành Product Foundation P.0: launcher React/PyWebView mặc định, rollback PySide và canonical product/architecture context.
4. [x] Người dùng duyệt visual D.2.6 Stage 2B.3.1; design foundation được frozen.
5. [x] Triển khai P.1 local persistence, authentication và RBAC end-to-end.
6. [x] Triển khai One UI Visual + Motion Integration V.2 cho đủ 40 finding Class A/B; giữ F42/F43/F44 và các behavior freeze.
7. [x] Người dùng phê duyệt visual V.2.1/P.1; implementation hiện tại là baseline.
8. [ ] Thực hiện human NVDA/Narrator acceptance route cho F39 và phần AT của F57 khi có môi trường phù hợp.
9. [ ] Trình danh sách PySide/Qt cleanup và chờ phê duyệt riêng trước mọi Phase E cleanup.
10. [ ] M2/hardware/protocol vẫn tuân theo gate lịch sử tương ứng; V.2/P.1 không mở M2.

## 14. Cách cập nhật tracker

Sau mỗi phase/milestone:

1. Cập nhật ngày và trạng thái ở đầu file.
2. Chuyển đúng ký hiệu trạng thái; không đánh dấu hoàn thành trước gate.
3. Ghi test command và kết quả mới nhất.
4. Ghi file/audit/artifact quan trọng.
5. Ghi quyết định người dùng và những phần bị từ chối hoặc hoãn.
6. Cập nhật `CHANGELOG.md` và `docs/SESSION_LOG.md` tương ứng.
7. Không xóa lịch sử quan trọng; chuyển nội dung cũ thành decision log nếu cần rút gọn.

## 15. Câu lệnh khởi động hiện tại

React/PyWebView collector mặc định (build source mới nhất trước khi mở):

```powershell
Set-Location C:\Users\ASUS\Downloads\DATN
.\run_app.ps1
```

Tái sử dụng production build hiện có:

```powershell
.\run_app.ps1 -SkipBuild
```

PySide rollback rõ ràng:

```powershell
.\run_app.ps1 -Legacy
```

Smoke hữu hạn dùng `-SmokeTest`; có thể kết hợp với `-SkipBuild` hoặc `-Legacy`.
Launcher không cài/cập nhật dependency tự động.
