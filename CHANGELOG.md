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

## 2026-10-19 - Inspectable webcam results and explicit sign completion

- Added Recognize now during Auto: closes the observed segment on the next fresh
  frame, preserving gap/duration/coverage checks and frozen model acceptance.
- Fixed rearming after a completed/timed-out sign when the user lowers both hands.
- TCN/VideoMAE now expose separately labeled unconfirmed top3 diagnostics on
  classifier rejection, including native outside-vocabulary status. Host validates
  the rankings; rejected top_k stays empty. No artificial accepted words.
- Capture failures/rejections now render their reasons and coverage instead of
  an empty Prediction heading. Finish capture is available for all manual models.
- Real-worker browser test verifies explicit completion and displayed scores,
  three viewports and Axe. This is pipeline evidence, not known-word webcam accuracy.
  Full verification/limitations are in docs/WORK_SESSION_HANDOFF.md.

## 2026-10-19 - Measured tracking optimization and TCN hand recovery

- Reused the pinned Holistic models with2CPU inference threads; preserved exact
  primary landmarks/presence on750 retained reference frames. Added bounded,
  current-frame palm recovery for missing TCN hands with visible pose wrists.
  Ambiguous/crossed/duplicate/out-of-frame matches are rejected; no held points.
- Versioned TCN Auto preprocessing as `-stream-palm-recovery-v2`; preserved weights,
  normalization, rejection threshold, Capture, default model and launcher.
- Wait for fresh video callbacks instead of a redundant full polling interval;
  retain one-frame backpressure, pause timeout and cancellation. Added stage timing.
- Added Camera quality choices1080p(default),720p,540p, all requesting60camera FPS.
  Existing OneUISelectField is reused; lower detail/latency tradeoff is explicit.
- Final offline comparison:25clips,750source frames; warm worker mean34.08→25.01ms,
  p9536.31→42.71ms (recovery adds tail cost); detected hand slots1202→1217/1500.
  Fifteen final decisions remained rejected;10clips had no final boundary. This
  is not a successful-word accuracy evaluation.60fresh tracking FPS remains unmet.
- User clarified the failure posture as the hand edge facing the camera.
  Physical edge-on and multi-user validation remain open; verification details
  and browser measurements are recorded in WORK_SESSION_HANDOFF.md.
- Browser3quality regression passed with real workers:fixture tracking7.57FPS
  at1080p,13.30at720p,15.46at540p; not physical webcam performance.78frontend tests,
  production build,353affected Python tests and launcher smoke passed. Rapid Auto restart may still need
  about2seconds for native worker teardown before retrying.

## 2026-10-19 - Record next-session tracking performance requirements

- Recorded user-observed slow tracking, lag on rapid movement and horizontal-hand
  detection failures; next-session target is60fresh tracking updates/second.
- Inspected current serialized camera/worker path and TCN360x360 input; documented
  stage profiling and separate hand-coverage/reacquisition criteria.
- Documentation only. No runtime settings, models, dependencies, UI or launcher
  changed. No new live-camera test or claimed FPS improvement.

## 2026-10-18 - TCN Auto and landmark replay references

- Enabled TCN on the existing authenticated stream: resize360/Holistic tracking,
  GH137 feature packing, final-only classification, pre-roll and stillness boundary.
  Interrupted/max-duration segments are withheld; fixed26-way threshold unchanged.
- Added25 train-only landmark replay WebMs, enlarged hand details and slow playback.
  They are labeled reconstructed landmarks, not original human videos or verified
  VSL instruction. Original RGB/semantic verification remains outstanding.
- Updated provider-specific reference routing and stream score/identity validation.
- Passed341affected pytest,74Vitest,production build,launcher smoke and a real-worker
  browser test covering Capture+reference playback+Auto.25clips/731frames decoded.
  Physical webcam accuracy remains unverified. No default/dependency/launcher change.

## 2026-10-18 - Selectable TCN25+OTHER Capture integration

- Added `vsl-gh-tcn-25`, pinned epoch44 weights/normalization, exact GH137 encoder,
  new25 labels, native26-way softmax and frozen S05 acceptance threshold. OTHER
  and uncertain decisions withhold words. CPU inference stays in the isolated worker.
- Live Camera offers **TCN · 25 signs + OTHER (Experimental)**, Capture and early
  Finish capture; Auto is disabled. Hide unrelated old25 reference videos.
- Existing default, launcher, dependencies, raw data and bridge security unchanged.
- Verified:328 recognition/offline pytest cases;14 final provider cases;73 Vitest
  cases; production TypeScript/Vite build; shell smoke; one real-worker Playwright
  test with two synthetic captures and three viewport screenshots. CPU replay of
  all4,541 samples has zero prediction mismatches. Physical webcam accuracy untested.
- Evidence and test-environment limitations: docs/WORK_SESSION_HANDOFF.md.

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

Extended vsl_data_audit with cropped-vsl provenance joins, signer/recording leakage,
augmentation-parent tracking and exact current-label coverage. Added nine regression
cases covering leakage, ambiguity, identity misuse and input preservation.

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

Detailed source links, counts, limitations, workflow and commands:
[VSL_MULTIUSER_DATASET_REVIEW.md](docs/VSL_MULTIUSER_DATASET_REVIEW.md).
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

## 2026-10-16 - VideoMAE worker startup and camera failure feedback

- Bypassed reproduced cuDNN warmup OOM while retaining CUDA FP32 and the pinned
  pretrained model; added safe runtime errors and worker recovery regressions.
- Distinguish stopped Auto recognition from active camera preview; clear stale
  Sending-local-clip status on upload/job failure and permit retry.
- Verified311 backend tests,73 frontend tests, five browser cases, build and
  launcher/shell smoke. Real CUDA Capture and one Auto completed-word replay pass.
- Current25-reference Capture check:24 matching accepted, bicycle withheld,
  zero execution errors. Auto also had a no-final replay timeout; physical-camera
  accuracy and completion reliability remain open. No local retraining.

## 2026-10-15 - Experimental pretrained VideoMAE GPU camera provider

- Added a separately pinned VideoMAE RGB provider, selectable in Live Camera with
  the current 25 signs; preserved V25 as the default and all KVSL topic models.
- Added isolated CUDA Capture/Auto routing, strict numeric checkpoint loading,
  bounded RGB history, native-100-class checks and heuristic uncertain-result
  withholding. Capture reuses its model; model execution cannot overlap Auto.
- Extended authenticated stream provider selection and displayed rejection
  reasons using existing One UI controls. No new visual assets or dependencies.
- Verified 297 affected Python tests, 73 frontend tests, four distinct browser
  cases, build and shell/launcher smoke. Actual GPU Capture replay succeeds;
  Auto final extended-hold replay is rejected, so physical accuracy and boundary
  reliability remain unverified. No local retraining in this change.

## 2026-10-15 - RTX 2050 replay verified; safe C cache cleanup

- Ran isolated VideoMAE FP32 on RTX2050: 39 source clips, 39 matching labels;
  all nine Thức dậy and 31 prior CPU top-one comparisons match. Warm model
  p50/p95 276.32/289.41ms; no physical-camera accuracy or total-latency claim.
- Recorded frequent wrong early-prefix outputs and the user's wrong final
  Thức dậy result with the current V25 app. GPU does not resolve this by itself.
- At user request, cleaned disposable C-drive caches/temp files. Windows
  automatically expanded pagefile and consumed most reclaimed disk space.
  Original runtime, app, launcher, model and raw data remain unchanged.

## 2026-10-15 - Pretrained Vietnamese sign model audit

- Qualified a public VideoMAE candidate through pinned metadata, checkpoint hash,
  exact architecture loading and 100-class label-map consistency checks.
- Executed 31 RGB source replays covering the current 25 words: 31 source-label
  matches, including Chào/Ăn. Shared training source prevents an independent accuracy
  claim. CPU p50/p95 1.30/1.52s; GPU and physical-camera verification remain open.
- Recorded incompatible/missing-weight alternatives and explicit label aliases.
  Experiments/dependencies stay in ignored storage; app, launcher, current model,
  original datasets and production dependency declarations are unchanged.

## 2026-10-15 - Personal camera accuracy priority documented

- Recorded the user's preference to improve recognition for themselves/current camera
  first, and the reported Chào -> Ăn confusion persisting in Completed sign.
- Reviewed historical prefix diagnostics; documented the need to distinguish early
  predictions from completed-gesture errors. No runtime/model/data change or new
  accuracy claim; pending performance verification and approval gates remain open.

## 2026-10-14 - Larger Live Camera and visible recognition result

- Live Camera now spans the Studio content width. The webcam is the primary pane;
  the model's word appears in large type at the top right, above the reference video.
  On narrow screens the result sits directly below the preview.
- Reused One UI surfaces, controls, typography hierarchy and both themes. Model
  scores/details remain available in a disclosure; Dataset results are unchanged.
  Camera diagnostics occupy one compact row on wider screens.
- Verified 70 frontend tests, 14 browser cases, TypeScript/Vite production build
  and launcher smoke. See WORK_SESSION_HANDOFF.md for evidence and remaining gates.

## 2026-10-14 - V25 reference videos inside Live Camera

- Added25 selectable source-example videos beside the webcam, default Chào, with
  explicit native playback, replay and normal/half speed. Reference choice is separate
  from camera recognition; source labels remain independently unverified.
- Prepared browser-compatible local VP8 previews with source/hash receipts. Protected
  ID-only media routes require existing bridge/user authentication; preview loading,
  missing-file recovery and Blob cleanup are handled without runtime conversion.
- Reused One UI controls and responsive surfaces; no new dependency, original-data,
  model, launcher or protected-reference change. Verification and limitations are
  recorded in docs/WORK_SESSION_HANDOFF.md.
- Final checks:360 Python and67 frontend tests passed; all24 distinct affected browser
  cases passed across runs, including real playback of all25 previews and six responsive
  theme/accessibility checks. Production build and launcher smoke passed. Initial
  memory-pressure failures were resolved by sequential verification.

## 2026-10-13 - Experimental during-motion ViSign Auto

- V25 Auto now processes a bounded local camera frame stream and updates tentative
  words during hand motion. It retains onset features and trims quiet tails instead
  of waiting for a completed2-5.5s recording. Manual/KVSL clip recognition stays available.
- Added authenticated stream ownership, backpressure, timestamp/rate/size limits,
  cancellation on Auto off/navigation/hidden camera and worker cleanup on shutdown.
  Camera frames/features stay in RAM; no model, dependency or dataset change.
- Reused existing One UI result primitives for tentative/completed result states.
  Raw scores and repeated candidates remain uncalibrated, not proof of correctness.
- Real reference replay emits predictions during movement, but initial words can be
  wrong. Physical webcam accuracy and subsecond gesture-end-to-display remain open.
- Verification: 321 affected Python tests, 65 frontend unit tests, production build,
  19 browser cases (including real model replay) and launcher smoke pass. Six new
  stream theme/viewport accessibility checks pass. Details, retries and limitations
  are recorded in docs/WORK_SESSION_HANDOFF.md.

## 2026-10-13 - Approved local tooling cleanup

- Removed the 16 explicitly approved Android/build/cache targets: 31,648 files,
  1,781,772,663 bytes (1.659 GiB). Kept Android source, exported APK, signing keys,
  desktop environments, recognition runtime/models, datasets, archives and design evidence.
- Full retained-file audit confirms all 62,428 protected hashes unchanged, with no
  unexpected removal/addition/change. Rebuilt desktop bundles remain byte-identical;
  only the existing Vitest result cache changed outside the documentation updates.
- Added recorded Android tooling versions and recovery steps to apk/README_APK.md.
  Android rebuilding now requires restoring tooling; stale local SDK/JRE paths are
  documented. No launcher, dependency declaration, UI, API or milestone change.
- Verification: 56 Vitest tests, TypeScript/Vite build, 20 targeted Python tests,
  both launcher smoke paths, 11 available providers and real-worker W00395 inference
  pass. Sandbox desktop smoke logged SQLite readonly shutdown despite exit 0;
  elevated rerun exits 0 with no errors. Legacy smoke passes without that retry.
- Root Git is absent; direct/hash evidence is under
  .design-cache/repository-cleanup-20261013/. One preexisting inaccessible pytest
  temp directory and 489 links were excluded from both inventories and left untouched.

## 2026-10-12 - Experimental camera model selection

- Added user-authorized ViSign25 research camera provider alongside ten KVSL topic
  providers. Uses pinned numeric checkpoint, exact training features and the existing
  isolated persistent worker, capture ownership, cancellation and cleanup.
- Live Camera now offers a model panel,25supported words and explicit experimental
  scope. No topic needed for ViSign. Model changes clear old results and wait for
  catalog loading; controls lock during capture/processing/Auto.
- Added raw signed score validation/display and processing time; no-hand clips return
  an actionable message. Kept legacy softmax/schema/provider and dataset behavior.
- Python affected suite164passed; frontend56unit tests and production build pass;
  shell/launcher smoke pass. Real-worker repeated reference, idle, legacy switching,
  cancel/recovery/cleanup pass. Observed warm30-frame processing1.47s; subsecond
  physical latency and new-person accuracy remain unverified. All14distinct affected
  browser cases pass across the combined run and explicit real-dataset opt-in run;
  six model-panel theme/viewport Axe and overflow checks pass.

## 2026-10-12 - Authorized source-label research baseline

- Recorded user approval to train offline experiments before exhaustive semantic review;
  production quality gates and source uncertainty remain explicit.
- Added baseline CLI/tests, deterministic validation repair preserving test groups,
  body-relative masked landmark features and train-only normalization/ridge fitting.
- Trained25-class baseline: test95/117 source-label matches(81.20%), macro-F1 0.6954;
  stored separate model/metrics/split/predictions and51-clip validation review shortlist.
- 147 affected tests pass; all593 saved-model predictions reproduced. No app integration.

## 2026-10-12 - Conservative group curation and local review pack

- Added offline curation CLI and tests: revalidate sources/features/groups, quarantine
  whole groups for flat frames or low hand coverage, preserve remaining assignments.
- Produced 593 screened/pending clips and 231 quarantined clips; exposed two labels
  without validation examples. Generated local per-word video pages and annotation CSV.
- Recorded unavailable VSL reviewer and unresolved semantic/evaluation gates.
- 134 affected tests pass; no model, runtime, source-media or launcher changes.

## 2026-10-12 - Full ViSign feature and recording-group qualification

- Added isolated offline feature extraction with source receipts, explicit missing
  landmark masks, per-clip quality counts and exclusive artifact publication.
- Added verified feature review, conservative connected recording groups and unfrozen
  development split proposals; no inferred signer independence or training approval.
- Extracted and verified all 824 clips; documented missing-hand and source-frame
  problems, review artifacts and recovery. 113 affected tests passed.
- Preserved source videos, pinned models, production dependencies, camera UI and launcher.

## 2026-10-12 - Immediately available VSL RGB dataset acquired

- Downloaded and hash-verified public ViSignLanguage-Video; all8,364 video entries decode.
- Indexed100 labeled classes,2,776 unique training sequences; prepared25-word/824-video
  pilot with duplicate aliases and conflicting labels excluded, without a claimed split.
- Documented source-folder leakage, Vietnamese CSV corruption, missing signer IDs and
  measured landmark availability. No production code/dependency/model changes.

## 2026-10-12 - Offline candidate segment preparation

- Added VSL-GH candidate review CLI with pinned metadata-blob validation, source-wide
  leakage/conflict exclusion, explicit duplicate aliases and repeated-gloss segment IDs.
- Generated a 25-gloss review index; semantic/media approval and training remain pending.
- Documented the schema, actual VSL400 applicant fields and public-data limitations.
- Preserved source data, models, runtime dependencies, camera UI and launcher.

## 2026-10-11 - Reproducible VSL data qualification

- Added offline Multi-VSL/VSL-GH audit CLI and tests for label conflicts, signer and
  recording leakage, exact feature duplicates, quarantine and safe report publication.
- Checked actual public video/landmark samples and recorded 25-word candidate coverage.
- Documented source acceptance blockers and prepared local dataset access-request text.
- 60 affected tests pass; shell smoke passes after resolving sandbox access on rerun.
- No training, production model/dependency, API, camera UI or launcher changes.

## 2026-10-11 - Realtime feasibility and dataset qualification

- Recorded explicit authorization for the 20-30-sign topic-free realtime direction.
- Measured a local incremental landmark prototype against pinned features; subsecond
  physical end-to-display behavior remains unverified.
- Audited project videos/archives and public Multi-VSL/VSL-GH metadata. No additional
  usable local labeled dataset found; documented access and annotation issues.
- Added docs/REALTIME_RECOGNITION_FEASIBILITY.md and updated canonical handoff.
- No production runtime, model, dependency, API, UI or launcher changes in this step.

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

## 2026-10-10 - Phase 3A persistent recognition runtime

- Replace normal per-request process execution with a lazy persistent isolated
  worker; cache verified providers and reset MediaPipe tracking between recordings.
- Add worker-v2 handshake and strictly correlated, bounded JSONL frames. Prediction
  requests accept IDs only; trusted paths are supplied at process startup. Preserve
  v1 single-use compatibility and existing data/preprocessing/provider contracts.
- Own the Windows venv launcher and actual interpreter with a kill-on-close Job
  Object, assigned before the suspended process resumes. Stop/reap on cancellation,
  timeout, crash or protocol corruption and restart on the next request.
- Close idle and active workers from server/job/CLI teardown. Do not report cancelled
  when process cleanup could not be verified. Bound input writes and diagnostics.
- Report live-worker exit status as null, not a fabricated successful process exit.
  Add local cold-start/provider-load/cache/feature-parity diagnostics.
- Local warm totals: W00395 5309.367ms versus 10438.971ms; D0098 4997.572ms versus
  8953.338ms. Exact W00395 numerical parity. Final real cancel 47ms, shutdown 187ms.
- Verification: 168 backend tests; 8 local browser regression tests plus a final real
  two-topic rerun; real parity/memory/lifecycle checks and headless shell exit 0.
  Frontend source, durable frontend tests and build untouched. No new dependency,
  training, provider expansion, hardware work, packaging or release.

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

## 2026-10-10 - Phase 2 desktop recognition vertical slice

- Integrate manifest-backed do_vat videos into Studio Dataset using existing One UI
  cards/controls; show dataset label separately from real top-k model scores.
- Add six authenticated ID-only recognition routes and a bounded in-memory job
  service: one concurrent worker, session ownership, queue limits and immutable results.
- Extend Phase 1 with optional real process cancellation; own job shutdown in bridge
  lifespan and desktop shell. Preserve existing offline API and model contracts.
- Add abortable polling, retry recovery, availability/error states and duplicate guards.
- Verify real W00395 through Studio/API/isolated worker, cancellation, clean shutdown,
  port release and ML-free collector; add focused backend/API/browser regression tests.
- Keep preview deferred and all other topics, training, camera/sensor recognition,
  persistent workers and Phase 3 outside this delivery. No dependency changes.

## 2026-10-10 - Phase 1 offline recognition provider boundary

- Add versioned FeatureSequence, PredictionResult and ModelDescriptor contracts;
  retain Phase 0A preprocessing ID and register only the verified do_vat GCN.
- Resolve recognition samples through Phase 0B recording/topic membership, preserving
  provenance and topic-local label IDs without changing manifest or sensor catalogs.
- Add offline service/CLI and bounded single-use JSON subprocess worker using the
  existing isolated ML environment; check source/model/video identity and mappings.
- Reject invalid contracts, artifacts, responses and process failures; preserve UTF-8,
  separate native diagnostics from protocol stdout and reap timed-out children.
- Verify 89 affected tests, three real service samples and the actual CLI. W00395
  reproduces historical scores; this is regression evidence, not accuracy evidence.
- Document configuration, contracts and next scope gate. No UI, bridge, acquisition,
  hardware, runtime dependency or launcher change; Phase 2 is not implemented.

## 2026-10-10 - Phase 0B offline KVSL manifest importer

- Add a standard-library Python module/CLI reading pinned local Git objects, with
  exact CSV/label-map/video provenance and no network or ML dependency.
- Preserve Vietnamese labels and topic-local indices; deduplicate original recording
  identities and recording/topic memberships while retaining all original CSV rows.
- Report unknown metadata, missing assets, content duplicates and unreferenced videos
  explicitly. Reject conflicting labels, malformed maps/CSV and unsafe filenames.
- Publish deterministic JSON atomically without overwrite; identical reruns are no-ops.
  Document schema, commands and recovery in `docs/DATA_SCHEMA.md`.
- Verify 34 tests and real metadata import: 187 rows -> 169 recordings / 175 memberships.
  Phase 0A inference was not rerun; UI, bridge, dependencies and sensor paths are unchanged.

## 2026-10-10 - Isolated KVSL Phase 0A feasibility evidence

- Record the user's sole-primary KVSL decision and PASS WITH FIXES for the do_vat GCN.
- Recover actual checkpoint/videos from pinned upstream Git history after Drive 404s.
  Verify one real sample and 20 unique original videos with strict checkpoint loading,
  exact preprocessing parity and final child exit 0; do not interpret matches as accuracy.
- Keep scripts, artifacts, locked contract, logs and isolated ML environment under ignored
  .design-cache/kvsl-phase0a/. No application source, desktop dependency or UI change.
- Document unresolved LSTM 40/60 mismatch, unknown split/licensing and proposed Phase 0B.
  Existing gates remain unchanged; Phase 0B is not implemented.

## 2026-10-05 - Slightly quicker accepted capsule motion

- After the user accepted the corrected motion and requested a small speed increase,
  shorten opening from 640ms to 540ms and closing from 520ms to 440ms (~16%).
  Preserve the same curve, content handoff and production time-unit fix.

## 2026-10-05 - Fix production capsule flashing

- Fix CSS duration parsing: production minification converts 640ms to .64s, while
  WAAPI requires milliseconds. Handle both units before starting the animation.
- Replace front-loaded springs with 640/520ms smoothstep motion; preserve current
  shape/content and reduce partial-reversal duration without an instant snap.
- Add rendered travel regressions for both stylesheet and second-valued durations.
  Production WebView2 confirms ~376ms open/~316ms close 10-90% travel. Prior result
  was rejected by the user; this corrected result still awaits review.

## 2026-10-05 - Live status capsule motion from supplied recording

- Refine the header Live Status capsule using motion.mp4: width leads height,
  restrained spring settling, sequential text, and distance-aware reversals.
- Use 460ms open / 380ms close as desktop adaptations; preserve clipping, text size,
  telemetry, focus, reduced motion and existing compact/expanded geometry.
- Verification and the pending visual gate are in docs/WORK_SESSION_HANDOFF.md.

## 2026-10-04 - Personal profiles, role clarity and continuous interaction pages

- Add self-service profile/avatar editing for all four roles, including Participant.
  Persist full name, contact email and organization/team without changing the session.
- Normalize PNG/JPEG avatars server-side with Pillow; remove metadata and support removal.
  Add transactional schema-2 migration with a SQLite backup of existing v1 identities.
- Show actual role permissions in Account and user management; explain immediate session
  revocation when changing a role. Preserve final-administrator and backend RBAC checks.
- Replace double-frame entrance/timer unmount with one reversible 400/320ms page animation;
  preserve clipping, content, focus and reduced motion without scaling text.
- Locate the exact font download link from live Figma Welcome node 4:47. Embedding remains
  pending verified permission; no Samsung binary or replacement icon was added.
- Actual tests, native 125% evidence and unresolved font/DPI limits are in the handoff.

## 2026-09-28 - Interaction refinement and consistent circular icons

- Preserve the accepted desktop scale; scrolling tabs clear the menu and utilities
  without moving the workspace. Notification also follows centered gutters on resize.
- Use a single reversible 400ms-open/320ms-close notification timeline, sequential
  text handoff, continuous rounded clipping and a focus outline on the morphing surface.
- Opening the drawer collapses notification to its live capsule beneath the scrim;
  capsule interaction is inert until the drawer closes, with drawer focus preserved.
- Give Raw Signals checkbox hover/focus 8px scroll clearance. Replace L/R boxes with
  stable Left/Right text across Devices, Monitor, Simulator, Statistics, Studio and status.
- Following user correction, remove the title hand and mixed 3D artwork. Search,
  Studio workflow and Dataset reuse exact Figma glyphs with consistent circular surfaces.
  Search browse now exposes the results-region ID referenced by its input.
- Verify the accepted source checkpoint with SHA256/CRC. Current visual acceptance is
  still open; tests, native DPI coverage and review artifacts are recorded in the handoff.

## 2026-09-27 ? Comprehensive One UI system standardization

- Fixed notification text escaping the shrinking surface; geometry now reverses from
  the displayed frame, clips throughout motion and rests at 32px inside a 44px target.
  Telemetry remains live; Pause/Mark, Escape and header keyboard order are preserved.
- Compact status hover retains its semantic surface; Search has one rounded focus owner,
  including Account filtering. Underline form fields and approved desktop scale remain.
- Standardized shared spacing, headings, surfaces, disabled/readable states and tooltips.
  Devices removes duplicate channel count/dividers; Monitor retains chart priority with
  compact legends; Simulator, Studio, Account and Search use consistent bounded layouts.
- Notification Center separates active attention from session history; existing actions,
  real data, permissions and functionality remain unchanged.
- Added three focused Playwright regressions. Vitest 26/26, build, interaction checks and
  launcher smoke pass. 144 viewport states plus final Account refresh and native PyWebView
  125% reviewed. No detected Axe A/AA violations in the final scan sets. Windows physical
  DPI 100%/150% remain unverified; user visual acceptance is pending.

Verified backup: `backups/SmartGlove-PRE-ONEUI-SYSTEM-20260927-204731.zip` (229 entries, per-file SHA256/CRC).
Before/after images, 28.4s interaction clip, detailed limits and provenance:
`docs/WORK_SESSION_HANDOFF.md` and `docs/ASSET_INVENTORY.md`.

## 2026-09-27 — Overlay navigation and coherent One UI refinement

- Desktop navigation now slides over stationary content, with outside/Escape dismissal,
  focus containment and current-destination focus. Narrow windows retain the bottom dock.
- Shared tab selection moves continuously; interrupted peer transitions continue from
  the current presentation. Drawer and interaction pages use the shared Samsung basic
  transform curve; reduced motion disables travel. Existing desktop scale is retained.
- Monitor uses exact equalizer_2 (341:16); Studio uses the existing labs pair
  (340:8858/8859); Quick Status uses speed (340:8580). No hand-drawn replacement assets.
- Snackbar uses a raised, readable surface on the black canvas; keyboard focus is more
  restrained. Studio empty states consistently use existing semantic Figma glyphs.
- Simulator has a bounded two-pane form/current-configuration composition. Statistics
  shows the two real sources using existing cards and key/value rows. Offline/disconnected
  rates are unavailable rather than stale; cumulative counters retain their meaning.
- Consolidated Simulator layout rules into device-layout.css, removing conflicting
  historical overrides. Backend, launcher, dependencies and design references are unchanged.

Figma gate passed before edits. Verified source checkpoint:
`backups/SmartGlove-PRE-OVERLAY-COHERENCE-20260927-194108.zip` (249 entries, SHA256/CRC).
Build, 26 unit tests, launcher smoke, 38 main and 5 focused runtime checks passed.
14 Axe states: 0 detected WCAG A/AA violations; 0 browser errors. Full evidence, known
verification limits and archive SHA256 are in docs/WORK_SESSION_HANDOFF.md.
User visual review is pending.

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

# Changelog

## 2026-10-14 - Camera tracking and performance diagnostics

- ViSign Auto now draws the existing MediaPipe pose/hand output over the mirrored
  camera, preserving source aspect ratio and reporting left/right hand presence.
- Added measured camera FPS, tracking FPS, frame RTT and worker processing time.
  RTT includes frame encoding and processing, not network-only ping. Missing/stale
  diagnostics show a dash; overlay clears when Auto/camera stops or replies stall.
- Reuses the isolated detector and model; no new dependency, dataset or launcher change.
- Verified70 frontend tests,94 affected Python tests, production build,14 browser
  cases and launcher smoke. Physical webcam alignment/performance remains user review.

## 2026-09-11 — Secondary interaction pages

- Search, Quick Status and Create Account now use a shared app-local page layer with Back/Escape, focus return, retained underlying state and reversible reduced-motion-aware transitions. No modal scrim or body scroll lock is acquired.
- Create Account retains the existing API, validation, password visibility and One UI role selection; its form uses a bounded content surface and deliberate header/field spacing.
- Refreshed Quick Status's exact Figma SVGs: `info_outline` 340:8901 and `info` 340:8902. Existing closed/open selection remains intact.
- Security activity hides native scrollbar chrome while retaining scrolling and keyboard access. Device actions use 46px page/42px local scales; simulation inputs and Apply use 46px with distinct numeric widths.
- TypeScript no-emit and modified CSS parsing passed. Runtime/visual verification is delegated to the user; no application launched.

## 2026-09-10

### Refined — Figma component conformance and reusable One UI primitives

- Converted Studio/Search from mostly screen-local styling to shared coded One UI primitives mapped to the existing Figma catalog: Card `245:399`, Search `1497:12549`, Selection Menu `1497:12842`, Top Navigation `1549:2831`, In-App Navigation `1495:9649`, App Dock `1491:8142` and Floating Toolbar `1495:11133`.
- Added reusable `OneUICard`, `OneUIEmptyState`, `OneUIKeyValueList`, `OneUISelectionMenu`, `OneUISearchField`, `OneUISelectField`, `OneUITopNavigation`, `OneUIAppDock` and `OneUIUtilityToolbar`; Studio, Search and shell navigation now consume these components instead of duplicating their anatomy.
- Normalized shell surfaces to the One UI token palette (`#010102`, `#17171A`, `#2E2E30`, `#F1F1F3`, `#FCFCFF`, `#EAEAEA`, `#387AFF`) while preserving the approved Samsung Health-inspired ambient treatment and scroll-revealed utility pill.
- Made Studio contextual navigation and the four-destination dock more compact/content-focused; inactive primary actions now read as disabled rather than active blue. Search now uses the exact Figma search SVG and shared search/selection surfaces.
- Performed a bounded English normalization in the touched shell/chart/shared-control paths. Legacy auth/account strings outside this pass remain for a later dedicated glossary sweep.
- Final TypeScript no-emit check passed. Full Vite build was not claimed because the uploaded Windows `node_modules` still lacks Rollup's Linux optional native package. Actual-source SSR/Chromium review renders were generated under `.design-cache/figma-conformance-pass1/review/`.

### Implemented — Studio and global Search frontend foundation

- Added Studio to the existing floating dock with Overview, Dataset, MediaPipe,
  Train, Evaluate and Translate contextual sections. New UI is English and uses
  existing One UI surfaces/controls with honest empty and readiness states.
- Added editable in-memory setup drafts, distinct sensor/MediaPipe provenance
  types and combined-input references. No camera, import processing, ML runtime,
  training, inference or new backend/dependency is implemented.
- Added global Search for actual frontend devices/channels, app destinations and
  existing actions, including keyboard results navigation and empty future categories.
  Search uses the existing scroll-revealed utility pill and closes before handing
  focus to a result. Account opens the existing account sheet for non-admin collectors;
  user administration remains administrator-only.
- Reused the approved shell/chart behavior; DeviceManager, LiveMonitor, SensorChart,
  acquisition and launcher source are unchanged. Added only the exact Figma Search SVG.
- The single TypeScript check failed on Windows module casing ambiguity between
  `Studio.tsx` and `studio.ts`. Renamed the type module to `studioModel.ts` and updated
  imports afterward. No second check, build, runtime or visual verification was run,
  per the user's single-check limit. Final source awaits external sandbox verification.

### Changed — 2026-09-09 floating bottom navigation overlay refinement

- Converted the Direction B bottom app navigation from a dedicated grid/footer row into an absolute floating pill over the continuous page canvas.
- Removed dock backdrop blur and the separate footer-band impression; the dock now uses its own opaque-tonal surface, border and shadow while content remains visible around/behind it.
- Added bottom scroll breathing room so final content can still be brought above the overlay without reintroducing a distinct footer layer.
- Preserved app-level navigation semantics, current destinations, responsive widths, keyboard behavior and the approved selected-state treatment.


## 2026-09-09

### Implemented — bounded user-feedback navigation/motion refinement, awaiting visual approval

- Clarified two-level navigation semantics, replaced contextual/utility icons with exact indexed One UI Figma SVGs, balanced bulk action proportions and the simulator configuration grid.
- Added Samsung-Health-reference scroll-linked Monitor header collapse: Dataset Studio fades away, the contextual category bar recedes, and theme/status/account utility actions consolidate into one pill while connectivity/SIM status stays separate.
- Reworked the collapsing Monitor header onto the same continuous canvas as the scroll content: the content now travels underneath the sticky controls, a masked blur/fade softens the top edge, and the former opaque compact-header colour seam is removed.
- Raw Signals keeps internal scrolling while hiding the visible scrollbar across standards/WebKit/legacy scrollbar properties.
- TypeScript compile and real-source sandbox visual runtime passed without page/console errors. Vite/Vitest are not reported as passing because the uploaded Windows dependency tree lacks the Linux Rollup optional native package.
- Evidence is under `.design-cache/sandbox-user-feedback/review/`; no backend/protocol/launcher change, push, merge or milestone expansion.


### Implemented — full One UI visual-system refinement, awaiting explicit user visual approval

- New user attachment `0bd30823-fc7c-44c0-a322-bf006bca9409` authorizes the reusable
  system and both Device Manager/Live Monitor. Live authentication, exact-file
  metadata and actual design context for `wzEFGRLl9MU1nB1JxUSyhD` passed before edits.
- Consolidated shared button/field/segmented, shell, feedback and overlay rules;
  unified card/title tokens while preserving the current Direction B composition.
  Monitor now shares Quick Status/Now Bar, compact controls and semantic status.
- Device flex bars show actual available samples and missing/offline states.
  Charts show time/raw axes, stable per-channel colors and L/R solid/dashed legends;
  paused/explored time windows survive theme changes. Acquisition remains independent.
- Fixed snackbar viewport overflow, action-hover contrast and landmark semantics;
  dialog confirm buttons retain their accessible names despite decorative CSS.
- Raw Signals now has one internal scrolling region; keyboard focus on the first
  and last channels keeps the panel visible, including tablet layouts.
- Final build and Vitest 17/17 passed; targeted real-bridge Playwright 5/5 passed.
  Both screens/themes at 1440×900, 1280×720, 800×1100 and 640×450 reviewed. Axe reports
  zero violations, with contrast/Quick Status manual-review targets retained.
  Direct shell smoke and final-build launcher smoke exited 0. Full historical E2E
  suite was not run. Exact evidence and limitations: `docs/WORK_SESSION_HANDOFF.md`.
- No backend/protocol/dependency/launcher/reference asset change or release action.
  Current downloaded folder has no local `.git`; preservation uses the 132-file
  pre-edit snapshot and per-file no-index diff rather than the unrelated parent repo.

### Implemented — Device Manager Stage1 fidelity, awaiting user visual approval

- Final authorized recovery captured actual Python smoke exit0, then one isolated Edge
  preflight passed. Final production-preview targeted E2E6/6 passed, one worker/trace off.
- Device Manager8states:0axe violations/incomplete. Now Bar16combinations/3728frames
  preserve geometry/acquisition with no transient scrollbar. Ten app images and native
  source comparison refreshed; unaffected build/unit/launcher results reused explicitly.
- No source edit or rebuild in final continuation. Checkpoints/prior inconclusive result
  preserved; two historical pre-edit gaps and human review remain documented. Stage1
  only; user visual approval required before Monitor/Account/auth/overlay rollout.

### Bounded recovery — smoke result inconclusive

- Goal BLOCKED after three resumed turns at the consumed one-smoke authorization gate;
  recorder repaired, but another app/browser attempt still requires user direction.
- Recorder-only follow-up: ignored replacement captured synthetic PowerShell exits0/7
  and both streams correctly (2/2). Original logs retained; no application/browser
  retry. This repairs observation only, not proof of environment recovery.
- Verified a separate53-file current-state checkpoint; original pre-stage1 archive
  unchanged. Clean config baseline recovered, new design-rules prior absence recorded;
  two exact pre-edit historical gaps remain (runtime test and asset inventory).
- One isolated direct smoke completed but its recorder lost the child exit code;
  empty streams/wrapper exit0 are not a pass. Persistent evidence and handoff updated.
  No browser/E2E retry or source changes. Stage1 remains incomplete; recovery unproven.

### Checkpoint reconciliation — verification remains stopped

- Updated portable handoff with actual terminal results and retained final build.
  Direct smoke failed with Argon2 memory allocation error; later launcher smoke
  exited0. Final browser run failed during axe; no final-source pass inferred.
- Documented partial10/14 recovery coverage and exact remaining bounded verification.
  Reconciliation changed documentation only; no browser/smoke/security-setting changes.

### In progress — source-grounded One UI9 Device Manager fidelity

- Added source-linked design contract and recorded user's geometry-unfreeze authorization.
- Applied draft container/button/field anatomy and typography to Device Manager;
  replaced compressed simulator band with grouped responsive fields. Device-only shell
  variant aligns title, palette and navigation without redesigning other screens.
- Unit17/17 and build passed. Production preview test configuration added using existing
  Vite; browser/visual verification in progress. User visual approval is still required.

## 2026-09-08

### Implemented — V.3 production standardization (awaiting visual approval)

- Bounded Edge recovery succeeded; one font diagnostic isolated font-dependent legend
  line boxes. Explicit line-height restores compact channel panel 469.19→467.78px
  against frozen 467.8px without changing Segoe UI, font size or assertions. Removed
  temporary diagnostic code; retained checkpoint and diagnostic evidence.
- Added direct pending-label fit/geometry regression. Corrected selected/pressed
  foreground contrast to 5.03:1 light / at least 6.39:1 dark, preserving selected state,
  focus and primary-action distinction. Now Bar stays 400×60/520×325 over 3065 frames.
- Full E2E once: 24/28 before contrast fix (three contrast failures, one missing RAM
  contact capture after worker restart). Final affected/evidence run: 17 selected,
  saved status passed/no failures; complete six-image/one-video output. No full rerun
  or claim of final-source full pass. Unit 17/17 reused, final build passed, both smoke
  paths exit 0, protected comparison and diff check passed with documented copy-only
  api.ts exception. No dependencies/backend/launcher/rollback changes.
- Native-resolution image review complete. Human playback, screen-reader speech and
  native-window visuals remain unverified; product visual approval belongs to user.

### In progress — V.3 verification checkpoint

- Standardized connection/recovery copy without changing REST/WebSocket or auth logic.
  Unit tests 17/17, production build (51 modules), dependency tree and diff check pass.
- All-size Now Bar measurements retain 400×60 / 520×325 in both themes, with zero
  transient scrollbar frames. Expanded reversal and effective-200% checks passed before
  the final copy edit. Compact channel panel still differs by +1.39px from frozen geometry.
- Stopped browser checks after Edge `browserContext.newPage` timed out at 30000ms,
  followed by context-close timeout. No retry loop or system-setting changes. Full V.3
  E2E, smokes and final review imagery/video remain unrun. V.3 is not implemented-complete.
- Extended recoverable checkpoint to 24 entries; protected comparison 177/178 unchanged,
  with the sole api.ts difference proven to be the generic error sentence only.

## 2026-09-07

### In progress — V.3 production visual, controls and writing standardization

- Measured and corrected Now Bar pause/resume height growth and transient scrollbar:
  chart status reserves intrinsic space; native scrolling remains for constrained height.
- Added frame-based pause/resume regression and separate V.3 evidence/checkpoint location.
  Initial targeted checks pass 2/2; later all-size pause/reversal/200% checks pass.
- Standardized shared pending/pressed/selected treatment, dialog label/focus anatomy,
  native role fields, auth heading spacing, and user-facing copy. Actual mixed-font
  diagnostics led to a React-only system Segoe UI preference; no assets/dependencies added.
- Compact channel font geometry and remaining final verification are still in progress;
  the latest targeted run was 5/7, not a full-suite pass. See handoff for exact findings.

### Implemented — production One UI alignment and approved A.1 Now Bar (awaiting visual approval)

- Integrated the accepted capsule/card hierarchy into the real React runtime, without
  copying the synthetic HTML page. Removed expansion glyphs and redundant statistics;
  retained live source/rate truth, contextual chart/navigation actions, Notifications
  through Quick Status, the single chart-pause state and uninterrupted acquisition.
- Kept the production same-surface anchor, scroll/focus/dismissal/handoff lifecycle and
  accepted 240/140ms motion. Fixed first-frame percentage-width resolution, interpolated
  rate letter spacing on reversal, provided contained short-viewport scrolling and
  corrected the activity container's dialog semantics.
- Shared typography now uses the existing licensed DM Sans 600 subsets, readable
  supporting labels and regular field values. Quick Status, Account, auth, user
  management, dialogs and Notifications reuse the same bounded changes. Auth gradient,
  existing icon family, semantic colors, terminology and all frozen geometry remain.
- Figma authentication was blocked, then resolved by user reconnect. Actual whoami and
  design context/screenshot for `wzEFGRLl9MU1nB1JxUSyhD` / `1491:6362` succeeded;
  previously completed family reads were retained. Node/official Samsung provenance,
  desktop adaptations and all 15 changed files are listed in `docs/WORK_SESSION_HANDOFF.md`.
- Final Vitest 17/17, build (51 modules), dependency tree and both PyWebView/SkipBuild
  smokes passed. The one full E2E run was 23/27 before final line-height/test fixes;
  final affected/evidence run passed 13/13. No final-source full-suite pass is claimed.
  Compact simulator/metric drift was corrected without relaxing geometry assertions;
  dialog measurement now waits for opening scale. All 308 recorded numeric layout
  fields match baseline; auth contrast minimum 5.1657:1; protected hashes 187/187 match.
- Six current production review images, one 5.04s WebM, diagnostics and the recoverable
  15-entry checkpoint are in `.design-cache/artifacts/production-one-ui-alignment/`.
  Historical evidence/prototype files were not overwritten. Automated optional video
  playback validation timed out; normal-speed human motion review, NVDA/Narrator and
  user production visual approval remain unverified. No backend/dependency/launcher/
  hardware or later-phase work was introduced; Python tests were not run.

## 2026-09-06

### Implemented — P.2.1.3 anchored Now Bar overlay morph (awaiting P.2.1 visual approval)

- Recorded the user's visual rejection of the P.2.1.2 inline expansion and superseded
  only that expanded presentation. The collapsed Now Bar remains the first normal-flow
  item in `.app-content` and scrolls away naturally; expanding morphs the same DOM
  surface from its exact collapsed bounds into a shallow anchored overlay while a
  collapsed-size placeholder preserves all underlying page coordinates.
- The overlay locks the internal scroll root and makes page siblings inert, traps focus,
  supports header/Escape/transparent-outside-click dismissal and reverses to the anchor
  without scroll or focus jumps. It can cover page content but remains below the frozen
  Top App Bar, rail and bottom navigation. There is no dim, blur, portal, duplicate
  surface, animation loop or new dependency.
- Preserved runtime reducer/RBAC/lifecycle, real telemetry and source metrics, the single
  App-owned chart-pause state, acquisition/counter continuity and atomic Notification
  Center handoff. Quick Status, Account and the theme control close the activity overlay
  before taking ownership; frozen shell/chart/command geometry remains unchanged.
- Reopened only the official Samsung pages listed in the reference audit and applied
  their bounded hierarchy, depth, accessibility, writing and motion rules. Samsung does
  not specify exact Now Bar anatomy or expansion behavior. The one allowed current Figma
  context request failed because the tool was unavailable, so exact expanded anatomy and
  Figma-authored motion remain `UNVERIFIED`; prior live node data supports only the
  compact anatomy/proportions/states.
- Final checks passed: Vitest 17/17; TypeScript/Vite production build (51 modules);
  affected P.2.1 Playwright 4/4; one full Playwright run 26/26 in 3.7 minutes; direct
  PyWebView, desktop-collector and `run_app.ps1 -SkipBuild -SmokeTest` paths exit `0`;
  `npm ls --depth=0` clean.
  `git diff --check` exits `0` with the existing LF→CRLF notices, and the protected
  prototype diff is empty. Python tests were not run because no Python/backend source
  changed.
- Evidence contains exactly one 1440×900, 25fps WebM plus two final stills at 1440×900
  dark and 800×1100 light under
  `.design-cache/artifacts/product-p2-1-3-anchored-overlay/`. Both stills were inspected
  at original resolution. Normal-speed human playback of the WebM and real
  NVDA/Narrator remain `UNVERIFIED`; P.2.1 still awaits explicit user visual approval.

### Implemented — P.2.1.2 Now Bar semantic interaction (awaiting P.2.1 visual approval)

- Replaced the conceptually dropdown-like Now Bar details with one semantic live-activity
  disclosure. The entire collapsed header is a real button exposing `aria-expanded` and
  `aria-controls`; activating it expands the same in-flow container without navigation,
  menu/listbox semantics, a portal or JavaScript layout measurement.
- The collapsed surface shows the truthful live status, `Live telemetry`, sensor-receive
  state, connected-source count and aggregate sample rate. The expanded surface adds
  current per-source status/rate, received/lost packet totals, chart state and only the
  existing `Open Monitor`, chart pause/resume and Notification Center actions.
- Added a 240ms shared-container grid/shape transition using the existing V.2 motion
  tokens, with a short detail fade/6px settle and immediate state update. Reduced motion
  removes positional/shape interpolation and keeps focus/semantics intact.
- Preserved P.2.1.1 normal-flow scrolling, the single App-owned chart-pause state,
  acquisition/counter continuity, atomic Notification Center focus return, RAM-only
  activity lifecycle/RBAC and frozen shell/chart/command geometry. Expansion state is
  component-local and is not persisted.
- Targeted reducer Vitest passed 5/5 and TypeScript check passed. The single full
  Playwright run passed 25/25 before a later targeted lifecycle check exposed a real
  Notification Center scroll jump; the final fix preserves the expanded allocation
  while the bar is suppressed. The final source then passed Vitest 17/17, production
  build (51 modules), all affected P.2.1 browser scenarios 3/3, and direct PyWebView/
  retained-build launcher smokes. The full suite was not rerun, honoring the one-run
  limit. Python tests were not run because no Python/backend source changed.
- Responsive/reduced-motion/disclosure checks passed at 1440×900, 1280×720 and
  800×1100. Exactly three final screenshots are retained in
  `.design-cache/artifacts/product-p2-1-2-shared-activity/`; P.2.1 remains awaiting
  explicit user visual approval and real NVDA/Narrator output remains unverified.

### Corrected — P.2.1.1 Activity lane scroll (awaiting P.2.1 visual approval)

- Confirmed that the regression came from placing the activity lane in a separate shell
  grid row outside the application's internal `.app-content` scroll root. The lane
  therefore remained under the Top App Bar while Live Monitor scrolled beneath it.
- Moved the unchanged activity lane to the first normal-flow child of the internal scroll
  root and reduced the shell grid to the existing Top App Bar/content/navigation rows.
  Top App Bar, rail, compact bottom navigation, card/chart and command geometry remain
  unchanged; runtime activity, notification/focus and chart/acquisition behavior were not
  modified.
- Reverified the Samsung gate from the two user-specified official entry points. Exact
  inspected URLs and the bounded rule applied from each remain recorded in
  `.design-cache/artifacts/product-p2-1-alignment/REFERENCE_AUDIT.md`. Samsung does not
  document exact Now Bar anatomy or fixed-versus-flow behavior; those details remain a
  five-node live-Figma adaptation.
- Full Vitest passed 17/17; TypeScript/Vite production build passed; affected P.2.1
  Playwright passed 2/2; direct PyWebView and retained-build launcher smokes exited `0`.
  The one allowed full Playwright run passed 23/24 and exposed a stale one-shot scroll
  reset race; after making that test helper wait for layout stability, the failed command
  geometry scenario passed 1/1. The full suite was intentionally not rerun.
- Automated top/middle/lower checks passed at 1440×900, 1280×720 and 800×1100. Exactly
  two current screenshots are retained in
  `.design-cache/artifacts/product-p2-1-1-scroll/`. P.2.1 still requires user visual
  approval; real NVDA/Narrator output remains unverified.

### Corrected — P.2.1 Figma/Samsung alignment (awaiting visual approval)

- Recorded the user's rejection of the initial P.2.1 visual evidence: the fixed Now Bar
  covered readable content, copy was over-localized and the approved V.2 mint status
  chips had been flattened. The earlier `product-p2-1/` evidence is historical only.
- Used live Figma design context for nodes `1491:6362`, `620:1523`, `1003:13022`,
  `744:3668` and `247:613`, plus relevant official Samsung One UI structure/app-bar/
  depth/motion guidance. The pre-edit MATCH/ADAPTED/INVENTED/MISMATCH audit is stored in
  `.design-cache/artifacts/product-p2-1-alignment/REFERENCE_AUDIT.md`.
- Replaced adaptive fixed overlay/scanning with a flow-owned activity lane immediately
  below the frozen 76px Top App Bar. Restored tonal mint `Bridge online` and `SIM 2/2`
  chips and adopted the documented controlled hybrid English/Vietnamese glossary.
- Preserved the runtime reducer, lifecycle, role filtering, actions, atomic side-sheet
  transition, chart-only pause, acquisition/counters and frozen component geometry.
  No backend, dependency, capture, later product phase or protected prototype changed.
- Final checks pass: targeted Vitest 14/14, full Vitest 17/17, TypeScript/Vite build,
  targeted Playwright 1/1, final full Playwright 23/23 with one worker/trace disabled,
  direct PyWebView and retained-build launcher smokes, and clean `npm ls --depth=0`.
  The first full browser run exposed four stale absolute-Y assertions (19/23); after
  normalizing only the approved 80px flow offset, targeted review passed 4/4 and the
  final full run passed. Exactly four current images plus concise audit/verification
  records are in `.design-cache/artifacts/product-p2-1-alignment/`.

### Implemented — P.2.1 Runtime Activity (awaiting visual approval)

- Added a typed, RAM-only runtime activity reducer (maximum 50 items), Now Bar and
  role-aware Notification Center with unread/read/dismiss/clear lifecycle. State resets
  on logout, session invalidation, user change and app exit; no browser/SQLite persistence,
  backend contract, dependency or audit-feed reuse was added.
- Connected existing bridge, resync, packet-loss, device/simulator and administrator
  operation signals. Actions use only existing callable paths or truthful navigation.
  The running label is `Đang nhận dữ liệu cảm biến` and does not imply dataset capture.
- Lifted chart pause into one App-owned state while preserving chart-only pause,
  acquisition/counter continuity and frozen control geometry. Quick Status transitions
  atomically into Notification Center; only snackbar operation feedback live-announces.
- Added adaptive fixed-overlay collision/safe-area placement for chart/device controls,
  uPlot content, navigation and modal actions, plus targeted reducer/store/Playwright tests.
- Verification passed: targeted Vitest 12/12, full Vitest 17/17, targeted Playwright
  1/1, full Playwright 23/23, TypeScript/Vite build, direct PyWebView shell smoke,
  retained-build launcher smoke and clean `npm ls`. `git diff --check` exited `0` with
  existing LF-to-CRLF warnings. Python was not rerun because no Python/backend changed.
- Early browser attempts exposed host resource pressure. The final P.2.1 scenario uses
  the real setup/session paths but performs Argon2id bootstrap before browser startup;
  it and the final full suite passed without changing production security parameters.
- Exactly four final images plus a concise manifest/verification report are stored in
  `.design-cache/artifacts/product-p2-1/`. Automated browser/visual inspection is
  complete; explicit user visual approval and human NVDA/Narrator remain pending.

### Approved — One UI V.2.1 / P.1 visual baseline

- Recorded the user's explicit final visual approval of the current One UI V.2.1 / P.1
  implementation. The approved scope includes the current auth atmosphere/composition,
  complete `Tài khoản` rail label, Account, Quick Status and Create/Edit User sheets,
  sheet opening/settling behavior, navigation and represented responsive behavior.
- Closed the V.2.1/P.1 visual-approval gate and retained the current implementation as
  the approved visual baseline; no additional visual refinement or redesign was requested.
- This gate-closing task changes documentation only. V.2.1 source, tests, config and evidence
  remain unchanged; F42/F43/F44 remain frozen and human NVDA/Narrator spoken-output
  verification remains unverified.
- Documentation verification: `git diff --check` exited `0` (with the existing
  LF-to-CRLF normalization warnings); all six source/test hashes listed by the V.2.1
  manifest match their recorded post-implementation values. No product suite was rerun.
- M1.1 remains open solely on its documented Phase E cleanup approval/completion gate.
  P.2, V.3, Phase E and M2 were not started.

## 2026-09-05

### Implemented — One UI V.2.1 (awaiting user visual approval)

- Restored the recovered V.1 auth wash as a noninteractive pseudo-element, expanded
  only the rail label's internal available width, and implemented immediate shared
  sheet mounting/focus with a 100ms visible settle. Existing exit handling remains.
- Vite build and diff whitespace check pass. Targeted browser testing proved local
  Account/Quick Status mounting before the first frame, opacity 1 and modal/focus
  readiness with API requests blocked (12 openings each).
- User resolved the specification error: preserve measured 54×62 targets, not 54×50.
  Assertions/docs now reflect this; rail 88px, icons 24px and 1260px threshold remain.
- All seven required contrast categories pass both themes across the full wash;
  minimum is 5.17:1. Axe violations are zero; pseudo-element contrast incomplete
  targets remain documented with manual color-envelope and screenshot review.
- Corrected auth theme-tooltip alignment to prevent 11px compact horizontal overflow,
  without changing the control or auth composition.
- Full Vitest 11/11, full Playwright 22/22, final targeted 2/2 + 2/2 and structural
  tests 3/3 pass; final build and shell/SkipBuild smoke pass. Geometry: 268 numeric
  values unchanged from V.2. Protected manifests 12/12 match. Python suite not rerun
  because this change is frontend-only. Evidence: `.design-cache/artifacts/one-ui-v2-1/`.
- No backend, authentication policy, acquisition, dependency, launcher or rollback
  changes. Human AT and explicit visual acceptance remain unverified; no P.2/Phase E.

### Implemented — One UI Visual + Motion Integration V.2

- Resolved or explicitly accounted for all 40 Class A/B findings from the V.1 audit:
  21 `CHANGED`, 17 `VERIFIED_PRESERVED` and 2
  `DEFERRED_WITH_EXPLICIT_REASON`. The two deferred records are the real-screen-reader
  portions of F39/F57; browser semantics and revocation behavior are implemented, but
  no human AT pass is fabricated.
- Added semantic surface/content/status/icon roles, a 100/140/240/360ms motion scale,
  Samsung Basic Path transform easing and directional opacity roles. Preserved neutral
  canvases, near-black primary actions and the non-color L/R plus solid/dashed contract.
- Standardized related-sheet and blocking-dialog depth, explicit opening/open/closing
  lifecycles, interruption-safe cleanup and post-exit focus restoration. Snackbars now
  have deterministic action/dismiss/timeout policy, hover/focus pause, persistent error
  behavior and no layout shift.
- Normalized Vietnamese copy across collector/auth/account/admin surfaces; added a
  bounded desktop auth composition and wide admin list/audit allocation while retaining
  compact DOM/focus order, canonical roles and all auth/RBAC/API behavior.
- Closed every retained V.1 axe target at source. The final all-severity inventory over
  eight contexts has zero violation and zero incomplete node. Added forced-colors and
  grayscale rules/evidence; danger and L/R tonal contrast now exceed 4.5:1.
- Preserved F42/F43/F44, the 76px app bar, 1260px rail switch, 900px chart switch,
  effective-200% behavior, rail/bottom navigation, device/chart/simulator allocations
  and exact 209×60 / 88×48 / 107×48 chart-control geometry within 1px rounding.
- Verification: Python `63 passed`; Vitest `8 passed`; Vite production build;
  Playwright `21 passed`; PyWebView, PySide, default, `-SkipBuild` and `-Legacy` smokes;
  healthy dependency trees; zero-unmapped selector audit; disclosure/hash/checkpoint/
  process/scope checks. No dependency, backend, acquisition, launcher, asset or rollback
  change belongs to V.2.
- Evidence, 40-row ledger, token/glossary/motion/accessibility/geometry reports,
  same-scale contact sheets and clean captures are retained at
  `.design-cache/artifacts/one-ui-visual-motion-v2/`. Status: implementation complete;
  awaiting explicit user visual approval. P.2 and Phase E remain locked.

### Implemented — Product Phase P.1 local persistence, authentication and RBAC

- Recorded the user's explicit approval of D.2.6 Stage 2B.3.1 and froze the approved
  design foundation. The pre-P.1 checkpoint at `.design-cache/backups/pre-product-p1/`
  saved 41 exact files and reconstructed all 41 byte-for-byte; its design manifest
  hashes the shared tokens/motion and One UI component/CSS baseline.
- Added a small explicit SQLite identity repository outside the Git tree with schema
  version 1, deterministic/idempotent migration, foreign keys, WAL, transactional
  writes, UTC timestamps, opaque IDs, clean shutdown and fail-closed startup handling.
- Added maintained `argon2-cffi>=25.1,<26` as the only P.1 production dependency.
  Argon2id uses `m=19456,t=2,p=1`, unique salts, a 12-character minimum and 1,024-byte
  maximum; successful login supports rehash upgrades.
- Implemented atomic first-administrator setup, generic login failures, account-bound
  bounded backoff, hashed opaque server sessions, 8-hour absolute/30-minute idle
  expiry, rotation/revocation, forced password change, final-active-administrator
  protection and credential-free security audit events.
- Preserved the RAM-only bridge token as a separate layer. Protected REST and telemetry
  WebSocket paths now additionally require a valid user session and backend role;
  exact Host/Origin and mutating-request CSRF checks remain. Logout, password/role
  changes and account disable revoke sessions and close affected sockets.
- Added responsive setup/login/forced-password/account/participant-access screens and
  administrator-only searchable user management with create/edit/activate/deactivate,
  reset, revoke, confirmations, status labels and auth audit. Existing Device Manager,
  Live Monitor, two-source simulator, 13 channels and pause/follow/zoom behavior remain.
- Added [`docs/AUTH_PERSISTENCE.md`](docs/AUTH_PERSISTENCE.md) as the sole new P.1
  canonical document; updated product/architecture/tracker/startup records without
  introducing participant collection, dataset, search/history, notification, AI,
  BLE/Android, Recorded Playback or Phase E cleanup.
- Verification passed: Python `63 passed` (one known Starlette `httpx` deprecation
  warning); Vitest `8 passed`; production Vite build; Playwright `13 passed` in 2.4
  minutes; direct PyWebView, default `-SkipBuild`, `-Legacy` and direct PySide smokes;
  `npm ls --depth=0`; `uv pip check`; 131-class dead-selector audit with zero unmapped;
  disclosure/database scan; protected hashes; and final diff/process checks.
- Light/dark and responsive evidence for setup, login/error, forced password, account,
  admin list/create/edit/pending/success/destructive confirmation, participant access
  and preserved collector states is retained under `.design-cache/artifacts/product-p1/`.
- Status: `Product Phase P.1 implemented — persistence, authentication and RBAC are
  functional end-to-end; existing acquisition behavior and PySide rollback are retained;
  awaiting user review before P.2.`

## 2026-09-04

### Corrected — Phase D.2.6 Stage 2B.3.1 stable pause/resume command geometry

- Kept both `Tạm dừng biểu đồ` and `Tiếp tục biểu đồ` in the pause/resume button's
  intrinsic layout. The inactive label now uses `visibility: hidden` with
  `aria-hidden="true"`; the existing icon slot remains fixed, with no hardcoded width,
  JavaScript text measurement, truncation, toolbar redesign or new button primitive.
- Extended the existing Playwright suite with two pause/resume cycles at 1280×720
  light/dark, 1024×768 and 800×1100. Command-group, pause/icon, restore, selector,
  chart-card and plot-host measurements are identical in all five sampled states
  (maximum delta `0 CSS px`), while acquisition continues and accessibility,
  keyboard order, follow-live/zoom, all 13 channels, Quick Status, responsive
  navigation and reduced motion remain covered.
- Verification passed: Vitest `5 passed`; Vite production build; Playwright `12 passed`
  with trace disabled; direct PyWebView and `run_app.ps1 -SkipBuild -SmokeTest` exits
  `0`; 102-class selector audit with one uPlot runtime allowlist entry and zero
  unmapped classes; `git diff --check`; dependency/protected-file hashes unchanged.
- Source CSS is 1,070 lines/45,264 bytes (+3/+156 from Stage 2B.3); production CSS/JS
  are 44,753/290,591 bytes (+136/+229). Required measurement JSON, state captures and
  four manually reviewed same-scale outlined contact sheets are retained at
  `.design-cache/artifacts/m1.1-ui-d2-6-stage2b3-1/`.
- Status: `D.2.6 Stage 2B.3.1 implemented — awaiting final user visual approval;
  design-system freeze and Phase E remain locked.`

### Implemented — Product Foundation P.0 launcher and durable context

- Switched root `run_app.ps1` from `app.desktop_collector.main` to
  `app.desktop_collector.shell` by default. Normal launch validates the repository
  Python 3.12 environment and existing web dependencies, runs `npm run build`, keeps
  the terminal attached and returns the child exit code without PySide fallback.
- Added `-SkipBuild` for a validated existing production bundle, `-Legacy` for the
  unchanged PySide rollback entry point, and `-SmokeTest` for bounded default/legacy
  startup verification. Existing `-NoAutoConnect` remains available with `-Legacy`.
- Added [`docs/PRODUCT_CONTEXT.md`](docs/PRODUCT_CONTEXT.md) as canonical product intent
  and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) as the implemented/planned/pending
  architecture boundary. They record one progressively integrated product with no
  user-selectable Demo Mode and the provisional P.0–P.10 roadmap.
- Updated only the launch instructions and canonical-document links in `README.md` so
  the operational guide no longer describes PySide as the default.
- Created and validated the byte-exact ignored checkpoint
  `.design-cache/backups/pre-product-foundation-p0/` before implementation. The source
  baseline was `main` at `bf7720825a368b051dee5748f83f487fc8191abc` with the complete
  dirty-worktree inventory retained in its manifest.
- Verification passed: PowerShell parser; build-first, `-SkipBuild`, `-Legacy` and
  `-Legacy -NoAutoConnect` launcher smokes; missing-build guard; direct PyWebView smoke;
  Vitest `5 passed`; Python `42 passed` with the existing Starlette warning; Vite build;
  dependency/protected/checkpoint hashes; `git diff --check`; scope and process audits.
  The ignored production build remains (9 files, 400,543 bytes / about 391.2 KiB).
- No React component/CSS, backend, REST/WebSocket/authentication, acquisition,
  Simulator, PySide/Qt, dependency/lockfile, asset, prototype or Android file was
  changed by P.0. D.2.6 visual approval, design-system freeze and Phase E cleanup remain
  locked; P.1 is a proposal requiring separate approval.

### Implemented — Phase D.2.6 Stage 2B.3 One UI component reuse/adaptation correction

- Replaced the separate 44 px application-status strip plus 64 px title row with one responsive 76 px application-owned Top App Bar. It now groups the page `h1` with a legible 14 px `Dataset Studio` subtitle and keeps Bridge/SIM status, the sole theme control and Quick Status in one trailing cluster; status indicators hide at 900 px and below while remaining available in Quick Status.
- Reused one destination-button implementation for both responsive navigation modes. The exact three-condition rail query and 88 px allocation remain unchanged; the content-hugging rail is now 88×172 with persistent `Thiết bị`/`Theo dõi` labels and a product-owned monitor/waveform glyph. Compact navigation remains mutually exclusive and always shows the same two icons and labels.
- Extended the existing `OneUIButton` primitive with an optional icon slot. The separate chart command group now uses product-owned restore-live and pause/resume glyphs above visible text, while the 5s/10s/30s/60s `OneUISegmentedControl` remains text-only and behaviorally unchanged.
- Adapted anatomy after one focused inspection each of Top App Bar `1495:10992`, Headers `1316:10528`, Navigation Rail `1589:7438`, In-App Navigation `1495:10175`, Floating Toolbar `1495:11133`, Simple Lower Bar `1549:8371`, Status Bar `1491:6323` and Slide Navigation `631:2757`. Status Bar and enlarged Headers were negative references; no generated code, Samsung font/logo/runtime asset or dependency was copied.
- Removed the superseded `.application-status-strip*`, `.one-ui-app-bar*` and rail-tooltip selectors rather than adding another override block. Combined source CSS changed from 1,074 lines/44,640 bytes to 1,067 lines/45,108 bytes (-7/+468); production CSS/JS changed from 44,146/290,224 bytes to 44,617/290,362 bytes (+471/+138). The final selector audit found 100 CSS classes, one expected uPlot runtime class and zero dead application classes.
- Verification passed: Vitest `5 passed`; Vite production build; Playwright `11 passed` with trace disabled for the low-disk environment; Python `42 passed`; PyWebView smoke exit `0`; axe, keyboard, reduced-motion, navigation exclusivity, Quick Status, 13-channel, pause/follow/zoom and effective-200%-zoom gates passed. Dependency manifests and protected user-file hashes are unchanged.
- Final full/focused light-dark captures, native/fixed-scale comparison sheets and layout measurements are retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b3/`.
- Status: `D.2.6 Stage 2B.3 implemented — awaiting user visual approval; design-system freeze and Phase E remain locked.`

## 2026-09-03

### Implemented — Phase D.2.6 Stage 2B.2 bounded component-anatomy correction

- Applied the five confirmed audit corrections without broad redesign: dialogs now use a reusable two-region `DialogActionRow`; chart commands are separated from the four-option time selector; the landscape application rail content-hugs its two destinations; local chrome is explicitly application-owned and contains no fake clock; and the title hierarchy is one `Dataset Studio` identity plus one page `h1` and subordinate context.
- Preserved the approved shell allocations and exact rail query, 54×50 navigation targets, 24 px icons, all 13 channel rows, chart/device/simulator geometry, Quick Status/snackbar/empty-state behavior, L/R labels and solid/dashed series, acquisition, pause, follow-live and zoom semantics.
- Replaced misleading selectors rather than appending an override layer: `.one-ui-status-bar*`, `.one-ui-navigation-rail`, `.one-ui-bottom-navigation`, `.floating-toolbar`, `.live-actions`, `.toolbar-actions`, `.one-ui-dialog__actions` and `.one-ui-dialog__destructive-action` were retired in favor of application-owned navigation/status, live command-group and dialog-action-row vocabulary.
- Combined application CSS changed from 1,069 lines/44,078 bytes to 1,074 lines/44,640 bytes (+5/+562), justified by the reusable dialog action states and safe-area handling. Production CSS/JS changed from 43,619/289,952 bytes to 44,146/290,224 bytes (+527/+272). The selector audit remains clean at 97 classes with 15 uPlot-generated classes allowlisted.
- Verification passed: Vitest `5 passed`; Vite production build; Playwright `11 passed` with axe, keyboard, reduced-motion, 200%-zoom, responsive/anatomy/state and acquisition/chart gates; Python `42 passed`; PyWebView smoke exit `0`; `npm ls --depth=0` clean; dependency manifests and protected user-file hashes unchanged.
- Final light/dark full views, every required focused state, geometry JSON, six required comparison/reference sheets and two manual-inspection boards are retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b2/`. The One UI Design Kit Community file remains a project reference, not official Samsung certification.
- Status: `D.2.6 Stage 2B.2 implemented — awaiting explicit user visual approval`. The design system is not production-frozen and Phase E remains locked.

### Corrected — Phase D.2.6 Stage 2B.1 production states

- Recorded that Stage 2B was accepted only in overall direction, not visually approved, and made no shell, control, overlay, card, chart-layout or breakpoint redesign.
- Content-state mode now unmounts the complete uPlot host and destroys its instance; returning to live data creates one clean instance while acquisition, L/R labeling and solid/dashed series behavior remain unchanged.
- Bridge request failures now discard raw response bodies and expose stable Vietnamese production copy. Disconnect pending state remains connected until resolution, restores the prior connected state on failure, and displays a width-stable spinner plus `Đang ngắt…` label.
- Added store and Playwright regressions for connect/disconnect event ordering, duplicate prevention, sanitized errors, uPlot teardown/recreation, acquisition continuity and artifact-free light/dark state evidence. The test bridge stderr stream is drained to prevent harness backpressure in the expanded suite.
- Combined application CSS is 1,069 lines/44,078 bytes (+6/+122 from Stage 2B); production CSS/JS are 43,619/289,952 bytes (+50/+908). The only inherited unmapped selector found by the audit, `.panel-context`, was removed.
- Verification passed: Vitest `5 passed`, Vite production build, Playwright `10 passed` with axe/keyboard/reduced-motion/state lifecycle gates, and PyWebView smoke exit `0`. Dependency manifests and frozen Stage 1 shell hashes are unchanged.
- Corrected captures and comparison/state contact sheets are retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b1/`; the canonical ZIP SHA-256 is `302ABF34CFFD92B33A608B58C250431B492EAA313319259387911A6B20AED352`.
- Status: `D.2.6 Stage 2B.1 corrections implemented — awaiting explicit visual approval`. Final D.2.6 approval was not claimed and Phase E remains locked.

### Implemented — Phase D.2.6 Stage 2B system overlays and feedback

- Recorded explicit visual approval of the Stage 2A shared controls and kept the approved Stage 1 shell files byte-identical while implementing only the Stage 2B overlay/feedback layer.
- Added grouped `one-ui/overlays.tsx` and `one-ui/feedback.tsx` foundations for a modal adaptive side sheet, confirmation dialog, snackbar, indeterminate progress and in-container state messages. The controls module changed only to consume the shared progress primitive without changing approved control geometry.
- Replaced Quick Status with a 400 px detached right sheet and compact bottom sheet; both use a restrained scrim, independent scrolling, background inertness/scroll lock, trapped focus, Escape/close/outside dismissal and focus restoration. The compact sheet remains above bottom application navigation.
- Added destructive confirmation for one-glove and all-glove disconnect only, with consistent cancel-first keyboard order, a non-color warning mark, duplicate prevention and exactly-once invocation after confirmation.
- Added resolution-driven success/error snackbars for connection, disconnection, bulk and simulator operations, plus real pending indicators and real no-channel/no-source/startup/bridge state messages. No artificial delay, fake percentage or backend contract was introduced.
- Adapted geometry and hierarchy from focused Figma Edge Panels `744:3668`, Notification Header `620:1523`, QS/Notification `1003:13022`, Dialog `632:2006`, dark/light Dialog `1493:8950`/`1493:8968`, Toast `479:8075`, dark/light Toast `479:8074`/`479:8116`, Live Activity `1491:6362` and Containers `247:613`; no generated code, Samsung font/logo/asset or raster was copied.
- Removed superseded quick-panel, close-button, inline-alert and spinner/loading selectors instead of appending an override block. Combined application CSS changed from 895 lines/37,371 bytes to 1,063 lines/43,956 bytes; the production CSS/JS bundles changed by +5,774/+7,318 bytes from Stage 2A.
- Verification passed: Vitest `2 passed`, Vite build, Playwright `9 passed` with mouse/keyboard/focus/inert/scroll-lock/snackbar/duplicate/reduced-motion/200%-zoom/axe gates, Python `42 passed`, and PyWebView smoke exit `0`. Dependency manifests are unchanged and the Stage 2B selector audit found no unmapped classes.
- Final captures and three contact sheets are retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b/`; status is `D.2.6 Stage 2B implemented — awaiting explicit visual approval`. Phase E remains locked.

### Implemented — Phase D.2.6 Stage 2A control foundation

- Recorded explicit visual approval of the Stage 1 shell architecture only and kept `one-ui/shell.tsx` plus `one-ui/shell.css` byte-identical while implementing Stage 2A.
- Expanded the grouped `one-ui/controls.tsx` foundation with compact One UI buttons, icon buttons, inset segmented navigation, labeled shape-distinct status indicators, native numeric fields and checkbox rows. Hover, pressed, focus-visible, disabled and loading-capable states are included without a new dependency.
- Migrated Device Manager actions, simulator inputs and device states; Live Monitor time windows, pause/follow-live actions, all 13 channel rows and chart states; plus the existing theme, Quick Status, Bridge and SIM consumers. Status treatment is predominantly quiet text-plus-shape to avoid competing green pills.
- Removed the superseded `.button`, `.segmented`, `.status-dot`, `.status-pill`, `.input-suffix`, `.channel-toggle` and `.checkmark` application rules rather than adding an override block.
- Adapted structure and interaction principles from Figma Buttons `1497:12222`, Top App Bar `1495:10992`, Slide Navigation `631:2757`, Status Bar `1491:6323`, Live Activity `1491:6362`, Search `1497:12549`, Card `245:399` and Containers `247:613`; no generated code, Samsung font/logo/asset or raster content was copied.
- Verification passed: Vitest `2 passed`, Vite production build, Playwright `7 passed` across the four review sizes with axe/keyboard/reduced-motion/behavior/geometry checks, and PyWebView smoke exit `0`. Dependency manifests are unchanged.
- Final review images and contact sheets are ignored at `.design-cache/artifacts/m1.1-ui-d2-6-stage2a/`.
- Status: `D.2.6 Stage 2A implemented — awaiting explicit visual approval`. Overlays, feedback components, Stage 2B and Phase E remain unstarted.

### Approved — Phase D.2.6 Stage 1 shell architecture

The system status region, application app bar, landscape navigation rail, compact/portrait bottom navigation and responsive shell mode selection received explicit visual approval. This was not final D.2.6 or Phase E approval.

## 0.1.5 — 2026-09-02

### Implemented — Phase D.2.5 refined D.2.3 tablet composition

- Refined the verified D.2.3 full-width shell without restoring the rejected D.2.4 rail or top app bar: `Dataset Studio` remains one text-only identity in a compact 68 px bottom navigation with exactly two destinations, restrained global state, one theme control and Quick Status.
- Rebuilt the responsive geometry around 32 px landscape gutters at 1280 px and above, 24 px tablet gutters from 1024–1279 px, 16 px portrait gutters, a 44/42/40 px title scale and an explicitly reserved navigation safe area.
- Aligned the two Device Manager glove cards to identical dimensions and internal rows, reduced nested surface weight and kept simulator configuration as one secondary horizontal band; the 1024 px layout retains two readable 480 px cards while portrait uses a bounded single-column scroll viewport above navigation.
- Enlarged and equalized both Live Monitor plots while compressing supporting toolbar, metric and channel-control chrome. All 13 channels, statistics, follow-live/zoom, pause-without-stopping-acquisition and non-color L/R solid/dashed distinctions remain intact.
- Applied selectively measured principles from the approved Figma Top App Bar, Card, Containers and Navigation Bar nodes; no Samsung logo, proprietary font, raster asset, generated code or literal Android status/navigation chrome was added.
- Verification passed: Python `42 passed` with the existing Starlette warning; PySide and PyWebView/web-shell smokes exited `0`; Vitest `2 passed`; Vite production build succeeded; Playwright `6 passed` across 1280×720, 1440×900, 1024×768 and 800×1100 with accessibility, behavior, security and geometry gates.
- Final light/dark screenshots, Quick Status views, responsive review sheet and the D.2.3 ↔ D.2.5 contact sheet are ignored under `.design-cache/artifacts/m1.1-ui-d2-5/`.
- Status: `implemented — awaiting explicit user visual approval`. Phase E remains locked; dependencies, backend/acquisition/simulator/contracts, PySide/Qt, launcher, prototypes and production assets are unchanged.

## 0.1.4 — 2026-09-02

### Attempted and rolled back — Phase D.2.4 One UI 8.5 tablet composition

- The adaptive rail/top-app-bar/bottom-navigation composition was implemented and passed its technical suite (`42` Python, `2` Vitest and `6` Playwright tests; both smoke tests and the production build succeeded), but the production visual review rejected it as an inferior tablet composition.
- Preserved the rejected implementation patch and manifest under `.design-cache/backups/d2-4-visually-rejected/`, plus the final D.2.3 ↔ D.2.4 and responsive contact sheets under `.design-cache/artifacts/m1.1-ui-d2-4/`; redundant individual screenshots were later consolidated during authorized repository hygiene.
- Restored only `App.tsx`, `styles.css` and `tests/collector.spec.ts` to the verified D.2.3 baseline. The fresh rollback verification passed `42` Python tests, `2` Vitest tests, `4` Playwright tests, both smoke tests and the production build.
- Fresh D.2.3 rollback screenshots originally confirmed that the composition and interaction shell matched D.2.3; that superseded rollback set was later consolidated into the byte-identical canonical `.design-cache/artifacts/m1.1-ui-d2-3/` evidence.
- D.2.4 — visually rejected; rolled back to the verified D.2.3 baseline. Phase E remains locked while a replacement direction awaits explicit approval.
- No dependency, backend, acquisition, simulator, REST/WebSocket/authentication, PySide, Qt adapter, launcher, prototype or source-asset change was retained.

## 0.1.3 — 2026-08-29

### Changed — Phase D.2.3 brand de-genericization and contrast rhythm

- Removed the generated-looking square `SG` monogram from the React collector taskbar and standalone error state; `Dataset Studio` is now a semantic text-only wordmark with no replacement logo asset.
- Consolidated light/dark switching into exactly one keyboard-accessible taskbar control with a sun/moon action icon, action-oriented accessible name and persisted non-sensitive theme preference; Quick Status no longer contains a second theme control.
- Extended the shared One UI contract with semantic primary-action and inverse-surface tokens. Only `Kết nối tất cả` and simulator `Áp dụng` use black/inverse emphasis; navigation remains blue tonal and disconnect/close/theme actions remain neutral.
- Rebalanced title/body/card line-height, readable measure and semantic spacing without changing application behavior, acquisition or chart implementation.
- Added one intentional inverse simulator band on Device Manager and one inverse sample-rate hero inside Quick Status; Live Monitor stays neutral so the charts remain dominant.
- Expanded Playwright coverage for wordmark semantics, single-theme-control behavior, mouse/keyboard/persistence, light/dark contrast, reduced motion, dock/band/chart geometry, Samsung runtime/bundle exclusion and twelve deterministic review captures.
- Preserved package manifests, production/design assets, backend contracts, PySide rollback path, Qt dependencies and `run_app.ps1`; Phase E remains locked pending direct visual approval.

## 0.1.2 — 2026-08-29

### Changed — Phase D.2.2 Samsung contemporary visual polish

- Polished the React collector against the approved local One UI references and the hierarchy/spacing language of Samsung's official Vietnam and One UI pages without copying website code, imagery or fonts.
- Replaced repeated blue eyebrows, tiny technical labels, nested metric cards and sensor pills with a calmer 40–44 px title scale, readable 11–14 px supporting type, separator-based statistics and one-line sensor summaries.
- Promoted both gloves to hero device panels, made disconnect neutral, expanded the simulator surface and added a low-height 1280×720 layout that keeps every field above the dock.
- Consolidated the Live Monitor summary from five equal boxes into three semantic groups, enlarged channel targets and increased plot height while enforcing chart/dock clearance in E2E.
- Refined the dock into separate navigation/status clusters and rebuilt Quick Status around one primary sample-rate metric, two clear glove tiles and one simulation/theme control row.
- Added a 240 ms transform/opacity exit transition for Quick Status with an immediate reduced-motion path while retaining Escape, outside-click and focus-return behavior.
- Preserved every D.2.1 behavior and dependency boundary; no acquisition, API, WebSocket, uPlot, package, asset, prototype, PySide or launcher change was made.

## 0.1.1 — 2026-08-28

### Changed — Phase D.2.1 One UI Desktop/DeX shell

- Replaced the full-height React navigation rail and large top app bar with a compact floating bottom taskbar that keeps Device Manager and Live Monitor identifiable by icon, text, shape and `aria-current`.
- Added an authenticated-state-safe Quick Status panel for bridge/session state, both gloves, aggregate sample rate, simulator configuration and theme without exposing or persisting the session token.
- Added keyboard focus, Escape/outside-click dismissal, focus return, reduced-motion behavior and a viewport-aware chart safe area so the taskbar does not cover chart axes or controls.
- Rebalanced the collector canvas for 1280×720 and 1440×900 while preserving all acquisition, pause, chart, device and simulator behavior.
- Added the collector/desktop/mobile adoption matrix and exact provenance for the existing One UI settings icon; no source asset was copied or modified.
- Kept Phase E, default launcher, PySide rollback UI, Qt dependencies, backend contracts and all post-Milestone-1 features unchanged.

### Changed — Phase D.2 shared One UI foundation

- Added the minimal shared visual contract at `app/frontend/shared/one-ui/`: semantic light/dark tokens, motion/reduced-motion values and adoption/provenance documentation.
- Made the React collector the reference consumer through one exact Vite alias while keeping all collector components, behavior and backend boundaries unchanged.
- Added frosted-surface fallback and reduced-transparency tokens for the One UI 7 Desktop/DeX shell; no master SVG or vendor CSS enters the runtime bundle.
- Inspected OneUI-Web at pinned MIT commit `b20b1dd7b4094e2c501a6d9712d1c8f2fc77a52f`; adopted only the documented cubic easing value and no dependency/source tree.
- Preserved both user-owned prototypes and added no Python/npm dependency, component placeholder or asset copy.

### Changed — Phase D.1 visual realignment

- Realigned the React collector shell against the two approved local One UI SVG references: detached rounded navigation rail, tonal selection pill, rounded Top App Bar, secure bridge Now Bar, enlarged headers and floating Live Monitor toolbar.
- Replaced the generic dashboard palette/geometry with a named light/dark token layer for canvas, containers, tonal states, accessible filled accents, typography, spacing, radius, elevation, focus and reduced motion.
- Preserved all Device Manager and Live Monitor behavior while increasing control targets, softening card/table hierarchy and retaining non-color `L`/`R` plus solid/dashed trace cues.
- Added deterministic 1280×720 and 1440×900 light/dark review captures, horizontal-overflow assertions and a runtime-resource assertion that excludes the two giant design SVGs.
- Added exact asset provenance at `app/desktop_collector/web/src/assets/one-ui/ASSET_USAGE.md`; no production asset was copied or modified.

### Added

- Framework-neutral acquisition callbacks, bounded display cursors and a temporary Qt signal adapter.
- Loopback-only FastAPI REST/WebSocket bridge with dynamic port, RAM-only session token, exact Host/Origin validation and authenticated telemetry.
- PyWebView shell with idempotent shutdown; PySide remains the default launcher pending Phase E approval.
- React 19 + TypeScript + Vite collector at `app/desktop_collector/web/` with Device Manager and Live Monitor parity for two gloves and all 13 channels.
- One UI light/dark tokens, direct read-only asset alias, DM Sans/Segoe UI fallback, keyboard focus and non-color L/R differentiation.
- Python security/lifecycle tests, Vitest store tests and Playwright integration, stress, accessibility and visual review tests.

### Preserved

- `run_app.ps1`, PySide UI, Qt adapter/dependencies and existing frontend prototypes remain in place; no Phase E cutover or cleanup was performed.

### Not included

- Serial, firmware, protocol v1, Data Capture, dataset persistence, filtering and ML remain out of scope.

## 0.1.0 — 2026-08-28

### Added

- Python 3.12/PySide6 foundation tại `app/desktop_collector/`.
- Domain models và transport-neutral `DataSource` interface.
- Deterministic two-glove simulator với seed, noise, packet loss và `simulated=true`.
- Threaded acquisition, rolling buffer và realtime statistics.
- Device Manager và Live Monitor với One UI light/dark design.
- Gesture catalog schema, validator và test.
- Windows launcher, project manifest, data directory policy và Milestone 1 documentation.
- Unit, stress, startup, accessibility token và visual screenshot tests.

### Not included

- Firmware, protocol v1, CRC32, Serial/COM và legacy adapter thuộc Milestone 2.
- Data Capture, Calibration, Dataset Browser, Filter Preview và model training.

## 2026-09-09 — Shared shell collapse and tooltip layering

- Standardized the scroll-linked Dataset Studio/header/context collapse across Device Manager, Live Monitor, and Account.
- Normalized collapse travel for short pages so Device Manager can reach the same compact shell state without artificial content.
- Fixed utility tooltip stacking/offset so theme/status/account labels no longer sit behind the contextual top bar.
- Added the Account overview anchor used by contextual navigation.

## 2026-09-09 — Brand fade and utility tooltip overlay refinement

- Removed the Dataset Studio brand from flex reflow during shell collapse so it remains a single line at every scroll position and only fades/translates.
- Kept the green live dot attached and fully visible throughout the fade sequence.
- Extended the brand fade travel for a more gradual Samsung Health-like disappearance.
- Restyled utility labels as floating tonal pills that intentionally overlay the contextual top bar rather than being pushed into a detached lower row.

## 2026-09-10 — Figma normalization continuation
- Replaced temporary derived navigation-state SVGs with exact One UI Figma exports (`apps_outline`, `settings`, `sound`).
- Added exact state pairs `device/device_outline` and `contact/contact_outline` for Devices/Gloves and Account navigation instead of custom outline approximations; Quick Status now uses exact `info/info_outline`.
- Replaced the hand-authored auth eye glyph with exact Figma `password_show/password_hide` assets and removed the remaining generated-looking square auth product mark in favor of text-only SmartGlove identity.
- Refined custom One UI select/dropdown popup styling against Figma nodes `1497:12842` and `1497:11901`; normalized the auth card radius to the Figma Card `245:399` 28 px container language.
- Preserved existing approved composition and isolated remaining icon fallbacks where no semantically appropriate exact outline/filled pair was found.

## 2026-09-10 — Auth V2 underline sign-in + Figma inventory
- Auth V2 center-lock refinement: forced the login header/copy/body to span the full card width so `Sign in`, the eyebrow, description, form column and CTA share the exact horizontal center while Username/Password labels remain left-aligned inside the 392 px credential column.
- Review-only source harness measurements at 1440×900 confirm title-center and form-center deltas are both `0 px` in light and dark modes. Full Vite build remains blocked in this sandbox because the packaged `node_modules/vite` payload is incomplete; no dependency or production runtime contract was changed.
- Reworked the login-only credential fields from generic pill inputs to a Samsung-style underline treatment while preserving the existing One UI card and Figma-grounded accent CTA.
- Centered the login heading/description within the card and constrained the credential column for stronger optical balance.
- Added a local-only `Remember username` control using the existing shared checkbox primitive, restyled as the circular checked state shown by Figma Shape `1549:8505`; only the username is stored, never the password or session token.
- Kept first-run administrator setup and password-management forms on the existing shared pill field until separately reviewed.
- Added `docs/FIGMA_IMPLEMENTATION_INVENTORY_20260910.md` after a read-only scan of all top-level Figma pages plus deep review of App Components/System UI and the relevant icon catalog.
- Confirmed the Figma kit does not expose a generic underline text-field component in the App Components inventory; the underline auth field is therefore a bounded product adaptation to the user-approved Samsung Account desktop/mobile pattern.


## 2026-09-10 — Shell fade, Selection Menu, and Studio icon pass
- Recorded user approval of the centered Auth V2 baseline; underline Username/Password fields and centered sign-in copy remain locked for the login screen.
- Added a subtle bottom-edge content fade to the shared shell so content eases beneath the floating dock, complementing the existing top fade without creating a heavy vignette.
- Refined Selection Menu / Drop Down surfaces against live Figma nodes `1497:12842` and `1497:11901`: 28 px translucent blurred containers, clearer optional menu title, plain-vs-rich row density, and a quieter selected-row treatment.
- Added exact Figma Studio contextual icon pairs for Overview, Dataset, MediaPipe, Train, Evaluate, and Translate, and replaced the remaining settings-outline fallback with exact `340:8609`.
- Preserved routes, page composition, Devices/Monitor behavior, and milestone boundaries.
