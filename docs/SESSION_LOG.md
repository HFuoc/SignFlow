## 2026-10-19 - Publication checks and Windows clean-install workflow

Full local pytest:601 passed,2 deprecation warnings,75.59s. Previously verified
84 frontend tests,production build,4 asset-installer tests and real-worker demo.
Added .github/workflows/windows-setup.yml to validate a fresh Windows checkout,
setup,CPU model loading,launcher smoke and full tests on GitHub after push.
This workflow has not run yet and is not evidence of a successful clean install.
Local clean installation remains blocked by C disk exhaustion and declined D-cache
retry. No retry of the declined command was made.

Publication clone synced and staged248 changed/new files, including the current
app,56 bundled artifacts,README/demo and setup. No raw archive,credentials,
node_modules,venv or build directories selected. Pattern/size scan of374 copied
paths found0 findings; this is a bounded scan,not proof against every secret form.
Reviewed bridge/shell delta: authenticated bounded camera stream and shutdown;
no host/origin/token bypass. Default model,launcher and accuracy gates preserved.
Git diff --check reports pre-existing controls.css blank line at EOF; no unrelated
formatting performed. Local workspace has no Git; publication clone preserves
main history. Pending:commit/push,remote SHA and fresh Windows workflow verification.

## 2026-10-19 - CPU asset bundle and actual app video prepared (not published)

Added setup.ps1 CPU worker install (DesktopOnly opt-out), configs/recognition-requirements.txt,
configs/recognition-assets (56 files, 11,032,535 bytes plus attribution/manifest),
app/desktop_collector/install_recognition_assets.py and its four tests.
Installer preflights SHA256/size/path bounds and refuses conflicting local assets.
Existing research model identities/default/thresholds remain unchanged.

Recorded docs/demo/reference-tracking.webm, 1,379,796 bytes, 332 decoded frames,
25fps/13.28s. Actual app/bridge/worker replay test passed, shutdown asserted;
owned Vite PID14100 had to be stopped before runner exited0. Video contact sheet
inspected. Source Chao produced final Toi (incorrect source-label match), retained
and disclosed in docs/demo/README.md and README. No mocked inference, webcam,
accuracy claim or token-bearing traces. Video source attribution included.

Verification: installer56 hashes PASS;4 installer tests PASS;84 frontend tests
PASS; production build PASS(existing >500KB warning). Setup parser PASS after
fixing Windows PowerShell inline-node quoting discovered by actual execution.
Full setup blocked: sandbox uv cache permission failure, escalated retry failed
because C drive is full. Request to retry with D cache/temp was rejected by user.
Do not repeat that rejected execution without new authorization. Clean checkout
installation has NOT passed. GPU/KVSL extra provisioning remains unfinished.

Publication clone contains373 copied current source/docs/assets; no deletions,
commit or push yet. Full staged review, secret/asset audit and affected backend
suite remain. Git diff --check reports existing controls.css blank EOF; do not
reformat unrelated source merely to remove it. Need sync subsequent edits into
clone before publication. README now links real video and documents CPU setup.
Next: complete provisioning scope, validate a fresh installation when environment
permits, review and publish requested source to SignFlow main. Goal remains active.

## 2026-10-19 - SignFlow publication preparation in progress

User explicitly requests publishing necessary project files to HFuoc/SignFlow,
reproducible setup, and an actual app tracking/result recording from reference
video linked in README. This authorizes publication and reference replay recording;
it does not close webcam accuracy, hardware, or default-model gates.

Workspace has no .git. Read remote heads and cloned main into ignored
.design-cache/signflow-publication; baseline c49a2aa70930ed38fdd289c1a4a753a9f535317c.
No push or commit yet. Use command-scoped safe.directory for sandbox reads of
that clone (owner differs), without changing global Git configuration.

Added setup.ps1: checks uv/Node and Python3.12, preserves an existing environment,
installs host dependencies (optional tests), runs npm ci and production build.
PowerShell parser check passed. Setup itself has NOT yet been executed from a
clean checkout. README still needs replacement: its camera/recognition claims
are stale. Current recognition runtime/models/references depend on ignored
.design-cache paths; packaging and isolated runtime setup remain required.
No model or threshold changed; launcher preserved, including pre-existing stray
literal 2 inside Stop-Launch (inspect/fix as part of launcher setup review).

Next: package licensed runtime assets with provenance and checksums, provision
isolated inference environment, record real app tracking/results, update README,
verify fresh checkout and affected tests, review full staged diff/secrets/assets,
then push requested scope to main without rewriting history. No demo exists yet.

## 2026-10-19 - Diagnose repeated webcam rejection and add explicit completion

User reports reference clips are useful but webcam attempts never produce a word;
clarified that both incomplete/missing-hand and uncertain/outside-vocabulary notices
occur. Inspected camera/worker/encoder/threshold paths and the retained upstream
GH extraction code. No demonstrated packing/mirror mismatch was found. Confirmed
TCN stillness-only endings, frozen0.9992662072181703 acceptance and hidden rankings
on rejection. No user failure recording was available, so do not assert these
code observations fully explain the user's incorrect classifications.

Implemented segment-ID-bound manual completion on a fresh authenticated frame.
Idle/stale clicks cannot start/end a new sign; gaps and duration limits still win.
Fixed the post-final rearm deadlock when hands are lowered out of view. Active
occluded signs still cannot finish merely because tracking disappears. Added safe
candidate metadata to TCN Capture/Auto and VideoMAE decisions with host validation.
UI reuses existing OneUI buttons (1497:12222), result list and key/value primitives;
no redesign/assets/dependencies or catalog edits. Candidates stay visibly
unconfirmed, including OTHER winning; normal accepted-word contract is unchanged.
Manual Capture's Finish control now works with all model choices.

Browser with the real isolated TCN and a retained Chao human video fixture:
manual_finish evaluated33frames, hand coverage2/3. Native OTHER0.959321;
supported guesses BAC-SI0.040389, DAU0.000288, ROI0.000000946. This source sign is
outside the GH25 vocabulary, so this validates plumbing/rejection/display only.
It is not a physical camera, a matching GH positive example, or improved accuracy.
Three real-app viewport screenshots and Axe passed. Vite PID28616 lingered after
the successful test; stopped only that test-owned PID, runner then exited0.
Bridge shutdown assertion passed. CIM process lookup was denied; the PID was
already known from the runner's WebServer log. No broad process termination.

Initial unit run failed because new host tests passed Python tuples instead of
JSON lists and an old test expected the now-fixed rearm deadlock. Fixtures now
roundtrip through the wire encoding; updated rearm assertion still checks no word
is emitted during permanent hand loss. Initial build caught incomplete TS fixture
identity; corrected the fixture and build passed. Default-path launcher smoke
could not initialize account storage under sandbox permissions. Smoke with a
unique process-local LOCALAPPDATA under system TEMP passed without touching user
accounts. Final commands/results and scoped diff inventory are in the handoff.

## 2026-10-19 - Implement tracking speed and edge-on recovery work

User resumed implementation, then clarified that the missing-hand pose is edge-on
presentation toward the camera. Read canonical context/tracker/handoff/schema;
Git metadata remains absent. Scoped before snapshots and all temporary evidence
are under `.design-cache/tracking-20261019/`; no secrets or user camera recordings
were read. Used retained public RGB reference clips, not GH skeleton replays.

Experiments: removing the face subgraph barely improved latency; standalone Hands
lost more detections; doubling TCN tracking size360→720 did not improve aggregate
coverage. These alternatives were not shipped. Pose-lite download was blocked by
sandbox networking and was abandoned; no dependency/model replacement was made.
XNNPACK inference2threads reduced compute time and kept all2250 landmark groups'
presence and coordinates exactly equal across750frames. Four threads offered
little additional benefit; six were slower. Shipped2threads with pinned runtime.

Added TCN-only palm recovery on original camera pixels. Current visible pose
wrists anchor identity, ambiguous/duplicate matches are rejected, failed searches
cool down100ms; after success each new frame is checked until primary tracking
returns or recovery fails. Stateless detection avoids stale ROIs and repeated
graph/model warm-up. Gap reset and worker teardown close both graphs. This changes
TCN features, so stream preprocessing is explicitly `-stream-palm-recovery-v2`.
Capture, weights, threshold and all other provider preprocessing remain unchanged.

Added rVFC wakeup for fresh frames, preserved full pixels and one pending frame,
and instrumented capture, authorization, worker roundtrip and bridge durations.
Added1080p/720p/540p camera requests, all60fps, default1080p preserved. UI uses
the existing OneUISelectField; catalog anchors1497:11901/1497:12842, no new assets,
geometry or Figma-catalog edits. Quality tradeoff and experimental recovery are
visible. No physical camera activated; no launch/default-model cutover.

Final offline worker comparison:25clips750native source frames (625warm timing
frames); repeated still tails serve boundary checks only and are excluded from
FPS metrics. Mean34.078→25.010ms, p9536.314→42.714ms; inverse mean29.34→39.98FPS
is WORKER-ONLY, not end-to-end camera rate. Hand slots1202→1217of1500; any-hand
frames688→689of750.15final decisions remain rejected,10clips have no boundary;
decision/native-argmax/status comparison unchanged. This does not prove known-word
accuracy or edge-on robustness on the user's camera. Recovery improves some
missing-hand frames at a measurable tail-latency cost.60FPS goal remains open.

Browser/verification completion and exact commands are in WORK_SESSION_HANDOFF.md.
Resumed browser3quality check passed:12s each,1080p7.57FPS/131.36ms meanRTT,
720p13.30FPS/74.20ms,540p15.46FPS/63.98ms. Software-rendered camera fixture,
not a physical webcam. Ordered fresh frames and hand outputs were checked;
1440x900/1280x720/820x1180 screenshots captured. Vite PID29088 needed owned-process
cleanup after the test passed; runner exited0 and bridge shutdown assertion passed.
An earlier run failed on immediate Auto restart while the old worker was still
closing. Test now waits for socket closure plus1.5s between profiles; rapid user
restart remains a known `stream_busy` risk, with a roughly2s wait workaround.
Frontend78tests/build and launcher smoke passed. No full browser suite or new
dark-theme/accessibility audit. Final affected pytest:353passed in56.13s with
2existing deprecation warnings. Git status/diff/check unavailable(no.git); reviewed
18changed source/test/doc files against scoped snapshots; no added trailing whitespace.
Early browser attempts failed from a temporary config path and a worker-scoped
Playwright option placed in a describe; both test setup errors were corrected.
Windows Vite teardown still needs stopping only the runner-owned PID after tests
finish; bridge lifecycle assertion is checked separately. No broad process kill.

## 2026-10-19 - Prepare tracking optimization handoff

User reports low tracking FPS, missed rapid movement and missing horizontal hands,
despite a reported1080p/60fps camera, and requests60fps tracking next session.
Read canonical state and current camera/stream/tracker code; no camera activated.
Confirmed current MAX_FPS=60; frontend negotiates up to60 but permits only one
frame in encoding/processing at a time, awaiting the previous acknowledgement.
Browser requests ideal60fps rather than guaranteeing camera delivery. It sends
full-resolution RGBA when negotiated;1920x1080x4=8,294,400bytes/frame, or497,664,000
payload bytes/sec at60fps before additional copies. These are calculated loads,
not measured throughput. TCN then resizes to360x360 before Holistic complexity1.
The classifier runs at sign end, whereas Holistic processes each streamed frame.

Inspected prior synthetic browser evidence: only4no-hands frames; median
tracking32.91ms and worker processing34.13ms, with startup/scheduling effects.
This is too small and unlike real signing to establish sustained FPS, latency
distribution, the user's baseline, or a root cause for horizontal-hand misses.
Receipt:.design-cache/tracking-priority-20261019/inspection.json.

Documented a next-session profiling/optimization plan with honest fresh-frame
metrics and separate detection/reacquisition checks. Candidate hand-focused ROI,
transport and acceleration changes remain proposals requiring measured comparison,
feature compatibility and regression verification. No source/config/model edits.
Only PROJECT_CONTEXT,PROJECT_MILESTONE_TRACKER,CHANGELOG,SESSION_LOG and
WORK_SESSION_HANDOFF changed. Git unavailable because workspace has no.git;
scoped before snapshots retained. No tests rerun for this documentation-only turn.

## 2026-10-18 - User requests reference movement and TCN Auto

User correctly points out that word names alone do not explain how to sign and
asks to integrate Auto. Implemented experimental final-only TCN streaming through
the existing worker/transport. Kept frozen weights and acceptance threshold,
correct GH137 resizing/packing, pre-roll, stillness, gap reset and truncation rejection.
Frontend now validates the TCN provider and subset-softmax on streamed predictions.

Rechecked publisher GitHub README/search; no usable matching original RGB download
obtained (attempted videos tree via browser returned cache miss, not proof of absence).
Generated explicit landmark replays from25 verified training segments, preserving
source receipts and MIT license. No validation/test exemplars or score-based selection.
Reused existing authenticated ReferenceCatalog/media bounds and viewer controls.
Draft render v1 had lower-body content crowding hand detail; v2 keeps upper-body
view separate.25clips,731frames,5,878,353bytes decode correctly; v2manifest pinned.
These are not original human video or semantically verified sign instructions.

Tests:23targeted Python passed; full affected recognition+GH experiment suite341
passed in70.59s (2existing deprecation warnings);74Vitest passed; final build passed
with existing chunk-size warning; launcher -SkipBuild -SmokeTest passed. Playwright
TCN integration passed: two fake-camera captures rejected for missing hands, reference
loads/plays, Auto authenticates asTCN and produces tracking without invented words.
Three viewport screenshots and Axe checks passed. Test Vite PID31800 needed explicit
cleanup after the test; runner then exited0 with1passed. No physical webcam activated.

Evidence:.design-cache/gh-tcn-auto-20261018/. Scope snapshots used because no.git
metadata exists. No dependencies, raw data, defaults, firmware or launcher edited.
Next gate: human RGB/competent-signer verification and multi-user webcam/unknown/idle
assessment; this task establishes integration only.

## 2026-10-18 - Integrate trained TCN for user webcam tests

User authorized "tích hợp để tôi test" and continued the session. Added a separate
experimental Capture provider for the existing GH25+OTHER epoch44 artifact.
Verified source pose indices and resize360/Holistic0.5 settings against the cached
publisher extractor. Reused the exact offline encoder and normalization. Native
OTHER and threshold rejection remain distinct, with no25-way renormalization.
No default replacement, Auto implementation, runtime install or webcam activation.

Validation:328 affected pytest cases passed in85.54s; after adding pipeline and
stream-denial coverage, final provider file14 passed in0.68s. Vitest73 passed;
production build and shell smoke passed. Existing Vite chunk-size warning remains.
Real CPU2.5.1 replay matched all4,541 saved predictions and frozen S05/S06 decisions.
Playwright TCN test passed (two real-worker fake-camera captures, both rejected
for missing hands; viewport1440x900,1280x720,820x1180 and accessibility checks).

Initial pytest failed on the protected default temporary directory; moving its
base inside the repository then hit the intentional identity-storage guard.
Reran with a unique directory under system TEMP, outside the source tree: passed.
Used npm.cmd because PowerShell npm.ps1 execution is restricted. First browser
assertion expected raw worker text instead of sanitized job error; corrected test,
then passed. The test's Vite processes did not exit promptly; stopped only its
known PIDs20260/30452, after which runner exited0 with1passed. App bridge shutdown
assertion passed. No account/bridge credentials included in evidence or logs.
Final launcher `run_app.ps1 -SkipBuild -SmokeTest` also passed (PowerShell process
execution policy set for this invocation only); test Vite port5173 was released.
Scoped snapshot diff reviewed and added-line whitespace checks passed.

Evidence: .design-cache/gh-tcn-integration-20261018/ (before snapshots, replay.json,
pytest.log, browser-test.log, browser screenshots and sanitized job results).
No .git metadata is available; Git status/diff checks cannot run. Reviewed scoped
changes against before snapshots instead. Remaining gate: independent multi-user
physical-camera/unknown/idle evaluation before Auto or model-default cutover.

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

Verification:91 affected tests PASS (40.48s); cropped-vsl CLI actual-data creation
and identical rerun PASS; shell --smoke-test PASS; actual CUDA replay completed.
Initial pytest attempt failed all34 setups because the default Windows temp
directory was inaccessible; workspace --basetemp resolved this. Initial probe
launch from .venv failed before inference (no mediapipe distribution there);
rerun using the established isolated extraction environment succeeded.
No dependency install, training, webcam activation, app/default/launcher change.
Frontend suites/build not run (no frontend changes). Git metadata absent; use
saved before-bytes and scoped no-index diff checks, not an invented clean status.

Next: resolve the current-25 coverage gap (vocabulary preference was asked but
no answer yet) and source eligibility, then acquire/validate the selected data,
freeze signer/recording partitions before augmentation and train a comparable
baseline. Independent multi-user webcam, idle/unknown, temporal boundaries and
latency still gate model cutover. No claim of improved or optimal recognition.
Physical hardware, Qt, launcher and visual gates remain unchanged.

Detailed source links, counts, limitations, workflow and commands:
[VSL_MULTIUSER_DATASET_REVIEW.md](VSL_MULTIUSER_DATASET_REVIEW.md).
Evidence: .design-cache/multiuser-data-20261018/.

## 2026-10-18 - User correction:25signs are an extensible MVP

User explicitly rejects framing the accuracy problem as a few wrong words.
Recorded vocabulary growth as a product requirement in PROJECT_CONTEXT.md.
Earlier15clip/five-sign proposal is diagnostic only; personal adaptation is an
optional experiment, not the approved long-term architecture. Current25sign
implementation/acceptance scope and all gates remain unchanged.

Documentation-only: PROJECT_CONTEXT.md, CHANGELOG.md, docs/SESSION_LOG.md,
docs/WORK_SESSION_HANDOFF.md and ignored accuracy plan clarification. Verified
prior document bytes preserved. Product tests/build NOT RUN; no source changes.
Git unavailable (no metadata). Next: assess a reusable recognition/data/evaluation
foundation; do not infer authorization to implement later vocabulary/features.

## 2026-10-18 - Accuracy strategy audit; no saved webcam failures

User requests a substantial accuracy improvement after repeated parameter/model
iterations and explicitly confirms no webcam clips have been saved. Read-only
pipeline/data review identifies missing reproducible failure inputs, a full-frame
tracking versus center-cropped VideoMAE coverage risk, and fixed4second Capture
with16uniformly selected frames. At16:9 the ideal center-square retains56.25%
of width. A synthetic1second motion within4seconds contributes4/16samples.
These are structural risks and illustrative arithmetic, not confirmed causes of
the user's failures. Center crop follows publisher inference; no claim it is
an accidental bug. Auto and real-camera accuracy gates remain unverified.

Recommended PROPOSAL: preserve user-selected failed captures and exact model
inputs, replay15diagnostic clips, fix proven framing/temporal input issues first,
then test small personal adaptation of the existing local encoder if needed.
Use separate adaptation/validation/test recording sessions and keep all25labels.
No new model/LLM, parameter tuning, camera capture, personal training or data
retention behavior was implemented or approved by this audit. No guaranteed
accuracy or numerical gate closure; thresholds and adaptation choice stay TBD.

Evidence/plan: .design-cache/accuracy-review-20261018/{PLAN.md,audit.json,record.py}.
Primary research supports domain/signer adaptation as a possible direction, not
project-specific proof. Prior source-reference and LLM probes cannot establish
webcam improvement. Agreement between models is not proof of correctness.

Changed only ignored audit artifacts and CHANGELOG.md, docs/SESSION_LOG.md,
docs/WORK_SESSION_HANDOFF.md. Verified deterministic crop/sampling calculations,
source hashes and Python syntax; actual CPU-only synthetic crop confirms edge
markers removed and crop-then-process equals full processor (max abs diff0.0).
No model weights loaded. Product suites/build NOT RUN (no source changes).
Git status/diff unavailable because there is no Git metadata. Unrelated files,
camera state, key.text, original datasets, launcher and runtime remain untouched.
Next gate: user-initiated real-camera diagnostic capture/evaluation before a
personal-adaptation or provider-cutover decision. All existing gates stay open.

## 2026-10-17 - User-approved GPT-6 Luna subscription trial

User authorized trying Luna via the ChatGPT/Codex pool. Verified existing Codex
ChatGPT login outside sandbox (sandbox initially said not logged in). No API
key supplied, no billing activation, no credentials read/copied into artifacts.
Ran isolated codex exec gpt-6-luna/low with16orderedPNGframes and timestamps per
clip,25label enum+UNKNOWN, no hints, no project docs or prior conversation.

Nine reference clips:4correct,5UNKNOWN,0wrong labels; median wall6.844s,
range5.938-8.938s. These are public224px source references,
not independent webcam accuracy. Gemini's prior same9clip independent result
was5correct/4wrong; media/prompt/timing differ, so no model-only comparison claim.
Luna timing includes CLI startup; Gemini timing was API-only.

Initial Chao smoke also returned correct label, but harness misclassified a CLI
skills-budget error item as tool use. Preserved that attempt; fixed parsing and
repeated Chao for the9clip evaluation. All10turns completed. All9evaluated
outputs valid JSON with no tool calls. CLI skills-budget warnings remain recorded.
Input tokens across10turns:193813; output:155.
Counts include context/images; pool percentage and monetary cost NOT measured.

Delivered evidence/scripts only: .design-cache/luna-probe-20261017/
{prepare.py,run.py,report.py,manifest.json,schema.json,results.json,summary.json,
REPORT.md,inputs/}. Checked source and144frame SHA256 values, script compilation.
No runtime/UI/dependency/data/model/launcher changes or camera activation.
Changed durable records: CHANGELOG.md, docs/SESSION_LOG.md,
docs/WORK_SESSION_HANDOFF.md. Product suites/build NOT RUN (no product edits).
Git status/diff unavailable: workspace has noGitmetadata; preserve existing work.
Next gate: personal-webcam evaluation before integration/default selection.
Current Luna path works technically but4/9recognized is insufficient to claim
an accurate MVP; latency, idle/unknown and all existing acceptance gates stay open.

## 2026-10-17 - Paired Gemini workflow benchmark (partial: quota exhausted)

User authorized testing and an optimized workflow recommendation. Executed Gemini
3.8Flash on identical public-source reference clips, independent vs cached
VideoMAE top3hints. Verified clip SHA256 against prior local inference receipts.
Requested8FPS, temperature0, low thinking, maxOutputTokens2048, enum label-only
JSON. Same settings across modes; order alternates. No local inference rerun.

Nine complete pairs: independent5correct/4wrong; hinted9correct/0wrong.
All18successful responses have valid JSON. TwoHTTP429 responses also occurred:
5RPM first (resumed with pacing), then20requests/day (stopped). Initial25pair
plan reduced to10pairs plus3wrong-hint controls after rate limit; tenth pair
and ALL wrong-hint controls remain incomplete/not run. No quota bypass/billing.
These224px/30frame references overlap local model training sources. Hinting can
copy already-correct predictions; no webcam accuracy, optimality or robustness
claim. Unknown/idle and latency including live capture remain untested.

Correction: Thuc an IS a canonical label. The earlier An->Thuc an response was
a wrong-class prediction, not an out-of-vocabulary response. Prior records below
are corrected accordingly; original API receipts remain unchanged.

Recommended proposal: complete manually bounded webcam clip -> independent
Gemini prediction and separate local comparator -> agreement/abstention decision.
Do not seed Gemini with local guesses by default before wrong-hint/webcam tests.
Retrospective agreement on9pairs accepts5correct and withholds4; this is not
validated accuracy. Full proposal and measurements: ignored artifact
.design-cache/gemini-free-probe/comparison/WORKFLOW.md and results.json.
No app integration, UI, dependencies, raw data, models, launcher or gates changed.

Checks: realAPI18successes/2quotaerrors; script py_compile passed; literal-key
scan over probe Python/JSON found no key. Product suite/build NOT RUN because
no product source changed. Git status/diff unavailable (no Git metadata).
Changed: existing ignored probe.py; new ignored benchmark.py and comparison
receipts/report scripts; CHANGELOG.md, docs/SESSION_LOG.md and
docs/WORK_SESSION_HANDOFF.md. No key content displayed or persisted in receipts.
Next gate: explicitly initiated personal-webcam evaluation on quota availability;
integration/default-provider decision remains open. No pretrained dependency is
intrinsically required by Gemini; comparator is a proposed error-control option.

## 2026-10-17 - User-authorized Gemini API key experiment

User requested testing the Free Tier key in local key.text. Read the key only
at runtime; never copied it into source, request URLs, or receipts. Added
/key.text to .gitignore. No app integration, billing activation, camera capture,
dependency installation, training, model cutover or acceptance gate change.

Executed stdlib Python probe in .design-cache/gemini-free-probe/probe.py.
Initial legacy-key-format check rejected the file without exposing its content;
single-line key support then allowed the actual Google API test. Sandbox network
access failed (WinError10013); approved escalated execution succeeded.
GET models returned HTTP200. Gemini3.8 Flash generateContent returned HTTP200
on three existing public-source reference previews at requested8FPS. All25
candidate labels were supplied, but individual expected labels/filenames were
not sent. No visual-text masking was performed, so label leakage remains possible.

Results against unverified source labels:
- Chao: Chao, STOP,8.51s.
- Thuc day: partial JSON predicting Nho, MAX_TOKENS,11.73s.
- An: Thuc an (wrong class; it is in the allowed vocabulary), STOP,7.34s.
Only1/3 exact label matches; the truncated response is not valid usable JSON.
These are three exploratory source clips, not an independent accuracy estimate.
maxOutputTokens1024 includes thinking; no retry or token-budget tuning performed.
Total reported tokens6428. Key works, but API responses do not establish billing
tier or zero charges; Free Tier status comes from the user, not a billing audit.
No quota rejection observed. Subsecond recognition is not achieved in this probe.

Evidence: .design-cache/gemini-free-probe/{models.json,video-results.json,probe.py}.
Opaque response thought signatures removed from saved receipts. Existing key file
unchanged. Git status/diff unavailable because this workspace has no Git metadata.
Changed durable files: .gitignore, CHANGELOG.md, docs/SESSION_LOG.md,
docs/WORK_SESSION_HANDOFF.md. No product tests/build run (no product source change).
Next gate: any app integration needs a separate decision; current physical-camera
25-sign, unknown/idle, boundary and latency acceptance gates remain open.

## 2026-10-16 - VideoMAE failure repair and 25-word acceptance audit

Resumed the user's no-result report with VideoMAE GPU25, including both Auto and
Capture failures. Reconciled project docs and preserved89 existing files before
changes. No Git metadata is present; task-owned comparisons use before.zip and
hashes. User's latest scope is accurate recognition of the existing25 words.

Actual direct-worker tracing reproduced CUDA OOM during cuDNN Conv3d warmup.
Disabling cuDNN only in the isolated VideoMAE runtime retains CUDA FP32/pinned
weights and allows startup/tracking. Added bounded safe memory/runtime error
classification through worker IPC and job results. UI now distinguishes stopped
recognition from an active camera, and clears stale upload text after failure.

Real browser Capture returns the wake-up word on RTX2050, switches to Auto and
draws hands. Extended single-reference Auto has one no-final timeout and a later
correct completed-word pass(score0.980817); automatic boundary reliability is
still open. All25 derived-reference captures:24 matching accepted, Xe dap rejected
at0.2832, zero worker errors. Warm total median2.727s. Source overlap means these
are regression checks, not independent physical-camera accuracy. No retraining,
threshold relaxation, default-provider switch, dependency or launcher changes.

Checks:311 affected backend tests,73 frontend tests, five browser cases, build,
shell smoke and unchanged launcher smoke pass. The extended Auto case initially
fails then passes a diagnostic rerun; no claim of stable completion is made.
Initial route-glob and HMR test issues were corrected. One Capture failure lacked
a detailed receipt; later real runs succeed. Parallel test execution hit host
memory exhaustion, including CLR startup failure; completed checks ran serially.
Disk C was near198MiB free. No unrelated apps/processes/files were modified.

Actual screenshots show the application on reference replay, not a physical user.
Receipts and detailed commands, changed files, limitations and next acceptance
gate are in docs/WORK_SESSION_HANDOFF.md and the ignored task evidence folder
.design-cache/camera-worker-failure-20261015. MVP remains unaccepted pending
personal-camera25-word, idle/unknown, Auto reliability and latency evaluation.

## 2026-10-15 - Approved VideoMAE GPU integration and resumed verification

User approved the proposed experimental integration and later resumed the session.
Read canonical context/tracker/handoff/schema/assets and preserved a before.zip /
SHA256 snapshot in ignored task storage. Git status/diff cannot run: no .git in
this workspace. Preserve existing launcher/source work and prior throughput work.

Added pinned RGB metadata/policy and an isolated CUDA provider using strict numeric
weight loading. Connected Capture, Auto, catalog, authenticated provider selection,
model-specific readiness/prediction validation and existing 25 reference previews.
New score kind preserves native probability mass. Added conservative abstention,
empty top-k on uncertainty and visible reasons. GPU Capture retains the same worker
between clips. Service reservations prevent simultaneous Capture/Auto models and
release idle manual workers before streaming. CPU/GPU handshakes advertise only
their supported providers. V25 remains default/selectable; no launcher change.

Real CUDA Capture of an existing reference returns Thức dậy. Warm request1418.61ms
(model235.47ms, preprocessing1121.72ms), same PID and zero process cold start.
First requests varied11.33-70.49s. Auto53-frame replay ends without a correct final;
extended73-frame replay produces correct tentative words but rejects final score
0.753568. Do not call these physical accuracy tests or claim the Auto issue fixed.
No local training; publisher notebook records5 head epochs plus20 full fine-tuning.

Final verification:297 affected Python tests pass (48.45s, two dependency
deprecation warnings);73 Vitest tests pass; TypeScript/Vite build passes.
Four distinct browser cases pass: new GPU selection/rejection/return-to-V25 plus
three existing Auto lifecycle/display/reset cases. New case renders both themes
at1280x720,1440x900,768x1024 and reports zero scoped WCAG A/AA violations.
Shell smoke and unchanged run_app.ps1 -SkipBuild -SmokeTest both exit0.
Mocked browser predictions are never treated as ML evidence.

During iteration, default sandbox C-temp permission failures were resolved with
outside-repo D:\SmartGloveTestTemp; using an in-repo database test temp was correctly
rejected by identity-storage policy. A stale catalog-count assertion11 was updated
to12; the initial GPU browser test incorrectly used selectOption on the existing
One UI button combobox, fixed to click its listbox option. An automatic approval
review failed from usage limits before one rerun; user resumed and the rerun
subsequently executed successfully. These were not passed checks at the time.

Updated context, tracker (experimental approval only), qualification, schema,
asset inventory, changelog and handoff. No semantic/physical/production gate
closure, new personal dataset, retraining, push or unrelated cleanup.
Source diff/AST/added-whitespace and prior-document preservation are audited
against before.zip in verification.json; no clean-Git claim.

## 2026-10-15 - Executed CUDA replay and authorized safe disk cleanup

Resumed GPU verification, retaining the user's report of Thức dậy changing words
and ending incorrectly. Confirmed app provider remains V25 with no unknown reject;
no physical reproduction or VideoMAE integration. Inspected scope/handoff/source
and Git state (no Git metadata).

Initial torch import failed with WinError1455; C had about 244MiB free and virtual
headroom was low. User authorized safe C cleanup. Deleted disposable caches/temp
files under explicitly bounded AppData roots, skipping recent/locked/reparse entries.
Report records 1,708,537,258 logical bytes removed and 1.58GiB observed free-space
gain. Automatic pagefile grew 4960 -> 6559MiB, consuming most reclaimed disk space.
No manual paging setting, app shutdown, personal-file or installed-extension removal.
Additional Windows Update cache was inspected only, not deleted with services active
and no administrator token. C still needs more headroom.

Installed torch 2.6.0+cu124 from the official PyTorch index into an isolated --target
directory; existing torch 2.5.1+cpu unchanged. Transient uv cache rename retry resolved.
Approved execution outside sandbox ran the exact pinned VideoMAE checkpoint on
RTX2050 in FP32, synchronized timings: 39/39 source matches, nine Thức dậy included,
31/31 prior CPU top-one matches; warm model p50/p95 276.32/289.41ms. Prefix tests
show 1/8/9/9 matches at 25/50/75/100 percent on the nine wake-up clips. Training
source overlap, unverified semantics and absent physical testing remain limitations.

Evidence: .design-cache/pretrained-vsl-audit-20261015/gpu-probe.json and
c-cleanup-report.json. No app/model cutover, training, webcam, production dependency
change or regression suite. Hash/syntax/replay/doc-preservation checks recorded in
gpu-verification.json. Updated context, qualification, changelog and handoff; no
milestone or acceptance-gate closure.

## 2026-10-15 - Pretrained VSL verification using existing labeled data

User conditionally selected pretrained recognition if compatibility could be checked,
noting datasets already have labels. Audited public VideoMAE VSL, ViSignRe,
SIGNTEGRATE, v-sign and AAGCN sources. Pinned metadata and code without executing
publisher notebooks. Retrieved the VideoMAE sequential checkpoint, verified LFS hash,
decoded numeric tensors with a restricted reader, and loaded the exact head strictly.
Primitive label mapping matches all 100 config entries; documented seven explicit
encoding aliases among the current 25 words. No source label rewriting.

Isolated CPU replay: Chào 3/3 and Ăn 5/5; expanded 31/31 source-label matches across
25 labels, repeated outputs identical. This collection overlaps publisher training;
results are compatibility evidence, not accuracy against independent users. Warm CPU
model p50/p95 1298.57/1523.38ms; no subsecond, GPU or physical-camera claim.
GPU inventory confirms RTX 2050. New probe dependencies live solely in ignored
--target storage; original worker dependencies and V25 checkpoint remain unchanged.

Network/CIM sandbox failures resolved by approved reruns; uv completed after a cache
rename retry. No regression suite, training, app edit or webcam capture was performed.
Recommendation and next GPU/physical evaluation gates recorded in data qualification,
context and handoff. Evidence: .design-cache/pretrained-vsl-audit-20261015/.

## 2026-10-15 - Personal accuracy priority and Chào / Ăn diagnostic review

User chose recognition for themselves/current camera as the first priority and gave
Chào -> Ăn as an example. Tracking is qualitatively satisfactory. User subsequently
confirmed Completed sign stays Ăn or another wrong word after finishing and about
one second of stillness. Read existing source, reports and scope.
Saved validation-prefix diagnostics contain Chào -> Ăn at 25 percent of one clip,
then Đồng ý at 50/75 percent and Chào on the full clip. This is historical source
evidence, not a reproduction of the user's camera error or verified sign semantics.

Recorded the preference and final-error confirmation in context and handoff.
Personalized collection/training is proposed, with no selected replacement model.
Documentation only; no tests, camera acquisition, training or runtime changes. Git
status remains unavailable because this folder has no Git metadata. Existing document
content is preserved and verified by comparison with pre-edit content hashes.
Pending throughput checks and all existing quality/physical gates remain open.

## 2026-10-14 - Live Camera workspace layout; resumed and verified

User requested a larger webcam, legible recognition while signing, use of empty
right-side space and preservation of the current visual language, then resumed.
Reviewed context, active scope/gates, handoff, logs, asset inventory and local One UI
catalog. Inspected the previous actual 1280px app render: the camera was nested in
two successive column splits, with predictions below the preview/reference block.
No live Figma tool was available. Reused approved primitives with Card 245:399,
Containers 247:613 and Buttons 1497:12222; no exact Figma geometry claim or new asset.

Camera mode now spans the Studio width, with a 2.2:1 webcam/result composition.
Setup fields share a row; dataset readiness/provenance remain below this workspace.
Predicted word uses the indexed 36/700 title hierarchy in the existing application
font; details are collapsed only for camera results. Reference remains available
under the result. At <=900px the result follows the preview, before diagnostics.
Preview and landmark overlay retain matching contain/mirror geometry. No inference,
capture, security, model, dataset, dependency, launcher or gate behavior changed.

Verification actually completed:
- npm.cmd test: 70 passed.
- npm.cmd run build: final TypeScript/Vite build passed, 126 modules.
- npm.cmd run test:e2e -- tests/stream-camera.spec.ts tests/camera.spec.ts
  tests/reference-video.spec.ts --trace off: elevated rerun, 14 passed in 2.8m.
  Includes manual capture/cancel/model switching, reference playback/recovery,
  stream lifecycle, real-worker replay and no-hand input. Expanded geometry checks
  require enlarged preview and simultaneous on-screen preview/word at desktop sizes.
  Six light/dark viewport Axe/overflow checks per reference and stream review passed.
- powershell -NoProfile -ExecutionPolicy Bypass -File ./run_app.ps1 -SkipBuild
  -SmokeTest: exit 0, no output/errors.

First sandbox browser attempt was interrupted during Windows paging-file/memory
failure; it has no passing result. On resume the process audit found no remaining
Node/Python processes. Elevated sequential rerun above completed successfully.
Browser media is synthetic or source replay, not a physical webcam accuracy test.
Actual renders inspected: dark1280, light1440, light768 and manual light1280.
Evidence and scoped baseline/diff: .design-cache/camera-layout-20261014/.
Git metadata is absent; status/diff/check cannot establish a clean Git worktree.
No commit/push/release. Next gate is the user's physical-camera/visual review.

## 2026-10-14 - Camera tracking diagnostics delivered

User requested visible MediaPipe tracking and FPS/ping-like diagnostics, then twice
resumed the session. Read canonical scope/handoff/contracts and local design indexes;
inspected actual prior app render before implementation. Root Git remains absent.
Baseline hashes and review output: `.design-cache/camera-tracking-20261014/`.

Stream worker now includes optional versioned75-point display data from the same
Holistic result used for inference, with native MediaPipe connections and visibility.
React overlays pose and both hands, mirroring with the video and matching contain
letterboxing. Right-hand edges use dashes as well as a different color. Low-visibility,
absent/out-of-frame points are hidden; replies expire after1second. No second detector.
Camera FPS uses presented frames; tracking FPS uses acknowledgement arrivals; frame
RTT includes encode/transport/processing, and worker processing time is separate.
Manual/KVSL preview has camera FPS and explicit ViSign Auto guidance for tracking.

Validation:70 Vitest,94 targeted Python, TypeScript/Vite build,14 browser cases and
elevated launcher smoke pass. Browser coverage includes real source replay through
MediaPipe, no-hands, cleanup/stale replies, manual capture and reference regression;
six tracking responsive/theme Axe reviews at1280x720/1440x900/768x1024. Inspected
actual dark desktop/light portrait captures; fixture points are synthetic and are
not accuracy evidence. No physical webcam was opened or accuracy gate closed.

Resolved failures: Windows module resolution confused helper cameraTracking.ts with
CameraTracking.tsx; renamed helper trackingMetrics.ts, then build/tests passed.
First pytest basetemp was inside the repository and34 API fixtures correctly refused
account storage; reran using a unique OS TEMP directory,94 passed. First sandbox
browser run passed5 cases but runner cleanup hung; stopped only its four known Node
processes. A subsequent run was interrupted by session resume; final elevated14-case
run passed with exit0. Sandbox launcher could not open local account storage;
same command elevated passed exit0. No security checks were weakened.

No dependency, model, source dataset, Figma reference, firmware or launcher changes.
Next gate is user review with the physical webcam; no milestone acceptance inferred.

## 2026-10-14 - Reference viewer resumed and implemented

User asked for reference videos inside the app, then resumed the session. Previous
streaming work was already completed; resumed from the existing287-file baseline in
`.design-cache/reference-viewer-20261013/`, retaining its original evidence-directory
date. Root has no Git metadata; direct hash/diff review is used. Read context/tracker,
handoff/latest logs, data/asset contracts and local One UI references before editing.

Added a V25 reference section in Live Camera, with25 canonical labels, default Chào,
native video controls, replay and0.5x/1x speed. Wide layouts compare webcam/reference;
narrow layouts stack them. Reused One UI primitives, checked live dropdown1497:11901
context/screenshot via figma-design-to-code. No new icon/font/reference edits.
Preview choice only controls viewing, never inference, and does not start the webcam.
Authenticated Blob loading, stale-fetch cancellation, URL revocation, hidden-page
pause, missing/corrupt retry states and unchanged camera behavior are verified below.

Offline builder uses existing isolated OpenCV, preserves originals and records hashes,
native dimensions/fps/frame count and lossy VP8 conversion. Review found that curation's
proposed training membership was stale for Giúp/Uống after baseline split repair;
corrected selection now uses the pinned effective research split. Early generated receipts
stay separate from the final pinned set. No semantic review or quality claim follows.
Code review also found reselecting the current dropdown item could disable Replay;
same-value selection now preserves loaded playback, covered by browser regression.

Initial launcher smoke failed OpenBLAS allocation; process-local single-thread BLAS
settings resolved that resource failure. Sandbox rerun could not initialize local
account storage; same command elevated passed clean exit0. No persistent environment,
PowerShell execution-policy or launcher change. Final check counts/evidence and open
gates are recorded in the handoff. No commit, push, release or milestone gate change.

Final results: 360 affected Python tests passed sequentially in76.69s;67 Vitest and
TypeScript/Vite build passed; all24 distinct affected browser cases passed across
the initial23-pass run and complete7-case Auto/reference rerun (zero skips). All25
actual videos decoded/played; six reference theme/viewport Axe/overflow checks passed.
Final launcher smoke with normal BLAS environment passed elevated, exit0. Concurrent
verification initially exhausted Windows allocation/paging resources; sequential
checks resolved the failures without changing application constraints. Actual paused
video screenshot frames refreshed after resizing/themes; no generated mock renders.
Direct hash/diff review preserves all unrelated files; root Git remains absent.
Complete file list, retry details, logs, asset recovery and remaining physical/semantic
gates are recorded in WORK_SESSION_HANDOFF.md.

## 2026-10-13 - V25 during-motion Auto correction

User reports Auto seems to recognize only after stopping, confirms both dynamic-sign
accuracy and during-motion word updates are important, and identifies xin chao onV25.
They asked to continue the session. Confirmed vocabulary label is Chào. Reconciled
latest context/tracker/handoff, source and prior cleanup; root Git remains absent.
Before edits saved hashes and scoped source snapshots to the ignored stream evidence
folder. Unrelated cleanup, datasets/model pins, references, launcher and Qt work preserved.

Read-only audit and29existing activity/camera tests confirmed old recording starts only
after200ms activity and inference only after recording ends, with2s minimum/600ms
stillness. No encoded pre-roll: a short movement can end just as recording starts.
V25 itself encodes16ordered temporal samples, not only the final held pose.

Implemented a lossless full-size PNG stream through the existing authenticated local
bridge into a bounded isolated worker. Continuous Holistic features retain onset
history and drive hand-motion segmentation/provisional predictions. Explicit stream
preprocessing identity records the difference from complete independently reset clips.
No model retraining, dependencies, cloud transfer or persistent camera frame storage.
Frontend uses one frame being encoded/processed at a time and closes on Auto off,
camera stop/disconnect, hidden page/navigation. UI labels incomplete guesses tentative.

Figma/local catalog discovery and Card245:399 live context/screenshot reviewed using
figma-design-to-code; reuse existing card, controls/status and PredictionView. No CSS,
geometry, vector/font asset or protected reference changes. Actual app renders are in
the ignored browser evidence folder, with mocked predictions identified as such.

Independent validation-feature prefix probe (116validation clips, source/model hashes
checked) demonstrates early wrong stable candidates; no new fitting or test tuning.
Actual isolated worker reference replay also produces early wrong words before Chào.
These findings limit the claim to implemented capture/streaming behavior, not improved
independent accuracy. Physical user testing remains the next product gate.

Checks completed so far:65frontend unit tests and TypeScript/Vite build; actual147-frame
worker replay/lifecycle; launcher smoke. Plain PowerShell blocks run_app.ps1 by execution
policy, so used a process-only Bypass. Sandbox launcher then could not initialize local
account storage; elevated same smoke passed exit0 without output. No persistent policy
change or launcher edit. Final backend/browser checks and complete receipts are in the
handoff. User session resume ended earlier agents; new verification agents continued
from current files/evidence, without restarting implementation or discarding work.

Evidence: `.design-cache/visign-stream-20261013/` baseline/before, prefix-diagnostic,
probe and browser receipts. No commit/push/release or approval-gate closure.

Final verification completed after the resumed turns: 321 affected Python tests passed
in 90.82s (two existing deprecations); 65 Vitest passed; TypeScript/Vite build passed;
all 19 affected browser cases passed in 4.5 minutes with RECOGNITION_REAL=1 and zero
skips. Final runner exited cleanly. Six new stream theme/viewport Axe and overflow
checks passed; actual screenshots inspected. Real browser replay displayed tentative
words during source playback and final Chào, with early wrong words retained as
diagnostic evidence. No webcam accuracy or physical latency claim. Idle cancellation,
shielded ASGI reaping and provisional quiet-tail bugs found during checks were fixed.
Final direct review: 14 durable files changed, nine added, no source deletion; generated
build replaced separately, 262 baseline files unchanged and no added whitespace errors.
Full file list, commands, timings, failures/retries and next gate are in the handoff.

## 2026-10-13 - User-approved workspace size reduction

User explicitly requested implementation of the 16-target cleanup plan, choosing
local disk reduction while preserving desktop behavior and Android source/exported
APK. This is tooling hygiene, not Phase E or approval to remove PySide/Qt.

Reconciled canonical context/tracker/handoff with the live tree. Root .git is absent;
git status/diff/check are unavailable. The nested signflow-publish repository has
no tracked changes; its removed node_modules/build paths are ignored and untracked.
Read-only process inspection required a sandbox escalation and found no Java, Node
or Python processes before our audit. No unrelated process was stopped.

Captured sizes, file lists and SHA-256 for 97,775 accessible files before deleting.
The initial serial hash scan was stopped only by its known owned PID to replace it
with parallel I/O; no files were deleted before the completed baseline. Audit data
and small copies of the four edited documents are in the ignored evidence folder;
there is no new dataset or environment backup.

PowerShell cleanup uses a fixed target list, validates absolute containment and
rejects reparse points throughout each target. Preflight checks every file against
baseline path/size/mtime before any deletion. All 16 targets were removed successfully
without permission/locked-file errors: 31,648 files, 1,781,772,663 bytes (1.659 GiB).
The exported APK matched the removed intermediate APK SHA-256. Signing identity,
android-user/user folders, all Android source/configuration and lockfiles remain.

Recorded Android versions: command-line tools 22.0, platform android-36 revision 2,
build-tools 35.0.0/36.0.0 (app selects 36), platform-tools 37.0.1, Gradle 9.1.0,
AGP 8.13.0. Historical daemon logs mention Java 21 and 25. The configured STM32CubeMX
JRE path is currently missing; local.properties still names the original Downloads
SDK location. Recovery documentation explains both preexisting machine-path issues.
No configuration was silently changed and no Android tools were reinstalled.

Checks actually executed after cleanup:
- Desktop web: npm.cmd test -> 56 passed; npm.cmd run build -> success (Vite 7.3.6).
- .venv Python: pytest tests/test_dependencies.py tests/test_recognition_topics.py
  tests/test_recognition_visign.py -p no:cacheprovider --basetemp <unique OS-temp path>
  -> 20 passed in 5.77s, two existing Starlette/AnyIO deprecation warnings.
- run_app.ps1 -SkipBuild -SmokeTest -> sandbox exit 0 but SQLite readonly shutdown
  traceback, therefore NOT accepted as a clean pass. Same command elevated -> exit 0,
  no output/errors. run_app.ps1 -Legacy -SmokeTest -> exit 0, no output/errors.
  QT_QPA_PLATFORM=offscreen was used; no physical webcam was opened.
- Actual RecognitionCatalog -> all 11 KVSL/ViSign providers available; four pinned
  KVSL implementation hashes match. Persistent worker predicts W00395 as ca (top-1),
  status ok; RecognitionService shutdown completed. This verifies integration only.

Full post-check hash scan: 62,428/62,428 protected files unchanged; zero unexpected
changes/additions/removals; all deletion targets absent. Desktop production bundles
are byte-identical. Only apk/README_APK.md and the generated Vitest result cache had
changed at that scan; these final changelog/log/handoff additions follow it and are
reviewed separately against the saved document bytes. Both scans left the same
inaccessible .design-cache/kvsl-phase3a/pytest-tmp and 489 links untouched.

Evidence: .design-cache/repository-cleanup-20261013/ contains compressed full hash
inventories, deletion-manifest.json, deletion receipts, test logs, model catalog,
offline result, documentation.diff and REPORT.md. Accessible project size before
was 6.858 GiB, after deletion 5.199 GiB before the new audit receipts; disk-summary.json
records the final measured total including receipts. These are logical file sizes,
not a claim about physical filesystem allocation or hard-link savings.

Changed durable files: apk/README_APK.md, CHANGELOG.md, docs/SESSION_LOG.md,
docs/WORK_SESSION_HANDOFF.md. Application source, launcher (including its preexisting
stray 2), context/tracker, datasets, models and design indexes remain unchanged.
No commit/push/release, Android rebuild/device run, browser visual/E2E rerun or physical
camera test. Remaining physical recognition/quality/latency and Phase E gates retain
their prior status; next product gate is the user's existing physical-camera review.

## 2026-10-12 - User-authorized experimental camera integration

User asked to add the research model for app testing and a model-selection panel,
then resumed the session. This explicitly supersedes the previous offline-only gate
for experimental integration, while production/semantic/independent-camera gates
remain open. Read canonical context/tracker/schema/history/handoff and existing
implementation; no root.git. Captured275-file baseline under
`.design-cache/visign-app-20261012/`, with original source copies for direct review.

Added research descriptor/worker implementation and tests; extended catalog, capture
label mapping and score identity validation without weakening KVSL validation. Only
the pinned25-word NPZ is allowed, verified before NumPy loading with allow_pickle=false,
exact array shapes/labels/finiteness/positive scales. Reuses training pack/encode/score
functions, independent MediaPipe0.5 tracking reset per clip, existing bounded transient
camera path and persistent IPC. Missing-hand coverage rejects poor inputs; no unknown
sign confidence threshold is invented. No dependency, launcher or raw dataset edits.

LiveCamera uses existing One UI selector/card/control primitives. Retrieved exact live
Figma Drop Down Menu1497:11901 context after local catalog discovery; no icon/assets
or protected catalog edits. Panel offers experimental25signs and KVSL family, optional
supported-word disclosure, no topic for ViSign, raw-score caption and processing time.
Switching clears stale prediction; Auto/capture/inference lock it. Catalog-loading
race found in browser testing and fixed by disabling selection until loading finishes.
Poll interval250ms reduces display delay without a physical latency guarantee.

Checks so far:164affected pytest passed29.04s (two existing deprecation warnings),
56Vitest tests passed, TypeScript/Vite build passed, shell and run_app -SkipBuild
-SmokeTest exit0. Initial pytest default temp denied; putting test DB inside repo
correctly failed repository-safety checks; a unique OS-temp basetemp resolved both.
PowerShell npm.ps1 execution policy requires npm.cmd; no machine policy changed.

Real worker probe used a derived30-frame Chào validation clip (VP8 WebM, unchanged
source preserved): top1Chào identically twice; cold12.93s including11.14s worker start,
warm1.47s including1.45s preprocessing. Synthetic empty-hand media returns hands_missing.
Legacy W00395 remains ca; actual cancellation, fresh-worker recovery, transient cleanup
and process exit pass. NOT physical-camera evidence, accuracy benchmark or subsecond
acceptance. Source receipt/results in probe-source.json and worker-probe.json.

Initial browser run exposed loading race and subsequent dev-HMR entry query mismatch
in the test-only credential injector; broadened its exact main.tsx match to permit a
query suffix. No app auth bypass introduced; secrets stay in RAM, traces disabled.
Initial runner teardown stuck under sandbox; explicitly identified owned runner PID
and cleaned only its process tree with approved escalation. Fresh targeted browser
run3passed35.2s, including real research no-hands path and six Axe/overflow/render
checks at1440x900,1280x720,820x1180/light+dark. Full affected browser rerun13passed/
1opt-in skip(3.0m). Then correctly enabled RECOGNITION_REAL=1: real W00395+cau_hoi
Studio regression passed24.8s. All14distinct affected cases pass. A preceding attempt
to start the next run before the stuck runner was stopped failed on occupied5173;
no config/port-security bypass was made. Screenshot review caught a theme transition
mid-frame; new panel screenshot capture disables animations to record settled styling.
That focused rerun passed15.1s; corrected1280light render inspected. No app style
change was needed. No new agents or external messages used.

Final direct review:23existing durable files changed,3added,no source deletions,
250baseline files unchanged. Generated Vite index/JS accounted separately. Original
manifest hash, launcher and Figma catalog preserved; no added whitespace errors.
Git status/diff/check fail because there is no root.git; hash/direct review is evidence.
Prepared app build is ready for user webcam testing; no physical capture or accuracy
PASS is claimed. Remaining production/independent data/subsecond gates stay open.

## 2026-10-12 - Authorized offline research training completed

User explicitly approved the proposed research exception: use source labels and
automatic filters to train a baseline without waiting for exhaustive manual VSL review.
Read canonical docs/schema and existing source; captured273-file baseline. Updated
context/tracker before training; preserved prior semantic flags and production gates.
Added vsl_baseline and tests, with existing isolated NumPy/threadpoolctl only.

Reconstructed curation from verified source/features/groups. Preserved117test clips,
excluded231quarantine clips, moved six train groups to ensure two validation groups
per class(Chúng ta2,Uống2,Giúp1,Xin lỗi1). Saved fixed experiment split360/116/117
before fitting. Encoded16temporal samples of body-relative XY and masks(3600values),
trained ridge candidates alpha0.1/1/10/100 with train-only statistics. Validation
macro-F1 selects alpha10. Test scored after selection; no test-guided retraining.

Measured train100%, validation76.72%/macro-F1 0.7322, test95/117=81.20%/macro-F1
0.6954, balanced accuracy70.93%. Four classes have zero test recall with1–2samples;
no robust class/signer/generalization claim. Model502,667bytes saved as numeric NPZ.
Classifier-only median0.0318ms/p950.0341ms excludes all video/extraction/segmentation/UI.
Production recognizer/topic selector unchanged; no subsecond physical performance proof.

Verification: targeted13tests passed2.54s; full affected147passed18.21s. Actual baseline
CLI and saved-model check pass. Reproduced593predictions from saved model; checked
train-only means, unchanged test, known-group separation and original KVSL pin.
Local verification script first failed to import app when launched by file path;
fixed its repository import path and reran successfully. No training failure or data
rewrite. Generated51-clip shortlist(27validation mismatches,24sampled matches), all
pending review. Browser playback untested. No independent webcam/idle/unknown test.
Evidence: .design-cache/visign-baseline-20261012/. No root.git; direct/hash final review.
Next gate is quality evaluation before app integration; research training is now allowed.

## 2026-10-12 - Group curation and review preparation; semantic reviewer unavailable

User requested continued work and answered that no VSL-competent reviewer is currently
available. Re-read canonical documents/schema, inspected Git absence and source code,
and captured a 271-file direct/hash baseline. Added vsl_curation CLI plus tests, using
the existing feature review and immutable manifest writer. No new dependencies/agents.
The CLI rechecks candidate source hashes, reconstructs the previous proposal from
verified NPZs, validates RGB diagnostic source/rule/coverage and quarantines complete
connected groups for any flat frame or hand coverage below half. Other proposed split
assignments remain unchanged; source video is neither rewritten nor trimmed.

Actual run: 824 clips /821 groups; 231 directly flagged and quarantined, 593 screened
pending semantics. Proposal retains 366 train /110 val /117 test. Only 23 of 25 labels
have all partitions; Chúng ta has6/0/2, Uống9/0/3. Neither missing validation nor sparse
coverage is concealed by reseeding. No source labels accepted or model trained.
Generated a local static review pack with 26 HTML pages, 824 original-video references,
technical flags and 824-row pending annotation CSV. This is a cache report, not a new
production UI. Browser video playback untested; links/files/receipts were checked.

Tests: targeted18 passed0.69s; initial affected suite131 passed38.91s; final suite134
passed34.45s after adding provenance/tampered-group rejection cases. CLI help and full
actual curation pass. Review-pack builder reverified every source video; static pack
check confirms local links, source/payload hashes, all review fields pending, counts
and original KVSL manifest unchanged. No frontend/bridge/physical-camera tests rerun.
Evidence: .design-cache/visign-curation-20261012/. No root.git; use baseline/direct diff.
Remaining gate: semantic review by a qualified VSL reviewer, sufficient evaluation,
source provenance, transformed duplicates and idle/unknown data. User's lack of a
reviewer is documented, not treated as a reason to invent annotation approval.

## 2026-10-12 - Complete feature extraction and source-frame triage

User authorized continued implementation, then resumed the session. Read canonical
documents/schema and captured a 267-file hash baseline; repository root has no .git.
Added offline vsl_features and vsl_feature_review plus their tests. Existing isolated
MediaPipe 0.10.14 environment used; no production ML dependency added. Source hashes,
finite coordinates, mask semantics, exact frame counts and exclusive output publication
are enforced. Documentation records the new 75-landmark contract and incomplete-run
recovery. Initial process pool failed with BrokenProcessPool; run1 remains incomplete.
Two independent per-clip Holistic thread workers finished run2; after the tool session
ended, its complete report and all output hashes/contracts were checked successfully.

Full pilot: 824 clips /24,653 frames. Pose present22,229; left15,561; right17,989;
either19,236. Eight clips have no hand,143 below half coverage,327 below80%.
Three near-image pairs yield821 groups; unfrozen proposal510train/153val/153test/8
quarantine. No signer independence claimed, no training. Inspection of14clips ×4actual
frames exposed flat-color/black frames and strong blue casts. Full bounded RGB scan
flags2,422 near-uniform frames in188clips;231clips have flat frames or hand coverage
below50%. The593other clips are not certified clean. No frame trimming, label repair,
face identification or source modification. Review CSV contains paths/flags and pending
semantic/boundary/tracking fields. Prototype split predates RGB screening and cannot
be frozen without curation/re-grouping; no source-quality approval inferred.

Verification: 113 affected pytest tests passed in26.14s, both new CLI help paths pass,
full extraction/review CLI and local RGB/summary/frame inspection scripts completed.
All824 candidate file hashes rechecked; original KVSL manifest hash unchanged. No UI,
bridge or acquisition changes, so frontend/physical-camera checks not rerun. No new
agents or external messages. Evidence: .design-cache/visign-features-20261012/.
Next gate remains source visual/semantic review, recording groups, adequate independent
evaluation and idle/unknown data before training. The user's realtime goal is unfinished.

## 2026-10-12 - No-wait data search and verified local RGB acquisition

User rejected waiting for VSL400 and requested immediate-use Vietnamese sign data,
then resumed after service limits. Previously delegated read-only searches identified
public ViSignLanguage-Video and the visl_98 lead. No new agents were spawned on resume.
Root re-read canonical state and preserved the266-file baseline. Initial archive
download had not run because automatic approval review exhausted its quota; the
resumed explicitly escalated retry was approved and completed. visl_98 returned401.

Downloaded863,939,416 bytes at pinned HF commit; published archiveSHA256 matches.
Extracted only bounded MP4 bytes to hash-based cache paths; CRC checked, no downloaded
code executed. All8,364 entries decode;6,137 unique whole-file/pixel sequences. Train
has3,875 entries /100 labels /2,776 unique sequences; unlabeled folders4489 entries.
Found156 exact train/unlabeled overlap groups and two conflicting training-label pixel
groups. Source archive folder labels agree with a primitive string/int mapping inspected
via pickletools only, never unpickled. CSV has828 rows failing normalized label+file join;
the local index uses original archive labels with UnicodeNFC only.

Prepared25 proposed words /824 unique nonconflicting sequences and a usable local CSV.
Independent signer splits are not supplied or invented. Inspected actual16-frame sheet;
MediaPipe0.10.14 probe25clips/750frames: pose636, either-hand593; low coverage on some
clips remains a risk. No training, classifier comparison or accuracy/latency claim.
Details and reproduction commands: VISIGN_IMMEDIATE_DATASET.md. Source/API errors,
observed duplicate/label issues and next quality gates are explicit in that report.
All scripts/data/evidence stay in .design-cache/vsl-immediate-20261012/. No runtime
changes; application tests not rerun. Final review is recorded in WORK_SESSION_HANDOFF.md.

## 2026-10-12 - Resumed candidate preparation and access-form inspection

Reconciled canonical state and the interrupted 2026-10-11 baseline: 264 durable files
unchanged at resume; root still has no .git. Read the three-page VSL400 agreement
using pypdf from ignored temporary tooling, not the application environment. Initial
text print hit Windows cp1252 encoding; Python -X utf8 read succeeded. The public
agreement page was rechecked; dataset-page refresh returned HTTP 429. No request sent.

Asked for actual form identity fields; user asked whether data was already available.
Explained public KVSL/VSL-GH limitations and continued public-source work without
requiring identity now. No signature, acceptance or affiliation was invented.

Implemented vsl_candidate_manifest.py and 22 focused tests. Exclude full feature groups
for conflicting annotations/splits/signers or shared quarantined metadata before
filtering labels; retain aliases and distinct IDs for repeated gloss occurrences.
Real-data run: 3279 segments, 2037 feature records; train/val/test 2801/240/238.
Ten conflicting groups / 23 rows excluded, 30 duplicate groups / 39 aliases collapsed.
No media slicing, label repair or training. Actual media/semantic review remains pending.

The preparation_review agent resumed successfully for two read-only reviews, confirming
the duplicate-boundary issue and identifying ambiguous commit terminology. Corrected
output to source_tree_sha with explicitly unverified commit provenance. GitHub API
web lookups were inaccessible; no commit verification is claimed. Final output uses
candidate-segments-v2.json; the earlier v1 file is retained, not overwritten.

Evidence stays in .design-cache/vsl-data-preparation-20261011/ because preparation
began in the preceding session; documentation date is the current client date.
Final tests/review and outstanding gates are in WORK_SESSION_HANDOFF.md.

## 2026-10-11 - Data qualification implementation and bounded media checks

User authorized handling the important data step, resumed the session, and chose the
best-qualified source before regional preference. Implemented vsl_data_audit.py and
tests without changing runtime dependencies/UI/models. Multi-VSL public Drive listed
1000 items; only 352 center files join split metadata and no class spans all splits.
Three downloaded MP4s decode. Audited all VSL-GH metadata: 2100 structurally consistent,
2100 quarantined; retained annotations without repair. Verified 30 NPY samples across
six signers against pinned Git blobs and frame bounds. First consistent subset has
40 exact duplicate groups / 92 paths; candidate coverage includes unique blob counts.
Examined VOYA NPZ headers with 69,931 bounded bytes, not a full archive download.
Recovered AAGCN gloss table as an unverified mapping lead; no off-by-one mapping applied.

New data schema/report and local VSL400/Multi-VSL access-request note preserve the
open source-quality gate. Public VSL400 agreement downloaded, not accepted or sent.
Final affected pytest: 60 pass, 15.61s, including strict duplicate-JSON/nonfinite checks.
Smoke sandbox run logged read-only SQLite shutdown failure despite exit 0; escalated
rerun exit 0 without errors. No frontend rerun.
Three delegated audits were interrupted by service usage limits; root completed the
reported implementation and checks directly. Details: VSL_DATA_QUALIFICATION.md.

## 2026-10-11 - Realtime feasibility and user-requested dataset search

User authorized implementation, confirmed possible extra videos, allowed supplemental
VSL datasets, and asked to scan the project. Ran a pinned-MediaPipe incremental
reference benchmark and read-only local/archived data audit. No additional labeled
multi-signer dataset was found in accessible project contents. Downloaded 10 public
metadata/source-text files (6,706,961 bytes) for Multi-VSL/VSL-GH with pinned Git SHAs
and SHA-256 provenance; inspected text only. Found disjoint Multi-VSL signer splits
and substantial VSL-GH metadata inconsistencies. No training or production cutover.

[Detailed report](REALTIME_RECOGNITION_FEASIBILITY.md) records actual measurements,
scan scope, failures/retries, unverified data access, next gate and evidence paths.
Current app tests were not rerun because production code did not change in this step.
Phase 5B prior test evidence remains historical; physical accuracy is still unresolved.

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

## 2026-10-10 - Phase 3A persistent worker, PASS WITH FIXES

Read the attached request, canonical context/tracker/handoff/log/changelog/schema/
recognition contract and Phase 3B inventory/evidence before changing production code.
Root git status confirmed no .git. Captured 277 scoped baseline hashes and source
copies under ignored .design-cache/kvsl-phase3a/before/; no prior work was reset.

Before optimizing, measured W00395 and D0098 with the existing one-shot service and
an external timing wrapper. Totals 10438.971/8953.338ms; imports 4495.869/3338.979ms;
preprocessing 5215.771/4981.571ms. No whole-dataset or 28-sample audit rerun.

Implemented lazy persistent client, handshake, v2 ID-only JSONL predictions, one
execution at a time, verified lazy model cache, reusable Holistic with graph reset,
bounded pipe threads/diagnostics and explicit service/job/CLI ownership. Kept v1
single-use compatibility. Windows handshake exposed that venv Python launches a
second interpreter; added suspended launch plus Windows Job Object ownership so
killing the launcher cannot leave actual ML running. Invalid stream/timeout/cancel
discards the whole worker and later requests spawn fresh. No silent prediction retry.

Six normal requests retained one worker: do_vat cold/warm, cau_hoi first/warm,
do_vat return, so_dem D0532. Final measured totals 8857.992/5309.367/5122.447/
4997.572/5254.486/4203.597ms. W00395 and D0098 scores are unchanged; D0532 still
predicts 5 then 3. Isolated comparison against the saved pre-edit extractor proves
W00395 float32 arrays, masks and timestamps exactly equal, including a repeated clip.
Model-memory probe loaded only three providers; chose lazy registry-bounded retention.

Real authenticated LoopbackServer tests covered success, active cancel (~47ms),
successful restart, induced process crash/failure, successful restart, real timeout,
successful restart, and shutdown with one running plus one queued job (~187ms).
Retained OS handles verified all four actual interpreters and launchers exited;
executor/server stopped and port rebound. No raw data/artifact/manifest writes.

Final affected pytest command (listed in handoff) passed 168 tests, 56.94s, with two
existing Starlette/AnyIO deprecations. Headless shell smoke exited 0. Existing browser
flow ran from an ignored evidence copy: only module/evidence paths and two obsolete
per-request exit-status expectations were adapted (live worker means null). Eight
tests passed in 48.0s; after final ID-only protocol hardening, the real do_vat/cau_hoi
test passed again (1 test, 33.5s total), including bridge teardown exit 0. No durable
frontend source/test/build changes, npm unit/build rerun, or native visual acceptance.

Failures retained: sandbox denied normal pytest temp access; an attempted in-repo
basetemp caused three expected identity-storage policy failures (77 other tests
passed). Proper external-temp scoped escalation resolved them. New process fixtures
initially passed an absolute path prohibited by WorkerConfig; fixed the fixture to
use a relative path. PowerShell native stderr redirection made a successful parity
probe appear exit 1; reran using subprocess capture and confirmed actual exit 0.
Read-only upstream Git inspection initially hit sandbox ownership checks; used an
exact command-scoped safe.directory override, without changing global configuration.

No new scope starts automatically. Next gate is a user priority decision; licensing,
dataset/evaluation provenance, deployment, packaging and native DPI limits remain.

Final direct review: 13 changed + three added durable files, no deletions, 264 baseline
files unchanged; protected references/frontend/manifest unchanged. All 16 no-index
whitespace checks are clean using command-local CRLF handling. Audit-only initial
failures were incorrect interpretation of no-index exit 1 and Windows CRLF; fixed the
review script, not source formatting. Fresh Vite port rebind passed. No root Git claim.

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

## 2026-10-10 - Phase 2 desktop recognition integration, PASS WITH FIXES

Read the attached request and current canonical documents, manifest membership and
Phase 1 real evidence; inspected bridge auth/lifecycle, Studio/API/shared controls and
worker source. Current explicit Phase 2 authorization supersedes older proposed gates.
Root has no .git. Saved 376 source/reference hashes and scoped pre-edit copies under
.design-cache/kvsl-phase2/. Sandbox helper startup failed; scoped escalated commands
worked. No automatic approval rejection, dependency install or network ML operation.

Implemented bounded in-memory job service, six authenticated recognition routes,
optional cancellable process execution and lifecycle ownership. Reused Phase 1
manifest adapter/service/model contracts. Added a focused Studio Dataset card using
existing primitives (Card245:399, Buttons1497:12222 lineage); no new Figma browsing,
assets or design-system replacement. Preview deferred. UI/API accept only IDs.

Final checks: affected backend 126 passed (two existing deprecation warnings), frontend
unit 27 passed, production build 119 modules, final mocked browser suite 6 passed.
Earlier real browser run passed 6 tests including actual W00395 recognition. Actual
Studio result ca/cày/bộ sách exactly matches Phase 1 scores, child exit 0, total
24917.5044ms under concurrent test load; not benchmark accuracy. Final real process
cancellation ~125ms; shutdown ~219ms with running+queued jobs, children reaped,
executor/server stopped, port reusable, all three ML packages absent/unimported in
collector. Headless shell smoke exit 0. Details/commands: current handoff.

Failures retained: mock reused terminal job ID and prevented new-job UI (fixture fixed).
Browser teardown intermittently exited 1 with SQLite locked after network disconnect.
Captured diagnostic showed unbounded Uvicorn request drain; added a 2s graceful
shutdown bound and tested an outstanding request plus closed SQLite/port release.
First test route was hidden by the static mount; fixture ordering fixed. Final suites
pass. Explicit polling retry recovery added after review. Authenticated network traces
are disabled in new tests; no trace archive remains in final browser test output.

Reviewed actual light/dark result at 1440x900,1280x720,820x1180 and smaller-desktop
loading/running/error states. Eight scoped Axe scans across result/running states had
zero WCAG A/AA violations. Native PyWebView visual/DPI/screen-reader not performed.
No historical broad visual suites were blindly repeated. No hardware/acquisition,
SensorPacket, simulator, raw data, identity schema, manifest, ML dependency or launcher
change. Bounded Uvicorn shutdown is the only additional shared lifecycle correction.

Updated context/tracker/changelog/contract/handoff, preserving historical entries.
Root review uses hashes/direct diff; upstream Git remains clean. The initial audit
flagged Vite removing its old hashed CSS; classified generated build replacements
separately and confirmed no source deletion, 16 durable changes, 5 additions and
358 unchanged baseline files, with no added-line whitespace errors. Phase 3 is only a
priority decision proposal (UX/latency, more topics, or hardware/sensor preparation).
No automatic Phase 3 implementation, push, merge, commit or release.

## 2026-10-10 - New Astra session: Phase 1 offline boundary PASS

Read the current attachment and canonical context/tracker/handoff/log/changelog/schema
and Phase 0 evidence; inspected source conventions, lifecycle and subprocess code.
The large initial document read was truncated; focused reads recovered relevant current
entries, contracts and the complete Phase 0A report. Root Git status reports no repository.
Saved a 269-file hash baseline and pre-edit canonical documents in kvsl-phase1 cache.

No reusable general process worker existed: acquisition owns sensor threads and shell
owns the bridge. Used one subprocess/request with versioned JSON, frozen contracts,
strict input/result validation and standard-library orchestration. The manifest lacks
a sample_id field, so introduced only an external recording/topic reference convention;
did not alter the completed manifest importer. Preserved model/preprocessing identity.
Pinned four upstream source hashes and verified them against immutable source Git blobs.
AST loading selects verified extraction/edge functions and avoids upstream top-level
augmentation/all-topic services. ML imports occur only inside the isolated worker.

Fresh checks:
- First affected pytest run: 87 passed, 1 failed. Test subprocess omitted production's
  UTF-8 flag, so Windows emitted non-UTF-8 bytes. Corrected the process fixture; also
  added explicit timeout child-reaping coverage. Final suite: 89 passed in 21.04s.
- Import guard blocks torch/MediaPipe/PyG during collector startup-module, manifest and
  orchestration imports. Separate find_spec check reports all three absent in .venv.
- Real smoke.py through the same RecognitionService instance: W00395, W00170, W00380,
  unique request IDs, real MediaPipe/torch/PyG/checkpoint, all statuses ok/child exits 0.
  W00395: ca .43561261892318726, cày .13568049669265747, bộ sách .1329399198293686;
  exact Phase 0A scores. Preprocess 5182.885ms, model 29.321ms, total 10682.662ms.
  Other totals 9484.690ms and 9065.532ms. These are regression checks, not accuracy.
- Actual module CLI via verify_cli.py: exit 0, annotation and prediction distinct,
  child exit 0, valid UTF-8, empty CLI stderr; total 9025.753ms. Native INFO/warnings
  are isolated from protocol output; service smoke retains them in worker-diagnostics.log.
- No full 20-video batch, Phase 0 rebuild, frontend/Playwright/UI suite or unrelated app
  tests. The affected smoke path is the offline service/CLI, not desktop wiring.

Sandbox helper initialization failed; scoped approved fallback commands were used.
No automatic approval rejection. No environment install, network inference operation,
model download, source video rewrite, UI/bridge/acquisition/hardware or launcher change.
Updated five canonical documents plus dedicated RECOGNITION_CONTRACT. Final file/hash
review and direct document diff are stored under .design-cache/kvsl-phase1/.
The first review script incorrectly expected __init__.py in its baseline; comparison
proved it was a new file. Corrected the audit expectation and documentation accordingly.
Final review passed: five existing documents changed, ten intended files added,
264 other baseline files unchanged, added-line whitespace clean, manifest hash
unchanged, and upstream Git status/diff/diff --check clean.
Next gate is separate Phase 2 authorization; all existing unrelated gates remain closed
or pending as previously documented. No push/merge/release.

## 2026-10-10 - New Astra session: Phase 0B complete

Read the requested six documents in order, prioritizing their latest dated entries;
inspected actual source, AGENTS, schema and local upstream metadata before editing.
The open IDE attachment is the historical repo-comparison brief; the current explicit
Phase 0B-only instruction controls this session. Phase 0A was not repeated.
Root `git status --short` confirms no .git in this downloaded workspace. Saved a
259-file source/reference hash baseline and the six documents to be edited under
`.design-cache/kvsl-phase0b/`; retained unrelated work and archives.

Added `app/desktop_collector/kvsl_manifest.py` and synthetic metadata-only tests in
`tests/test_kvsl_manifest.py`. The importer reads immutable Git blobs from separate
source/artifact pins, independently checks blob IDs and records SHA-256/byte counts.
One recording per original filename, one annotation per recording/topic, all CSV rows
preserved. Kept unknown split/signer/session/license/training provenance explicit.
Output is deterministic, no-overwrite, atomically published with same-directory hard
link after fsync; missing assets are diagnostics, malformed metadata fails closed.
No upstream checkout writes, network, video decoding, model loading or app integration.

Verification actually run:
- Initial importer/dependency pytest run: 30 passed. Added separate-commit and malformed
  CSV cases; final same suite: 34 passed (command in DATA_SCHEMA/current handoff).
- Real module CLI: exit 0, created manifest with 187 rows / 169 recordings / 10 topics.
- `verify_import.py`: exit 0; all 187 source rows match, 175 memberships/classes,
  12 repeated annotation rows, zero missing references/content duplicate groups,
  309 historical paths / 140 unreferenced. Repeated import is byte-identical/no-op.
- All 20 previously recovered asset hashes/blob IDs/sizes match Phase 0A evidence;
  this only compares metadata/bytes and does not rerun its feasibility tests.
- Upstream Git status and diff --check remain clean. Root Git diff/status unavailable;
  source hash comparison/direct document diffs provide this session's review.
- Final scope review: exactly eight intended files changed/added, 253 other baseline
  files unchanged, added-line whitespace check passed; `source.diff` and
  `final-review.json` are retained in the Phase 0B cache.

Sandbox process startup repeatedly failed with helper_unknown_error; scoped escalated
reads/test/import commands succeeded. No automatic approval rejection occurred.
Desktop/Qt/frontend suites were not rerun: importer is standalone and not wired into
the application. No dependency changes, model/runtime install, source video extraction,
UI, bridge, hardware, simulator, launcher, cutover, push or release.
Updated context/tracker/schema/changelog/handoff. Phase 0B is complete; subsequent
integration needs separate scope approval. Licensing, signer split, held-out evaluation
and production ML deployment remain unverified, as in Phase 0A.

## 2026-10-10 - Complete KVSL Phase 0A (runs on 2026-10-09)

Read the user's attached feasibility request and canonical project documents; preserved
existing work. KVSL is the confirmed sole primary repository. Root is a downloaded copy
without .git, so root Git status/diff cannot establish a baseline. Temporary work is
confined to ignored .design-cache/kvsl-phase0a/; durable changes are documentation only.

Pinned main e5165d79f373a12a4964e2c3d1bf59c911416667. Both README Drive folders
returned 404; no releases. Fetching full four-commit history found 309 distinct MP4
blobs and ten GCN checkpoints at 4634b5d9f695f1118f99a6d09c9487f81bde0b3c.
Restored/decoded only 20 selected do_vat videos, not all 309. The public qipedc W00395
download returned 200 and matched the Git video SHA256. Current CSV has 187 rows,
169 distinct labels/video filenames; do_vat has 21 rows but 20 unique recordings.
No LSTM artifact or NPZ corpus was found in this Git history.

Created extraction-env under the ignored cache: Python 3.12.13, torch 2.5.1+cpu,
PyG 2.4.0, MediaPipe 0.10.14, NumPy 1.26.4, OpenCV-contrib 4.10.0.84.
This differs from upstream Python/CUDA pins; full freeze retained. Root .venv has
no torch, mediapipe or torch_geometric. Default sandbox execution/network initially
failed; reviewed escalated commands succeeded. No automatic approval rejection occurred.

Loaded real do_vat.pth with weights_only=True and strict state-dict validation.
Checkpoint SHA256 ea64129ba9a3f66a955a65b65340906ede701ff4d2f1f97bb4031979817eaade.
Canonical contract kvsl-gcn-do-vat-60x65x3-v1 is supported by weights and co-versioned
source, not unavailable training logs. AST-loaded upstream extraction functions avoid
top-level augmentation side effects. Every frame and resampled clip matched backend
helpers exactly. Standalone W00395: annotated/predicted ca; top-3 scores ca .4356126,
cày .1356805, bộ sách .1329399. First forward 6.85ms, warmed median 2.84ms; extraction
5.20s includes setup/parity checks and excludes model/process initialization.

First 20-clip run produced results but PowerShell returned wrapper exit 1 on MediaPipe
stderr INFO (NativeCommandError). Retained logs and reran through direct Python subprocess:
actual child exit 0, 95.74s, 20 unique videos, 2415 frames, 20 top-1 annotation matches.
Median extraction 4753.42ms/clip; warmed forward 2.59ms. No benchmark claim: source
recordings may overlap training, no held-out signer split. Missing groups and nonfatal
MediaPipe/protobuf warnings are retained. No training, fake sensor data or app integration.

Evidence: REPORT.md, preprocessing-contract.json, asset-inventory.json, results-1.json,
results-20.json, batch-summary.json, batch-execution.json, requirements-resolved.txt and
verified-batch logs in the cache. Upstream source/model/map parity after CRLF normalization
and clean upstream Git status/diff were verified. App tests/build were not rerun for this
isolated experiment; historical test outcomes are not new results.

Verdict PASS WITH FIXES. Proposed Phase 0B manifest importer must preserve hashes,
topic-local labels, original recording identities and unknown split/license metadata.
Phase 0B and all existing visual/cutover/hardware/capture gates remain unopened here.

## 2026-10-05 - User accepts motion; requests slightly faster timing

User said the corrected capsule was good but somewhat slow. Changed only the two
capsule duration tokens: 640/520ms to 540/440ms (open/close). The shape of the motion,
text sequence, current geometry and seconds/milliseconds conversion are unchanged.
Production TypeScript/Vite build and all five focused capsule regressions passed.
The previous native timing evidence describes the earlier 240/240ms
version; do not reuse its measured numbers as measurements of this small adjustment.

## 2026-10-05 - Resume after successful Figma reauthentication

User confirmed reauthentication and requested continuation. Verified whoami as Fish /
Full / Student and retrieved live design context plus screenshot for One UI 838:4076.
Reconciled current source, production build and the existing native timing evidence.
No SmartGlove shell process remained at resume; opened the current production build
through run_app.ps1 -SkipBuild. The SmartGlove Dataset Studio window is responding,
launcher stderr is empty. No production source or test changes; previous verification
remains the evidence, not a claim of new test runs. User motion approval remains open.
Updated the handoff and asset provenance to remove the stale reauthentication blocker.

## 2026-10-05 - Correct production motion units and visible travel

User reported the capsule still flashed. Independent code/frame audit found the prior
spring's visible10-90% travel was only 116-118ms open/141-142ms close despite 460/380ms
nominal durations. More importantly, native production inspection exposed the actual
flash: Vite changes 640ms to .64s (previous460ms to .46s), but parseFloat was passed to
WAAPI as milliseconds. Source/dev checks had not caught that 1000x unit mismatch.

Fixed time-unit conversion, changed motion to640/520ms smoothstep with modest width
lead and retained presentation-value reversal. Added two rendered10-90% travel tests,
including explicit.64s/.52s CSS values, and bounded monotonic geometry/clipping checks.
Existing page Quick Status motion and Account were not changed. Figma whoami requested
again by user now returns reauthentication required. Continued with existing retrieved
Figma context; no new design/assets or permission assumption.

Final checks:26 Vitest tests, production TypeScript/Vite build118 modules,11/11 focused
Playwright tests and launcher smoke exit0. Real production JS/CSS loaded in separate
visible PyWebView at1426x863,DPR1.25: serialized.64s verified, light/dark10-90% travel
~376ms open/~316ms close, two Axe A/AA scans0 violations,0 page errors, clean bridge
exit0/empty stderr. Test bootstrap adapts only credential consumption in RAM; no secret
in URLs/files/logs, no production bridge bypass or source security change.

Final six-state responsive review (1440x900, 1280x720, 820x1180, both themes) also
passed capsule Axe with 0 violations and 0 page errors; video saved in v2/after/.

Intermediate native harness failures are not passing evidence: AxeBuilder attempted an
unsupported new page; inline Axe injection was rejected by production CSP. Switched to
same-origin routed test script without weakening CSP. Hidden native window throttled
RAF to~1s, invalidating timing; switched to visible verification window. One early
hidden teardown hit WinError32 on isolated test SQLite; final navigation/settle shutdown
passed. Existing user's desktop window was not closed or restarted, so it retains its
loaded bundle until reopened. Final review/handoff holds actual evidence and limits.

## 2026-10-05 - Capsule motion and disk-space recovery

The user supplied .design-reference/one-ui-illustration/motion.mp4 and a screenshot
of the header capsule. This request concerns LiveStatusNotification, not the separate
full-page Quick Status navigation. Read canonical context, local catalog and existing
source. Live Figma design context/screenshot for 838:4076 succeeded; whoami rechecked
as Fish / Full / Student. Reused existing equalizer artwork and desktop geometry.

Inspected the 12.766708s 720x1568 recording with browser-decoded frame sheets, including
opening around 0.90-1.30s and collapse around 6.24-6.64s. Reference shows a continuous
shell, sequential content and soft settling. Applied a lightly damped opening spring,
monotonic closing spring, width-before-height and shorter duration for partial reversals.
460/380ms are desktop choices, not exact measured recording timings.

Work was interrupted by disk exhaustion. The TSX edit had persisted but the CSS timing
edit had not; reconciled both on resume. At the user's request, pip cache purge removed
457.4MB; a broad temporary-cache deletion was policy-blocked and did not run. No model,
runtime, project or personal files were deleted. Final C free space remains limited.

Actual checks: Vitest 26/26; TypeScript/Vite 118 modules; first one-ui-system Playwright
8/9 (Account Edit profile focus assertion failed), repeat 9/9 without Account/source
changes between runs; production launcher smoke exit0. Six actual-app states at
1440x900,1280x720,820x1180, light/dark: zero capsule Axe A/AA violations, no horizontal
overflow or browser errors; all motion samples preserve clipping and sequential text.
Measured settle: opening460-465ms, closing386-388ms, early reversal276-277ms. These are
samples from this run, not performance guarantees. Bridge exits0 with empty stderr.
Reviewed the actual app screenshots and video frame sheets. Native Windows/DPI and
real workload performance were not reverified. Review artifacts and baseline copies
are in .design-cache/quickstatus-motion-20261005/. Git commands fail because this copy
has no .git/parent repository; inspected direct baseline diffs instead. No release.

## 2026-10-04 - Account and Quick Status continuation after Figma recovery

Two interrupted resumes stopped without source edits because whoami required
reauthentication. The current resume succeeded as Fish/Full and meaningfully read the
required One UI pages, live Button/Card/App Bar variants and actual text font properties.
The SmartGlove cover-only exclusion persists. Verified the existing pre-Account source
archive (232 entries, CRC and SHA256, no intervening source changes).

User confirmed four existing roles (no per-user permission switches), full name, contact
email and organization/team, and asked to locate the actual font download. Live Welcome
node 4:47 resolves that link; its public Drive preview title is Variable One UI Sans.ttf.
No embedding/redistribution license was found in that preview or official font guidance.
No font binary was added and no claim of actual Samsung rendering is made.

Recorded baseline Quick Status video/frames from the actual app. Full-width travel used
240ms with a double-RAF start and timer-based removal. Implemented a single reversible
WAAPI transform with 400ms entrance/320ms exit and animation-owned completion. These are
desktop choices, not measured Samsung timings. Baseline/new samples settle around
265/406ms; largest sampled position step drops from 170 to 103px. This does not prove a
higher frame rate: one new sample gap was 28ms versus 14ms in the baseline.

Added authenticated self-profile persistence, normalized avatars, atomic schema migration
with SQLite backup, permission explanations and Participant profile access. Added Pillow
12.x solely for decoding/normalization; installed 12.3.0 in the local environment. Real
profile edits preserve the cookie and do not reset telemetry/Studio/Monitor state.

Verification: full backend suite 75 passed, then added two image validation cases and
reran all 14 profile cases successfully; 26 Vitest cases, production build (118 modules),
final 9/9 focused Playwright and launcher smoke passed. Native PyWebView: 1426x863 CSS,
DPR1.25, both themes, 2 continuous motion samples, 4 Axe A/AA scans with zero violations,
profile save and role preview, no page errors, bridge exit0/empty stderr. Native100/150%
and user motion acceptance remain unverified.

Resolved intermediate failures: TypeScript caught a role-preview note inserted into the
create form instead of edit; moved it. One old migration assertion expected version1;
updated for the intentional version2. Oversized pytest parameter IDs caused fixture
errors; named cases fixed them. A new Participant test used an incorrect submit label;
corrected it and final9/9 passed. Initial review screenshots had reversed theme labels
and one transitional frame; regenerated after explicit theme/animation settling. Earlier
resume harness OOM/Vite-offline failures remain diagnostic only, not successful evidence.
Current artifacts and pending font/visual gate are in WORK_SESSION_HANDOFF.

## 2026-10-04 - Interrupted refinement finalized

Resumed without restarting implementation. Figma whoami and live One UI Button Grid
1497:11799 were successfully rechecked; the cover-only SmartGlove exclusion remains.
Reconciled current source, prior successful checks and archive hashes. The final bounded
Playwright run passed all six cases after app teardown waited for the application
WebSocket only (not the independent Vite HMR connection). Prior teardown failures remain
recorded in the September 28 entry. No production source change was needed on resume.

Completed the offline review page, current handoff and final archive-based scope audit.
The checkpoint still passes SHA256/CRC and all 56 protected references match. The final
source retains circular glyphs, no title hand and no newly exported illustration PNGs.
Review evidence remains dated September 28; October 4 is this continuation/handoff date.
The next gate is user visual review of this refinement, with native 100%/150% unverified.

## 2026-09-28 - Approved desktop follow-up and icon correction

Read required project context and reconciled the untracked downloaded workspace with
its parent Git repository. Reverified Figma whoami and meaningful One UI access before
work and on continuation; retained the intentional exclusion of the cover-only SmartGlove
file. Captured real baseline views and verified a 230-entry accepted-source checkpoint.

Implemented menu clearance from measured geometry, notification timing/reversal/text
handoff and drawer context/inert behavior, Raw Signals scroll safety and full hand labels.
The latest user rejected the first decorative illustration treatment. Removed those PNGs
from runtime, removed the title hand and used the existing exact Figma glyphs in shared
circular badges. Inspected Button Grid 1497:11799 and its children live; reused existing
local SVGs unchanged. Local Figma catalog and recordings remain read-only.

Real UI review found a collapsed notification misalignment after 1440-to-1920 resize:
its fixed-width anchor moved with the centered gutter without resizing. Observe the
containing layout and measure on the next frame, deduplicating unchanged bounds.
Also corrected Search browse aria-controls target and notification focus ownership.

Reviewed two themes, 18 sections and five widths; refreshed affected icon views after
user steering. Recorded actual interaction video/intermediate frames and tested actual
PyWebView at Windows 125%. An initial native audit used an incompatible Axe new-page
path; switched the audit to in-page Axe. A native packet-loss check raced the actual
configuration response; it now waits for successful PUT before sampling real telemetry.
Native final run passed and exited cleanly. Some Playwright/native teardown attempts
hit Windows socket-reset/temporary SQLite-lock errors; test teardown now unmounts the
real app, disposes its bridge and waits for WebSocket close rather than abruptly closing
an active stream. No production backend/lifecycle change was made. Final outcomes and
remaining limitations are recorded in WORK_SESSION_HANDOFF; failures are not counted
as successful runs. The user visual gate for this refinement remains open.

## 2026-09-27 ? Approved comprehensive system plan implemented

Continued the interrupted session after successful Figma identity and live-file checks.
Read the required pasted brief and canonical context; excluded the known cover-only
SmartGlove file. Established the rendered baseline and verified the pre-edit 229-entry
checkpoint. Inspected live Modern components and exact children beyond old inventories.

Implemented foundation/control/surface changes across the 18 sections and the three
priority fixes in one authorized frontend pass. Notification motion uses one WAAPI
controller, an independent portal, persistent rounded clipping and fixed-size crossfade;
hover and Search focus are owned by their proper surfaces. Preserved real functionality,
chart pause/acquisition separation, form drafts and existing exact Figma assets.

Reviewed 144 real viewport captures, then 24 final Account captures; performed actual
PyWebView checks at Windows 125%, recorded a 28.4s interaction clip and reviewed middle
frames. Corrected one accessibility attribute and one redundant Search prop found by
checks. Resolved a harness breakpoint race, then ran the outstanding checks. Final unit,
build, focused Playwright, accessibility and launcher smoke results pass. Native 100%/
150% remain explicit limits. Connecting hover was subsequently verified in both themes
using test-only latency on real connect requests. Full commands, provenance,
backup hash, source scope and evidence are in WORK_SESSION_HANDOFF / ASSET_INVENTORY.

No milestone/cutover approval is inferred; final user visual acceptance remains pending.

## 2026-09-27 — Overlay navigation, full app inspection and visual coherence

After the user's limit-interruption resume request, whoami succeeded again and actual
One UI rail, card and icon nodes remained readable. Reconciled the completed source,
38+5 passing checks and 14 Axe results; recorded final source hashes. Stopped the owned
Vite review process and confirmed port 5173 was released. No additional design changes.

Read project context, milestone, handoff, changelog/session history, asset inventory,
local Figma guide and required original pasted brief. The requested 20260912 transfer
file is absent; the existing 20260910 transfer is historical and superseded by current
canonical documents and explicit user decisions. No additional SmartGlove draft requested.

Before changes: whoami succeeded (Fish Full), then meaningful live inspection of
wzEFGRLl9MU1nB1JxUSyhD. Enumerated all 11 actual pages; searched the live 2,403-component
Icons page and inspected App Components, Behind the scenes, System UI, Workspace,
paint/text styles and exact applicable variants. The old cover-only SmartGlove file
was intentionally excluded. The Figma catalog JSONs were not regenerated or edited.

Rendered the real React application with an authenticated temporary simulator before
editing: all 18 contextual sections and overlays in 39 screenshots. Reviewed the new
6.63s galaxy-note.mp4 throughout, then at 0.15s intervals: the drawer covers stationary
content and selection dismisses it. This evidence supplements the prior three Samsung
recordings. Consulted official design-system, motion, large-screen, depth, symbol and
toast guidance. Created and verified the 249-entry pre-edit source archive.

Implemented the shared foundation and compositions listed in CHANGELOG.md. The final
main review passed 38 checks across all 18 sections, responsive layouts and overlays;
52 screenshots. Focus/resize/forced-color/offline review passed 5 further checks and
3 screenshots. 14 Axe scans found no WCAG A/AA violations; browser error lists are empty.
Both temporary bridges ended exit 0. Final TypeScript/Vite build and launcher smoke
passed; the affected Vitest suite passed 26 tests. No hardware/native GUI claims.

Intermediate verification: npm was initially invoked at the repository root (ENOENT)
and then correctly in the web directory. A reduced-motion assertion compared duration
to literal 0s, overlooking the existing global 0.01ms rule with transition-property:none;
corrected to check actual animations, transition property and final geometry. A focused
closing test initially included an unrelated peer-page animation; settled that transition
before sampling. Final attempts above passed. Source audit distinguishes expected Vite
build regeneration from source deletion. No missing source or protected-reference edits.

Remaining gate: user visual review through the unchanged run_app.ps1. See current handoff
for exact changed files, hash, source mapping and limitations. No commit/push/merge/release.

## 2026-09-26 — Toggleable navigation and live-status refinement

- Removed whole-row checkbox hover/checked paint in login, Raw Signals and shared forms;
  retained full label targets, exact selected/unselected artwork and keyboard focus.
- Added desktop rail show/hide with exact drawer341:46; starts hidden, preserves session
  choice through page changes and resizing; bottom navigation remains below1100px.
- Replaced the compact Now Bar grammar with a32px one-line Live Activity and44px hit
  target, expanding into the existing source-aware notification. Removed unsupported
  breathing decoration. Chart pause, markers, Escape/focus and acquisition stay intact.
- Rebuilt Quick Status with Card245:399 anatomy, a38/62 desktop split and standalone
  source rows. Shared snapshot prevents stale rates; common recent-gap state remains
  visible in both surfaces. Removed internal auth implementation copy. Notifications
  opened from Quick Status now return there on Back/Escape.
- Used exact semantic draft assets for devices, menu, translation, reports, play,
  upload and notifications. Success feedback uses completed515:716, not a checkbox;
  neutral/inactive statuses use text. Search actions show their actual action glyph.
- Arranged Studio's existing workflow into four reusable cards with semantic accents;
  retained real readiness and draft behavior. Dedicated Channels uses5/3/2/1 groups
  according to width; overview remains chart-first. No fabricated data or new workflow.
- Dataset Studio fades continuously with scroll; subtle top fade preserves readable
  floating utilities and their hit targets. Existing desktop proportions are retained.

Source gate: whoami and live One UI inspection passed after reconnect. Cover-only
SmartGlove reference excluded by user decision. Verified pre-edit archive:
`backups/SmartGlove-PRE-LIVE-NOTIFICATION-REFINEMENT-20260926-203152.zip`
SHA256 `9f6a774b375ec6c649c9186a11ba4417a5d04bbdfcf0704f928d21a8cf2ed0d4`.
All224entries/CRC/hashes verified. No restore of user source was needed.

Verification: npm test26/26; npm run build PASS; launcher process-scoped smoke PASS.
Actual React/Vite + Edge + authenticated temporary simulator:36/36 main checks and
2/2 supplemental checks PASS;13Axe page/theme states report0WCAG2A/AA violations,
0browser errors.44main+2supplemental real screenshots cover1920x1200,1440x900,
1280x720,820x1180,640x720, both themes, reduced motion and forced-color selection.
Supplemental check confirms both status views show actual simulated packet gaps and
recover after the10-second recent-gap window. Temporary bridges shut down exit0.

Earlier attempts: a harness selector incorrectly assumed zero unread notifications;
then runtime review exposed the Notifications Back issue, which was fixed. An Axe
scan during a snackbar's closing fade was repeated on settled content. Supplemental
gap verification initially observed transient resynchronization; corrected the test
to await the actual packet-gap message. Failed/intermediate attempts are not counted
as passing evidence. Final evidence: `.design-cache/oneui-refinement-20260926/final/`
and `supplemental-final/`; audit/source matrix and diffs remain ignored.

Not run: full historical Playwright suite, native PyWebView GUI, human screen reader,
real hardware, physical display/DPI review. No backend/core/protocol/acquisition,
dependency, font binary, reference catalog, original recording or launcher changes.
Downloaded project still lacks local.git; parent Git shows?? ./, so the archive
manifest is used for change review. No push/merge/release. Next gate: user visual review.

## 2026-09-26 — One UI language normalization and responsive rail

User approved the corrected desktop scale and authorized the new seven-reference pass,
then explicitly selected desktop left rail / narrow bottom navigation. This is a new
visual review gate, not acceptance of the earlier rejected mobile-size treatment.

- Shared typography: explicit14px/1.5 body; title32, profile24, section20, card/item16
  semibold, caption12, chart/micro11; common weight/line-height roles. Segoe UI is primary
  for consistent Vietnamese glyphs.40px actions and44px underline fields are retained.
- Colour: aliases resolve to shared canvas/container/raised/tonal roles, warning tonal
  added, reduced-transparency dark contrast fixed, theme-aware L/R badges and chart
  axis/grid/tick/font tokens. Channel mapping and solid/dashed traces are unchanged.
- Navigation: same four destinations in88px solid rail at>=1100 CSS px;54px bottom nav
  below. Arrow keys follow the axis; Enter activates. Content clears the rail. Scroll
  chrome uses capsules and a soft fade, preserving native sticky and contextual motion.
- Search: retained rounded tabs and48px field; inner input no longer exceeds capsule.
  Search typography now matches cards and item hierarchy.
- Shared paired action capsule44px: Back / Change password, divider and neutral surface.
  Forced password change retains its standalone action. Existing validation is retained.
- Now Bar: exact existing equalizer asset, leading activity circle, compact state/SIM
  and aggregate rate; expanded per-source rates, identity and health, chart-only pause,
  local marker. Degraded connection state outranks chart pause; no zero-Hz fiction when
  there are no available sources; bridge loss hides stale rate and explains historical
  counters. Expanded bounds distinguish rail from bottom dock. Escape/focus, scroll
  dismissal, overlay suppression and reduced motion remain in place.

Live One UI source gate verified: whoami successful plus full page/style/variant audit.
Cover-only SmartGlove Figma deliberately excluded. See temporary detailed source matrix
`.design-cache/oneui-language-20260926/AUDIT.md` for all seven references and node IDs.
Recordings remain the motion authority; exact Samsung Now Bar choreography is not claimed.

Verified pre-edit backup (221entries, all hashes/CRC verified again at handoff):
`backups/SmartGlove-APPROVED-DESKTOP-PRE-ONEUI-LANGUAGE-20260926-154933.zip`
SHA256 `162d53fcbe8bb4c795ff0b04cf1526777091eaa220793240895df7f2f210a1ba`.
Earlier archives preserved; no restore/reset/cleanup performed.

Verification actually run:
- `npm test`:5files /26tests PASS, including9new Now Bar truth cases.
- `npm run build`:TypeScript/Vite PASS after final source edits.
- PostCSS:affected styles parse PASS.
- Actual React/Vite + Edge + isolated authenticated simulator:30/30checks PASS.
  Covers four domains, Search, shared forms, action bar, menus, checkbox, dialog,
  snackbar, draft/pause preservation, rail keyboard and responsive axis, Now Bar
  rates/packet continuity/offline warning/local Mark/Escape/narrow reduced motion.
- 1920x1200,1440x900,1280x720,820x1180 and640x720; both themes.9Axe page/theme states
  (four domains x2 plus expanded Now Bar) report0WCAG2A/AA violations;0browser errors.
- Launcher smoke: direct invocation hit the host PowerShell execution-policy check.
  Process-only `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1
  -SkipBuild -SmokeTest` then passed exit0; no persistent policy or launcher change.
- Scoped `git diff --check -- .` passed; parent Git reports only `?? ./`, so it cannot
  describe this downloaded project's edits. The verified archive diff was reviewed:
  21implementation/test files plus5canonical documents; added-line whitespace clean.
- Temporary bridges shut down exit0 with empty stderr. No session tokens or credentials
  persisted by the harness. Screenshots render the actual application with simulator data.

First runtime pass found action label wrapping;340px bounded capsule fixed it. An
intermediate audit caught scroll-fade stacking above chrome; isolation was corrected
and final compact-chrome renders reviewed. A harness assertion used innerText on hidden
compact Now Bar content; switched to textContent, without a product change. Earlier
failed/cascaded runs are not reported as passing. Final evidence is only `final/`.

Not run/unverified: full historical Playwright suite, native PyWebView GUI, human screen
reader, real hardware, physical16-inch display/DPI. Reviewed sizes are CSS viewports.
No backend/protocol/acquisition, dataset, dependencies, launcher, Qt, assets or reference
catalog changes. Existing user work remains. Downloaded project has no local.git;
baseline manifest/archive is authoritative for this session's diff.

Next gate: user visual/motion review of this language pass. No push/merge/release.
Launch with existing `run_app.ps1`; it rebuilds current source.

Exact implementation/test files:
- `app/desktop_collector/web/src/AuthScreens.tsx`
- `app/desktop_collector/web/src/RuntimeActivityView.tsx`
- `app/desktop_collector/web/src/SensorChart.tsx`
- `app/desktop_collector/web/src/account-profile.css`
- `app/desktop_collector/web/src/one-ui/action-bar.css`
- `app/desktop_collector/web/src/one-ui/action-bar.tsx`
- `app/desktop_collector/web/src/one-ui/controls.css`
- `app/desktop_collector/web/src/one-ui/feedback.css`
- `app/desktop_collector/web/src/one-ui/interaction-page.css`
- `app/desktop_collector/web/src/one-ui/navigation.tsx`
- `app/desktop_collector/web/src/one-ui/overlays.css`
- `app/desktop_collector/web/src/one-ui/shell.css`
- `app/desktop_collector/web/src/one-ui/shell.tsx`
- `app/desktop_collector/web/src/one-ui/surfaces.css`
- `app/desktop_collector/web/src/runtime-activity.css`
- `app/desktop_collector/web/src/search.css`
- `app/desktop_collector/web/src/studio.css`
- `app/desktop_collector/web/src/styles.css`
- `app/desktop_collector/web/src/telemetryNowBar.test.ts`
- `app/desktop_collector/web/src/telemetryNowBar.ts`
- `app/frontend/shared/one-ui/tokens.css`

Documentation: `PROJECT_CONTEXT.md`, `PROJECT_MILESTONE_TRACKER.md`, `CHANGELOG.md`,
`docs/SESSION_LOG.md`, `docs/WORK_SESSION_HANDOFF.md`.
Evidence/report: `.design-cache/oneui-language-20260926/` with `final/results.json`,
real screenshots, backup metadata, source audit and checkpoint diff. Temporary artifacts
are ignored and not committed. No additional production dependency or asset bundle.


## 2026-09-26 - Desktop proportions corrected after visual rejection

User rejected the strict pass's oversized mobile geometry and pill-shaped form fields.
Current direction supersedes literal Figma dimensions: preserve desktop proportions,
use the supplied Samsung Account underline-field anatomy, and rounded Search tabs
consistent with outer contextual navigation. This is a correction, not a full rollback.
Fresh Figma whoami and live Top Nav1540:31020/31021 plus Search1497:12550 were read;
Top Nav capsules and Search fields are distinct from form input anatomy. Cover-only
SmartGlove Figma remains excluded. Existing exact assets/motion/real state are retained.

Shared default actions60->40px, labels20->14px; fields58->44px with transparent
background, bottom line, focus/error feedback and password end-action; page titles
36->32px. Icon targets50->40px, checkbox art24->20px with44px rows, menu text20->14px,
menu padding24->12px, dialog actions20->16px. Search field48px; tabs38px with25px
radius and transparent outer group. Compact telemetry and contextual tabs share the
smaller scale. Card titles16px, key-value rows14px. No global CSS zoom/transform scaling.
Small filled actions use contrast-safe blue in both themes. Menu placement estimates
match smaller rows/minimum width. Navigation destinations and behavior are unchanged.

Before edits, verified previous checkpoint:
`backups/SmartGlove-PRE-STRICT-FIGMA-NORMALIZATION-20260926-082514.zip`
SHA256 `7d4384a8043b2ff0df1e49588e9a35ee4bf0845c95843848a2cd95d76ac5da36`.
New checkpoint of rejected strict result (221 files, CRC and every hash verified):
`backups/SmartGlove-PRE-DESKTOP-CORRECTION-20260926-143421.zip`
SHA256 `8405d4847b39661d50dc035aa2f82036b65b8de01b59e7e6de765bbd76e23819`.
Both remain intact; no whole-archive restore performed.

Validation: npm run build PASS;8/8 existing overlay/runtime tests PASS;9 affected CSS
parses PASS. Corrected real Vite/Edge + isolated authenticated simulator review23/23
PASS: main pages, Search, password, dropdown, checkbox, dialog/snackbar, retained state,
reduced motion,1920x1200/1280x720/1440x900/820x1180. Main-page Axe zero WCAG2 A/AA
violations across4 pages x2 themes; no browser JS errors. Initial review script expected
fields on the profile summary without opening Change password, leaving the overlay
open and causing cascading timeouts. Harness corrected; successful rerun did not
require a production fix. Temporary bridges shut down cleanly.

Additional form verification: underline focus/error feedback PASS; login Axe zero
WCAG2 A/AA violations in dark and light, no browser errors. Supplemental harness
initially used an incorrect theme-button accessible name; corrected to the real
shared test ID and passed. Evidence: form-verified/results.json.

Evidence and changed-file list: `.design-cache/desktop-proportion-correction-20260926/`.
No backend, acquisition, dependencies, assets, launcher or reference-catalog changes.
Not verified: native PyWebView GUI, hardware, full E2E suite. New user visual acceptance
remains open; Phase E/M2 and cutover status unchanged. run_app.ps1 rebuilds the source.

## 2026-09-26 - Strict Figma-led generic UI normalization

Current authorization: `7a589557-ebf6-43bd-a7f2-96300c633dfd/pasted-text-1.txt`.
The completed Design Kit refinement is this pass's baseline. Live One UI now supplies
the default generic component standard; deviations require concrete evidence.
Fresh whoami and meaningful One UI file access verified; all 11 live pages, relevant
sets/modern variants, icons, six text styles, 19 paints and canvas notes inspected.
Cover-only SmartGlove file is intentionally excluded; current source owns functionality.

Delivered: shared 60px buttons, 58px fields/Search, 50px icon buttons, modern 52px
segments, 24px checkbox artwork, 20px menu text/p24, modern translucent dialogs,
Card p20/r28 with 18px regular titles/grouped rows, 36px page titles, 54px dock with
22px icons/10px labels, 100px profile avatar. Password fields share the normal field
primitive. Exact search340:8619 refreshed; existing close/error/info/checkbox assets
replace generic symbols. Seventeen source/asset files changed; CSS reduced by9791 bytes.
Contrast exceptions are scoped to measured surfaces. IA, real state, chart semantics
and recording-derived Search/navigation motion preserved.

Recovery: `backups/SmartGlove-PRE-STRICT-FIGMA-NORMALIZATION-20260926-082514.zip`,
221 entries verified before edits, SHA256
`7d4384a8043b2ff0df1e49588e9a35ee4bf0845c95843848a2cd95d76ac5da36`.
No project-local Git; parent status `?? ./`; checkpoint hashes provide scope evidence.

Verification: TypeScript/Vite build PASS;12 CSS parses PASS;8/8 existing overlay/runtime
unit tests PASS. One final real-app review covered main pages/overlays/two themes and
1920x1200,1280x720,1440x900,820x1180. Main checks22/23 initially: forced-color assertion
was too early; targeted media-refresh retry PASS. Initial contrast and status-art
issues fixed. Follow-up Axe has zero WCAG2 A/AA violations on4 pages x2 themes.
Status geometry retry first sampled hidden content; visible24x24 artwork and equal
Search segments passed the corrected check. Zero browser JS errors. Temporary bridge
shutdowns exit0. Original failures remain in evidence; no full E2E, native PyWebView,
backend or hardware validation claimed.

Full mappings, changed files, source diff, screenshots and six concrete exception
categories: `.design-cache/oneui-strict-normalization-20260926/CONFORMANCE_REPORT.md`
and `FIGMA_CONFORMANCE_EXCEPTIONS.md`. These are ignored review artifacts, not runtime.
Next gate: user visual acceptance of this strict pass. Phase E/M2, hardware, launcher
cutover and Qt cleanup remain closed. No release, push, dependency or backend changes.

## 2026-09-26 — One UI Design Kit conformance refinement

- Continued the accepted completed overhaul per `4cffd1dd-36bc-4978-84d0-f7909b9635a1`.
  Fresh Figma whoami/access verified before editing; all 11 pages and relevant canvas
  notes, sets/variants, styles, icons and imagery inspected. Old SmartGlove cover excluded.
- New verified 216-file post-overhaul checkpoint:
  `backups/SmartGlove-POST-ONEUI-OVERHAUL-PRE-DESIGNKIT-REFINE-20260926-073716.zip`.
  SHA256 `9b3cf5d597077aa46fc02554697e67d46799810823e8372c104817fd85687070`.
- Replaced checkbox drawings, feedback character symbols/custom close SVG and dropdown
  long arrow with five exact Figma exports. Removed Monitor/auth checkbox overrides;
  native checkbox is visible under forced colors. Existing info icon reused.
- Sentence-case table headers, four 800-to-700 weights, 44px/16px dialog actions,
  neutral shared menu elevation, and no redundant blur behind opaque dialog/menu surfaces.
  Account composition, imagery, four domains, Search and video-derived motion preserved.
- TypeScript/Vite build PASS (100 modules); 11 CSS parses PASS; existing overlay tests
  3/3 PASS. Real Vite/Edge + isolated authenticated bridge reviewed all major screens,
  two themes, 1920x1200 plus 1280/1440/820 widths. Main runtime checks 13/15 initially;
  two harness-selector/asset-URL assumptions resolved with targeted checks, both PASS.
  Notification check separately PASS. No browser errors; Devices light Axe 0 violations.
  Temporary bridge shutdowns exit 0. No full E2E/native GUI/backend/hardware claim.
- Discovery index: `.design-cache/oneui-designkit-audit-20260926/DESIGN_KIT_INDEX.md`.
  Complete scope/evidence/limits: current `docs/WORK_SESSION_HANDOFF.md` entry.

## 2026-09-26 — Coherent One UI frontend overhaul

- Authorized full-system visual/interaction pass; Figma `whoami` Fish succeeded and
  live One UI `wzEFGRLl9MU1nB1JxUSyhD` access was verified before editing. Old SmartGlove
  `StIo1CdCci8HQXMmdhXZG8` is intentionally excluded as cover-only. Current source,
  live Figma, all three recordings and official One UI docs were audited independently.
- Verified pre-edit 208-file backup: `backups/SmartGlove-PRE-ONEUI-OVERHAUL-20260926-024246.zip`;
  SHA256 `179bfb3d77dfdede88198ed315fcafe5fdc30c2a911f212a3ea35344c1c04931`. No local project Git metadata; filesystem hashes provide
  the baseline, preserving user archives and unrelated files.
- Replaced shell morph/workaround stack with native sticky contextual chrome,
  interruptible content transitions and a compact floating dock; standardized matte
  surfaces, typography, 40px controls and 42px fields across the existing screens.
- Preserved device/monitor semantics, made view/draft state survive domain navigation
  with reset on sign-out/user change, redesigned Account/Profile from real account
  data, added six exact Figma assets and purposeful Studio imagery, retained Search's
  bottom input and detail-page Back/focus flow. Consolidated superseded CSS.
- Final build and all 11 CSS parses PASS; relevant existing unit checks 15/15 PASS.
  Actual browser/bridge review and targeted fixes cover both themes, desktop/narrow
  layouts, navigation, profile, Search, Now Bar and accessibility (Devices Axe 0/0).
  Initial detected defects and automation timing issues are documented in the handoff.
- One temporary-bridge cleanup hit Windows connection reset/SQLite file lock; last
  follow-up shutdown exit 0. Intermittent shutdown reliability/native GUI remains
  unverified. No full E2E/backend/hardware run, new dependency, cutover or push.
- One direct-root patch ZIP delivered. Implementation awaits user visual approval;
  Phase E/M2 remains closed. Exact files, mappings, evidence and limits:
  `docs/WORK_SESSION_HANDOFF.md` (2026-09-26).

## 2026-09-12 — SignFlow source-only publication

- User explicitly authorized replacing old files on HFuoc/SignFlow and pushing only project source, excluding APK, patches, unrelated Markdown and archives.
- Downloaded workspace has no local .git. Isolated checkout: `.design-cache/signflow-publish`, origin `https://github.com/HFuoc/SignFlow.git`, branch `main`, parent `b9149d1db153f1d605f744727248e4a61c44384d`. Original local archives/APK/patch/reference material preserved. No history rewrite.
- Prepared 169 source/config/test/asset/technical-documentation files (about 1.34 MB); removes old unpack workflow, backup ZIP and BACKUP_BASELINE.md from published branch. Runtime/Qt rollback files retained. Session logs and project planning snapshots remain local.
- Changed local files: README.md (complete Windows setup/run/auth/dev/test/troubleshooting guide), .gitignore (publication exclusions), app/desktop_collector/web/src/store.test.ts (two stale Vietnamese error expectations updated to existing English app copy), CHANGELOG.md, docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md.
- Verified in filtered checkout: npm.cmd ci PASS; Python pytest 63/63 PASS (two dependency deprecation warnings); Vite/TypeScript build PASS; Vitest initially 15/17, then 17/17 PASS after expectation correction; PySide smoke exit 0; bridge smoke initially hit sandbox read-only database on shutdown, escalated rerun exit 0 with no error output.
- Git staged artifact/credential-pattern audit PASS; all published file bytes match corresponding workspace files. git diff --check on unstaged changes PASS; staged diff --check reports pre-existing trailing whitespace/EOF blanks in imported source, preserved rather than reformatting unrelated work.
- NOT RUN: fresh Python dependency install, full Playwright, interactive GUI and visual acceptance. Publishing does not approve new UI, open ML/hardware milestones, change launcher cutover or authorize Qt cleanup. Next product gate remains manual runtime/visual acceptance.
- Publication status: pushed successfully to HFuoc/SignFlow main as c49a2aa70930ed38fdd289c1a4a753a9f535317c (fast-forward from b9149d1). Isolated checkout is clean; final git diff --check and git diff are empty. Original workspace archives and unrelated files remain intact.

## 2026-09-10 — Auth V2 center-lock sandbox refinement

- User asked to keep the `Sign in` title visually centered while retaining Samsung-style underline credentials.
- Updated only `app/desktop_collector/web/src/styles.css`: login header is now block/full-width, login copy and body span the card, and the bounded 392 px form column remains centered. Username/Password labels remain left aligned; CTA remains the Figma-grounded accent pill.
- Generated review-only light/dark actual-source harness screenshots in `/mnt/data`; no generated screenshot was added to repository source.
- Geometry verification at 1440×900: card center = title center = form center, delta `0 px` in both themes.
- `npm run build` is still blocked because the transferred sandbox `node_modules/vite` directory lacks `vite/client`; `npm ci` timed out. No new dependency was introduced.
- Gate remains user visual approval of Auth V2 before broader icon-enrichment or propagation to other auth forms.

# Session log

## 2026-09-11 — Secondary interaction-page refinement

- Implemented attachment `8bc052ac-240e-41a2-a249-540e861724e5` after successful Figma reauthentication: shared page-depth interaction for Search/Quick Status/Create Account, exact info SVG pair, spaced account form, hidden scroll chrome for Security and compact Device Manager controls.
- Retained API, role/password validation, search actions, real status data and underlying page state. No APK/backend/navigation/Now Bar redesign.
- TypeScript no-emit and modified CSS parsing PASS. Runtime/visual checks NOT RUN by user instruction. Next gate: user manual test; details and changed files in `docs/WORK_SESSION_HANDOFF.md`.

## 2026-09-10 — Figma component conformance pass after Astra Studio/Search

- User requested a bounded normalization pass with stronger component reuse: Figma should function as a component source, not only a visual mood/reference. Preserved the approved shell direction, scroll behavior, Devices/Monitor composition and Astra's UI-only Studio architecture.
- Saved a pre-edit checkpoint at `.design-cache/figma-conformance-pass1/pre-edit.zip` plus SHA-256 manifest. The active sandbox working copy is `/mnt/data/sg-current` -> `/mnt/data/astra-result`.
- Introduced reusable coded One UI primitives for Card/empty/key-value/selection surfaces, Search/select fields, Top Navigation, App Dock and Floating Toolbar anatomy. Studio, Global Search and shell navigation were refactored to consume those primitives. Exact Figma SVG assets already in the project remain the icon source where available.
- Normalized contextual-nav, utility-pill and dock surfaces/geometry toward the local One UI Figma catalog while retaining the product-specific Samsung Health scroll morph. Light ambient color was reduced; dark/light base and container tokens now use the catalog values directly.
- Bounded English cleanup covered App/SensorChart/shared One UI paths touched by this work; AuthScreens/UserManagement/API-facing legacy copy was intentionally not swept in this pass.
- Verification: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json` passed from the web directory. Full Vite build remains environment-blocked by the uploaded Windows dependency tree missing `@rollup/rollup-linux-x64-gnu`; no dependency repair was attempted.
- Actual-source review used a deterministic React SSR harness plus Chromium `set_content`, not generated mockups. Review images: `studio-overview-component-pass.png`, `studio-mediapipe-component-pass.png`, `global-search-component-pass.png`.

## 2026-09-10 — Studio/Search UI implementation; external verification pending

- Attachment `5ae3ecc9-4114-4410-8da0-e1a9a9d85507/pasted-text-1.txt` approves the
  current visual baseline, freezes existing screens, and authorizes this frontend-only
  expansion. It explicitly delegates runtime, visual, accessibility and responsive
  verification to another agent. No Phase E/M2, hardware, cutover or release work.
- Used minimal canonical context and targeted frontend inspection. This downloaded
  folder has no `.git`; `git status`/diff cannot describe it. No parent repository,
  branch, history, existing user asset or acquisition source was modified.
- Local One UI discovery preceded focused live context calls for Search `1497:12549`,
  Card `245:399` and Collapsed Search `1589:7648`, file `wzEFGRLl9MU1nB1JxUSyhD`.
  Reused approved primitives; Studio's six text sections adapt the existing contextual
  bar. A bounded library icon query returned no camera match; no library crawl followed.
  Search icon bytes from instance `1589:7626` were downloaded unchanged into the existing
  frontend asset directory after sandbox network escalation. No expiring URL in source.
- Delivered six Studio sections, editable configuration drafts, source readiness and
  future presentation types, plus a pure frontend Search index and shared side sheet.
  Dataset/model/run categories remain empty. No camera permission, device enumeration,
  import parser, training job, evaluation calculation or recognition output is fabricated.
- Extended shell utility/context slots and side-sheet optional close lifecycle callback
  to keep Search handoff after modal focus cleanup. The original progressive utility
  background and title/context fade formulas remain unchanged. Chart modules, Raw
  Signals scrolling, runtime acquisition semantics and `run_app.ps1` were not edited.
- One transient sandbox helper error reported disk exhaustion. A read-only escalated
  disk query showed about 3 GB free on C; normal edits resumed. No cleanup or toolchain
  repair was performed; root cause was not established.
- Single verification: `node_modules\\.bin\\tsc.cmd --noEmit -p tsconfig.app.json`,
  from the web directory, exit 1: Windows resolved `./Studio` to `studio.ts`, producing
  TS2305/TS1261/TS1149. Renamed the new type module to `studioModel.ts` and updated both
  consumers. Deliberately did not rerun; final-source compilation is UNVERIFIED.
- No tests, build, screenshots, smoke, accessibility or responsive review. Exact final
  changed files and remaining gate are recorded in `docs/WORK_SESSION_HANDOFF.md`.

## 2026-09-09 — Full reusable One UI pass implemented; stop for visual approval

- Read the new attachment, canonical project documents and all 13 local catalog
  files. Reconciled stale Stage1-only documentation with the existing Direction B
  source. No local `.git` exists in this downloaded folder; the parent user repo is
  unrelated. Saved 132 source/document/reference files before edits and preserved
  all existing work. No parent Git state was modified.
- Live Figma authentication, metadata for exact file `wzEFGRLl9MU1nB1JxUSyhD` and
  actual representative design contexts succeeded. Published the component-to-node
  implementation matrix before editing; no catalog-only fallback or new icon assets.
- Refined reusable foundation and applied it to both screens. Retained Direction B
  ambient composition, solid/tonal cards, one theme control and chart-first layout.
  Added source-truth flex presentation, per-channel legends/axes, compact shared
  chart controls and consistent Quick Status/Now Bar availability on Monitor.
- Real-app baseline caught invalid flex-bar labeling. Iteration tests caught narrow
  snackbar overflow, CSS-generated punctuation changing dialog button names, and a
  missing snackbar landmark; all corrected. Independent review also identified
  action-hover contrast and theme recreation losing paused/explored chart x ranges;
  both corrected, with canvas round-trip verification for pause/explore.
- Final image inspection caught an inherited outer-panel scroll/focus defect and
  stale tablet grid rules in Raw Signals. Bounded the shared checkbox input to its
  row and gave the panel one internal scroll region; first/last row focus and panel
  bounds now pass at all four viewports. Refreshed the real all-13-channel screenshot.
- Final `npm.cmd test`: 17/17; `npm.cmd run build`: success, 53 modules;
  `npm.cmd run test:e2e -- tests/visual-system.spec.ts --trace off`: 5/5, 30.2s.
  Actual bridge acquisition continues while chart canvas is frozen. All 13 channels,
  empty/recreate, zoom/follow, reconnect/missing data, focus return, Now Bar no-reflow,
  keyboard/forced colors, dialog/sheet/snackbar bounds and two themes are covered.
- Earlier E2E iterations failed before the above fixes; those failures are not
  reported as passes. Initial build/test/dev and direct smoke attempts encountered
  sandbox filesystem restrictions; authorized reruns succeeded. Initial launcher
  invocation was blocked by PowerShell execution policy; a process-only Bypass
  invocation succeeded without changing the system policy.
- During the final scroll-fix verification, one worker exited with native code
  3221226505, one bridge startup exited 1 without retained stderr, and one whole-test
  90s timeout surfaced inside axe. Revalidated terminal/missing handles and absence
  of project processes before restarting. Added redacted startup stderr and named
  scan diagnostics. Isolated interaction test then passed 1/1 (14.9s), followed by
  final full affected suite 5/5 (30.2s). No persistent root cause was proven; no
  production workaround or reduced axe coverage was introduced.
- Direct shell smoke exit 0; final-build launcher `-SkipBuild -SmokeTest` exit 0.
  Review PNGs and axe reports are under `.design-cache/visual-system-refinement/`.
  Zero axe violations does not imply complete certification: contrast and existing
  Quick Status manual targets remain. Native-window visual, screen-reader speech
  and normal-speed human motion review are unverified. Historical E2E geometry tests
  were not run because they target the earlier rail/frozen layout.
- Updated changelog, tracker and portable handoff. No Phase E/M2, hardware, transport,
  ML, capture, cleanup, commit, push, merge or release. Next gate is explicit user
  visual approval of the current actual-app renders.

## 2026-09-09 — Stage1 final authorized verification complete; visual approval pending

- Confirmed old smoke PID34348 absent; preserved INCONCLUSIVE evidence. One v2-recorded
  direct smoke captured actual Python exit0 with saved empty stdout/stderr, no timeout.
  One isolated Edge page/context check then passed; no retries or concurrent smokes.
- Final production-preview6/6 targeted E2E passed1.3min, one worker/trace off. Device
  Manager8states0axe violations/incomplete; Now Bar16combinations/3728frames stable
  400×60/520×325, no transient scrollbar, acquisition continues during pause.
- Refreshed10app PNGs/native source comparison; inspected final settings/compact both,
  1280light/comparison, reusing prior same-CSS visual review and unaffected test results.
  Earlier unit17/17, final51-module build and launcher exit0 reused, not rerun/full-suite.
- Reviewed four production diffs against Stage1 baseline; no source edits this turn.
  Final build/source/checkpoint hashes preserved; old INCONCLUSIVE result unchanged.
  Two historical gaps remain (runtime test/asset inventory); no complete rollback claim.
- One consolidated outcome saved in handoff/design rules/tracker/changelog and ignored
  final-verification-20260909.json. Stage1 implemented, STOP for user visual approval.
  Native-window/screen-reader/motion and existing Quick Status manual targets remain.
  No wider rollout, security/settings/dependency/backend/launcher change, commit/push.

## 2026-09-09 — Recorder-only repair verified, application gate unchanged

- Subsequent read-only revalidation confirms the same inconclusive smoke and passed
  recorder self-test, with no Node/Python process. Launch authorization gate persisted
  across three resumed Goal turns; Goal marked BLOCKED pending fresh user permission.
  No app/browser retry or source edit; resume current checkpoint only.
- Automatic Goal continuation did not authorize another app/browser launch. Read the
  objective/current state; previous turn made concrete checkpoint/diagnostic progress.
- Kept original recorder/logs unchanged; added ignored v2 recorder with retained
  process handle, concurrent stream capture and null/error failure guard. SelfTest
  only: two synthetic PowerShell exits0/7 and exact stdout/stderr verified2/2.
  Evidence: one-ui9-device-manager/recorder-v2-SelfTest-20260909-014653/selftest.json.
- No Python/app/Edge/E2E launched. Stage1 remains incomplete; previous smoke remains
  inconclusive. Next step requires fresh bounded smoke authorization, not another
  recorder fix. No production/build/security/rollback changes or wider rollout.

## 2026-09-09 — Bounded Stage1 recovery: checkpoint saved, smoke result inconclusive

- Preserved pre-stage1.zip byte-identically. Saved and verified53 accumulated modified/
  untracked files in continuation-20260909-014158; recovered clean pre-Stage1 Playwright
  config HEAD blob separately and recorded design-rules prior absence. Exact pre-edit
  runtime test/asset inventory remain two historical gaps, disclosed before further edits.
  Current-state backup does not repair historical coverage. No source edits performed.
- Exactly one isolated direct smoke ran against retained final build. stdout/stderr
  saved empty, no timeout; recorder's child ExitCode was null. Wrapper exit0 is not a
  smoke pass. Security4689 read found no matching events; no Node/Python remained.
  Evidence: one-ui9-device-manager/direct-recovery-20260909-014300/result.json.
- Stopped without Edge/E2E launch or smoke retry. Recovery unproven; recorder must be
  repaired/validated and a new bounded attempt authorized before another app launch.
  No Argon2/auth/settings/dependency/launcher changes, cleanup, commit or push.
- Retained final build hashes match; diff check passed. Handoff and separate recovery
  ledger updated; prior iteration results unchanged. Stage1 incomplete; final-role axe,
  remaining Now Bar checks and human review/visual approval still pending.

## 2026-09-09 — Saved Stage1 state reconciled after usage interruption

- Subsequent read-only revalidation found the same terminal failed result and no
  Node/Python process. Existing Goal marked BLOCKED after the gate persisted across
  three consecutive Goal turns. No launch retry; awaiting user direction for bounded
  recovery. Source and completed evidence remain intact.

- Read current handoff, iteration ledger, failed Playwright result/error context,
  retained build and prior terminal smoke output; no browser or smoke launched.
- Confirmed final51-module build exists (index-CQSvcnQ8.js/index-17l4M1_h.css).
  All seven recorded browser invocations terminal; last six-selected run failed
  during axe after browser/page closure, five unrun. No missing-output pass inferred.
- Confirmed direct smoke exit1 with Argon2 memory allocation error and later launcher
  exit0 were saved in the ledger before interruption; standalone smoke log files were
  not found. Same Python/module/auth path; changing resource availability is plausible,
  not a confirmed explanation. Browser closure cause remains unestablished.
- Readable10-entry pre-stage1 archive does not cover all14 Stage1 paths. Missing
  config, runtime test, asset inventory and new design-rules document recorded in
  handoff; no archive changed or falsely backfilled with current contents.
- Updated handoff with exact source/evidence provenance, terminal counts, unverified
  final-role/NowBar/smoke work and sequential bounded recovery proposal. Current-state
  snapshot is recommended before further edits; Stage1 remains incomplete, Devices
  only, user visual approval pending. No process termination or security/settings change.

## 2026-09-09 — One UI9 fidelity Stage1 authorized and initial implementation

- Read new Goal attachment; user makes draft authoritative and unfreezes necessary
  geometry, while keeping V.3 behavior and Device-Manager-only stopping gate.
- Read canonical context/scoped delta and actual six Figma component contexts/images;
  applied mandatory design-to-code workflow, no file-root scan or new assets/fonts.
- Added ONE_UI_DESIGN_RULES source/variant contract and explicit desktop/font/glyph
  gaps. Saved10-file pre-stage1 archive separately from untouched V.3 evidence.
- Device groups now content-sized with14px support and36px rate;60px/20px actions,
  rounded58px numeric fields, simulator header/actions and field grid separated.
  Scope reference palette and shell variant to Devices; preserve all functional handlers.
- Unit17/17, production build51modules pass. First review startup failed: npm missing
  preview script (no browser launch). Fixed test command to installed Vite preview;
  focused browser test result still pending. No environmental failure diagnosis claimed.
- No backend/launcher/dependency/system-setting/git mutation. Stage1 remains IN PROGRESS;
  final geometry regression updates, visual review, affected verification and handoff remain.

## 2026-09-08 — V.3 browser recovery, final corrections and evidence completed

- User authorized one bounded recovery. Read current continuation/scoped delta; resources
  ~2.80GiB physical and ~7.53GiB virtual free, no stale task browser. Isolated Edge page
  creation passed in 1063ms, own context/server closed; unrelated processes untouched.
  Reused completed Figma families, no repository rescan or implementation restart.
- Existing diagnostic ran once: 469.1875px panel, font-dependent normal legend line
  boxes. Set legend line-height 1.3; 800px result 467.78 versus frozen 467.8, preserving
  Segoe UI/11px size. Targeted 2/2 then pending-control regression 1/1 passed. Removed
  temporary diagnostic code; retained diagnostic JSON and original 24-entry checkpoint.
- Full V.3 E2E once, 24/28 in 6.3m. Three failures share 4.12:1 selected/pressed contrast;
  one contact-sheet failure followed RAM capture loss on worker restart. Corrected
  foreground with theme-aware accent/text mix; measured 5.028:1 light, >=6.388:1 dark.
- Final affected/evidence run selected 17 tests. Initial stdout confirmed first three
  passed; handle later disappeared. Revalidated terminal saved `.last-run.json` passed
  with no failures and all final artifacts; did not restart based on handle loss.
  Final full-source suite was NOT rerun; earlier 24/28 is not a final-source pass.
- Final build 51 modules; direct shell smoke and SkipBuild smoke both exit 0. Unit17/17
  reused because later production edits were CSS-only. No Python tests or dependency
  changes. Protected hash check 177/178 unchanged with api.ts copy-only exception;
  HEAD unchanged, diff check clean, accumulated work and rollback preserved.
- Reviewed six final PNGs at original resolution, including auth/management/dialog/
  feedback/collector and both Now Bar sizes. Final WebM1440×900/25fps/6.08s records actual
  open/pause/resume/close/reversal. Metadata verified, human playback not watched; bundled
  FFmpeg lacks null muxer, so no full decoder claim. No supported human-video tool found.
- Final Now Bar16 combinations/3065frames stable400×60/520×325, zero transient overflow;
  packet counters continue, page position stable, legitimate200% scrolling retained.
  Eight axe inventory states zero violations; manual-review entries retained. Final
  evidence and test provenance in `.design-cache/artifacts/one-ui-v3/` and handoff.
- V.3 implemented; next user visual approval. Human motion/native-window visual review
  and NVDA/Narrator speech remain unverified. Frozen geometry/PhaseE boundaries unchanged.

## 2026-09-08 — V.3 current-source unit/build pass; browser verification stopped

- Final blocker audit: after three consecutive Goal turns with the same terminal
  browser-verification blocker, read-only checks found no live test process and no
  channel-font diagnostic output. Marked the existing Goal BLOCKED, not complete.
  No browser retry or system-setting change; awaiting environment recovery to resume
  the documented checkpoint. Only handoff/tracker/session status changed in this audit.

- Resumed exact existing checkpoint. Previous test handle 17885 was unavailable;
  saved result listed only the 800px geometry failure. The bounded follow-up diagnostic
  (10857) failed before opening a page: `browserContext.newPage: Test timeout of 30000ms
  exceeded`; context teardown also timed out. Playwright cleaned up its own Edge tree.
  Stopped browser launches per brief. Low available memory was observed read-only;
  exact browser failure cause remains unproven. No system settings changed.
- Removed ordinary-flow Bridge/recovery-window jargon; checkpoint extended from 21
  to 24 entries before the additional copy/test files. API diff is exactly one generic
  error sentence, with auth/transport behavior byte-for-byte otherwise unchanged.
- `npm test` 17/17, `npm run build` 51 modules, `npm ls --depth=0` clean,
  `git diff --check` exit 0. Build retained; no Python/backend edits or Python tests.
  Protected hashes: 177/178 unchanged; sole differing api.ts verified copy-only.
- Now Bar report covers 16 viewport/theme/state combinations at four required sizes,
  all stable 400×60 collapsed / 520×325 expanded and zero scrollbar frames. This and
  passing reversal/200% evidence predate the latest connection-copy edit.
- Remaining: diagnose/fix 800px channel height 469.19 versus frozen 467.8px, verify latest
  copy/control states, final full E2E once, smokes, six native-pixel images and one video.
  No V.3 final screenshots/video exist yet. Current handoff contains exact changed files,
  provenance, constraints, commands and resume point. Goal remains incomplete.

## 2026-09-07 — V.3 resumed, initial Now Bar stability correction

- Continued with verified live references: shared controls, dialog/field hierarchy,
  font and product-writing corrections. CDP confirmed mixed Vietnamese glyph rendering;
  Segoe UI first removes that mixture. Preserved protected assets and shared tokens.
- Subsequent targeted runs: 1/1 font, 4/4 shared/frozen/1280, then 5/7 broader checks.
  New all-four-size pause and reversal/200% regression passed. Two findings: obsolete
  dialog-radius assertion updated for authorized local anatomy; 800px channel panel
  +1.39px font drift under diagnosis. No final full-suite/build/smoke claim yet.

- Successful live Figma family reads and reconnect preflight preserved; resumed existing
  Goal and dirty implementation. No repeated phase or prototype integration.
- Checkpoint 21 planned files in `.design-cache/artifacts/one-ui-v3/pre-v3.zip`.
- Frame measurements reproduced expanded 290→325px pause growth and transient scrolling;
  collapsed remained 400×60. Added stable intrinsic chart status and viewport-constrained
  overflow in RuntimeActivityView.tsx/runtime-activity.css; regression in runtime-activity.spec.ts.
- Initial targeted Playwright 2/2. Font diagnostic added after that run remains unrun.
  V.3 product-wide alignment and final verification remain in progress; see handoff map.

## 2026-09-07 — Production One UI alignment and approved Now Bar integrated

- Resumed the existing Goal/worktree checkpoint after Figma reconnect, without resetting
  files or rebuilding completed references. whoami confirmed Fish; actual context plus
  screenshot returned the expected ten LiveActivity variants at `1491:6362` in the
  required duplicate file. Prior invalid-grant/reauthentication failures were stopped.
- Completed the production A.1 capsule/overlay presentation and bounded shared typography,
  field/action/helper/notification adjustments. Fixed initial overlay-width flash and
  reversal letter-spacing discontinuity; preserved acquisition, chart pause ownership,
  anchoring, focus, dismissal, shell handoff and all protected boundaries. The production
  brief supersedes the prototype spec's historical unapproved-integration wording.
- Final source files: RuntimeActivityView.tsx, runtime-activity.css, App.tsx, styles.css,
  one-ui/{controls,shell,overlays,feedback}.css; tests/{runtime-activity,collector}.spec.ts.
  Updated changelog, tracker, asset inventory and handoff. The 14-file pre-integration
  archive was extended to 15 before changing the asset inventory; earlier entries and
  accumulated unrelated user edits were preserved.
- Verification: initial targeted Now Bar 4/4 and shared checks 6/6. One full E2E run
  passed 23/27, with dialog-scale measurement race, compact simulator-height drift and
  contact-sheet RAM loss after worker restart. Follow-up exposed 0.75px metric drift.
  Restored original line boxes without shrinking new labels or relaxing assertions;
  test waits for actual dialog animation. Final affected/evidence run passed 13/13.
  Full suite was NOT rerun and its result predates these fixes.
- Final Vitest 17/17; TypeScript/Vite build 51 modules; npm ls clean; direct PyWebView
  shell and run_app.ps1 -SkipBuild -SmokeTest both exit 0. Python suite NOT RUN (no
  Python/backend edits). Protected hash comparison 187/187; all 308 numeric layout
  fields match prior baseline; auth wash minimum contrast 5.1657:1. Final axe checks
  retain manual-review targets and expanded Now Bar has no violations at 200% both themes.
- Evidence is exactly six PNG review images and one 1440×900/25fps/5.04s WebM under
  `.design-cache/artifacts/production-one-ui-alignment/`, plus consolidated diagnostics.
  Images are from running React and were reviewed; the prototype remains unchanged.
  Optional Edge video-playback validation timed out and its helper left no active
  Playwright-profile Edge process; bundled FFmpeg metadata was readable but its null
  muxer is unavailable. No playback pass, human motion review or real-AT acceptance is
  claimed. Earlier sandbox test/build access failure was resolved by an approved run;
  no dependency installation, system settings or compression workaround in this pass.
- Next gate: user production visual approval only; no additional phase or cleanup opened.

## 2026-09-06 — P.2.1.3 anchored Now Bar overlay morph implemented

- Implemented only the user-approved replacement for the visually rejected P.2.1.2
  inline expansion. The collapsed surface remains the first normal-flow child of
  `.app-content`; on activation the same DOM element is measured at the boundary and
  morphs from that exact rectangle into a shallow fixed overlay. A 400×60 collapsed
  placeholder preserves underlying geometry, and the bar still scrolls away while
  collapsed.
- Added an explicit `collapsed/opening/open/closing` lifecycle, 240ms basic-path
  width/height/radius transition, delayed 140ms detail settle and immediate reduced-motion
  path. Expansion locks the internal scroll root, sets content siblings inert, traps
  focus, and closes through the header, Escape, transparent outside click or shell
  handoff. The reverse transition restores relative flow, scroll position and focus.
- Preserved the runtime reducer, role filtering, RAM-only reset rules, true source/rate/
  packet/chart state, single App-owned pause state and acquisition/counter continuity.
  Notification Center receives an atomic handoff; Quick Status, Account and theme actions
  never coexist with the expanded Now Bar. No portal, duplicate card, dim/blur, request
  loop, backend/API, dependency or later-phase work was added.
- Reopened exactly the official Samsung URL set recorded in
  `product-p2-1-alignment/REFERENCE_AUDIT.md`, starting from the user-provided One UI and
  motion pages. Applied only general layout/hierarchy, restrained depth, focused writing,
  accessibility and predictable spatial motion. No inspected Samsung page defines exact
  Now Bar anatomy or behavior. The one permitted live Figma context request for node
  `1491:6362` failed because the Figma tool was unavailable; no retry was made. Exact
  expanded anatomy and Figma-authored motion therefore remain `UNVERIFIED`.
- Iteration disclosed: disk exhaustion caused one Vitest startup `ENOSPC`; transparent
  NTFS compression of repository-local `.venv` and `node_modules` restored space without
  changing Git content. Playwright FFmpeg was installed in the user cache only. Early
  targeted checks exposed a one-pixel border tolerance, missing FFmpeg, a real first-frame
  fixed-width flash (fixed with boundary `flushSync` plus one allowed style read), a
  test-only focus neutralization issue and an old close-transition timing assumption.
- Checks actually run on final source: targeted P.2.1.3 1/1; Vitest 17/17; TypeScript/Vite
  build passed with 51 modules; affected P.2.1 Playwright 4/4; the single final full
  Playwright run passed 26/26 in 3.7 minutes; direct desktop collector, PyWebView shell
  and `run_app.ps1 -SkipBuild -SmokeTest` smokes exited `0`; `npm ls --depth=0` was clean; `git diff --check` exited `0` with the
  existing LF→CRLF notices; protected prototype diff was empty. Python tests were not
  run because no Python/backend source changed.
- Evidence is exactly one 1440×900 25fps WebM (4.52s) and two final stills (1440×900 dark,
  800×1100 light) at `.design-cache/artifacts/product-p2-1-3-anchored-overlay/`. Both
  stills were opened at original resolution and showed unobstructed shell chrome with no
  dim/blur. The available tools cannot genuinely play the video at normal speed, so that
  human motion review is explicitly `UNVERIFIED`; user visual approval and real
  NVDA/Narrator remain pending.

## 2026-09-06 — P.2.1.2 semantic shared-activity surface implemented

- Implemented the user-approved semantic correction without repeating prior Samsung,
  Figma, media or repository-wide audits. The earlier Now Bar exposed a disclosure button
  but its small action row read as a dropdown/launcher; it did not present the running
  telemetry activity itself in a richer shared surface.
- The collapsed header remains one real button and now exposes concise live telemetry,
  sensor-receive state, `2/2 nguồn`-style count and aggregate rate. It expands the same
  card in place to expose existing per-source status/rates, packet/loss totals, chart
  state, `Open Monitor`, chart pause/resume and Notification Center only. No Account,
  Settings, Theme, user management, fake carousel, recording/reconnect action, menu,
  listbox, navigation semantics or detached portal was added.
- Added `pause-chart` as a presentation command paired with existing `resume-chart`; both
  update the one lifted `chartPaused` state in `App`. Acquisition and counters continue
  while paused. Expanded state remains local React presentation state and is not stored
  in the reducer, browser storage, SQLite or backend.
- CSS uses the existing 240ms V.2 basic transform token for the container row/radius and
  a restrained opacity/6px detail transition. State and `aria-expanded` update on the
  activation frame. Reduced motion collapses all positional/shape transitions to the
  existing immediate token and removes the transform.
- P.2.1.2 Playwright verifies click/Enter/Space/Escape, `aria-expanded`/`aria-controls`,
  focus restoration, no menu/listbox/nav semantics, independent Account access, atomic
  Notification Center lifecycle, one pause state, live counter continuity, reduced
  motion, normal-flow expansion/scroll-away and navigation/content collision safety at
  1440×900, 1280×720 and 800×1100. Iteration exposed two test-only issues (sheet-internal
  focus expectation and CSS specificity for reduced-motion transform) plus one transient
  Vite startup exit. A later targeted pass exposed a real internal-scroll jump because
  opening Notification Center collapsed the suppressed bar; the final implementation
  keeps the expanded allocation/state while the sheet is open, so close/focus return no
  longer changes `scrollTop`.
- Checks actually run: reducer Vitest 5/5; TypeScript check exit `0`; affected P.2.1
  Playwright 3/3 on the final source; final Vitest 17/17; production build passed with
  51 modules; direct PyWebView and `run_app.ps1 -SkipBuild -SmokeTest` exited `0`. The
  single full Playwright run passed 25/25 in 3.5 minutes before the later scroll-lifecycle
  correction and was intentionally not rerun. Supplemental browser attempts also
  disclosed host resource failures (startup OOM, target timeout/crash, and unavailable
  bundled Chromium); these were not product assertion failures. The final targeted run
  used Edge with constrained Node memory and passed. Python tests were not run because
  no Python/backend source changed.
- Exactly three screenshots were generated and inspected at original resolution under
  `.design-cache/artifacts/product-p2-1-2-shared-activity/`: desktop collapsed, desktop
  expanded and compact expanded. Tooltip, hover, incidental focus and snackbar states
  were neutralized. P.2.1 user visual approval and real NVDA/Narrator remain unverified.

## 2026-09-06 — P.2.1.1 activity-lane scroll correction implemented

- Reproduced the approved regression in source: `.one-ui-activity-lane` occupied a shell
  grid row outside `.app-content`, the actual internal scroll root. It consequently stayed
  anchored below the Top App Bar while Live Monitor content moved underneath it.
- Moved the lane, unchanged, to the first child of `.app-content`; simplified only the
  affected shell grid-row ownership. No arbitrary offsets, collision scanning, backend,
  dependencies, runtime reducer/actions, Notification Center behavior, pause/acquisition
  logic or frozen shell/chart/control geometry changed.
- Rechecked the official Samsung pages requested by the user before the source edit. The
  exact URL-to-rule table in `product-p2-1-alignment/REFERENCE_AUDIT.md` remains current:
  official guidance supports hierarchy, restrained depth, readable/focused content,
  accessibility and predictable motion, but does not specify exact Now Bar anatomy,
  dimensions, desktop placement or fixed-versus-flow behavior. Live Figma nodes remain
  the sole anatomy/spacing/proportion/state reference.
- Added an explicit P.2.1.1 Playwright scroll gate at 1440×900, 1280×720 and 800×1100.
  It checks top/middle/lower positions, lane ownership and scroll-away behavior, protected
  header/chart/plot reachability, unchanged app-bar/navigation/command/card geometry,
  compact bottom-safe-area completion and zero document scrolling. The existing focus
  test now also asserts no internal-scroll jump after Notification Center closes.
- Iteration: the first new scenario run failed on a test-only `BoundingBox.top` mistake;
  three subsequent targeted runs passed after fixing the assertion and neutralizing the
  snackbar evidence state. Final affected P.2.1 scenarios passed 2/2.
- Final checks actually run: Vitest 17/17; production build (51 modules) passed; affected
  P.2.1 Playwright 2/2; direct shell smoke and `run_app.ps1 -SkipBuild -SmokeTest` exited
  `0`. The single permitted full Playwright run passed 23/24; its only failure was the
  legacy `resetReviewViewport` one-shot scroll reset racing the newly flow-owned lane.
  After the helper was made layout-stable, that exact geometry test passed targeted 1/1;
  the full suite was not rerun.
- Exactly two final screenshots were opened at original resolution under
  `.design-cache/artifacts/product-p2-1-1-scroll/`. User visual approval for P.2.1 and
  human NVDA/Narrator output remain `UNVERIFIED`; Python tests were not run because no
  Python/backend source changed.

## 2026-09-06 — Samsung-guideline provenance addendum

- Rechecked the P.2.1 reference gate from the user-specified official entry points
  `https://developer.samsung.com/one-ui` and
  `https://developer.samsung.com/one-ui/motion/basic.html`, following only links relevant
  to overview, basic layout/structure, app-bar hierarchy, visual depth, focused/simple
  writing, accessibility introduction/focus/contrast/layout/content and motion.
- Expanded `product-p2-1-alignment/REFERENCE_AUDIT.md` with every exact URL inspected
  and the bounded rule applied from each. Corrected the attribution boundary: Samsung
  does not specify an exact Now Bar/Live Activity anatomy, size, desktop position or
  fixed-versus-flow behavior, and the app-bar page does not state that notifications
  must appear directly below the app bar.
- The reserved activity lane remains a product adaptation based on general hierarchy,
  readability and accessibility rules. Exact anatomy, spacing, proportions and visual
  states remain sourced only from the five live Figma nodes. The hybrid language split
  is an explicit user/product glossary decision, not a Samsung prescription.
- Documentation/provenance only: no source, tests, dependencies, evidence images or
  visual decisions changed. Product suites were not rerun. Final documentation diff
  verification is recorded in the current handoff.

## 2026-09-06 — P.2.1 Figma/Samsung alignment correction implemented

- User rejected the first P.2.1 visual pass because the fixed Now Bar covered readable
  content, UI copy was over-localized and approved V.2 green status chips were absent.
  The user authorized only a bounded alignment correction; status remains
  `IMPLEMENTED — AWAITING USER VISUAL APPROVAL`.
- Loaded the required `figma-design-to-code` workflow and obtained live design context
  from Figma file `97artOnuCMCiOPdD2r3ST2` for nodes `1491:6362`, `620:1523`,
  `1003:13022`, `744:3668` and `247:613`. Also reviewed official Samsung One UI index,
  app-bar, basic structure, visual depth and motion guidance. Created the required
  pre-edit classification audit at
  `.design-cache/artifacts/product-p2-1-alignment/REFERENCE_AUDIT.md`.
- Replaced the fixed/floating Now Bar and JS collision scanner with a reserved activity
  row directly below the 76px app bar. The row aligns after the rail allocation and
  precedes page content/bottom navigation. Modal suppression and focus-return behavior
  remain; runtime reducer, actions, role filtering, side-sheet identity and chart-only
  pause behavior were not redesigned.
- Restored contained mint `Bridge online` and `SIM 2/2` status chips. Added the explicit
  controlled hybrid copy table to the canonical One UI adoption guide and updated the
  current product surfaces/tests without translating ordinary Vietnamese instructions.
- Expanded the P.2.1 browser collision gate to app bar, rail/bottom nav, descriptions,
  metrics, cards, settings, channel panel, chart headers, plots/canvas, simulator and
  overlay actions at 1280×720, 1440×900, 1024×768 and 800×1100.
- Targeted Vitest passed 14/14; full Vitest passed 17/17; TypeScript project check and
  production build passed. After three targeted browser runs exposed stale test-only
  label/text/opacity expectations, the corrected P.2.1 scenario passed 1/1 with axe
  serious/critical zero.
- The first full Playwright run passed 19/23 and exposed four old absolute-Y geometry
  checks that did not account for the approved 80px flow lane. Tests continue to lock
  x/width/height and relative Y; only the measured activity-row offset is normalized.
  Targeted review then passed 4/4, and final full Playwright passed 23/23 in 3.8 minutes
  with one worker and trace disabled.
- Direct PyWebView and `run_app.ps1 -SkipBuild -SmokeTest` exited `0`;
  `npm ls --depth=0` was clean. The protected prototype diff was empty; dirty backend,
  API/store, launcher and Python dependency entries match the recorded preflight state
  and were not edited by this correction. Python tests were not run because no
  Python/backend source changed.
- Exactly four current screenshots were generated and opened again at original
  resolution after the final suite. `REFERENCE_AUDIT.md` and `VERIFICATION.md` record
  provenance and checks. User visual approval and human NVDA/Narrator remain
  `UNVERIFIED`.

## 2026-09-06 — P.2.1 Runtime Activity implemented; awaiting visual approval

- Implemented the separately approved P.2.1 scope only: a typed session activity
  reducer, adaptive overlay Now Bar, atomic Quick Status → Notification Center flow,
  read/unread/dismiss/clear lifecycle and adapters for existing bridge/resync/packet-loss,
  device/simulator and administrator-operation results.
- Activity remains RAM-only and role-aware with a hard 50-item bound and reset on logout,
  invalidation, user change or app exit. No backend, SQLite, audit feed, browser storage,
  dependency, capture/history/search/settings, V.3, Phase E or M2 work was added.
- Chart pause is now App-owned single state. It remains chart-render-only; acquisition
  and counters continue, and the fixed pause/resume dimensions were not edited. Now Bar
  copy uses `Đang nhận dữ liệu cảm biến` and never claims dataset recording.
- Targeted Vitest passed 12/12; full Vitest passed 17/17. TypeScript project compilation
  and final Vite production build passed. Direct PyWebView shell smoke and
  `run_app.ps1 -SkipBuild -SmokeTest` both exited `0`; `npm ls --depth=0` was clean.
  `git diff --check` exited `0` with existing LF-to-CRLF warnings. Python tests were not
  run because no Python/backend file changed.
- Early targeted/full Playwright attempts exposed host memory/GPU pressure, including
  Argon2id allocation failure and browser target crashes. The final isolated P.2.1 test
  boots the administrator through the real endpoint before opening the browser, preserving
  production Argon2id parameters and RAM-only session semantics.
- Final targeted P.2.1 Playwright passed 1/1 in 6.1 seconds. Final full
  `npm run test:e2e` passed 23/23 in 3.5 minutes, including all prior P.1/V.2.1 behavior
  and the new runtime-activity scenario.
- Four final review images were generated and opened at original resolution. Browser
  coverage proves the exact runtime copy, atomic overlay focus, single live-announcement
  ownership, pause/counter continuity, identical pause button bounding box, collision
  avoidance at 1280×720/1440×900/1024×768/800×1100, no horizontal overflow and zero
  serious/critical axe violations. User visual approval and human NVDA/Narrator remain
  `UNVERIFIED`.

## 2026-09-06 — One UI V.2.1 / P.1 visual approval recorded

- User explicitly approved the current One UI V.2.1/P.1 visual implementation,
  including auth light/dark atmosphere and V.2 composition, the full `Tài khoản` rail
  label, Account, Quick Status and Create/Edit User sheets, their opening/settling
  behavior, navigation and represented responsive behavior.
- Closed the V.2.1/P.1 visual-approval gate and retained the current implementation as
  the approved visual baseline. No further polish or redesign was requested.
- Documentation-only synchronization; V.2.1 source, tests, config and evidence were not
  modified, and no product test/build/smoke/visual suite was rerun. F42/F43/F44 remain
  frozen; human NVDA/Narrator spoken-output verification remains `UNVERIFIED`.
- `git diff --check` exited `0` with existing LF-to-CRLF normalization warnings. All
  six source/test hashes listed by the V.2.1 manifest still match their recorded
  post-implementation values.
- Tracker reconciliation confirms M1.1 remains open because Phase E cleanup still
  requires separate direct approval and completion. P.2, V.3, Phase E and M2 remain
  unopened.

## 2026-09-05 — One UI V.2.1 completion after user baseline correction

- User explicitly confirmed 54×62 rail targets and identified 54×50 as a brief error.
  Updated assertion/evidence/docs only; 88px rail, 24px icon, 1260px threshold and
  destination positions/hit targets did not change. Label uses its natural width
  inside the rail, with no ellipsis or text overflow and no typography reduction.
- Completed auth wash restoration and immediate Account/Quick/Create/Edit surface
  mounting. Modal focus is assigned during commit. No API awaited before opening.
  Final 6px settle uses existing 100ms token; original 140ms yielded 155–164ms observed
  phase completion, so only opening settle was shortened. Exit remains V.2.
- Final 12-opening runs: Account first-frame median/p95/worst 8.50/27.80/27.80ms,
  focus worst 17.30ms, settled median/worst 118.40/128ms; Quick Status 6.95/10.60/
  10.60ms, focus worst 7.50ms, settled median/worst 114.95/120ms. All first frames
  opaque/focused/modal with API blocked. First-frame photography is explicitly held
  transform evidence, separate from unmodified browser timing measurements.
- Read actual screenshot pixels and reviewed light/dark login, compact/participant
  and rail captures. All required text categories across the entire 0–10% wash pass;
  lowest ratio 5.17:1. Preserved axe incomplete targets (pseudo-element ambiguity),
  with zero violations and explicit manual color-envelope review, not suppression.
  Found/fixed auth-only tooltip overflow without changing geometry. Initial contrast
  test sampled transitioning theme colors; final measurements wait for settled colors.
- Full Vitest once: 11 passed. Full Playwright once: 22 passed in 3.5m. After final
  opening-duration refinement: targeted overlay/lifecycle 2 passed, structural Vitest
  3 passed; final auth/Create/Edit/rail/response run 2 passed in 52s. Build passes,
  CSS/JS 59,053/318,350 bytes (+825/+175 versus V.2). Direct shell and SkipBuild smoke
  pass. No Python changes; Python suite intentionally not rerun.
- 268 numeric layout values match V.2 exactly. Checkpoint remains 9 validated original
  files, plus recorded absence of new overlays.test.ts; user work preserved. Evidence
  under `.design-cache/artifacts/one-ui-v2-1/`, no archive or credential/trace copies.
- Status: implemented, awaiting explicit visual approval. Real NVDA/Narrator spoken
  output still unverified. F42/F43/F44 and P.2/V.3/Phase E gates unchanged.

## 2026-09-05 — One UI V.2.1 partial implementation / geometry gate

- Read the active V.2.1 brief and targeted owners; recovered the exact V.1 radial
  gradient (82%/18%, accent 10%, 32rem). Validated nine pre-edit copies at
  `.design-cache/backups/pre-one-ui-v2-1/` before source edits.
- Modified styles.css, one-ui/shell.css, one-ui/overlays.tsx, one-ui/overlays.css and
  collector.spec.ts. No backend, API, authentication policy, acquisition, dependency,
  launcher or rollback change. The prior dirty worktree remains intact.
- Shared sheets now request their mount in the activation render, use an opaque
  first state and a 6px/140ms settle, and acquire modal focus in a layout effect.
  The previous effect mount + animation frame + opacity ramp caused delayed response;
  no pre-open data request exists. Existing exit/fallback handling remains.
- Production build passed (48 modules); git diff --check passed with existing CRLF
  warnings. Initial targeted test was interrupted to correct test-only selector IDs.
  The corrected test completed 12 Account and 12 Quick Status openings with blocked
  API requests, immediate modal focus and opacity 1, then failed the brief's rail
  height assertion: actual and saved baseline are 62px, not 50px (width is 54px).
- Browser-internal first-frame p95/worst: Account 22.4ms, Quick Status 26.5ms;
  worst focus 17.3ms/23.9ms. Raw sanitized timing records are under
  `.design-cache/artifacts/one-ui-v2-1/`. These are partial evidence, not acceptance.
- Stopped before any Class C geometry change. Need user direction to preserve actual
  54×62 baseline or authorize 54×50 correction. Full frontend tests, contrast/axe,
  complete visual evidence, smokes and final scope/process audits remain outstanding.
  Python tests were not rerun; the changed boundary is frontend-only. No completion
  or visual approval is claimed; P.2/V.3/Phase E remain locked.

### Independent verification while the geometry decision remains pending

- Targeted Playwright first-run/auth, V.2 overlay lifecycle and accessibility inventory:
  3 passed in 26.5s. Direct shell smoke and `run_app.ps1 -SkipBuild -SmokeTest` both
  exited 0. Existing protected/dependency manifest hashes matched 12/12.
- Inspected the new login screenshot: the form-side V.1 wash is visible and the V.2
  two-zone composition remains. This is not final visual/contrast acceptance.
- The retained axe inventory reports zero violations, but auth has a color-contrast
  incomplete rule because axe cannot resolve the pseudo-element background. It is
  not suppressed and must receive manual pixel/foreground contrast verification;
  the green inventory test alone does not prove accessibility completion.
- No rail geometry change or full-suite acceptance was performed. The 54×50 brief
  versus 54×62 pre-existing target discrepancy still requires user direction.

## 2026-09-05 — One UI Visual + Motion Integration V.2

### Recovery, ledger and bounded scope

- Read the approved V.2 brief, repository/product/architecture/auth/design records and
  every V.1 audit artifact. Preserved the accumulated dirty P.1 worktree and user-owned
  files. Created `.design-cache/backups/pre-one-ui-v2/` at branch `main`, exact HEAD
  `bf7720825a368b051dee5748f83f487fc8191abc`; all 34 candidate files reconstructed
  byte-for-byte with zero validation failure before source edits.
- Built a 40-row Class A/B ledger before implementation. Final accounting is 21
  `CHANGED`, 17 `VERIFIED_PRESERVED` and 2 `DEFERRED_WITH_EXPLICIT_REASON`. F39 and the
  real-AT portion of F57 remain explicitly unverified: NVDA is unavailable and the
  agent cannot validate Narrator spoken output, despite its executable being present.
- Class C F42/F43/F44, P.2, Phase E, backend/auth policy, API/store, acquisition,
  simulator behavior, protocol, launcher, dependencies and PySide rollback stayed out
  of scope. Batch patches retain the foundation/feedback/overlay and visual/copy/auth/
  admin changes without creating Git commits.

### Visual, copy, accessibility and motion integration

- Added semantic surface/content/status/icon roles while retaining neutral canvases,
  near-black primary actions and existing status/glove families. Standardized a calm
  simulator surface, quieter top status, coherent product-owned 18/20/24px icons,
  Vietnamese product copy and semantic button/helper states.
- Related sheets now use opaque surfaces with one soft shadow and no visible scrim or
  blur; blocking dialogs use an opaque surface and neutral 32% dim. Auth uses a bounded
  desktop context/task composition and compact one-column flow; admin uses a bounded
  list/audit layout and constrained stacking.
- Snackbar policy now separates polite timed success from actionable recovery and
  persistent failures; action/dismiss, keyboard access, hover/focus pause and
  deterministic replacement are implemented. Sheets/dialogs/snackbars use explicit
  opening/open/closing lifecycles, interruption-safe cleanup, bounded completion
  fallbacks and post-exit focus restoration. Reduced motion computes to 0.01ms with no
  travel; security/acquisition truth stays immediate.
- Closed the invalid list role and every retained axe manual-review target at source:
  appropriate `group`/`img` semantics replace prohibited generic ARIA, the decorative
  auth gradient was removed, danger-quiet contrast is 5.40:1 and L/R tonal contrast is
  5.48:1 per side. Final all-severity axe inventory across eight contexts is zero
  violations and zero incomplete nodes. Forced-colors/grayscale evidence retains
  focus, boundaries and non-color L/R/line-style distinctions.

### Geometry, verification and evidence

- Exact P.1 reconstruction and V.2 assertions preserve Top App Bar 76px, rail 88px at
  1260, bottom navigation 358×62, chart switch at 900, effective-200% behavior,
  device/chart/simulator allocations and the 209×60 / 88×48 / 107×48 chart command
  contract. Maximum recorded frozen-layout difference is 0.39 CSS px at the 800px
  responsive chart start; state-to-state command delta remains zero.
- Final verification: Python `63 passed` (one known Starlette/httpx deprecation
  warning); Vitest `8 passed`; Vite build; Playwright `21 passed` in 2.8 minutes;
  direct PyWebView/PySide and default/SkipBuild/Legacy launcher smokes exit `0`.
  Dependency checks, all-protected hashes, credential/bundle disclosure, 139-class
  selector audit with zero unmapped application class, checkpoint validation,
  diff/process/listener and final scope checks pass.
- The reconstructed pre-V.2 production bundle is CSS/JS 50,970/317,805 bytes. Final
  exact bundle/source sizes are recorded in the evidence manifest. Same-scale core,
  P.1 and overlay contact sheets, clean light/dark/responsive/forced-color captures and
  normal/reduced motion frames are retained under
  `.design-cache/artifacts/one-ui-visual-motion-v2/`.
- Status: V.2 implementation and technical verification complete; awaiting explicit
  user visual approval. Human screen-reader acceptance, P.2 and Phase E remain gated.

## 2026-09-05 — Product Phase P.1

### Approval, preflight and recovery

- Read the P.1 brief and all required repository/product/architecture/schema/asset/log
  records before implementation. Recorded `main` at exact HEAD
  `bf7720825a368b051dee5748f83f487fc8191abc` and preserved the complete accumulated
  dirty worktree, including user-owned `AGENTS.md`, `app.rar` and `glove_ble.py`.
- Recorded the brief's explicit visual approval of D.2.6 Stage 2B.3.1. The approved
  Device Manager, Live Monitor, shell/navigation/dialog/sheet/feedback foundation is
  frozen; P.1 extends it only for real auth/account consumers and does not infer visual
  approval of those new screens.
- Created `.design-cache/backups/pre-product-p1/` for every P.1 candidate path. An
  initial disposable copy command matched no files because a wildcard was passed to
  `-LiteralPath`; no source had been edited. A fresh corrected reconstruction then
  saved and rebuilt all 41 existing files with `VALIDATION_FAILURES=0` before source
  changes. `DESIGN_BASELINE.md` and `FILE_HASHES.txt` retain exact baseline hashes.

### Persistence, authentication and authorization

- Added `persistence.py` with an application user-data directory, explicit SQLite
  schema/migration, FK/WAL/transaction enforcement, canonical usernames, opaque IDs,
  hashed session credentials, audit records and clean checkpoint/close behavior.
- Added `auth.py` with Argon2id (`argon2-cffi` 25.1; `m=19456,t=2,p=1`), password bounds,
  atomic bootstrap, generic login failure, dummy verification, bounded account backoff,
  8-hour absolute plus 30-minute idle sessions, touch interval, revocation/rotation,
  must-change-password, four canonical roles and final-admin protection.
- Extended the FastAPI boundary with setup/login/logout/change-password and administrator
  user/audit APIs. Request validation output is sanitized; exact loopback-origin parsing,
  Host/Origin/CSRF checks and the original bridge capability remain. All collector REST
  and WebSocket access is role checked server-side; logout and access loss close sockets.
  Persistence initialization failure releases the pre-bound port and reaches the shell
  only as a safe message.
- Added only `argon2-cffi>=25.1,<26` to `pyproject.toml`; no ORM, JS dependency or lockfile
  delta belongs to P.1. `uv pip check` reports all 55 installed packages compatible.

### Frontend and visual evidence

- Added first-run setup, login, forced password change, participant access-limited,
  account sheet and administrator user-management surfaces. Search/filter, create,
  role/status edit, activate/deactivate, controlled reset, revoke and auth audit are
  functional; high-impact actions use the approved dialog and results use snackbar.
- Collector startup occurs only after an authorized role session; auth invalidation
  clears collector state and WebSocket. Admin navigation is absent for unauthorized
  roles and participant cannot start collector acquisition. Password errors are tied
  to fields; visibility controls expose accessible name/state; route changes, modal
  trap/restore and skip-link focus were verified.
- Playwright regenerated light/dark evidence at 1440×900, 1280×720, 1024×768 and
  800×1100, plus effective 200% reflow. Password DOM values, pointer, tooltip and
  incidental focus were neutralized in screenshots. Direct inspection found no
  overflow, clipping, hierarchy issue or visual regression in the sampled screens.

### Verification and boundaries

- Final Python suite: `63 passed` with one known Starlette TestClient/httpx deprecation
  warning. Coverage includes migration/restart/rollback/FK/WAL/path, Argon2id/hash,
  atomic bootstrap, generic failures/backoff, idle/absolute expiry, revocation, full
  REST role matrix, final admin, sanitized validation, exact origin configuration,
  authenticated WebSocket logout/role-loss closure and lifecycle/port release.
- Final frontend: Vitest `8 passed`; TypeScript/Vite production build succeeded;
  Playwright `13 passed` in 2.4 minutes. Existing two-glove/13-channel acquisition,
  simulator, Quick Status, dialogs/snackbars, stable pause geometry, follow-live/zoom,
  accessibility, keyboard, reduced motion and responsive gates remain green.
- Direct PyWebView smoke, `run_app.ps1 -SkipBuild -SmokeTest`,
  `run_app.ps1 -Legacy -SmokeTest` and direct PySide smoke all exited `0`. The valid
  production bundle is retained. `npm ls --depth=0`, 131-class/zero-unmapped selector
  audit, disclosure/local-database scan and protected-file hashes passed.
- No Data Capture/raw dataset, participant collection, history/global search, Now Bar,
  notifications, annotation, AI/model registry, BLE/protocol, Recorded Playback,
  Android/Capacitor or Phase E cleanup was added. PySide/Qt rollback remains intact.
- Status: `Product Phase P.1 implemented — persistence, authentication and RBAC are
  functional end-to-end; existing acquisition behavior and PySide rollback are retained;
  awaiting user review before P.2.`

## 2026-09-04 — Milestone 1.1 Phase D.2.6 Stage 2B.3.1

### Recovery and bounded correction

- Read the correction brief and repository records, inspected the dirty worktree and
  relevant Live Monitor/button/test implementation, and preserved all accumulated
  D.2.6 and Product Foundation P.0 changes. Created and byte/hash validated
  `.design-cache/backups/pre-d2-6-stage2b3-1/` before editing the three source/test
  files and three permitted project records.
- Changed only the existing pause/resume label anatomy: both localized labels occupy
  the same intrinsic grid cell; the inactive label is hidden visually with
  `visibility: hidden` and from accessibility APIs with `aria-hidden="true"`. The
  button's dynamic accessible name/pressed state and existing fixed icon slot remain
  intact. No width constant, JavaScript measurement, truncation, primitive expansion,
  toolbar re-layout, backend or dependency change was made.

### Verification, measurements and evidence

- Added one focused Playwright regression to `collector.spec.ts`. It exercises
  running → paused → resumed → paused → resumed at 1280×720 light/dark, 1024×768 and
  800×1100; confirms keyboard reachability and active/inactive label accessibility;
  verifies acquisition growth while paused; and preserves follow-live/zoom, two uPlot
  instances and overflow-free responsive layout.
- Across all contexts and five measured states, the command group, pause action/icon,
  restore action, selector, chart cards and plot hosts have maximum delta `0 CSS px`.
  At 1280 the group/pause/restore/selector measure 209×60, 107×48, 88×48 and 188×40;
  at 1024 the selector remains on the first row and the 209×60 command group on the
  second; at 800 they remain side by side without clipping. Four same-scale outlined
  contact sheets were manually inspected in addition to the state captures and JSON.
- Final verification: Vitest `5 passed`; production build succeeded; Playwright
  `12 passed` in 1.6 minutes with trace disabled; direct PyWebView smoke exit `0`;
  `run_app.ps1 -SkipBuild -SmokeTest` exit `0`. Python unit tests were not rerun because
  no Python boundary changed. The selector audit found 102 unique classes, one
  expected uPlot runtime class and zero unmapped classes; `git diff --check` passed
  apart from existing line-ending warnings.
- Source CSS is 1,070 lines/45,264 bytes; production CSS/JS are 44,753/290,591 bytes.
  Package/lock/Python manifests and `AGENTS.md`, `app.rar`, `glove_ble.py`, launcher,
  Product Context and Architecture hashes match preflight. Required evidence is under
  `.design-cache/artifacts/m1.1-ui-d2-6-stage2b3-1/`; transient Playwright result output
  and the temporary contact-sheet helper were removed after verification.
- Status: `D.2.6 Stage 2B.3.1 implemented — awaiting final user visual approval;
  design-system freeze and Phase E remain locked.`

## 2026-09-04 — Product Foundation P.0

### Preflight and recovery

- Read the P.0 brief, repository instructions, technical context, milestone tracker,
  latest session/changelog entries and current entry-point implementation before any
  source/document edit. Preflight recorded branch `main`, exact HEAD
  `bf7720825a368b051dee5748f83f487fc8191abc`, the full tracked/untracked dirty state,
  current launcher, old default `app.desktop_collector.main` and current React shell
  `app.desktop_collector.shell`.
- Preserved the accumulated D.2.6 Stage 2B.3 worktree and user-owned files. Created
  `.design-cache/backups/pre-product-foundation-p0/` with exact pre-edit bytes and
  SHA-256 values for `run_app.ps1`, `README.md`, the tracker, changelog and session log,
  plus absent markers for both new docs. Disposable reconstruction reproduced each
  file byte-for-byte before its edit; details and complete preflight status are in the
  checkpoint manifest.

### Launcher cutover and product records

- Replaced only the launcher default: `run_app.ps1` now resolves root through
  `$PSScriptRoot`, uses `.venv\Scripts\python.exe`, validates Node/npm prerequisites,
  builds `app/desktop_collector/web/`, then launches `app.desktop_collector.shell`.
  Build/start failures return non-zero and never fall back silently to PySide.
- Added `-SkipBuild` with index/assets/JS/CSS validation and a clear missing-build
  instruction; the launcher never runs `npm install` or `npm ci`. Added `-Legacy` for
  unchanged `app.desktop_collector.main` and `-SmokeTest` for either path. The existing
  `-NoAutoConnect` remains functional on `-Legacy`; using it on the default shell fails
  clearly because P.0 did not authorize a shell/backend behavior change.
- Added [`PRODUCT_CONTEXT.md`](PRODUCT_CONTEXT.md) for canonical product intent, roles,
  current/planned feature inventory, single-product/no-Demo-Mode decision, DataSource
  distinctions, functional-feature definition, delivery rules, constraints and the
  provisional P.0–P.10 roadmap.
- Added [`ARCHITECTURE.md`](ARCHITECTURE.md) for actual React/Vite → PyWebView → secure
  FastAPI loopback → acquisition/domain boundaries, current Simulator adapter, planned
  BLE/playback/persistence/RBAC/Android boundaries, code sharing, security, data flow
  and platform ownership. Future statements are explicitly `Planned` or
  `Decision pending`.
- Updated the tracker and changelog by linking to the canonical documents instead of
  duplicating their full narrative. The explicitly authorized P.0 launcher switch is
  recorded as an exception to the still-locked Phase E cleanup gate; it is not final
  D.2.6 visual approval or a design-system freeze.
- Updated the root README's operational launcher section and canonical links only, so
  it no longer contradicts the P.0 default. No additional product-context document was
  created.

### Verification and boundaries

- PowerShell parser: pass. Launcher smoke results: default build-first exit `0`,
  `-SkipBuild` exit `0`, `-Legacy` exit `0`, and `-Legacy -NoAutoConnect` exit `0`.
  A controlled missing-build check exited `1`, printed the required run-without-switch
  instruction, restored the production build in `finally`, and did not invoke PySide.
- Direct `app.desktop_collector.shell --smoke-test`: exit `0`. Vitest: `5 passed`.
  Python: `42 passed`, with the existing Starlette `httpx` deprecation warning. Direct
  Vite production build succeeded (48 modules).
- `npm ls --depth=0` is clean. SHA-256 values for `package.json`, `package-lock.json`
  and `pyproject.toml` match the D.2.6 baseline. Protected `AGENTS.md`, `app.rar`,
  `glove_ble.py` and the recorded pre-D.2.6 Stage 2B.3 checkpoint artifacts also match
  their prior hashes. The 65-file Stage 2B.3 review/Figma evidence directory has no
  write later than 18:10:46 +07:00, before P.0 began.
- The production bundle remains ignored at `app/desktop_collector/web/build/`: 9 files,
  400,543 bytes (about 391.2 KiB). Process audit found zero project-owned Python, Node,
  Uvicorn or WebView processes; 11 unrelated Windows/PC Manager WebView processes were
  already outside project scope.
- `git diff --check` passed with only pre-existing CRLF conversion warnings. Comparing
  current status with the preflight inventory found no unexpected path: P.0 added only
  the new canonical docs and introduced changes only to `run_app.ps1`, `README.md` and
  the required existing documentation records. No UI/backend/acquisition/PySide/
  dependency/asset/Android change belongs to P.0.
- Status: `Product Foundation P.0 implemented — current React/PyWebView UI is the
  default launcher; PySide rollback retained; feature implementation, design-system
  freeze and Phase E cleanup remain locked.`

## 2026-09-04 — Milestone 1.1 Phase D.2.6 Stage 2B.3

### Recovery, focused references and bounded correction

- Created and validated `.design-cache/backups/pre-d2-6-stage2b3/` at exact recovery HEAD `bf7720825a368b051dee5748f83f487fc8191abc`. The complete tracked patch, exact tracked ZIP and exact nine-file `one-ui/` ZIP all reconstructed the pre-edit Stage 2B.2 worktree in disposable space; the active index, historical evidence and earlier checkpoints were not disturbed.
- The connected Figma account retained Full/student access to file `97artOnuCMCiOPdD2r3ST2` and its required pages. Using the local `figma-design-to-code` workflow, each authorized node was inspected exactly once before its corresponding edit; generated React/Tailwind, Samsung fonts/logos/icons/raster and proprietary runtime assets were not used.
- `OneUITopAppBar` adapts Top App Bar `1495:10992`: compact title/subtitle anatomy, 50 px trailing action targets and restrained/elevated surfaces are preserved. The product omits the reference drawer/search/menu because there is no matching navigation action, places quiet Bridge/SIM application statuses in the trailing area, and hides those statuses at widths up to 900 px because Quick Status already exposes them. Headers `1316:10528` and OS Status Bar `1491:6323` were intentional negative references: no oversized content heading or fake system chrome was added.
- `LandscapeAppRail` reuses the existing destination-button pattern and adapts Navigation Rail `1589:7438`: the approved 88 px allocation, compact selected target and rounded content-hugging surface remain; persistent localized labels make the two product destinations self-explanatory, so the surface grows only from 156 to 172 px. The generic speaker glyph was replaced by a product-owned monitor/waveform glyph.
- `CompactAppNavigation` reuses the same destinations and adapts In-App Navigation `1495:10175`: icon-plus-label selection anatomy and floating surface remain, but the product keeps exactly two navigation destinations, safe-area clearance and mutual exclusion with the landscape rail. No decorative/filler item was added.
- The chart command group reuses `OneUIButton` through a shared optional icon slot and adapts Floating Toolbar `1495:11133` plus Simple Lower Bar `1549:8371`: restore-live and pause/resume remain peer, content-hugging actions with product-owned icons and visible labels. Slide Navigation `631:2757` remains the text-only 5s/10s/30s/60s selector; commands never enter its outline. Enabled order remains selector → restore → pause/resume, while the correctly disabled restore action is omitted from the native tab sequence.
- Device cards, simulator band, charts/uPlot, all 13 channel rows, L/R text and solid/dashed series, Quick Status, dialogs/snackbars/progress/state messages, acquisition, pause, follow-live and zoom semantics were not redesigned. No backend, REST/WebSocket/authentication, simulator, launcher, PySide, Qt, protocol, dependency or lockfile change occurred.

### Verification, measurements and evidence

- Vitest: `5 passed`; production build: success; Playwright: `11 passed` in 1.5 minutes with trace disabled to avoid redundant archives on the nearly full system drive; Python: `42 passed` with the existing Starlette deprecation warning; PyWebView smoke: exit `0`; `npm ls --depth=0`: clean. Browser coverage confirms one Top App Bar/identity/`h1`/theme control, no standalone/fake status bar, exact rail query, rail/bottom exclusivity, persistent nav and command icons/labels, hidden compact statuses plus Quick Status reachability, all 13 channels, acquisition/pause/follow-live/zoom, keyboard/focus, axe, reduced motion and effective 200% zoom.
- The responsive query remains exactly `(min-width: 1260px) and (min-height: 680px) and (min-aspect-ratio: 4/3)`. Measurements at 1280×720 / 1440×900 are: 76 px Top App Bar, 88×172 rail, device cards 556×274 / 636×274 and chart cards 450×398 / 530×453. At 1024×768 / 800×1100: 76 px Top App Bar, 242×62 bottom navigation, device cards 484×286 paired / 760×286 stacked and chart cards 378×446 paired / 760×413 stacked. The full selector-and-command row is 409×60 at 1280/1440, 402.73×112 at 1024 where it wraps, and 760×60 in portrait.
- Combined source CSS changed from the Stage 2B.2 baseline of 1,074 lines/44,640 bytes to 1,067 lines/45,108 bytes (-7 lines/+468 bytes). Production CSS/JS changed from 44,146/290,224 bytes to 44,617/290,362 bytes (+471/+138). The selector audit found 100 unique CSS classes; after allowing the single stylesheet-referenced uPlot class `.u-legend`, no class is unmapped.
- Package manifest SHA-256 remains `0759989F33C5C8EE32CA6C695B0A997DA854F067F4F0B55140FA8B4F3A3CEAF1`; lockfile remains `873F84C202128DE62C77CE3A7F94387A94A95758853364244D6EC0E8DFEE61E0`; `pyproject.toml` remains `7BCA5335DA65DA5A05FE8A96B0FEA9F855B360C1A4D817F4510DC8701F98AAF9`. Protected hashes remain `BC1AF4953D3856FB76F4C50984A9A69A392FEB1D4786A5F68C1DA1D2DC27A050` (`AGENTS.md`), `F4CF93F168A9C59DA993FB64751A4CB16E705023F210863480117F984863A049` (`app.rar`) and `37099804425E5F3F9A8F0FD8C4B604A107F552F6CA8E6EB1655981A700829B92` (`glove_ble.py`).
- All 16 required full-view captures, Quick Status and focused command/navigation states were manually inspected. Four component comparisons use native pixel scale, and the responsive matrix uses one fixed 28% scale across all 16 views. Canonical evidence remains uncompressed at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b3/`; Figma screenshots are reference evidence only and are not imported by runtime source.
- Status: `D.2.6 Stage 2B.3 implemented — awaiting user visual approval; design-system freeze and Phase E remain locked.`

## 2026-09-03 — Milestone 1.1 Phase D.2.6 Stage 2B.2

### Recovery and bounded implementation

- Created `.design-cache/backups/pre-d2-6-stage2b2/` at exact recovery HEAD `bf7720825a368b051dee5748f83f487fc8191abc`. Separate application/documentation patches, the complete tracked-worktree patch and an exact implementation ZIP were validated in disposable worktrees/extraction space before source editing; the active index and worktree were not disturbed by validation.
- Used the retained component-anatomy audit and its six comparison sheets as the normative evidence; no Figma re-fetch occurred. The Community kit remains a project reference, not official Samsung certification.
- Renamed the local chrome to `ApplicationStatusStrip`, `LandscapeAppRail` and `CompactAppNavigation`. The 44 px status allocation, 64 px app bar, 88 px rail column, top/left position, 54×50 targets, 24 px icons and exact `(min-width: 1260px) and (min-height: 680px) and (min-aspect-ratio: 4/3)` query remain fixed. The visible rail surface changed from 88×760 in the 1440×900 Stage 2B.1 evidence to 88×156 by content-hugging the two real destinations.
- The audit's remaining vocabulary is recorded as future-only, not mechanically applied in this pass: primitives such as `ActionButton`/`StatusLabel`, patterns such as `WorkspaceIntro`/`OperationSnackbar`, and domain composites such as `DeviceSummaryPanel`, `SensorChartPanel`, `RawSignalSelector`, `SimulatorControlPanel`, `CollectorStatusSheet`, `TelemetrySummaryStrip` and `RawTelemetryTable`. Their adoption requires a later explicitly authorized boundary.
- Removed the fake local clock, moved the sole text-only `Dataset Studio` identity to an application-labeled status strip and kept exactly one page `h1`, theme control and Quick Status trigger. `Simulation workspace` and `Realtime telemetry` remain useful subordinate description text rather than competing headings. Compact shell and overlays now include safe-area inset handling.
- Added reusable `DialogActionRow`: two equal native 48 px-high regions, one measured 1×16 px divider, no independent pill surface at rest, contained inset keyboard focus, explicit destructive wording plus a non-color `!` mark, and width-stable pending spinner/`Đang ngắt…` state. Focus trapping, dismissal rules, inert background, scroll lock, exactly-once execution and focus restoration are unchanged.
- Split the four-option `OneUISegmentedControl` from a content-hugging `ChartCommandGroup`; restore and pause/resume are peer commands outside the selector outline with tab order selector → restore → pause/resume. The groups share a row at wide sizes and wrap without shrinking charts at 1024 px; portrait remains overflow-free.
- Frozen device summaries, simulator layout, all 13 channel rows, chart panels/uPlot, L/R text and solid/dashed series, Quick Status, snackbar and state-message geometry were not redesigned. No backend, acquisition, simulator, REST/WebSocket/authentication, launcher, PySide, Qt, dependency, font or source-asset change occurred.

### Verification, measurements and evidence

- Vitest: `5 passed`; production build: success; Playwright: `11 passed` in 1.9 minutes; Python: `42 passed` with the existing Starlette deprecation warning; PyWebView smoke: exit `0`; `npm ls --depth=0`: clean. Browser gates cover dialog anatomy/pending/exactly-once behavior, navigation exclusivity/query, one identity/title/theme/Quick Status trigger, all 13 channels, acquisition/pause/follow-live/zoom, chart teardown, focus lifecycle, snackbar timing, full-page/dialog/sheet axe, reduced motion and effective 200% zoom.
- Measured device-card width×height: 556×274 at 1280×720, 636×274 at 1440×900, 484×286 at 1024×768 and 760×286 stacked at 800×1100. Measured chart-card width×height: 450×398, 530×453, 378×446 and 760×413 stacked, respectively. The unchanged shell is 44 px status + 64 px app bar; the rail is 88×156, and bottom navigation is 258.42×62 at compact sizes.
- Source CSS changed from 1,069 lines/44,078 bytes to 1,074 lines/44,640 bytes (+5/+562). Production CSS/JS changed from 43,619/289,952 bytes to 44,146/290,224 bytes (+527/+272). The dead-selector audit found 97 unique classes across five stylesheets, 15 uPlot-generated classes allowlisted and zero unmapped classes.
- Package manifest SHA-256 remains `0759989F33C5C8EE32CA6C695B0A997DA854F067F4F0B55140FA8B4F3A3CEAF1`; lockfile remains `873F84C202128DE62C77CE3A7F94387A94A95758853364244D6EC0E8DFEE61E0`. Protected hashes remain `BC1AF4953D3856FB76F4C50984A9A69A392FEB1D4786A5F68C1DA1D2DC27A050` (`AGENTS.md`), `F4CF93F168A9C59DA993FB64751A4CB16E705023F210863480117F984863A049` (`app.rar`) and `37099804425E5F3F9A8F0FD8C4B604A107F552F6CA8E6EB1655981A700829B92` (`glove_ble.py`).
- Manually inspected all final full views and focused light/dark state evidence. No incidental tooltip, pointer, hover or focus treatment appears; only the dedicated keyboard-focus captures show focus. Canonical evidence, layout measurements, the six required sheets and two consolidated inspection boards are retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b2/`.
- Status: `D.2.6 Stage 2B.2 implemented — awaiting explicit visual approval`. The design system is not production-frozen; final D.2.6 approval was not claimed and Phase E remains locked.

## 2026-09-03 — Milestone 1.1 Phase D.2.6 Stage 2B.1

### Narrow production-state correction

- The user accepted Stage 2B only in overall direction and authorized a narrow correction pass. Stage 1 shell geometry, Stage 2A control geometry, side-sheet/dialog/snackbar placement, device/chart composition and responsive breakpoints were not redesigned.
- `SensorChart` now renders either a live `.plot-host` or a static `.chart-state-slot`, never both. Effect cleanup destroys the exact uPlot instance and resize observer; two teardown/recreate cycles produce exactly two current plots and telemetry continues increasing while state messages are shown.
- Bridge failures discard response bodies and map to stable safe copy. Store state suppresses premature disconnect WebSocket success while the request is pending, restores the connected state on failure, and preserves a connected event that races ahead of a `connecting` response.
- Pending destructive actions retain their original button width, accessible pending name and `aria-busy`, while visibly rendering the shared spinner with `Đang ngắt…`; the existing connection lock continues to prevent duplicate submission.
- Every evidence capture now moves the pointer to a neutral location, blurs incidental tooltip triggers and waits for tooltip closure. Required light/dark no-channel, no-source, pending, failure and success images contain no unintended tooltip, stale uPlot element or raw response detail.
- Removed the inherited dead `.panel-context` selector. Combined source CSS is 1,069 lines/44,078 bytes, a Stage 2B delta of +6 lines/+122 bytes. Production CSS is 43,619 bytes (+50) and JS is 289,952 bytes (+908).

### Verification, evidence and stop gate

- Vitest: `5 passed`; Vite build: success; Playwright: `10 passed`. Browser coverage includes uPlot teardown/recreation and acquisition continuity, pending state order/failure restoration, sanitized response bodies, duplicate prevention, all 13 channels, L/R distinction, pause/follow-live/zoom, full-page/dialog/sheet axe checks, keyboard/focus, reduced motion, tooltip hygiene, four responsive review sizes and 200% effective zoom.
- PyWebView smoke exited `0`. The selector audit covered 97 unique class selectors across five application stylesheets; after allowing 15 uPlot-generated classes, no class was unmapped. `git diff --check` passed.
- Stage 1 shell hashes remain `DF411A49170C6A2EEA6B449813884511BF397EC81736332E49B6A94299A3D957` (`shell.tsx`) and `D4499B0277A4141AAF36C794CFB9A81ACFF9A1547EDECFE019A0884E06F53D4C` (`shell.css`). Package manifest hashes remain `0759989F33C5C8EE32CA6C695B0A997DA854F067F4F0B55140FA8B4F3A3CEAF1` and `873F84C202128DE62C77CE3A7F94387A94A95758853364244D6EC0E8DFEE61E0`.
- Corrected evidence is retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b1/`; its state sheet contains every required state exactly once in its correct theme, and the Stage 2B comparison documents the removed artifacts/raw copy/unlabeled pending state. ZIP: `.design-cache/artifacts/m1.1-ui-d2-6-stage2b1.zip`, 3,926,328 bytes, SHA-256 `302ABF34CFFD92B33A608B58C250431B492EAA313319259387911A6B20AED352`.
- No backend, acquisition, simulator, REST/WebSocket/authentication contract, launcher, PySide, Qt adapter/dependency or package dependency changed. User-owned `AGENTS.md`, `app.rar` and `glove_ble.py` retain their pre-pass hashes.
- Status: `D.2.6 Stage 2B.1 corrections implemented — awaiting explicit visual approval`. Final D.2.6 approval was not claimed; Phase E remains locked.

## 2026-09-03 — Milestone 1.1 Phase D.2.6 Stage 2B

### Approval boundary and focused references

- The user explicitly approved the Stage 2A shared control foundation and its current integration. Stage 1 shell geometry and Stage 2A control geometry were frozen; `one-ui/shell.tsx` and `one-ui/shell.css` remain at SHA-256 `DF411A…D957` and `D4499B…3D4C` respectively.
- Performed only focused connector reads for Edge Panels `744:3668`, Notification Header `620:1523`, QS/Notification `1003:13022`, Dialog `632:2006`, dark/light Dialog `1493:8950`/`1493:8968`, Toast `479:8075`, dark/light Toast `479:8074`/`479:8116`, Live Activity `1491:6362` and Containers `247:613`. Geometry, surface, scrim, spacing and hierarchy informed the implementation; no generated code, brand/font/asset or raster content entered production.

### Overlay and feedback implementation

- Added the cohesive `one-ui/overlays.tsx` and `one-ui/feedback.tsx` modules with companion styles. `OneUISideSheet` uses a 400 px detached landscape surface and viewport-bounded compact bottom sheet above navigation. `OneUIDialog` uses a 372 px surface, 20 px padding and 28 px radius.
- Quick Status retains its bridge, aggregate sample rate, both glove rates and simulator summary while adding an accessible modal name, focus trap, inert background, Escape/close/scrim dismissal, focus return, trigger-tooltip suppression, body scroll lock and independent content scrolling.
- One/all disconnect actions now require explicit destructive confirmation; connect actions remain immediate. Re-activation is locked, no backend call occurs before confirmation and each confirmation invokes the existing operation once.
- Actual resolved connection/disconnection/bulk/simulator outcomes drive a latest-operation-wins snackbar. Success is polite `status`, failure is assertive `alert`, focus is not stolen and hover pauses timeout. Real asynchronous buttons use one shared indeterminate progress primitive without width shift or duplicate submission.
- `OneUIStateMessage` represents only startup/bridge failure, no channels selected and no connected source. Operation failures no longer duplicate their snackbar in an inline alert. Charts continue to mount and acquisition semantics are unchanged.
- Removed `.quick-status-panel`, its closing/header/title rules, `.panel-close`, `.inline-alert`, `.loading-state`, `.spinner`, `.one-ui-control-spinner` and superseded keyframes. The Stage 2B styles introduce 22 referenced class selectors with no dead class; no generic override block was added.

### Verification, evidence and stop gate

- Combined application CSS moved from the Stage 2A baseline of 895 lines/37,371 bytes to 1,063 lines/43,956 bytes (+168 lines/+6,585 bytes). Production CSS is 43,569 bytes (+5,774) and JS is 289,044 bytes (+7,318); dependency manifest hashes are unchanged.
- Vitest: `2 passed`; Vite production build: success; Playwright: `9 passed`, covering pointer/keyboard sheet and dialog flow, Escape/focus restoration, inertness, scroll lock, snackbar roles/timing/hover pause, duplicate submissions, real pending width, reduced motion, full-page/dialog/sheet axe, all 13 channels, acquisition/pause/follow-live/zoom and 200% effective zoom. Python: `42 passed`; PyWebView smoke: exit `0`.
- Manually inspected base light/dark Device Manager and Live Monitor at 1280×720, 1440×900, 1024×768 and 800×1100 plus both sheet modes, both dialogs, both snackbar outcomes, pending, no-channel and no-source states. Canonical captures and three contact sheets are retained under `.design-cache/artifacts/m1.1-ui-d2-6-stage2b/`.
- Package manifests, backend, acquisition, simulator semantics, REST/WebSocket/authentication, `run_app.ps1`, PySide, Qt adapter/dependencies, protected prototypes/assets and user-owned `AGENTS.md`, `app.rar` and `glove_ble.py` were not changed by Stage 2B.
- Status: `D.2.6 Stage 2B implemented — awaiting explicit visual approval`. Final D.2.6 approval was not claimed; Phase E remains locked.

## 2026-09-03 — Milestone 1.1 Phase D.2.6 Stage 2A

### Approval boundary and reference inspection

- The user explicitly approved only the Stage 1 system status region, app bar, landscape rail, compact/portrait bottom navigation and responsive shell mode selection. Both shell source hashes remained unchanged throughout Stage 2A; final D.2.6 approval was not inferred.
- Reused the prior Figma preflight and performed only focused context reads for Buttons `1497:12222`, Top App Bar `1495:10992`, Slide Navigation `631:2757`, Search `1497:12549`, Status Bar `1491:6323`, Live Activity `1491:6362`, Card `245:399` and Containers `247:613` through the advertised connector. The implementation adapts geometry/state principles and contains no generated Figma code, Samsung font/logo/asset or raster content.

### Control foundation and consumer migration

- Kept all primitives grouped in `one-ui/controls.tsx` with one companion stylesheet: `OneUIButton`, `OneUIIconButton`, `OneUISegmentedControl`, `OneUIStatusIndicator`, `OneUITextField` and `OneUICheckboxRow`.
- Added hover, pressed, focus-visible, disabled and loading-capable behavior. Status labels remain explicit and the marks distinguish positive, waiting, neutral and warning/error states by shape/border treatment as well as color.
- Replaced Device Manager actions, four native numeric simulator inputs and device statuses; Live Monitor's four time windows, pause/follow-live actions, all 13 native checkbox rows and chart statuses; plus the existing theme, Quick Status, Bridge and SIM consumers.
- Removed the superseded `.button`, `.segmented`, `.status-dot`, `.status-pill`, `.input-suffix`, `.channel-toggle` and `.checkmark` rules. No duplicate override block was appended. The simulator band remains secondary, channel scanning remains compact, and device/chart dimensions match Stage 1 exactly at the measured target viewports.

### Verification, evidence and stop gate

- Stage 1 freeze: `one-ui/shell.tsx` remains `DF411A49170C6A2EEA6B449813884511BF397EC81736332E49B6A94299A3D957`; `one-ui/shell.css` remains `D4499B0277A4141AAF36C794CFB9A81ACFF9A1547EDECFE019A0884E06F53D4C`.
- Vitest: `2 passed`; Vite production build succeeded; Playwright: `7 passed`, covering behavior, one identity/h1/theme control, all 13 channels, keyboard focus, Quick Status focus/tooltip lifecycle, reduced motion, axe serious/critical checks, shell geometry, responsive captures and bundle exclusions. PyWebView smoke exited `0`.
- Manually inspected light/dark Device Manager and Live Monitor at 1280×720, 1440×900, 1024×768 and 800×1100. Retained final captures and Stage 1 ↔ Stage 2A/responsive contact sheets under `.design-cache/artifacts/m1.1-ui-d2-6-stage2a/`.
- Package manifests are unchanged. Backend, acquisition, simulator behavior, REST/WebSocket/authentication, `run_app.ps1`, PySide, Qt adapter/dependencies, protected prototypes and production assets were not changed.
- Status: `D.2.6 Stage 2A implemented — awaiting explicit visual approval`. Side sheet, dialog, snackbar, progress/state-message work, Stage 2B and Phase E were not started.

## 2026-09-03 — Milestone 1.1 Phase D.2.6 Stage 1

The shell prototype was implemented and later received explicit visual approval limited to its architecture. That approval did not cover Stage 2A controls, final D.2.6 visuals or Phase E.

## 2026-09-02 — Milestone 1.1 Phase D.2.5

### Baseline, visual specification and references

- Began from `bf77208` after proving `App.tsx`, `styles.css` and `tests/collector.spec.ts` matched the verified D.2.3 baseline. Preserved the modified user-owned `AGENTS.md` plus untracked `app.rar` and `glove_ble.py`.
- Re-read the D.2.4 visual rejection diagnosis and all relevant baseline/rejected/rollback contact sheets. Wrote the ignored exact geometry contract at `.design-cache/audits/D2_5_VISUAL_SPEC.md` before editing source.
- Re-inspected the approved Figma Top App Bar `1495:10992`, Card `245:399`, Containers `247:613` and Navigation Bar `1502:19870` nodes through the active connector. Navigation Rail and Status Bar remained explicit negative references; no generated code or Samsung asset/font/brand entered production.

### Implementation and visual iteration

- Kept the D.2.3 single full-width shell, bottom application navigation and unchanged React component behavior. Deliberately rejected D.2.4's permanent rail, separate top app bar, duplicate identity, lateral content shift and mobile-system chrome.
- Consolidated the collector CSS around 32/24/16 px responsive gutters, 44/42/40 px titles, equal-height glove cards, divider-based metrics, a quieter 132 px simulator band, a compact 68 px bottom dock and no more than canvas/semantic-container/control surface depth.
- Preserved both 1024 px Device Manager columns at 480 px each. Portrait uses one-column cards and a bounded scrolling application viewport ending above the dock, preventing navigation from painting over interactive simulator or chart content.
- Live Monitor now uses a 220 px landscape channel panel and equal dominant plots: 482×330 px at 1280×720, 562×430 px at 1440×900 and 362×378 px at 1024×768. Portrait presents all 13 channel controls in a compact grid before stacked 768×360 px plots.
- The four early gates were generated and manually compared three ways against D.2.3 and rejected D.2.4. A first simulator-band pass exposed an inherited grid-span overlap; it was corrected before responsive work. Final inspection covered all light/dark 1280×720, 1440×900, 1024×768 and 800×1100 images plus Quick Status and both contact sheets.

### Verification and boundaries

- Vitest: `2 passed`; Vite production build succeeded; Playwright: `6 passed` across the four review sizes, including acquisition/pause/heartbeat, exact two-destination/single-identity/single-theme shell, geometry, bottom reserve, token security, reduced motion, contrast and axe serious/critical gates.
- Python: `42 passed` with the existing Starlette `httpx` deprecation warning. PySide smoke and PyWebView/web-shell smoke both exited `0`.
- Package manifests and lockfiles are unchanged. Backend, acquisition, simulator, REST/WebSocket/authentication, `run_app.ps1`, PySide UI, Qt adapter/dependencies, prototypes and source assets were not modified.
- Review output remains ignored at `.design-cache/artifacts/m1.1-ui-d2-5/`; the superseded early three-way comparison was consolidated during authorized repository hygiene after the final D.2.3 ↔ D.2.5 and responsive contact sheets were retained.

### Stop gate

- D.2.5 status: `implemented — awaiting explicit user visual approval`.
- Phase E was not started and remains locked. Automated axe checks do not replace hands-on screen-reader, 200% zoom, touch-device or user visual review.

## 2026-09-02 — Milestone 1.1 Phase D.2.4

### Baseline and Figma inspection

- Preserved the user-owned modified `AGENTS.md` and untracked `app.rar`/`glove_ble.py`; the source baseline was otherwise clean at `bf77208`.
- Verified the connected Figma student plan/full seat, file `97artOnuCMCiOPdD2r3ST2`, all six top-level pages and the approved One UI 8.5 nodes before editing.
- Inspected Navigation Rail `1589:7438`, Top App Bar `1495:10992`, Card `245:399`, Containers `247:613`, Status Bar `1491:6323` and Navigation Bar `1502:19870` through the active connector. The ignored audit is `.design-cache/audits/ONE_UI_TABLET_BEFORE_D2_4.md`.

### Implementation

- Replaced the D.2.3 floating desktop dock with one adaptive application frame: compact rail for landscape/tablet widths and bottom navigation for portrait/narrow windows.
- Added a restrained top app bar for the text-only `Dataset Studio` identity, bridge/simulator status, one theme control and Quick Status action; Quick Status retains its existing focus lifecycle and secure in-memory wording.
- Rebalanced Device Manager into responsive paired glove containers and a grouped simulator surface while preserving every action, field, state and statistic.
- Rebalanced Live Monitor into a chart-dominant tablet workspace with touch-sized selectors and one/two-column responsive plots while preserving all 13 channels, pause behavior and semantic L/R plus solid/dashed distinction.
- Reused only the existing repository SVG icons and DM Sans files. No Figma-generated code, Samsung branding/font/raster asset, new dependency, backend, protocol, launcher or Qt change was introduced.

### Verification and visual review

- Python: `42 passed`; the existing Starlette `httpx` deprecation warning remains the only warning.
- PySide smoke and PyWebView/web-shell smoke: exit code `0`.
- Vitest: `2 passed`; Vite production build succeeded.
- Playwright: `6 passed`, including acquisition/pause/heartbeat, token security, one theme control, adaptive navigation, minimum touch targets, geometry/overflow, contrast, reduced motion, axe serious/critical gate and production bundle exclusions.
- Manually inspected light/dark Device Manager and Live Monitor at 1280×720, 1440×900 and 1024×768, plus 800×1100 portrait and Quick Status. Visual iteration corrected a right-aligned 1024 heading, tablet card truncation, dark inactive icon contrast and portrait chart framing.
- The final D.2.3 ↔ D.2.4 and responsive contact sheets remain ignored at `.design-cache/artifacts/m1.1-ui-d2-4/`; redundant individual screenshots were later consolidated during authorized repository hygiene.

### Production visual rejection and controlled rollback

- The user rejected the D.2.4 production composition. The adaptive shell technically passed, but the added rail, top app bar and page title formed competing hierarchy, consumed the chart/device canvas and behaved like a compressed desktop dashboard at 1024 px; the portrait stack did not read as a cohesive native tablet screen.
- Saved the complete rejected tracked diff at `.design-cache/backups/d2-4-visually-rejected/d2-4.patch` (SHA-256 `43A080235F77A53C0B61DC6E1E314847ABB929A952AFDE648B04D4E977CEEA84`) and retained all D.2.4 screenshots/contact sheets. The pre-D.2.4 images were separately archived before regenerating screenshots.
- Restored only `app/desktop_collector/web/src/App.tsx`, `app/desktop_collector/web/src/styles.css` and `app/desktop_collector/web/tests/collector.spec.ts` to `HEAD`; their hashes match the verified D.2.3 baseline. The user-owned `AGENTS.md`, `app.rar` and `glove_ble.py` were not changed.
- Re-read the same six approved Figma nodes through the active connector for diagnosis. No Figma-generated code, asset or source edit was made.
- Fresh rollback verification: Python `42 passed` with the existing Starlette warning; PySide and PyWebView/web-shell smoke tests exited `0`; Vitest `2 passed`; Playwright `4 passed`; the Vite production build succeeded.
- Fresh rollback images and a D.2.3-before ↔ D.2.3-rollback contact sheet confirmed the composition was restored; the superseded rollback directory was later consolidated into the byte-identical canonical `.design-cache/artifacts/m1.1-ui-d2-3/` evidence. Changing simulator values and live traces were expected.

### Stop gate

- D.2.4 — visually rejected; rolled back to the verified D.2.3 baseline. Phase E was not started and remains locked pending explicit approval of a replacement visual direction.
- `run_app.ps1`, PySide UI, Qt adapter/dependencies, backend/acquisition/simulator/API/WebSocket/authentication contracts, source assets and post-Milestone-1 features remain unchanged.
- Automated axe checks do not replace hands-on screen-reader and 200% zoom review before release.

## 2026-08-29 — Milestone 1.1 Phase D.2.3

### Baseline and correction scope

- Read the complete D.2.3 prompt, tracker, changelog, session history, shared One UI contract, both D.2.2 audits, all ten D.2.2 screenshots and the two local One UI reference overviews before source changes.
- Recorded the ignored pre-change audit at `.design-cache/audits/BRAND_CONTRAST_BEFORE_D2_3.md`; the dirty worktree baseline (4 tracked modifications, 34 tracked deletions and existing untracked project paths) remains preserved.
- Used Samsung Vietnam home/ethics/brand-identity pages only as visual hierarchy and spacing references; no website code, image, logo, icon or font was copied and no Samsung runtime request was added.

### Implementation

- Removed the taskbar and error-state `SG` initials blocks. The taskbar now renders only semantic text `Dataset Studio`; no logo asset was created.
- Removed the Quick Status theme button and retained exactly one taskbar theme control with a sun/moon action icon, visible focus, mouse/keyboard support and a stored `light`/`dark` preference. The RAM-only bridge token remains absent from storage and logs.
- Added shared semantic action/inverse tokens. Black/inverse emphasis is limited to `Kết nối tất cả` and simulator `Áp dụng`; connect/disconnect, close, theme and navigation keep their existing semantic roles.
- Turned simulator configuration into the single inverse Device Manager band and Quick Status sample rate into its inverse hero. Dark mode uses a raised neutral inverse surface rather than a bright white block; Live Monitor chart surfaces were not changed.
- Adjusted title, section/card heading, helper line-height/readable measure and relationship spacing. A final 1280×720 review found the simulator band touching the dock; the breakpoint padding was corrected and a band/dock clearance assertion was added.

### Verification

- Python: `42 passed`, with the existing Starlette `httpx` deprecation warning only.
- PySide smoke and local bridge/PyWebView smoke: exit code `0`.
- Vitest: `2 passed`; Vite production build succeeded.
- Playwright: `4 passed`, covering two 200 Hz simulators, pause/acquisition independence, heartbeat, single theme control, theme mouse/keyboard/persistence, token non-storage, wordmark semantics, CTA/inverse contrast, geometry, reduced motion, axe serious/critical gate, and Samsung/master-resource exclusion.
- Twelve final screenshots plus a D.2.2 ↔ D.2.3 contact sheet are ignored at `.design-cache/artifacts/m1.1-ui-d2-3/`.
- Automated accessibility checks do not replace hands-on screen-reader and 200% zoom review before release.

### Stop gate

- D.2.3 is technically complete but awaits the user's direct visual approval. Phase E was not started.
- `run_app.ps1`, PySide UI, Qt adapter/dependencies, backend/acquisition/uPlot contracts, prototypes, assets and all post-Milestone-1 features remain unchanged.

## 2026-08-29 — Milestone 1.1 Phase D.2.2

### Visual sources and baseline

- Inspected all ten D.2.1 artifacts, both approved local One UI SVG references, the shared token/motion contract and the official Samsung Vietnam/One UI pages before source changes.
- Wrote ignored pre-change and final-review audits under `.design-cache/audits/`; Samsung web pages were visual references only and no site code, image or font was copied.
- Preserved the dirty-worktree baseline and all user-owned prototypes/assets.

### Implementation

- Changed only `App.tsx`, `DeviceManager.tsx`, `LiveMonitor.tsx`, collector CSS and Playwright review assertions.
- Reduced nested gray surfaces and pill count, raised supporting typography, created hero device statistics/sensor summaries, grouped Live metrics and increased chart prominence.
- Refined taskbar cluster hierarchy and rebuilt Quick Status without changing its security, state or lifecycle behavior.
- Completed the Quick Status motion pair with a 240 ms exit state and a zero-delay reduced-motion branch; E2E focus/Escape behavior remains green.
- Added a 1280×720-specific one-row simulator layout after visual review found the first polish pass placed controls behind the dock; regenerated artifacts confirm the correction.

### Verification

- Python: 42 tests passed; one existing Starlette `httpx` deprecation warning.
- PySide and local bridge smoke tests: exit code 0.
- Vitest: 2 tests passed; Vite production build succeeded.
- Playwright: 3 tests passed, including two-glove acquisition, pause/heartbeat, Quick Status security/focus, axe critical/serious scan, title/body/control sizing, no overflow and chart/taskbar clearance at both target viewports.
- Ten final light/dark screenshots were generated for D.2.2; after authorized repository hygiene, their retained comparison evidence is `.design-cache/artifacts/m1.1-ui-d2-3/contact-sheet-d2-2-vs-d2-3.png`, while the final visual audit continues to record the original sizes and SHA-256 values.
- Package manifests, production icons and master SVG hashes are unchanged.

### Stop gate

- Phase E was not started. `run_app.ps1`, PySide rollback path, Qt dependencies and backend contracts remain unchanged.

## 2026-08-28 — Milestone 1.1 Phase D.2.1

### Audit and scope

- Recorded the dirty-worktree baseline and component ownership in ignored `.design-cache/audits/ONE_UI_DESKTOP_SHELL_BEFORE_D2_1.md` before changing source.
- Inspected all eight D.1 screenshots. The current Live Monitor 1280×720 artifacts do contain the app bar and logo; the historical discrepancy came from retained page scroll during an earlier capture and is prevented by deterministic viewport reset assertions.
- Limited implementation to the React shell, responsive visual CSS, E2E review coverage, asset usage record and adoption/log documentation. No API, WebSocket, backend, acquisition, dependency, prototype, source asset, Qt or launcher change was made.

### Implementation decisions

- Replaced rail/topbar with one floating One UI Desktop/DeX taskbar. Navigation uses icon + text + selected shape and `aria-current`; system tray contains bridge, simulation, theme and Quick Status.
- Kept Quick Status inside `App.tsx` because it is shell state, avoiding an unused abstraction or new package. It reads the existing `CollectorState` and never renders the session token.
- Quick Status supports pointer and keyboard activation, Escape, outside click, focus on open and focus return on explicit close/Escape. Acquisition and telemetry continue while it is open.
- Reused `settings-outline.svg` node `340:8609` from the confirmed production asset source. No SVG was redrawn, copied or changed.
- Added `docs/ONE_UI_DESKTOP_MOBILE_ADOPTION.md`; both user-owned prototype trees remain untouched.

### Verification

- Python: 42 tests passed; one existing Starlette `httpx` deprecation warning.
- PySide and local-web-shell smoke tests: exit code 0.
- Vitest: 2 store tests passed; Vite production build succeeded.
- Playwright: 3 tests passed, including two-glove 200 Hz flow, batching, pause/acquisition independence, heartbeat, Quick Status focus/Escape/outside click, in-memory session wording, token non-disclosure, axe serious/critical checks and no horizontal overflow.
- Ten review PNGs were generated for D.2.1: eight Device/Live light/dark viewport captures plus Quick Status light/dark at 1440×900. The superseded directory was later consolidated during authorized repository hygiene after the D.2.3 canonical set was retained.
- Visual review found and corrected an initial 1280×720 chart/taskbar overlap and dark-mode inactive-icon contrast issue. Regenerated images keep chart axes above the taskbar and preserve non-color L/R + solid/dashed cues.

### Stop gate

- Phase E was not started. `run_app.ps1`, PySide rollback files and Qt dependencies remain unchanged pending separate user approval.
- Serial, firmware, protocol v1, Data Capture, persistence, filtering and ML remain out of scope.

## 2026-08-28 — Milestone 1.1 Phase D.2

### Baseline and sources

- Captured the dirty-worktree baseline: 4 modified tracked files, 34 tracked deletions and 18 untracked entries; all pre-existing changes remain preserved.
- Audited the desktop prototype, mobile prototype and React collector before source changes. Desktop/mobile each contain 42 assets and all 42 relative-path pairs are byte-identical by SHA-256.
- Verified the two approved One UI 7 design references at their existing hashes and kept them out of runtime imports.
- Checked out SamsungInternet/OneUI-Web at exact commit `b20b1dd7b4094e2c501a6d9712d1c8f2fc77a52f` only under ignored `.design-cache/vendor/OneUI-Web/`; no vendor script was run.
- License boundary: OneUI-Web MIT for selective implementation reference; OneUIX AGPL-3.0 and Android-Dex closed-source/no published application-code license remain reference-only with no copied code or assets.

### Shared contract and pilot

- Added only `tokens.css`, `motion.css` and `README.md` under `app/frontend/shared/one-ui/`.
- Moved canonical D.1 color, surface, status, radius, spacing, elevation and motion values from collector-local CSS into the shared contract.
- Added accessible filled/on-accent pairs, frosted opaque fallback, reduced-transparency behavior, named durations and reduced-motion overrides.
- The collector imports the contract through exact Vite alias `@one-ui-shared`; collector-only aliases and layout/component styling remain local.
- No React component, store/API behavior, package manifest, lockfile, dependency, Python/Qt file, default entry point or `run_app.ps1` was changed.
- Both user-owned prototypes remain untouched and do not yet import the contract.

### Verification

- Python: 42 tests passed; one existing Starlette `httpx` deprecation warning.
- PySide and local-web-shell smoke tests: exit code 0.
- Vitest: 2 tests passed; Vite production build succeeded.
- Playwright: 3 tests passed, including pause/acquisition independence, heartbeat, keyboard focus, axe serious/critical scan and 1280×720/1440×900 overflow checks.
- Light and dark manual image inspection showed no visual regression after shared-token adoption.
- Completion audit confirms no giant SVG/vendor path in the bundle, no new dependency, and unchanged prototype/source-asset hashes.

### Stop gate

- The provided D.2 attachment ends mid-code-block after the three-file shared structure. No missing later requirement was invented.
- Phase E remains locked; PySide dependencies/UI, rollback path, `run_app.ps1` and default entry point remain unchanged.

## 2026-08-28 — Milestone 1.1 Phase D.1

### Visual gate and implementation

- Inspected `.design-cache/one-ui/one-ui-master.svg` and `one-ui-secondary.svg` directly by metadata/hash and local raster crops. The reference hashes remain `BAA04D…E10` and `4895C5…13B`.
- Created the required pre-change gap audit before editing React source.
- Realigned only the React visual layer: detached rounded rail, tonal selected navigation, desktop Top App Bar, bridge status capsule, in-bar light/dark chip, enlarged headers, large tonal controls/cards, floating chart toolbar and softer data containers.
- Kept the existing React files and behavior boundaries; no backend, acquisition, protocol, security, PyWebView lifecycle, PySide rollback, dependency, default entry point or `run_app.ps1` change was made.
- Continued to import `devices.svg`, `sound-outline.svg` and DM Sans directly from `app/frontend/desktop/assets/`. No master SVG was bundled, extracted or edited.
- Automated axe review found white text on reference blue `#387AFF` at 3.89:1. D.1 retains that reference accent for non-text/plot use and uses an accessible filled-control token for text-bearing controls.

### Verification snapshot

- Python: 42 tests passed; one existing Starlette `httpx` deprecation warning.
- PySide smoke and PyWebView/local-bridge smoke: exit code 0 for both.
- Vitest: 2 tests passed.
- Vite production build: success, 9 generated files; no master/secondary SVG filename or hash reference in the bundle.
- Playwright: 3 tests passed, covering two-glove 200 Hz flow, pause without acquisition stop, UI heartbeat, keyboard focus, axe serious/critical checks, resource exclusion and no page-level horizontal overflow.
- Eight deterministic review PNGs were generated for D.1: Device Manager and Live Monitor, light/dark, at 1280×720 and 1440×900. The superseded directory was later consolidated during authorized repository hygiene after the D.2.3 canonical set was retained.
- Source hashes after verification: `devices.svg` = `2CC36B…C5F`; `sound-outline.svg` = `048ADC…24D`; both design reference hashes are unchanged.

### Stop gate

- Visual approval remains with the user; the D.1 review report does not self-approve the result.
- Phase E was not started. PySide files/dependencies and `run_app.ps1` remain unchanged.

## 2026-08-28 — Milestone 1.1 Phase A–D

### Safety and design gates

- Captured the dirty-worktree baseline and backed up exactly 10 files planned for modification under ignored `.design-cache/backups/pre-m1.1/`; source/copy size and SHA-256 matched for every entry in `MANIFEST.md`.
- Preserved `app/frontend/index.html`, both user-owned prototype trees and all 34 existing tracked deletions.
- Rendered the two approved master SVGs locally without bundling or printing their XML. Crops/overviews remain ignored design artifacts.
- Production UI reads `devices.svg`, `sound-outline.svg` and DM Sans WOFF2 directly through the Vite alias to `app/frontend/desktop/assets/`; no asset was copied or modified.

### Implementation decisions

- `AcquisitionController` is now Qt-free and exposes listener callbacks plus bounded per-device cursors. The PySide rollback UI receives the same events through `QtAcquisitionAdapter`.
- FastAPI routes remain in `server/app.py`: health, bootstrap, connect, disconnect, simulator config and telemetry resync snapshot only. There is no rename/PATCH route.
- Telemetry is full-rate in the acquisition buffer and sent to display clients as bounded columnar batches at 10–30 FPS; no unbounded queue is created.
- The PyWebView shell pre-binds an IPv4 loopback socket on port 0, creates one random RAM token and shuts down acquisition, WebSockets and Uvicorn idempotently.
- React stores up to 60 seconds per device. Pausing the chart freezes only its display snapshot; batching and packet counters continue.
- Phase C covers two independent simulators, 13 raw channels, per-channel stddev/peak-to-peak, loss, channel toggles, cursor/drag zoom and 5/10/30/60-second windows.
- Phase D follows the approved One UI reference language with card hierarchy, 18–26 px radii, light/dark surfaces, exact focus states and L/R labels plus solid/dashed traces.

### Verification snapshot

- Python: 42 tests passed in the final full run.
- Vitest: 2 store tests passed.
- Playwright: 3 integration/visual tests passed, including two-glove 200 Hz stress, UI heartbeat, pause/acquisition independence and axe serious/critical checks.
- Exact 1280×720 and 1440×900 light/dark review captures were generated for Device Manager and Live Monitor. That superseded initial review directory was later consolidated during authorized repository hygiene after canonical D.2.3 evidence was retained.
- Both PySide and local-bridge smoke tests exit successfully. Generated build/test artifacts remain ignored.

### Stop gate

- Phase E was not started. `run_app.ps1` still launches `app.desktop_collector.main`; Qt adapter, PySide UI and all Qt dependencies remain until the user reviews the images and separately approves cleanup.

## 2026-08-28 — Milestone 1

### Baseline

- Worktree đã có thay đổi của người dùng: frontend gốc được tổ chức lại thành `desktop/` và `mobile/`, README liên quan đã sửa, nhiều tài liệu dự án chưa track.
- Không restore, xóa, đổi tên hoặc chỉnh nội dung các thay đổi đó.
- Asset desktop/mobile đã được kiểm kê trước khi triển khai; hai cây trùng byte.

### Decisions

- Desktop collector mới nằm riêng tại `app/desktop_collector/`; prototype web được giữ nguyên.
- Acquisition dùng một Python worker thread cho mỗi `DataSource`; UI chỉ đọc snapshot.
- Simulator mặc định 50 Hz, seed 2026/2027, noise σ=7 và packet loss 1%.
- Sequence tăng cả khi packet mô phỏng bị drop để packet loss quan sát được.
- Live chart refresh 10 FPS; pause chart không dừng source hoặc buffer.
- UI chỉ có Device Manager và Live Monitor trong Milestone 1.
- SVG One UI và WOFF2 được đọc từ asset gốc; DM Sans fallback Segoe UI, không chuyển font.
- Gesture catalog có validator nhưng chưa nối vào capture workflow.

### Boundaries for next session

- Dừng sau Milestone 1.
- Trước Milestone 2 cần xác nhận lại hardware ESP32-C3 SuperMini, GPIO0 và môi trường PlatformIO.
- Milestone 2 mới được thêm firmware, JSONL/CRC32 protocol, Python parser, Serial worker và legacy adapter.
- Không được cho capture chính thức từ legacy line hoặc nguồn thiếu protocol v1 metadata.

### Verification

- Runtime kiểm thử: CPython 3.12.13, PySide6/Qt 6.11.2.
- `python -m pytest`: 27 test passed.
- Startup offscreen `python -m app.desktop_collector.main --smoke-test`: exit code 0.
- PowerShell parser xác nhận `run_app.ps1` không có lỗi cú pháp.
- Visual test bằng Qt Windows platform: light/dark tại 1280×720 và 1440×900 cho cả Device Manager và Live Monitor.
- DM Sans WOFF2 không được Qt 6.11.2 trên môi trường này nhận dạng thành raw font hợp lệ; ứng dụng chọn Segoe UI và không chuyển đổi asset.
- Asset desktop/mobile vẫn có 0 khác biệt SHA-256 sau triển khai.


## 2026-09-10 — Approved auth baseline → shell/menu/icon continuation

- User approved the centered Auth V2 visual. Continued from that exact sandbox working copy rather than reopening the auth concept.
- Implemented a gentle bottom mask fade in the shared content viewport to mirror the existing top transition before the floating dock.
- Pulled fresh design context for Figma Selection Menu `1497:12842` and refined shared Selection/Drop Down menu styling without adding a new UI framework or Tailwind.
- Exported and stored exact Figma SVG pairs for Studio contextual destinations (folder, image, labs, info, sound) and exact settings outline; shared shell injects them only for existing Studio context items.
- `shell.tsx` and `surfaces.tsx` pass TypeScript syntax transpile checks. Full Vite build remains blocked by the incomplete transferred `node_modules` payload (`vite/client` missing).
- Generated and inspected real sandbox review captures for dark/light Studio shell and dark/light menu surfaces. Review shell is intentionally scrolled so the top and bottom fade behavior can be seen in one frame.
- No Phase E/M2 work, no broad Devices/Monitor redesign, and no auth propagation beyond the already approved login baseline.
