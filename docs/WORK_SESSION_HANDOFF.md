## 2026-10-19 - Published847b4c3; Windows checkout integrity fix

Pushed847b4c3cd755289d7a7ea7778bb9b77740182048 to HFuoc/SignFlow main.
GitHub run39172240708 installed desktop/worker dependencies but failed asset
verification: Windows Git converted a hash-pinned reference JSON to CRLF.
Added.gitattributes disabling text conversion for the recognition bundle and
WebM demo. Kept all original model/reference hashes; did not weaken verification.
Next push reruns clean-install CI. Goal is not complete until fresh setup passes.

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

## 2026-10-19 - Webcam result path fixed for explicit completion/diagnostics

Latest priority supersedes more FPS tuning: user needs useful webcam recognition,
reports both incomplete/missing-hand and uncertain/outside-vocabulary notices.
No user failure clips are available. Do not claim model accuracy has been fixed.

Delivered and built:
- Auto has Recognize now while moving/ending. A segment-specific request travels
  with the next fresh frame; no worker restart, clip encoding or frame queue.
  Gap/max-duration/hand-coverage checks and acceptance thresholds are preserved.
- Auto rearms after500ms of absent hands following completion/timeout; previously
  lowering hands could leave TCN/VideoMAE permanently waiting for tracked stillness.
- TCN/VideoMAE rejected results show3 actual model candidates labeled unconfirmed,
  native outside-vocabulary status, threshold (TCN), frame count and hand coverage.
  They are not accepted words. Missing/incomplete input still emits no guesses.
- Capture rejection now shows its reason instead of an empty prediction heading.
  Finish capture is available on all manual providers. Defaults/launcher unchanged.

User test: restart run_app.ps1 -> Studio -> Dataset -> Live Camera -> TCN25+OTHER.
Start camera -> Auto on -> perform ONE listed sign -> press Recognize now immediately
when finished (before the5.5s cap). Inspect Sign not confirmed / Closest supported
signs and Capture details if rejected. Lower hands or hold still before the next
sign. If onset never starts, Auto off -> Capture sign -> perform after countdown
-> Finish capture. The reference vocabulary must match the selected model.

Changed files (scoped snapshots/diff in .design-cache/recognition-result-20261019):
- recognition/streaming.py, stream_worker.py, gh_tcn_provider.py, videomae.py,
  service.py under app/desktop_collector/: explicit endpoint, rearm and diagnostics.
- web/src/cameraStream.ts, LiveCamera.tsx, Recognition.tsx, api.ts under the same
  app directory; cameraStream.test.ts and new Recognition.test.ts.
- web/tests/stream-camera.spec.ts: real-worker explicit-boundary regression.
- tests/test_recognition_stream.py, test_recognition_gh_auto.py,
  test_recognition_gh_tcn.py, test_recognition_videomae.py.
- PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
  docs/DATA_SCHEMA.md, SESSION_LOG.md, WORK_SESSION_HANDOFF.md.

Verification actually run:
- Full affected pytest (recognition glob + test_vsl_gh_experiment.py, unique system
  TEMP --basetemp):365passed,2existing deprecation warnings,47.61s.
- npm.cmd test -- --run:84passed. Production npm.cmd run build:passed after TS
  fixture correction; existing >500KB bundle warning. No new dependencies.
- Playwright stream-camera.spec.ts -g "TCN manual finish", ignored config in the
  evidence directory:1passed, real isolated TCN/bridge, capture boundary reaches
  classifier and3 displayed candidates match worker scores. Axe passed; rendered
  1440x900/1280x720/820x1180, light theme. Bridge clean shutdown asserted. Runner
  exited0 after stopping only its lingering Vite PID28616. No physical camera.
- run_app.ps1 -SkipBuild -SmokeTest:default account storage failed sandbox access;
  rerun with unique process-local LOCALAPPDATA in system TEMP passed (exit0).
  Actual user's persistent account startup is not verified by that isolated smoke.
- Final targeted pytest after diagnostic-test/message review:29passed (GH Auto
  and VideoMAE); final Recognition.test.ts rerun:3passed. Scoped22-file comparison
  reviewed against before snapshots; no added trailing whitespace. Git metadata
  is absent, so Git diff/check/status could not run. UI evidence visually inspected
  at1280x720 and820x1180; no new dark-theme review or complete browser suite.

Evidence: browser/manual-result.json and three screenshots. Input was retained
Chao RGB (different vocabulary),33frames,2/3 hand coverage, OTHER0.959321.
Supported alternatives BAC-SI0.040389/DAU0.000288/ROI0.000000946 remain rejected.
This confirms score visibility and correct outside handling, NOT correct known-word
webcam recognition. No recorded physical-camera test, new GH RGB positives,
multi-user test, retraining or threshold recalibration. No raw footage saved.

Next gate/risks: use actual known-word webcam attempts to distinguish missing input,
bad boundaries, wrong native winner and correct-but-rejected words. Multiple users
are required; personalized memorization is not the project target. Candidate
visibility is a diagnostic improvement, not accuracy. GH source semantics and
60FPS remain unverified/unmet. A recognizer may still be unsuitable despite this
usable testing path. Do not mark the accuracy gate or default-model cutover passed.
Git status/diff/check unavailable(no.git); preserve unrelated files and launcher.

## 2026-10-19 - Tracking optimization integrated;60FPS and physical gate still open

User authorized implementation and clarified the troublesome posture: edge of the
hand facing the camera. Runtime changes now exist; the preparation-only entry
below is historical. Do not restart the same investigation or claim60FPS achieved.

Delivered:
- CpuHolistic uses pinned existing models/thresholds/smoothing with2XNNPACK threads.
  Execution-only parity:750frames,2250groups, identical presence/coordinates.
- TCN Auto adds current-frame palm recovery tied to visible current pose wrists.
  Searches cool down100ms after failure; successful recovery continues fresh
  inference per frame until primary recovery/failure. No held/interpolated hands.
  Reject ambiguous identities, duplicates and nonfinite/out-of-frame landmarks.
- Explicit TCN stream preprocessing suffix `-stream-palm-recovery-v2`; Capture,
  frozen weights/normalization/threshold and default provider are unchanged.
- Fresh-video wakeups, existing single-frame backpressure/pause timeout, extra
  timing diagnostics. Added Camera quality choices1080p(default),720p,540p, each
  requests60camera FPS. Actual rate/dimensions and tracking FPS remain distinct.
- UI reuses OneUISelectField (catalog1497:11901/1497:12842), no new dependencies,
  assets, Figma-reference edits or launcher cutover.

Test workflow: restart run_app.ps1 → Studio → Dataset → Live Camera → TCN25+OTHER.
Before Start camera choose Camera quality. Compare1080p with720p, then540p if
latency remains high; lower resolution can lose finger detail. Enable Auto, test
edge-on and palm-facing motion, compare Tracking FPS, Frame RTT and missing hands.
Stop camera before changing quality. All modes request60fps; none guarantees it.

Final offline evidence `.design-cache/tracking-20261019/summary.json` and
`worker_compare.json`:25clips750source frames,625warm frames. Mean worker time
34.078→25.010ms (~36%more worker throughput), p9536.314→42.714ms due to recovery.
Worker-only inverse mean29.34→39.98FPS, NOT webcam FPS. Hand slots1202→1217/1500;
any-hand frames688→689/750.15final results remain rejected and10clips have no
final boundary. No successful-known-word accuracy claim. Source replays are
retained data, not independent user captures. Primary graph parity is exact;
secondary recovery intentionally changes features and has not passed webcam validation.

Changed source/tests:
- new recognition/tracker.py; recognition/stream_worker.py, streaming.py;
  server/recognition_stream.py (timing only; authentication still every frame).
- web/src/camera.ts, cameraStream.ts, CameraTracking.tsx, LiveCamera.tsx;
  camera.test.ts, cameraStream.test.ts; web/tests/stream-camera.spec.ts.
- new tests/test_recognition_tracker.py.
- PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md;
  docs/DATA_SCHEMA.md, SESSION_LOG.md, WORK_SESSION_HANDOFF.md.

Protected scope/remaining risks:60FPS is unmet. No new training/default-model
switch, no raw dataset changes or physical camera capture. Original GH RGB and
label semantics, multi-user/unknown-word accuracy remain open. Current-frame
recovery can increase p95 latency and still miss edge-on hands/occluded fingers.
Camera quality reductions need real-camera coverage comparison; browser fixtures
are upscaled prerecorded clips, not sensor tests. Next gate is sustained physical
camera evaluation at the selected quality, including crossed/occluded hands,
idle/unknown rejection and fresh tracking cadence. Do not tune thresholds from it.

Git checks unavailable(no.git); scoped snapshots/diff review under
`.design-cache/tracking-20261019/before/`; review diff at `final.diff` in that folder's
parent. No added trailing whitespace was found in the scoped comparison.

Verification supplement (resumed session):
- `npm.cmd test -- --run`:78passed; `npm.cmd run build`:passed with the existing
  >500KB chunk warning. Latest production build includes camera-quality controls.
- `run_app.ps1 -SkipBuild -SmokeTest` via PowerShell ExecutionPolicy Bypass:passed.
- Playwright `stream-camera.spec.ts -g "TCN tracking uses fresh"` using ignored
  `.design-cache/tracking-20261019/playwright.config.mjs`:1passed, all3qualities,
  real isolated worker/authenticated bridge, ordered fresh frames and tracked
  hands. Captured1440x900,1280x720,820x1180 real-app screenshots. Light theme only;
  no new dark-theme/Axe or complete browser suite run. Vite PID29088 lingered after
  test completion; stopped only that owned PID and runner exited0. Bridge clean
  shutdown assertion passed. No physical camera activated.
- Browser evidence `browser/tracking.json`:12s measurement per profile, software
  browser rendering, prerecorded human clip padded/upscaled as a camera fixture.
  1080p:90frames,7.57freshFPS,meanRTT131.36ms;720p:160frames,13.30FPS,74.20ms;
  540p:186frames,15.46FPS,63.98ms. Worker means29.14/26.39/27.89ms respectively.
  These measure fixture/renderer+transport+worker and are NOT physical camera
  limits or a60FPS result. Capture-to-reply timing excludes sensor exposure.
- First3quality run failed because Auto restarted before native worker teardown;
  the test now clears prior replies, waits for socket closure and1.5s teardown
  between profiles. Rapid restart can still report `stream_busy`; wait roughly
 2seconds after Auto off/Stop camera before enabling Auto again. This behavior
  was observed and not hidden by changing ownership/security rules.
- Final `.venv/Scripts/python.exe -m pytest tests/test_recognition*.py
  tests/test_vsl_gh_experiment.py --basetemp=<unique-system-TEMP> -q` (PowerShell
  expanded the recognition glob):353passed in56.13s,2existing Starlette/AnyIO
  deprecation warnings. Includes recovery identity/freshness/cooldown, stream
  preprocessing version, bridge security, worker cancellation and process cleanup.

## 2026-10-19 - NEXT SESSION: tracking60fps target + horizontal-hand detection

Latest user priorities supersede further model/threshold tuning as the next task:
tracking FPS is low, it lags fast movement, and horizontal hands often disappear
despite the user's reported1080p/60fps camera. Pursue60fresh tracker outputs/sec
and improved detection continuity. This session prepares the handoff only; no
optimization has shipped and60fps is not promised or measured as achieved.
Assume the newly integrated TCN Auto for the initial baseline, but establish the
actual provider/camera settings when reproducing. Exact horizontal pose is unknown.

Confirmed code observations:
- web/src/camera.ts requests ideal1920x1080/60fps; actual camera cadence must be measured.
- web/src/cameraStream.ts already negotiates MAX_FPS60 but serializes capture,
  pixel extraction, transport and acknowledgement. Initial15fps value is replaced
  by negotiated60; merely changing that initializer is not a demonstrated fix.
- Full1080p RGBA is8,294,400bytes/frame,497,664,000bytes/sec at60fps before copies.
- recognition/stream_worker.py runs Holistic complexity1 for every frame and
  resizes TCN input to360x360 only after transmission. Camera1080p is therefore
  not the hand detector's actual input resolution in this path.
- TCN inference runs only after movement ends; distinguish it from tracker time.
- Existing quality fields include decode_ms/tracking_ms/processing_ms. Browser
  telemetry separately measures camera FPS, tracker replies and frame RTT.

Next-session workflow (proposed implementation choices, user-authorized objective):
1. Record a sustained warm baseline on the real runtime with actual camera FPS,
   fresh tracker FPS, capture-to-overlay age, p50/p95 stage latency, drops and
   CPU/GPU utilization. Existing4-frame synthetic trace is NOT a benchmark.
2. Identify dominant costs before changes. Compare reduced copying/transfer,
   model-appropriate input size and bounded latest-frame scheduling. Preserve
   original coordinates, timestamps, identity, backpressure and shutdown security.
3. Evaluate hand-focused detection/tracking/ROI and acceleration actually supported
   by this Windows runtime. Do not assume NVIDIA hardware means MediaPipe uses CUDA.
   Keep needed shoulder/pose and left/right landmarks; compare with frozen GH137
   normalization/weights. Tracker/input changes may shift classifier features.
4. Reproduce arms extended horizontally, in-plane hand rotation, edge-on palms,
   fast motion and occlusion separately. Measure per-hand missing-frame fraction,
   reacquisition delay and jitter, plus downstream Auto boundary/prediction effects.
5. Report before/after on identical inputs and sustained real camera conditions.
  60fps means fresh computed tracking updates, not60fps preview or interpolated
   skeletons. Current serial path would need roughly16.7ms total per update;
   pipelined throughput and end-to-end age must be reported separately.

Do not weaken unknown rejection, silently change training preprocessing, swap
default models or claim webcam accuracy. Original RGB/semantic verification is
still open. No saved user webcam failure clips are known to exist; ask for concrete
reproduction inputs only when needed, not generic permission to start authorized work.

Changed this turn: PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md. Runtime/UI/models unchanged.
Checks: read-only code and prior synthetic telemetry inspection; no new tests or
camera benchmark run. Git checks unavailable(no.git); scoped snapshots and inspection
receipt at.design-cache/tracking-priority-20261019/. Prior passing test results below
belong to the previous integration, not a performance claim for this session.

## 2026-10-18 - TCN Auto and landmark references ready for experimental testing

Latest user asked how to perform signs without references and requested Auto.
This supersedes the earlier Capture-only restriction. Delivered final-only TCN
Auto through the existing authenticated RAM-only stream and a separate25-item GH
landmark replay catalog. No original human GH video was obtained; do not call
these replays verified VSL instruction. Human semantics/video verification remains open.

Workflow: restart run_app.ps1 → Studio → Dataset → Live Camera → TCN25+OTHER.
Landmark replay → select word → Replay reference (0.5× slow option). Start camera
→ Auto on → one complete sign → hold still about0.5seconds → wait for result.
Auto off permits manual Capture/Finish capture. All frames remain local.

Changed source/tests:
- recognition/stream_worker.py, streaming.py: GH137 streaming, frozen model/native
  threshold, final-only decisions, provider-specific validation and hand tracking.
- recognition/references.py: separate allowlisted GH replay IDs, manifest/media hashes.
- new app/desktop_collector/vsl_gh_reference_media.py: train-only source-verified renderer.
- web/src/LiveCamera.tsx, CameraTracking.tsx, ReferenceVideo.tsx, api.ts, cameraStream.ts.
- web/src/cameraStream.test.ts, web/tests/camera.spec.ts;
  tests/test_recognition_gh_tcn.py; new tests/test_recognition_gh_auto.py.
- PROJECT_CONTEXT, PROJECT_MILESTONE_TRACKER, CHANGELOG; docs SESSION_LOG,
  WORK_SESSION_HANDOFF, DATA_SCHEMA, ASSET_INVENTORY, VSL_MULTIUSER_DATASET_REVIEW.

Checks actually run:
- pytest tests/test_recognition*.py tests/test_vsl_gh_experiment.py using a unique
  system-TEMP base:341passed in70.59s,2existing warnings. Targeted23also passed.
- npm.cmd test -- --run:74passed. npm.cmd run build:passed, existing chunk warning.
- run_app.ps1 -SkipBuild -SmokeTest via PowerShell process ExecutionPolicy Bypass:
  passed with latest production build. Launcher itself unchanged.
- Playwright camera.spec.ts -g "TCN capture":1passed; two real-worker synthetic
  captures, actual GH media playback, authenticated TCN Auto with tracking/no false
  word for fake no-hands frames.1440x900/1280x720/820x1180 screenshots and Axe passed.
  Runner required stopping its lingering Vite PID31800; then exited0. Bridge exit
  assertion passed. No physical camera/accuracy test or complete browser suite run.
- Render decode verification:25clips/731frames,768x720 each,5,878,353bytes total.
- Git checks unavailable: no.git metadata. Scoped before snapshots/diff in cache.
  Scoped diff reviewed; added-line whitespace passed. Final25 pinned references and
  copied source license verified; test Vite port5173 released.

Assets:.design-cache/gh-landmark-references-20261018-v2/ with SOURCE_LICENSE.txt.
Manifest2288fd61f6656abc5338a37d9e9db2161589724d043845b84412e51408e5fd05.
Every reference records source train signer/segment/frame boundaries, Git blob and
segment SHA256. Runtime files remain optional and hash checked; do not clean this
folder or the pinned background-run1 checkpoint/normalization. Draft v1 unregistered.

Limits: original RGB not acquired; source sign semantics/identity/timing unverified;
landmark detail cannot fully demonstrate palm orientation/facial expression. Auto
boundary accuracy and generalization to new people/idle/unknown remain unverified.
Do not claim successful integration improves accuracy or establishes90%webcam.
Next gate is human-reference verification and multi-user physical-camera evaluation,
before any default-model cutover. Default model and dependencies unchanged.
Evidence:.design-cache/gh-tcn-auto-20261018/; read SESSION_LOG for tooling caveats.

## 2026-10-18 - TCN25+OTHER ready for manual webcam testing

User approved integrating the trained model for tests. Delivered selectable
`vsl-gh-tcn-25` (epoch44) in Live Camera, with new25 source labels, native OTHER,
frozen threshold0.9992662072181703 and exact training preprocessing. CPU worker
reuses model/tracker; Capture accepts an early Finish capture. Auto disabled at
both UI and stream service boundary. Old vocabulary reference videos hidden.
Default model, launcher, dependencies, bridge security and raw storage unchanged.

**User workflow:** restart `run_app.ps1` → Studio → Dataset → Live Camera →
Recognition model **TCN · 25 signs + OTHER (Experimental)** → Start camera →
Capture sign → perform one complete sign after countdown → Finish capture.
Automatic stop after4seconds. Word list is in25 supported signs. See
`docs/VSL_MULTIUSER_DATASET_REVIEW.md` for the full Vietnamese test guide.

**Changed files:**
- Added `app/desktop_collector/recognition/gh_tcn.py`, `gh_tcn_provider.py`.
- Updated recognition `registry.py`, `worker_client.py`, `captures.py`, `jobs.py`,
  `worker.py` for model/artifact routing and outside-vocabulary feedback.
- Updated web `src/LiveCamera.tsx`, `src/CameraTracking.tsx`, `tests/camera.spec.ts`.
- Added `tests/test_recognition_gh_tcn.py`; updated `tests/test_recognition_topics.py`.
- Updated PROJECT_CONTEXT, PROJECT_MILESTONE_TRACKER, CHANGELOG and docs SESSION_LOG,
  WORK_SESSION_HANDOFF, DATA_SCHEMA, ASSET_INVENTORY, VSL_MULTIUSER_DATASET_REVIEW.
- Built ignored frontend output; test/replay artifacts remain in ignored cache.

**Checks actually run:**
- `.venv/Scripts/python.exe -m pytest tests/test_recognition*.py
  tests/test_vsl_gh_experiment.py -q --basetemp=<unique system TEMP directory>`:
  328passed,2 pre-existing deprecation warnings,85.54s (PowerShell expanded file list).
- Final `tests/test_recognition_gh_tcn.py`:14passed,0.68s after further test coverage.
- Web `npm.cmd test -- --run`:73passed. `npm.cmd run build`:passed; chunk-size warning.
- `.venv/Scripts/python.exe -m app.desktop_collector.shell --smoke-test`:passed.
- Launcher `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./run_app.ps1
  -SkipBuild -SmokeTest`:passed, using the rebuilt frontend. No launcher edits.
- Web `npm.cmd run test:e2e -- tests/camera.spec.ts -g "TCN capture"`:1passed,
  two synthetic captures through authenticated API and real CPU worker, no hands
  -> rejected; three viewport screenshots and Axe checks passed. Runner exited0
  after explicit cleanup of its two lingering Vite PIDs; app bridge shutdown passed.
- Isolated CPU2.5.1 replay via `replay.py`:all4,541 saved predictions identical.
  S06:94correct/1wrong/81rejected known;11/196 unknown falsely accepted, unchanged.
- Git status/diff/check unavailable because this workspace has no.git. Use ignored
  before snapshots for scoped diff review; do not initialize/reset Git to "fix" it.
  Scoped snapshot diff reviewed; no added trailing whitespace. Test Vite port5173
  verified released after cleanup.

**Limits / next gate:** physical webcam, new people, idle/arbitrary motions and
automatic segmentation remain untested. Source labels/identities are not independently
certified. Strict threshold can reject many valid signs; never report webcam90% or
accepted-only precision as overall accuracy. No RGB references for this vocabulary.
Optional weights stay in `.design-cache/multiuser-data-20261018/gh25/background-run1/`;
do not clean that directory. If artifacts disappear or fail hashes, model unavailable.
Next: user testing with multiple people, recording correct/wrong/rejected separately,
before approving Auto or replacing the default. No production accuracy gate closed.

Evidence: `.design-cache/gh-tcn-integration-20261018/`. Initial test-environment and
browser-assertion failures plus the Vite cleanup workaround are recorded in SESSION_LOG.

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

Changed this continuation: app/desktop_collector/vsl_gh_experiment.py (new,
offline prepare/train/replay); tests/test_vsl_gh_experiment.py (new,23cases);
PROJECT_CONTEXT.md; PROJECT_MILESTONE_TRACKER.md; CHANGELOG.md; docs/SESSION_LOG.md;
docs/WORK_SESSION_HANDOFF.md; docs/DATA_SCHEMA.md; docs/ASSET_INVENTORY.md;
docs/VSL_MULTIUSER_DATASET_REVIEW.md. Research arrays, weights, download scripts,
protocols, source receipts and prediction reports are ignored cache artifacts.

Verification command:
`.\.venv\Scripts\python.exe -m pytest tests/test_vsl_gh_experiment.py tests/test_vsl_baseline.py tests/test_vsl_candidate_manifest.py tests/test_vsl_data_audit.py tests/test_kvsl_manifest.py tests/test_dependencies.py --basetemp .design-cache/multiuser-data-20261018/gh25/pytest-final2 -q`
Result: 127 passed in 16.13s. Shell smoke passed again after the final offline guards;
frontend suites/build not run because no frontend changes. Git status/diff/check
unavailable (workspace has no Git metadata); before snapshots plus scoped
no-index/diff review are used. Do not claim a clean Git worktree.

Superseded evidence: unknown-results.json was the first diagnostic; comparison-
results.json is authoritative for side-by-side figures. It uses float64 score
comparison and an explicit reject-all threshold, correcting candidate enumeration
near float32=1.0. Original receipts stay intact; neither correction retrains or
selects using test outcomes. TCN checkpoint replay passes on CPU for both runs.
No exact encoded duplicates found in the initial2,086inputs; no unresolved raw/
encoded cross-split conflicts retained in follow-up. Near-duplicates, true signer
identity, correct VSL interpretation, and timing alignment to RGB remain unverified.

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

Changed durable files: app/desktop_collector/vsl_data_audit.py;
tests/test_vsl_data_audit.py; docs/VSL_MULTIUSER_DATASET_REVIEW.md (new);
PROJECT_CONTEXT.md; PROJECT_MILESTONE_TRACKER.md; CHANGELOG.md;
docs/SESSION_LOG.md; docs/WORK_SESSION_HANDOFF.md; docs/DATA_SCHEMA.md;
docs/ASSET_INVENTORY.md; docs/VSL_DATA_QUALIFICATION.md.
Research downloads/scripts/receipts are isolated in ignored .design-cache.

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

## 2026-10-16 - Camera worker repair; 25-sign MVP is NOT accepted yet

User confirms VideoMAE GPU25 and reports both Capture and Auto producing no
results. Explicit target: the current25 signs must be accurate for the user's
camera first. Continue the approved experimental integration; physical accuracy,
Auto boundary reliability, unknown/idle rejection and latency gates remain open.
Numerical acceptance thresholds are TBD. No new training or checkpoint change.

Delivered:
- Reproduced CUDA out-of-memory at VideoMAE Conv3d warmup. Bypassed the cuDNN
  path inside the isolated GPU provider; still CUDA FP32 with identical pinned
  weights, no CPU fallback. A synthetic720p frame now returns75 tracking entries
  after12.80s startup, and its worker/pipes are reaped. Entries are not detected
  hands on this blank frame.
- Added bounded worker-error classification for GPU/host memory and known
  runtime/model faults, safe fixed user messages, cleanup and recovery tests.
  Raw stderr paths are not returned as user messages.
- Auto failure now says recognition stopped while camera preview continues.
  Capture upload/job completion clears stale Sending-local-clip status; failed
  jobs show failure and allow another capture. Existing One UI components reused.
- Built the production frontend. Launcher, originalV25, checkpoint, dependencies,
  raw datasets, protected references and all unrelated work are preserved.

Actual evidence, not physical-camera accuracy:
- Browser real authenticated POST -> queue -> CUDA -> polling -> rendered word
  succeeds for the existing wake-up reference. The test replaces only the POST
  media with that known reference; it does not represent a user's recorded sign.
- Capture -> Auto worker transition passes. Real canvas-video frames produce
  hand tracking. Extended replay finally renders Completed sign: Thuc day with
  native score0.980817. Latest Capture total16.77s from cold start; model scores
  are not accuracy estimates. Captured actual-app screenshots were inspected.
- IMPORTANT: an earlier extended browser replay produced no final segment in
  30s, although tracking and an incomplete-sign notice remained visible. A later
  replay passes without model/threshold changes. This is intermittent boundary
  behavior, not resolved reliability. Do not claim every Auto sign now completes.
- All25 existing derived references through actual Capture policy:24 accepted
  with matching source labels, one Xe dap withheld (native top-one is the right
  class but score0.2832/margin0.0529), zero execution failures. Warm median total
  2726.73ms, model402.46ms. Training-source overlap prevents independent accuracy.
- Windows was observed with only about198MiB free on C and low commit headroom.
  A parallel test attempt even prevented PowerShell CLR startup. Serial checks
  subsequently pass; resource-pressure reliability is not guaranteed. No user
  applications, system pagefile, driver or personal files were changed.

Checks actually run:
- .venv Python -m pytest tests/test_recognition*.py (expanded by PowerShell),
  tests/test_dependencies.py tests/test_server.py, with OPENBLAS/OMP/MKL threads1,
  --basetemp D:\SmartGloveTestTemp\camera-worker-final and task-local cache:
  311 passed in74.65s, two existing dependency deprecation warnings.
- npm.cmd test -- --maxWorkers=1 --minWorkers=1:73 passed.
- npm.cmd run build:TypeScript/Vite passed.
- npm.cmd run test:e2e -- tests/stream-camera.spec.ts --grep
  'worker failure reports|failed capture upload|failed recognition job|real VideoMAE CUDA|VideoMAE selection'
  --workers=1:five passed. Selection case covers both themes/three viewports and
  zero scoped axe violations. Synthetic/mocked cases are not model evidence.
- Extended the real CUDA case to require a final decision after single playback:
  first run failed(no final in30s); diagnostic rerun passed in47.1s and displayed
  the correct final word. This limitation stays open, despite the final test pass.
- .venv Python -m app.desktop_collector.shell --smoke-test:exit0.
- powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1
  -SkipBuild -SmokeTest:exit0, launcher unchanged.
- evaluate_references.py:25 processed,24 matching accepted,1 rejection,0 errors;
  worker reaped. No webcam used and no training performed.
- review_changes.py compares preserved before.zip/SHA256 baseline, Python syntax,
  new whitespace, protected launcher/V25 hashes and historical document bytes.
  git status/diff unavailable: this directory has no Git metadata. The snapshot
  cannot establish a clean Git state or inventory all pre-existing untracked work.

Iteration failures also included a test route glob omitting query parameters,
source hot reload interrupting a browser job, and one generic failed Capture job
whose underlying code was not captured. Corrected instrumentation and serial
reruns produce passing Capture receipts; do not retroactively call failed runs
passed or attribute the unclassified error to a proven cause.

Evidence: .design-cache/camera-worker-failure-20261015/{before.zip,baseline.json,
gpu-after.json,references-25.json,changes.diff,verification.json,browser/}.
gpu-before.json was accidentally reused by the initial diagnostic script and
contains an AFTER success, not the original failure. gpu-after.json is the honest
success receipt; original CUDA traceback was observed in the tool transcript.
browser/real-auto-completion.json and real-gpu.json contain the latest passing
replay. The earlier no-final failure is described above, not overwritten as a pass.

Next gate: restart via run_app.ps1, explicitly select VideoMAE GPU25, compare
Capture and Auto on the user's actual camera. Measure correct/wrong/rejected
attempts separately for all25 signs plus idle/unknown behavior. Investigate
Auto segmentation variability and low-confidence bicycle/reference transforms
before calibration or targeted fine-tuning. Do not lower rejection thresholds
or claim production-ready accuracy solely to make the reference tests pass.

Changed source/tests/docs in this task (ignored evidence/build output excluded):
- `CHANGELOG.md`
- `PROJECT_CONTEXT.md`
- `PROJECT_MILESTONE_TRACKER.md`
- `app/desktop_collector/recognition/jobs.py`
- `app/desktop_collector/recognition/persistent_client.py`
- `app/desktop_collector/recognition/runtime_errors.py`
- `app/desktop_collector/recognition/stream_worker.py`
- `app/desktop_collector/recognition/streaming.py`
- `app/desktop_collector/recognition/videomae_provider.py`
- `app/desktop_collector/recognition/worker.py`
- `app/desktop_collector/web/src/CameraTracking.tsx`
- `app/desktop_collector/web/src/LiveCamera.tsx`
- `app/desktop_collector/web/tests/stream-camera.spec.ts`
- `docs/SESSION_LOG.md`
- `docs/WORK_SESSION_HANDOFF.md`
- `tests/test_recognition_jobs.py`
- `tests/test_recognition_persistent.py`
- `tests/test_recognition_runtime_errors.py`
- `tests/test_recognition_stream_worker.py`

## 2026-10-15 - VideoMAE GPU is integrated; physical comparison remains next

Current approved scope: user approved integrating the audited pretrained model
experimentally, then requested continuation. Work is delivered for app testing.
This supersedes prior "offline only/app still V25 only" entries below. V25 remains
the default; manually choose VideoMAE GPU in Live Camera to use the new provider.
No production cutover, new personal dataset or local retraining was performed.

Delivered:
- Separate pinned visign-videomae-25 RGB/CUDA provider; native100 outputs projected
  to canonical25 signs without renormalizing softmax. Strict checkpoint hash and
  numeric-only loading; original V25 checkpoint/runtime preserved.
- Capture and Auto model routing, bounded RGB history, heuristic abstention,
  provider-bound authentication/handshake/predictions, visible rejection reasons.
- Capture model reuse and service reservation to avoid overlapping manual/Auto
  allocation; idle manual workers are reaped before stream startup.
- Existing One UI selector/result/reference controls reused; no new visual assets.
  Desktop host still does not import ML packages. GPU dependencies/checkpoint
  stay in ignored .design-cache/pretrained-vsl-audit-20261015.

Training status: local V25 is Ridge fitted by linear solve, not a few-epoch neural
model. The new VideoMAE uses publisher pretrained/fine-tuned weights unchanged.
Pinned notebook records5 head-only plus20 full fine-tuning epochs. No new training
run or new test-set accuracy is claimed in this task.

Actual CUDA evidence (existing wake-up reference, not physical camera):
- Capture returns Thức dậy, native73/canonical14, score0.986507. Warm total1418.61ms,
  preprocessing1121.72ms, model235.47ms; same worker reused, cold_start0.
- First requests varied11.33s to70.49s; UI allows up to120s worker startup.
- Auto10FPS timestamp replay: correct tentative word, but early segment rejected.
  Extended hold73-frame replay final at frame68 rejected at0.753568 (<0.80).
  Auto boundary/hold sensitivity remains; do not claim Completed-sign success.
- Actual workers/pipes were reaped. Source overlaps publisher training, and
  repeated-frame replay is not camera latency or independent accuracy.

Checks actually run:
- Main .venv Python: pytest tests/test_recognition*.py (expanded in PowerShell),
  tests/test_dependencies.py, tests/test_server.py; final --basetemp
  D:\SmartGloveTestTemp\videomae-resume and task-local cache:297 passed,
  two existing dependency deprecation warnings.
- web: npm.cmd test:73 passed; npm.cmd run build:passed.
- web: npm.cmd run test:e2e -- tests/stream-camera.spec.ts --grep
  'VideoMAE selection|ViSign Auto shows|Auto off, hidden|new segment' --workers=1:
  three existing cases passed; new GPU case initially failed from an incorrect
  test selectOption call. Fixed to use the real One UI listbox, reran
  --grep 'VideoMAE selection':one passed. Four distinct cases pass.
- GPU browser case: both themes,1280x720/1440x900/768x1024; zero scoped WCAG A/AA
  violations, no horizontal overflow. Synthetic media/mocked inference only.
  Two desktop screenshots visually inspected; no new geometry claim.
- .venv Python -m app.desktop_collector.shell --smoke-test:exit0.
- powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1
  -SkipBuild -SmokeTest:exit0; launcher itself unchanged.
- integration_probe.py --mode manual, manual-warm, stream, stream-hold:
  real CUDA worker paths exercised with limitations above; no webcam.
- review_changes.py: own source changes parsed, added-whitespace checked,
  launcher/pyproject/V25 source hashes preserved, historical document bytes retained.
  git status/diff unavailable because no Git metadata; before.zip is task evidence,
  not a substitute for a real Git worktree or an assertion of no unrelated changes.

Iteration failures: C-temp sandbox permissions, then in-repo test DB rejection,
were resolved by a disposable outside-repo D test directory. Stale catalog-count
test11->12 and browser helper failure were fixed. One approval review failed from
usage limits; the user's resumed session successfully ran the pending suite.
No verification failure remains hidden behind a passed claim.

Changed files are enumerated below. Ignored evidence and generated build/test
output are excluded from the durable file list.

- `CHANGELOG.md`
- `PROJECT_CONTEXT.md`
- `PROJECT_MILESTONE_TRACKER.md`
- `app/desktop_collector/recognition/captures.py`
- `app/desktop_collector/recognition/contracts.py`
- `app/desktop_collector/recognition/jobs.py`
- `app/desktop_collector/recognition/persistent_client.py`
- `app/desktop_collector/recognition/references.py`
- `app/desktop_collector/recognition/registry.py`
- `app/desktop_collector/recognition/service.py`
- `app/desktop_collector/recognition/stream_worker.py`
- `app/desktop_collector/recognition/streaming.py`
- `app/desktop_collector/recognition/videomae.py`
- `app/desktop_collector/recognition/videomae_provider.py`
- `app/desktop_collector/recognition/worker.py`
- `app/desktop_collector/recognition/worker_client.py`
- `app/desktop_collector/server/recognition_stream.py`
- `app/desktop_collector/web/src/LiveCamera.tsx`
- `app/desktop_collector/web/src/api.ts`
- `app/desktop_collector/web/src/cameraStream.test.ts`
- `app/desktop_collector/web/src/cameraStream.ts`
- `app/desktop_collector/web/tests/stream-camera.spec.ts`
- `docs/ASSET_INVENTORY.md`
- `docs/DATA_SCHEMA.md`
- `docs/SESSION_LOG.md`
- `docs/VSL_DATA_QUALIFICATION.md`
- `docs/WORK_SESSION_HANDOFF.md`
- `tests/test_recognition_persistent.py`
- `tests/test_recognition_stream_api.py`
- `tests/test_recognition_topics.py`
- `tests/test_recognition_videomae.py`

Evidence: .design-cache/videomae-integration-20261015/ contains before.zip,
baseline.json, changes.diff, verification.json, integration_probe.py,
manual-probe.json, manual-warm-probe.json, stream-probe.json,
stream-hold-probe.json, wake-up-frames.npz and browser/review.json/renders.
Preserve the existing pretrained audit and original reference/model assets.

Next gate: user runs .\run_app.ps1, then Studio > Open Dataset > Live Camera >
Recognition model > VideoMAE GPU · 25 signs (Experimental). Start camera; test
Capture sign first with Chào, Ăn and Thức dậy, keeping face/upper body/hands inside
the center square. Then compare Auto with the same framing and one sign at a time.
Any physical capture is user-initiated; none was collected by this session.

Open risks: no independent or personal-camera accuracy result; unknown/idle
rejection is not calibrated; true signs may be withheld and accepted words can
still be wrong; center crop can exclude hands; synchronous GPU inference delays
tracking acknowledgements. C-drive low space/paging can cause slow/failed startup.
No subsecond end-to-end or60FPS claim. Further boundary/quality work and possible
fine-tuning require evidence from the physical comparison. Existing unrelated
hardware, visual, semantic and production acceptance gates remain unchanged.

## 2026-10-15 - GPU probe complete; C-drive disposable caches cleaned

User resumed the GPU check, reported Thức dậy provisional/final errors, and explicitly
authorized safe C cleanup when Windows memory pressure blocked torch import.
Current app is still V25; VideoMAE has only been run offline. No physical sample
was collected and no cause of this user's wrong final sign is established.

Executed GPU probe: RTX 2050 4GiB, driver 596.21, torch 2.6.0+cu124, compute capability
8.6; FP32 with TF32 disabled and CUDA synchronization around each model timing.
39 source clips across 25 target labels: 39 source matches, all nine Thức dậy match,
and all 31 CPU-reference top-one results match. Largest shared top-three softmax
difference 0.00000203. Warm model p50/p95 276.32/289.41ms; allocator peak
410.85MiB allocated / 462MiB reserved, excluding driver/external allocations.
Three warmups excluded; first warmup 1086.34ms; setup 7098.52ms excludes imports.
36 additional Thức dậy prefix runs: 25/50/75/100 percent source matches 1/8/9/9
of nine. No independent accuracy, camera-to-display, idle/unknown or production claim.

Original torch CPU import initially failed with WinError1455. Sandboxed nvidia-smi
failed, but approved outside-sandbox inventory and actual CUDA execution succeeded.
Installed CUDA dependencies with uv --target inside the audit directory; transient
cache rename retries resolved. Original worker torch remains 2.5.1+cpu, no Transformers.
V25 checkpoint, launcher, provider and pyproject hashes unchanged.

C cleanup: only bounded disposable npm/browser/VS Code download/code caches, crash
dumps, and Temp files older than seven days; recent/locked files and reparse points
were skipped. 1,708,537,258 logical bytes deleted; disk free rose from 253,935,616
to 1,947,226,112 bytes, then automatic pagefile growth 4960 -> 6559MiB consumed
most of it. Later C free was 268,206,080 bytes; exact current space fluctuates.
No document/project/account/installed-extension deletion, process termination or
manual system configuration change. Windows Update download cache (~3.05GiB) was
inspected only: active services and no admin token; not safely quiesced for deletion.

Durable changed files: PROJECT_CONTEXT.md, docs/VSL_DATA_QUALIFICATION.md,
CHANGELOG.md, docs/SESSION_LOG.md and this handoff. Ignored evidence/scripts/deps:
.design-cache/pretrained-vsl-audit-20261015/gpu_probe.py, gpu-probe.json,
gpu-baseline.json, clean_c_caches.ps1, c-cleanup-report.json and gpu-verification.json.
Actual checks: probe syntax, strict loading/hash checks, finite CUDA inference and
CPU top-one comparison, original-file hashes and preservation of previous docs.
No application regression suite or physical camera test was run. Git commands cannot
run because this workspace lacks Git metadata; no clean-worktree assertion.

Next: integrate the candidate as a separate experimental RGB provider before the
user's physical test; validate complete-gesture boundaries and uncertainty rejection.
Do not silently replace V25 or claim 39/39 is webcam accuracy. C remains nearly full.
Prior throughput work below remains unfinished; no milestone/cutover gate changed.

## 2026-10-15 - Pretrained audit complete; VideoMAE is the candidate to test next

User asks to verify a pretrained VSL route using already labeled data, avoiding a
large personal dataset. Inspected current scope, Git state (no .git), available data,
publisher metadata/code/weights and local runtime. No capture or app integration.

VideoMAE candidate revision 9759fc78b5d69625317bb658b4104040f9427fa3: public 100-class
RGB model; pinned sequential checkpoint 345,300,963 bytes verified against LFS SHA-256.
Strict complete loading with the documented LayerNorm/Dropout/Linear head succeeds.
All 100 model label IDs match its primitive map. V25 has 18 exact text matches and
seven documented encoding aliases; source and model files retain original labels.
ViSignRe and SIGNTEGRATE have weights but incompatible vocabularies/tasks; checked
v-sign and AAGCN trees do not contain immediately usable model checkpoints.

Actually executed: initial 8-clip Chào/Ăn source replay, 8/8 matches; expanded 31 clips
covering all 25 target labels, 31/31 matches. Repeated eight top-k scores match exactly.
These source clips may overlap publisher training, not independent accuracy evidence.
CPU 4-thread model-only p50/p95: 1298.57/1523.38ms; full end-to-display not measured.
RTX 2050 detected, GPU path untested; current subsecond acceptance is not met by CPU.

Audit artifacts: .design-cache/pretrained-vsl-audit-20261015/ including metadata,
checkpoint, probe.py, probe.json, probe-25-labels.json and verification.json. uv --target
installed probe dependencies only inside that directory. Original worker remains
torch 2.5.1+cpu with no Transformers; original V25 checkpoint hash remains pinned.
No raw-data, app, API, launcher or production dependency change; no regression suite
or physical camera test run. Network/CIM were sandbox-blocked then approved reruns
succeeded; uv retried a transient cache rename and finished successfully.

Durable changes: PROJECT_CONTEXT.md, docs/VSL_DATA_QUALIFICATION.md, CHANGELOG.md,
docs/SESSION_LOG.md and this handoff. Added documentation is checked for whitespace
and exact preservation of prior content using pre-edit hashes; no Git-clean claim.
Next: isolated GPU benchmark, then physical camera/unknown/idle evaluation before
app replacement or an accuracy claim. No need for a new large personal dataset to
start that experiment. Previous throughput verification below is still unfinished;
no existing semantic, physical, latency or cutover gate is marked complete.

## 2026-10-15 - Accuracy discussion: prioritize the user's current camera

Confirmed preference: improve recognition for this user/current camera first, before
new-signer generalization. User reports satisfactory tracking and Chào -> Ăn errors,
and confirms Completed sign still shows Ăn or another wrong word after finishing
and about one second of stillness. No physical sample was captured in this session.

Read-only comparison of existing saved diagnostics found a validation Chào clip whose
25/50/75/100 percent prefixes produce Ăn / Đồng ý / Đồng ý / Chào. This supports
checking premature predictions, but does not establish the cause of this user's error.
Source semantics remain unverified. Evidence is the existing
.design-cache/visign-stream-20261013/prefix-diagnostic.json; no experiment was rerun.

Changed only PROJECT_CONTEXT.md, CHANGELOG.md, docs/SESSION_LOG.md and this handoff
to record the decision/findings. No application, model, dataset or dependency edits;
no tests, training or camera capture run. Git metadata is still absent; documentation
prefix additions are checked against pre-edit hashes of the retained prior content.
Previous throughput verification below remains unfinished and is not marked passed.

Next: compare manual complete-gesture recognition with Auto boundaries, keeping
camera/setup/sign fixed, before selecting personalized capture/training work. Wrong
final words rule out a provisional-display-only issue but do not identify whether
Auto truncated the gesture or the classifier misclassified a complete gesture.
No milestone, semantic, physical accuracy, latency or cutover gate is closed.

## 2026-10-15 - In progress: 1080p60 camera and tracking throughput

User requested60FPS camera and faster tracking with accuracy preserved; Camo/S22+
is configured1080p60. Current implementation requests1920x1080/60, negotiates raw
lossless RGBA8 over existing stream-v1 (legacy PNG fallback), raises tracking ceiling
15->60, preserves one frame in flight and retains the temporal history at higher
rates. Same source pixels, Holistic graph/model, display design and security bounds.
Negotiated camera settings are visible; camera FPS counts presented-frame deltas.

Current checks:72 frontend unit tests and TypeScript/Vite build passed;103 relevant
Python tests passed before the final worker-environment change. Fixed-timestamp
comparison of25videos/750frames shows exact RGB/landmarks/masks/phases/top-k/scores
parity; saved report assertions passed. The PowerShell parity runner returned1 from
native stderr warnings; all25 comparison rows completed, report independently checked.

Initial full browser run:10 passed/5 real-worker cases failed. Isolated diagnostic
confirmed MemoryError importing MediaPipe/matplotlib with inherited OMP16; bounded
OMP/OpenBLAS1 run passed. Worker subprocesses now bound OMP/OpenBLAS/MKL to1 before
imports, preserving host environment and graph executors. Temporary diagnostic source
edits were removed. Full15-case browser rerun is active; no final performance or
verification claim yet. Rerun worker Python coverage and launcher smoke after it.

Evidence: .design-cache/camera-performance-20261014/ (date retained from initial work).
Baseline166files and before copies retained; repository has no Git metadata.
Next: finish1080p native-socket comparison; inspect result and actual renders; run
affected tests/build/smoke; final scoped hash/diff audit and documentation. Physical
Camo60FPS, signer accuracy and end-to-display latency remain user review gates.
No model/data/dependency/launcher/cutover change or milestone acceptance.

## 2026-10-14 - Latest snapshot: larger Live Camera layout verified

User requested more webcam space, a readable model word while signing and use of
the empty right area without changing the design language, then resumed this task.
Delivered full-width camera mode with a large left preview and right-side result
above the reference video. Large 36px word; tentative/completed distinction retained;
scores/model metadata expand on demand. Narrow layout puts the result directly
under the preview. Existing One UI controls/surfaces/themes and tracking remain.

Changed durable files (10):
- app/desktop_collector/web/src/Studio.tsx
- app/desktop_collector/web/src/LiveCamera.tsx
- app/desktop_collector/web/src/Recognition.tsx
- app/desktop_collector/web/src/studio.css
- app/desktop_collector/web/tests/camera.spec.ts
- app/desktop_collector/web/tests/reference-video.spec.ts
- app/desktop_collector/web/tests/stream-camera.spec.ts
- CHANGELOG.md
- docs/SESSION_LOG.md
- docs/WORK_SESSION_HANDOFF.md
Generated web build/tsbuildinfo updated separately; screenshots remain ignored.

Completed verification:
- npm.cmd test: 70 passed.
- npm.cmd run build: final TypeScript/Vite build passed.
- npm.cmd run test:e2e -- tests/stream-camera.spec.ts tests/camera.spec.ts
  tests/reference-video.spec.ts --trace off: 14 passed, 2.8m, elevated exit 0.
- powershell -NoProfile -ExecutionPolicy Bypass -File ./run_app.ps1 -SkipBuild
  -SmokeTest: exit 0, no errors.
- Actual light/dark review at 1280x720, 1440x900, 768x1024: Axe and overflow pass;
  enlarged preview and result both in the desktop viewport; overlay matches video.
  Visually inspected dark1280/light1440/light768 and manual light1280 captures.
The interrupted first browser run hit Windows memory/paging failure; sequential
elevated rerun resolved verification. No outstanding automated failure.

Evidence: .design-cache/camera-layout-20261014/ (baseline, before files, diff,
browser receipts and renders). Root has no .git: Git status/diff/check unavailable;
scoped direct comparison is used, without a claim that the Git worktree is clean.
No backend, model, dataset, dependency, launcher or protected reference edits.
No commit, push, release or milestone acceptance. Previous experimental camera
integration scope and all physical/semantic/accuracy/latency gates remain open.

Unverified: physical webcam ergonomics and actual signer recognition accuracy.
Synthetic camera/source replay evidence verifies presentation and integration only.
Next gate: user reopens run_app.ps1 > Studio > Dataset > Live Camera, starts the
webcam, enables Auto and reviews the enlarged preview and right-side word display.

## 2026-10-14 - Latest snapshot: camera tracking diagnostics verified

Delivered user-requested MediaPipe pose/hand overlay in Live Camera > ViSign > Auto on.
Uses the existing isolated detector output; manual/KVSL remains unchanged except
camera FPS display. Diagnostics: camera FPS, acknowledgement/tracking FPS, frame RTT,
processing ms, left/right presence. Overlay matches mirrored contain-fit preview,
filters absent/out-of-frame/low-visibility pose points and expires after1second without
fresh replies. Stop/hidden/navigation clears the stream. No additional ML runtime.
RTT includes encoding/local transport/processing, excludes rendering, and is not
network ping or physical gesture-end latency. Optional quality field is backward
compatible; schema/migration notes are in DATA_SCHEMA.md.

Commands actually run:
- `npm.cmd test`:70 passed after final source edits.
- `npm.cmd run build`: TypeScript/Vite passed; generated build updated.
- `.venv/Scripts/python.exe -m pytest tests/test_recognition_stream.py
  tests/test_recognition_stream_api.py tests/test_recognition_stream_worker.py
  tests/test_vsl_features.py tests/test_dependencies.py -p no:cacheprovider
  --basetemp <OS TEMP>/smartglove-tracking-20261014 -q`:94 passed, two existing warnings.
  Process-local PYTHONDONTWRITEBYTECODE=1, OPENBLAS_NUM_THREADS=1, OMP_NUM_THREADS=1.
- `npm.cmd run test:e2e -- tests/stream-camera.spec.ts tests/camera.spec.ts
  tests/reference-video.spec.ts --trace off`:14 passed in2.2minutes, elevated exit0.
  Includes real Holistic reference replay, no-hands, manual capture/cancel, references,
  stale overlay expiry, matching overlay geometry, and six theme/viewport Axe checks.
- `powershell -NoProfile -ExecutionPolicy Bypass -File ./run_app.ps1 -SkipBuild
  -SmokeTest`: elevated exit0. Sandbox account-storage failure resolved by rerun.

Initial build casing conflict, pytest repository-storage guard failure, sandbox
browser runner hang and interrupted run are documented in SESSION_LOG.md. No remaining
automated failure. Browser evidence uses synthetic cameras/reference replay, not a
physical webcam. Actual render evidence under `.design-cache/camera-tracking-20261014/browser/`.
Reviewed dark1280/light768 renders. No user visual approval or physical accuracy claim.

Changed durable files (13): recognition/stream_worker.py; web/src/LiveCamera.tsx,
CameraTracking.tsx(new), trackingMetrics.ts(new), cameraTracking.test.ts(new), studio.css;
web/tests/stream-camera.spec.ts; PROJECT_CONTEXT.md, CHANGELOG.md; docs/DATA_SCHEMA.md,
ASSET_INVENTORY.md, SESSION_LOG.md, WORK_SESSION_HANDOFF.md. Generated web build and
tsbuildinfo updated separately. No model, dependency, raw dataset, launcher, protected
reference or milestone gate changes. Root still has no Git metadata: status/diff/check
unavailable; baseline/hash review is used, without claiming a clean Git worktree.

Remaining limitation: latest processed landmarks lag the current preview by measured
frame RTT; this is not a synchronized delayed-video display. Camera FPS is unavailable
when the browser lacks video-frame callbacks. Tracking requires ViSign Auto, and its
experimental15FPS cap remains. Physical alignment, signer accuracy and subsecond
gesture latency still require user testing. Next gate: launch `run_app.ps1`, open
Studio > Dataset > Live Camera, select ViSign, Start camera, Auto on and review.
No commit, push or release performed.

## 2026-10-14 - Previous snapshot: V25 reference videos delivered and verified

User requested reference videos in the app and continued the session. Implemented
V25 Live Camera viewer:25 local examples, default Chào, native playback/replay and
0.5x/1x speed; side-by-side with webcam on wide screens, stacked at narrower widths.
No autoplay/camera startup or reference-conditioned recognition. Original source
semantics remain unreviewed. Earlier during-motion Auto work remains intact.

Added authenticated ID-only catalog/media endpoints, pinned bounded SHA-verified
WebM delivery, abortable Blob fetches, cleanup on selection/unmount and hidden pause.
Offline builder prepares previews in the existing CV environment. Final set is
`.design-cache/visign-references-20261014-v2/`:25 final-training exemplars/750 frames,
4,096,616bytes, manifest SHA256
`42de9f617d90f513d2bb2784ac5ba2ff0c810e4ec3028714bbdcc7782386db48`.
Originals/model unchanged. First set used stale proposed split for two clips; retained
as unserved audit evidence, corrected selection pins the effective research split.
Same-item dropdown reselection bug fixed; Replay stays ready.

Final verification actually completed:
- `npm.cmd test`: 67 Vitest passed. `npm.cmd run build`: TypeScript/Vite passed,
  final output includes the same-selection fix. Logs: frontend-sequential.txt and
  frontend-build.txt under the evidence directory below.
- All `test_recognition*.py` plus test_server, test_auth_persistence,
  test_account_profile, test_dependencies, test_kvsl_manifest, test_vsl_features and
  test_vsl_baseline: 360 passed in 76.69s, two existing deprecation warnings. Includes
  all 39 new reference tests. Used `.venv/Scripts/python.exe -m pytest`, unique OS
  TEMP basetemp, `-p no:cacheprovider`, PYTHONDONTWRITEBYTECODE=1 and process-local
  OPENBLAS_NUM_THREADS=1/OMP_NUM_THREADS=1. Log: backend-sequential.txt.
- With RECOGNITION_REAL=1, `npm.cmd run test:e2e -- tests/reference-video.spec.ts
  tests/stream-camera.spec.ts tests/camera.spec.ts tests/auto-camera.spec.ts
  tests/recognition.spec.ts`: first run 23 passed/one Auto timing failure during
  memory pressure. Sequential rerun of complete reference-video + auto-camera files:
  7 passed in 2.1 minutes, exit0. All 24 distinct affected browser cases therefore
  passed across these runs, zero skips. Logs: browser-tests.txt/browser-sequential.txt.
  Real source/model replay and synthetic camera are not physical webcam evidence.
- All 25 real reference WebMs decoded and played on request; default paused/muted,
  no webcam request, authenticated header/cookie fetches, no token URL/storage.
  Selection/speed/replay/hidden pause, stale replies, missing/corrupt retry,
  same-item selection, Blob revocation and unchanged running camera passed.
- Six reference light/dark Axe/overflow reviews passed at 1280x720, 1440x900 and
  768x1024; actual renders inspected. Screenshot harness explicitly refreshes a
  native video frame after resize/theme so paused compositor frames render reliably.
- Final `powershell -NoProfile -ExecutionPolicy Bypass -File ./run_app.ps1
  -SkipBuild -SmokeTest` passed elevated, exit0, with normal BLAS environment.
  Earlier OpenBLAS allocation/sandbox account-storage failures and a successful
  thread-limited smoke are retained as context. No persistent policy/launcher change.
- Independent code review and media-audit.json confirm canonical final-train sources,
  unchanged original/curation/split hashes and all 25 pinned previews available.

Resolved verification failures: running browser/Python/frontend checks concurrently
exhausted Windows allocation/paging resources (Argon2, Git subprocesses, OpenBLAS,
PowerShell, Edge). A Python attempt had 345 passes, seven failures/eight errors;
frontend repeat failed allocation; earlier browser fixture/startup and paused-frame
screenshots also needed retries. Sequential runs above passed without weakening
checks or altering application constraints. No outstanding automated failure.

Changed durable files: recognition/references.py (new), vsl_reference_media.py (new),
server/recognition_routes.py; web/src/ReferenceVideo.tsx (new), LiveCamera.tsx, api.ts,
api.test.ts, studio.css; web/tests/reference-video.spec.ts (new);
tests/test_recognition_references.py (new); PROJECT_CONTEXT.md, CHANGELOG.md;
docs/ASSET_INVENTORY.md, DATA_SCHEMA.md, RECOGNITION_CONTRACT.md, SESSION_LOG.md,
and this handoff (17 durable files). Web build regenerated separately. No dependencies,
launcher, milestone gate or Figma-reference edits. Git root absent; Git status/diff/check
cannot report a clean tree. Direct baseline/hash review under
`.design-cache/reference-viewer-20261013/` (retains original start date): 12 existing
durable files changed, five added, no source deletion; generated index/CSS/JS replaced
separately. 272 baseline files unchanged; added-line whitespace check passes.

Evidence: baseline.json/before, final-review.json, changes.diff, audit.py/media-audit.json,
test/build/smoke logs and browser receipts/renders. Preview assets remain outside the
frontend bundle; moving the app requires keeping/restoring the exact pinned local
preview set. Missing assets remain recoverable and do not block camera use.
Next gate: user opens Studio > Dataset > Live Camera > ViSign and compares source
examples with physical gestures. No physical webcam opened here; semantic review,
independent accuracy and subsecond physical latency remain open. No commit/push/release.

## 2026-10-13 - Latest snapshot: V25 during-motion Auto verified, physical gate open

User reports xin chao on V25 only appears after stopping and explicitly prioritizes
both dynamic recognition and words during movement. Continue requests authorize this
experimental correction within camera/realtime scope. They do not approve accuracy,
semantic labels, production replacement or unrelated milestones. Label is Chào.

Delivered: V25 Auto uses bounded authenticated local PNG frames into a separate
isolated persistent stream worker, continuous Holistic landmarks, 400 ms onset history
and tentative words before stillness. Same pinned 25-class numeric model/training
encoder; stream preprocessing ID discloses tracking/prefix differences. Quiet tails
are trimmed from provisional and final inputs. Manual capture/KVSL Auto retain their
clip path. Frames/features stay in RAM; one global stream, one frame in flight,
explicit size/time/rate bounds and session ownership. Tentative/completed labels clear
on new segment/gap/disable; hidden page/navigation/camera stop/disconnect dispose the
stream. Logout and shutdown cancel idle, starting and processing workers promptly.
No dependency, training, dataset or launcher change; shell shutdown/WS limits updated.

Final checks actually completed:
- `npm.cmd test`: 65 Vitest passed. `npm.cmd run build`: TypeScript/Vite passed.
- All `test_recognition*.py`, plus test_server, test_auth_persistence,
  test_account_profile, test_dependencies, test_kvsl_manifest, test_vsl_features and
  test_vsl_baseline: 321 passed in 90.82 s, two existing deprecation warnings.
  Used `.venv/Scripts/python.exe -m pytest`, `-p no:cacheprovider`, unique OS TEMP
  basetemp and PYTHONDONTWRITEBYTECODE=1. The 21 isolated binary IPC tests are included.
- With RECOGNITION_REAL=1, `npm.cmd run test:e2e -- tests/stream-camera.spec.ts
  tests/camera.spec.ts tests/auto-camera.spec.ts tests/recognition.spec.ts`:
  19 passed, zero skips, 4.5 minutes, exit 0. Includes real workers, original clip
  paths, model switching, V25 no-hands/replay and stream lifecycle/stale-result cases.
- Six new stream light/dark Axe/overflow checks at 1280x720, 1440x900, 768x1024 passed.
  Actual result renders inspected; no CSS/asset/reference changes.
- Real isolated 147-frame source replay: processing p50/p95/max 33.51/38.89/160.07 ms;
  cold readiness 960.81 ms, normal shutdown 115.41 ms. Startup/in-flight cancellation,
  recovery, actual child/launcher exit and pipe-thread cleanup verified. These timings
  exclude browser/rendering and are not physical gesture latency.
- `powershell -NoProfile -ExecutionPolicy Bypass -File ./run_app.ps1 -SkipBuild
  -SmokeTest`: elevated clean exit 0; plain script blocked by execution policy and
  sandbox attempt failed account-storage initialization. No persistent policy change.

Real browser replay uses the existing VP8 derivative of the original 30-frame Chào
reference (native 224x224, 1x playback, 2.066 s), because Edge could not decode its
original MP4 codec. Latest UI trace: Ăn at source 0.617 s, Đồng ý at 0.876 s, Chào at
1.960 s while playing, then final Chào. Zero MediaRecorder starts/live-job uploads.
This proves during-motion updates on a replay, not physical accuracy. The original
worker replay first reaches Chào at zero-based frame 27 (28th of 30 frames).

Critical limitation: the classifier was trained on complete clips. Validation-only
prefix diagnostics give 39/56/70/89 source-label matches across 116 clips at
25/50/75/100% input. Early wrong candidates can remain stable; smoothing does not
establish correctness. Unknown/visible-hand idle, new-person accuracy, slow/small
movements and physical end-to-display under 1000 ms remain unverified. No physical
webcam was opened here. No accuracy, semantic or production gate is closed.

Changed durable files (23):
- `app/desktop_collector/recognition/`: persistent_client.py, worker.py,
  streaming.py (new), stream_worker.py (new).
- `app/desktop_collector/server/`: app.py, recognition_stream.py (new); and shell.py
  under app/desktop_collector.
- `app/desktop_collector/web/src/`: api.ts, LiveCamera.tsx, Recognition.tsx,
  cameraStream.ts (new), cameraStream.test.ts (new).
- `app/desktop_collector/web/tests/stream-camera.spec.ts` (new).
- `tests/`: test_recognition_stream.py, test_recognition_stream_api.py,
  test_recognition_stream_worker.py (all new).
- PROJECT_CONTEXT.md, CHANGELOG.md; docs/ASSET_INVENTORY.md, DATA_SCHEMA.md,
  RECOGNITION_CONTRACT.md, SESSION_LOG.md and this handoff.
Generated web build refreshed separately. Root has no .git; status/diff/check are
unavailable, not reported clean. Baseline/direct hash review: 14 existing durable
files changed, nine added, no source deletion; generated index/JS replacement only.
262 baseline files unchanged, including launcher, Figma catalog and shared assets.
Model/source hashes match the real replay receipt. Added-line whitespace check passes.

Resolved verification issues: idle logout could hold a lease until timeout; cancellation
could interrupt ASGI teardown; quiet/no-hand tail could change provisional words.
Regression tests now cover these. Initial browser sandbox Vite teardown hung; only
its verified owned process chain was stopped, then elevated final regression exited
cleanly. Early harness failures were corrected; no outstanding automated failure.
Some delegated verification turns hit service usage limits; resumed verification
completed from saved source/evidence. No automatic approval rejection occurred.

Evidence: `.design-cache/visign-stream-20261013/` baseline/before, changes.diff,
final-review.json, verification.json, backend-tests.txt, prefix-diagnostic.py/json,
probe.py/json and browser receipts/renders. Earlier tooling cleanup, datasets/models,
references, PySide/Qt, hardware/Pi/history and all unrelated gates remain protected.
Next gate: user physical V25 Chào and other dynamic-sign testing, recording missed/
wrong signs and first-correct/final latency separately. No commit, push or release.

## 2026-10-13 - Latest snapshot: approved tooling cleanup completed

User explicitly approved the 16-target disk cleanup plan. All targets were removed:
31,648 files / 1,781,772,663 bytes (1.659 GiB). This authorization covers only the
listed Android tools/dependencies/intermediates, the publish-copy web dependencies
and build, and root pytest cache. It does not authorize further cache-wide deletion
or Phase E/PySide cleanup. No milestone status was changed.

Preserved: desktop .venv/web dependencies/production build/launcher; isolated ML
environment, pinned KVSL sources/manifest/checkpoints, ViSign model and all research
data; archives/backups/patches; Figma/reference/history; Android source/configuration,
lockfile/source Gradle wrapper, exported APK and signing keys. The full after-check
scan confirms 62,428 protected hashes unchanged, zero unexpected differences and
no remaining deletion targets. Rebuilt desktop bundles are byte-identical.

Verification actually run: 56 Vitest passed; TypeScript/Vite build passed; 20 Python
dependency/topic/ViSign tests passed (two existing deprecations); Legacy launcher
smoke passed; default launcher smoke passed cleanly on elevated rerun. Its initial
sandbox run exited 0 but logged SQLite readonly shutdown, so that first run is not
a clean PASS. All 11 model providers remain available; four pinned KVSL source
hashes match; actual persistent worker W00395 -> ca, status ok, service shutdown done.
Tests used PYTHONDONTWRITEBYTECODE=1 and pytest cacheprovider disabled. No webcam,
Android rebuild/device test, visual/E2E rerun or new accuracy claim.

Changed durable files: apk/README_APK.md (Android restore instructions), CHANGELOG.md,
docs/SESSION_LOG.md and this handoff. No production source/dependency/API/schema edits.
Root has no .git, so use direct/hash review. Nested publish Git tracked state remains
unchanged. Both inventories exclude the same unreadable old pytest temp directory
and skip 489 links without following/deleting them; no deletion itself was blocked.

Evidence and final review: .design-cache/repository-cleanup-20261013/REPORT.md,
before/after-summary.json, before/after.json.gz, deletion-manifest.json,
deleted-targets.log, test/model receipts, documentation.diff and disk-summary.json.
The full after hash scan precedes the three final changelog/session/handoff additions;
documentation-review.json separately verifies preservation of their original bytes.
Logical size is approximately 5.20 GiB before these new audit receipts; consult the
disk summary for the total including evidence. Physical reclaimed space may differ.

Android building requires restoring SDK/Gradle caches/node_modules. Preserve the
existing debug.keystore. README_APK records versions and the preexisting obsolete
SDK/JRE paths; restoration commands were documented, not executed or verified here.
Next product gate remains manual physical-camera review of the experimental model;
semantic quality, independent accuracy, latency and Phase E gates are unchanged.
Do not clean the remaining .design-cache wholesale: it contains live dependencies.

## 2026-10-12 - Latest snapshot: experimental camera model panel implemented

CURRENT AUTHORIZATION: user approved adding the25-word model to the app for testing
and asked for a model panel. They resumed during final verification. This supersedes
older offline-only/no-app-integration restrictions below; no production-quality
approval, semantic verification or subsecond performance is inferred. Do not ask
again for this experimental integration permission.

Implemented: two-family LiveCamera selector (ViSign25initial when installed, KVSL
topic models available); supported-word disclosure; signed ridge scores and processing
time. ViSign has no topic prerequisite. Captures reuse existing live-jobs/persistent
worker lifecycle. Fixed catalog-loading race; disable picker until loaded, during
capture/jobs/Auto; clear stale results on switch. Camera preview/recording remains
user-initiated. Existing manual3-second countdown+4-second clip and Auto unchanged.

Provider visign-ridge-25 uses pinned .design-cache/visign-baseline-20261012/run1/model.npz,
hash e525679567b115b2a66202f46ac58c079ec1852241902ca9840606f050a08a31.
Uses exact training75-point pack/body-relative16-sampleXY+mask encoder, Holistic0.5
thresholds, independent tracking reset, lazy numeric loader and cached model. Existing
isolated environment only; host remains ML-free. Raw ridge scores are not probabilities.
Less than50%hand-present frames rejects with useful message; unknown/visible-hand idle
still may receive an incorrect word. Source semantics/signer independence unverified.

Checks run:164affected pytest passed29.04s,56Vitest passed, build passed, shell smoke
and run_app.ps1 -SkipBuild -SmokeTest exit0. Actual research worker repeated derived
Chào30-frame reference succeeds with same score; no-hand rejection, legacy W00395 ca,
cancellation/recovery/capture cleanup/worker exit pass. Cold12.93s,warm1.47s processing
observed on one clip, excluding recording/display; NOT physical-camera performance.
Targeted browser3passed35.2s (model switching/signed UI/loading race/real no-hands),
six theme/viewport Axe+overflow checks pass and real screenshots inspected. Full
Dataset/Capture/Auto browser rerun13passed/1opt-in skipped in3.0m; the skipped real
dataset case was then enabled with RECOGNITION_REAL=1 and passed24.8s (W00395 and
cau_hoi via Studio/real worker). All14distinct affected cases passed across those runs.
Panel screenshot rerun1passed15.1s, disabling screenshot animations to avoid theme
transition frames; settled1280light render inspected successfully.

Failures resolved: default pytest temp access denied; repository basetemp failed
intentional DB-outside-source rule; unique OS-temp basetemp passes. npm.ps1 blocked
by policy; npm.cmd works. Initial browser race fixed; test harness now handles Vite
main.tsx query suffix after HMR. Owned initial runner teardown required approved
process-tree cleanup; fresh targeted elevated run exits cleanly. No automatic
approval rejection occurred. Physical webcam not tested this session; user will test.

Changed files: recognition/{experimental.py(new),visign_provider.py(new),contracts.py,
registry.py,worker_client.py,captures.py,service.py,jobs.py,worker.py}; frontend
src/{api.ts,LiveCamera.tsx,Recognition.tsx}; tests/{test_recognition_visign.py(new),
test_recognition_topics.py}; web/tests/{camera.spec.ts,auto-camera.spec.ts,
recognition.spec.ts}; PROJECT_CONTEXT,PROJECT_MILESTONE_TRACKER,CHANGELOG;
docs/{DATA_SCHEMA,RECOGNITION_CONTRACT,ASSET_INVENTORY,VISIGN_IMMEDIATE_DATASET,
SESSION_LOG,WORK_SESSION_HANDOFF}. Production build regenerated, not source edits.

Evidence root .design-cache/visign-app-20261012/: baseline.json,before/,review.py,
probe.py,probe-source.json,worker-probe.json,browser/*.png. Root has no.git; use hash
and direct diff review. Preserve earlier unrelated files, local datasets/checkpoints,
launcher (including preexisting stray2), Qt/sensors/Pi/history/Phase5C and design index.
No new dependency, model retraining, source-label change or new agents.

Final review:23existing durable files changed,3added,no source deletions;250baseline
files unchanged. Generated build index/JS reviewed separately. Direct diffs show no
added whitespace errors; original KVSL manifest, launcher and Figma index unchanged.
Git status/diff/check remain unavailable(no.git), not falsely reported as clean.

Reproduction: .venv Python -m pytest over test_recognition{,_worker,_topics,_persistent,
_captures,_jobs,_visign}, test_vsl_baseline,test_vsl_features,test_dependencies, using
a unique --basetemp under OS TEMP; frontend npm.cmd test -- --run, npm.cmd run build,
npm.cmd run test:e2e -- tests/recognition.spec.ts tests/camera.spec.ts tests/auto-camera.spec.ts;
then RECOGNITION_REAL=1 and tests/recognition.spec.ts -g "real W00395". Smoke:
python -m app.desktop_collector.shell --smoke-test and powershell -NoProfile
-ExecutionPolicy Bypass -File run_app.ps1 -SkipBuild -SmokeTest. See SESSION_LOG for
observed failures/recovery; no production source edit followed the successful build.

Next: user tests the prepared build with physical webcam. No physical camera was
opened or recorded automatically; no user sign accuracy was verified this session.
User test path: run_app.ps1 → Studio → Open Dataset → Live Camera → ViSign25 → Start
camera → Capture sign / Auto on. W00395 belongs to old KVSL model, not ViSign25.
Remaining gate: independent physical-camera accuracy, segmentation and latency;
production replacement is not approved. Model file currently resides in ignored local
experiment storage and must exist for availability; missing pins fail closed.

## 2026-10-12 - Historical snapshot: authorized research baseline trained

CURRENT AUTHORIZATION supersedes older training blockers below: user explicitly
approved offline source-label training before exhaustive manual review. No need to
ask again for this research permission. Source semantics remain unverified; no reviewer
available. Production model replacement still requires quality/independent evaluation,
unknown/idle and physical-camera performance. The realtime product goal remains open.

Delivered: app/desktop_collector/vsl_baseline.py plus tests/test_vsl_baseline.py.
Offline CLI requires --allow-unreviewed-source-labels and new output directory;
rebuilds curation from verified inputs, keeps231quarantined clips excluded. No new
dependencies; existing isolated environment NumPy1.26.4/threadpoolctl3.7.0. No UI,
launcher, production model, sensor/Pi/Phase5C/history/Qt cleanup or new subagents.

Research split:25labels/593clips;360train/116val/117test, known groups kept together.
Original117test members unchanged. Six deterministic train-to-val group moves before
fitting:Chúng ta2,Uống2,Giúp1,Xin lỗi1; every class has at least two validation groups.
Recorded changes live in split.json; earlier curation/proposals remain untouched.
Feature encoding:16nearest temporal samples, body-relative XY+presence masks(3600).
Ridge least-squares classifier, train-only normalization/targets, validation-select
alpha0.1/1/10/100; alpha10 wins. No retrain using validation or test-guided tuning.

Actual source-label metrics: train accuracy100%; validation76.72%,macro-F1 0.7322;
test95/117=81.20%,macro-F1 0.6954,balanced accuracy70.93%. Majority baseline5.13%.
Test recall0 for Chúng ta(2),Có thể(1),Xe đạp(2),Xin lỗi(1); tiny class supports,
unverified source labels and unidentified signer/recording overlap limit interpretation.
Classifier-only median0.0318ms/p950.0341ms is NOT full physical latency. No unknown
rejection/calibration: ridge scores are not probabilities. No app deployment approved.

Evidence root: .design-cache/visign-baseline-20261012/
- run1/run-input.json: research exception/config/source receipt.
- run1/split.json: fixed experiment membership and explicit moves.
- run1/model.npz:502,667bytes,mean/scale/weight/bias/Unicode labels,allow_pickle=false.
- run1/report.json:complete metrics/confusion matrices/grid/model hash/package versions.
- run1/predictions.json:all593 predictions; run1/review-priority.json:validation only.
- review-shortlist.html/.csv:51validation clips(27mismatches+24sampled matches), pending
  semantics. Predictions do not replace labels. Browser playback untested.
- verify_and_review.py,verification.json:saved-model reproduction and source-code hash.
- baseline.json,before/,review.py:273-file baseline,final-review.json/review.diff after
  final check. Root has no.git; preserve user files and all earlier experiments.

Checks actually run:13targeted tests passed2.54s; full affected pytest147passed18.21s
(vsl_baseline,curation,features,feature_review,candidate_manifest,data_audit,kvsl_manifest,
dependencies). Actual training CLI succeeds. Reloaded model reproduces all593predictions
and metrics; train-only means, original test membership and known-group separation
verified. Original KVSL manifest hash unchanged. Verification script initially lacked
repo import path; corrected and successful rerun. No runtime/frontend/physical-camera
tests rerun for isolated offline code. No accuracy/latency claim for actual new users.

Changed durable files: added app/desktop_collector/vsl_baseline.py,
tests/test_vsl_baseline.py; updated PROJECT_CONTEXT.md,PROJECT_MILESTONE_TRACKER.md,
CHANGELOG.md,docs/DATA_SCHEMA.md,docs/VISIGN_IMMEDIATE_DATASET.md,
docs/VSL_DATA_QUALIFICATION.md,docs/SESSION_LOG.md,docs/WORK_SESSION_HANDOFF.md.

Next work: use validation-only priorities to investigate failure modes/labels; acquire
independent real-person and idle/unknown evaluation before app integration. Test results
are now inspected, so future tuning needs fresh independent confirmation. Research can
continue under current permission; do not reinstate exhaustive review as its prerequisite.
Do not promote81.20% to deployment readiness or hide weak classes. Full details and
exact reproduction command are in docs/VISIGN_IMMEDIATE_DATASET.md.

## 2026-10-12 - Historical snapshot: group curation complete; no VSL reviewer available

Authorization: user asked to continue data work and explicitly answered that no VSL
reviewer is currently available. Continue technical work within the data gate; do not
infer semantic approval or change the production model. Product goal remains20–30
signs, no mandatory topic and under1000ms actual-end-to-display; still undelivered.

Delivered: offline `vsl_curation` CLI and tests. Source video hashes are rechecked,
group proposal recomputed from actual verified NPZs, and RGB diagnostic tied to source
and threshold. Any flat frame or <50% hand coverage quarantines the entire connected
group. Remaining clips retain previous proposed assignments; no source alteration or
automatic trimming. Output uses `visign-curation-review-v1`, training_ready=false.

Actual result:231 quarantined,593 screened_pending_semantics,821 groups/824 total clips.
Proposal366train/110val/117test. Only23 labels have all three partitions; Chúng ta6/0/2
and Uống9/0/3 lack validation. Even nonempty small partitions are not strong evaluation.
All semantic/boundary/tracking decisions remain pending. Prior proposal is preserved
as historical evidence, not frozen or deployed. See docs/VISIGN_IMMEDIATE_DATASET.md.

Current evidence: `.design-cache/visign-curation-20261012/`
- curation.json: source receipts, group decisions, per-clip flags and class coverage.
- review/index.html plus25 word pages: local original-video players, technical flags.
- review/annotations.csv:824 rows for a future reviewer; no filled approval decisions.
- review/pack-receipt.json, pack-verification.json: receipts and local reference checks.
- build_review_pack.py, verify_pack.py: successful local cache report generators/checks.
- baseline.json,before/,review.py:271-file baseline; final-review.json/review.diff after
  final check. No root.git; preserve existing user files and all earlier data artifacts.

Changed durable files: added app/desktop_collector/vsl_curation.py and
tests/test_vsl_curation.py; updated docs/DATA_SCHEMA.md, docs/VISIGN_IMMEDIATE_DATASET.md,
docs/VSL_DATA_QUALIFICATION.md, docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md,
PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md and CHANGELOG.md.

Checks actually run: final `.venv` pytest over tests/test_vsl_curation.py,
test_vsl_features.py, test_vsl_feature_review.py, test_vsl_candidate_manifest.py,
test_vsl_data_audit.py, test_kvsl_manifest.py, test_dependencies.py:
134passed34.45s (earlier targeted18, affected131). Full real-data curation and CLI help
pass. Pack builder verified824source video hashes. Pack checker verifies26HTMLpages,
824local video refs,824CSVrows, pending review fields, artifact hashes and original
KVSL manifest hash. Browser playback/actual visual render not tested. No app frontend,
bridge or physical camera tests rerun; no realtime/accuracy claim. RGB diagnostic pixels
are not redecoded by the curation CLI; its exact source/rule/structural coverage is checked.

Preserved scope: no model training/integration, UI/topic selector/launcher changes,
production dependencies, source video edits, sensor/Pi/Phase5C/history/Qt cleanup,
external messages or new subagents. Only existing isolated ML environment is used.

Remaining gate: qualified VSL semantic and boundary review is unavailable today. Local
review pack is ready; no pending reviewer answer or automatic approval. Independent
evaluation, sparse/missing validation classes, unknown/idle data, source provenance,
color casts and transformed duplicate families remain unresolved. Do not mark593clips
clean or25words frozen. Next useful work is acquiring valid annotation/evaluation
evidence or a user-approved change to the research scope; do not repeatedly rerun the
same extraction or silently substitute model predictions for human ground truth.

## 2026-10-12 - Historical snapshot: full feature extraction; source quality needs curation

User authorized continued implementation and resumed the interrupted session. Product
goal remains20–30 Vietnamese signs, no required topic selection, stable realtime with
under1000ms actual gesture-end-to-display. This turn completes technical preparation
and triage, not the product goal or training/data acceptance gate. No new agents used.

Delivered: reusable offline vsl_features and vsl_feature_review CLIs, numeric feature
contract with explicit missing-point masks, exclusive output publication, conservative
grouping and an unfrozen development split. Existing isolated MediaPipe0.10.14 only;
no new production dependency. Data source remains the locally pinned ViSign archive.

Measured full pilot:824clips/24,653frames;19,236frames with either hand,22,229pose,
15,561left,17,989right. Eight no-hand clips;143below50%hand coverage;327below80%.
Three conservative close-image pairs (Cứu,Trường học,Thức ăn) yield821groups and a
preliminary510train/153val/153test/8quarantine proposal. No signer IDs or independent
evaluation established; no final vocabulary or training permission inferred.
Source inspection14clips/four frames each reveals flat-color/black frames and blue cast.
Full RGB scan finds2,422 near-uniform frames in188clips, including88with >=50%hand
coverage. Union flat-frame/low-hand flags:231clips. Remaining593are NOT approved clean.
The group proposal does not incorporate RGB flags and MUST NOT be frozen as-is.

Evidence root: .design-cache/visign-features-20261012/
- run2/features/*.npz and run2/feature-report.json:824 verified artifacts, complete.
- group-review.json: diagnostic connected groups and unfrozen partition assignments.
- quality-summary.json and rgb-quality.json: full/per-label counts, exact frame flags.
- manual-review.csv:824 paths with coverage, proposed group/split, flat-frame indices,
  high priority for231clips; semantic/boundary/tracking review remains pending.
- review-frames.jpg/.json: actual source frames and provenance, not semantic approval.
- extraction-stderr.log: first process pool failed BrokenProcessPool; run1 has no
  final report. Preserved; do not combine with successful run2.
- audit_rgb.py, summarize.py, inspect_frames.py: completed local diagnostic scripts.
- baseline.json,before/,final-review.json,review.diff: hash/direct review, no root.git.

Exact durable changed files:
- Added app/desktop_collector/vsl_features.py, app/desktop_collector/vsl_feature_review.py.
- Added tests/test_vsl_features.py, tests/test_vsl_feature_review.py.
- Updated docs/DATA_SCHEMA.md, docs/VISIGN_IMMEDIATE_DATASET.md,
  docs/VSL_DATA_QUALIFICATION.md, docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md,
  PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md.

Checks actually run:
- .venv Python pytest tests/test_vsl_features.py tests/test_vsl_feature_review.py
  tests/test_vsl_candidate_manifest.py tests/test_vsl_data_audit.py
  tests/test_kvsl_manifest.py tests/test_dependencies.py -q:
  113passed in26.14s (final run; earlier runs17,30,111passed).
- Both new CLI --help paths pass without ML imports in collector environment.
- Full extraction complete; full review validates824NPZhashes/shapes/masks/finite values,
  annotations, exact source receipt and frame indices; local RGBscan/summary pass.
- All824source candidate hashes and original KVSL manifest pin reverified unchanged.
- Git status/diff/diff--check attempted; unavailable because root lacks.git. Use direct
  baseline comparison:8modified,4added,259unchanged,0deleted,0added whitespace errors;
  do not claim clean Git. No frontend/full-app/physical-camera
  test rerun for isolated offline tools. No realtime or recognition-accuracy measurement.

Remaining risks: transformed/repeated recordings may evade conservative visual matching;
no signer/session provenance, upstream license chain or qualified sign annotation review;
poor frames/color casts, missing tracking, no idle/unknown coverage. Flatness is a
diagnostic threshold, not a reason to invent repaired frames or trim unknown boundaries.
training_ready=false. No model training, runtime integration, UI/topic selector change,
launcher cutover, Phase5C/history/sensor/Pi/Qt cleanup. Preserve source archive/videos,
original models/pins, existing user files and all previous failed-run evidence.

Next gate/action: curate the231flagged clips, review semantic correctness and boundaries
with a VSL-competent reviewer, refine recording groups, choose/freeze eligible vocabulary
and development splits with explicit limits, and define separate real-person evaluation
plus idle/unknown inputs. Technical extraction is complete; do not restart it or wait
for VSL400. Any extraction variant needs a bounded measured comparison and new run path.

## 2026-10-12 - Historical snapshot: immediate RGB dataset downloaded and checked

Latest user constraint: needs Vietnamese sign dataset usable now; waiting10business
days for VSL400 is too long. User resumed the interrupted search/download. VSL400 is
optional and must not block the main route. Actual RGB is now available locally.

Delivered data: star092304/ViSignLanguage-Video at HF commit
906306d7cc9c684b034bc8e96494ce9a99bc1bfc, public/no authentication. Complete archive
863,939,416bytes downloaded and verified against published SHA256
cdfec1080e8b75cf10a972a4d7cf54fcfa4bf1b874002d28eae8405188a2a308.
All8,364MP4 entries decode;6,137 unique files/pixel sequences. Train3,875 entries /
100labels /2,776 distinct sequences. Public_test1,630 and private_test2,859 are present
in this public archive but carry no word labels; exclude them from supervised metrics.
There are156 exact pixel groups overlapping train and unlabeled folders. Two training
pixel groups conflict (Chào/Chậm lại; five paths). No independent source split is claimed.

Local root: .design-cache/vsl-immediate-20261012/. Key files:
- visign-dataset.zip and download-receipt.json: immutable source/provenance.
- videos/<sha256>.mp4: unique extracted bytes, no source video transformation.
- labelled-videos.csv: readable Vietnamese labels, source IDs, paths, frames and hashes.
- local-pilot.json:25proposed labels /824 distinct, nonconflicting video sequences,
  duplicate aliases, provisional filename-family hints, signer_id/training_split null.
- archive-audit.json: complete decoding and duplicate evidence. Directory-bucket counts
  include unlabeled folders; only local-pilot.json determines actual class counts.
- landmark-probe.json; sample-contact-sheet.jpg/.json:25clip probe and16actual midpoint
  frames. These do not constitute qualified annotation approval.
- download_visign.py, audit_archive.py, prepare_local_pilot.py, probe_landmarks.py,
  verify_delivery.py: local bounded inspection scripts, not production integrations.

Labels: original archive folders agree with all100 labels from the primitive
label_mapping.pkl dictionary. Only whitelisted string/int pickle opcodes inspected;
never unpickled or executed. Local index normalizes UnicodeNFC; CSV's828 mismatching
label/file joins are not silently repaired. Archive/CSV remain untouched.

Checks actually run and passed: archive SHA256, ZIP CRC while reading MP4s, all unique
video decoding with frame-count agreement, all6,137 extracted file hashes, local CSV
3875/100 counts, candidate824/25 uniqueness and exclusion of cross-label duplicates,
unchanged original KVSL manifest hash. MediaPipe0.10.14 existing isolated environment
probe25clips/750frames: pose636, either-hand593, allclips at least some hand detections;
lowest coverage7/30. Technical detection availability only, not recognition accuracy.
All local scripts completed successfully. No new production dependency or source code.
App/backend/frontend tests not rerun for this data/docs task; historical82tests below
belong to the previous candidate-tooling change, not this turn.

Changed durable files: new docs/VISIGN_IMMEDIATE_DATASET.md; updated PROJECT_CONTEXT.md,
PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md, docs/SESSION_LOG.md,
docs/VSL_DATA_QUALIFICATION.md and this handoff. Final hash/direct review:6 existing
files changed,1added,260baseline files unchanged,0deleted,0added whitespace errors.
Root git status exits128 and git diff/diff --check exit129 (no .git). Evidence:
baseline.json, before/, delivery-verification.json and review.diff. No clean Git claim.

Failures/resolution: earlier download was not executed due to automatic approval-review
usage limit. After resume, explicit escalated retry succeeded (147.2s download). No bypass.
visl_98 public API returned401, so unavailable; no further access attempt. Previous
agents hit usage limits; no new agent delegation on resume. No messages sent to owners.

Remaining limits and next gate: source card declares CC-BY4.0 and PTIT provenance;
upstream rights/participant chain not independently verified. No signer/session IDs,
no qualified semantic review, unknown near-duplicate families, low-resolution/missing
landmarks, no idle/unknown-sign coverage. The25words are a separate proposed RGB pilot,
not a replacement model map or the earlier VSL-GH list. Data is usable for local research
preparation now. Next: review selected signs, qualify extraction over824clips, establish
recording-group development splits with honest limitations and independent real-person
evaluation, then train. Do not wait for VSL400, randomly split duplicates, claim unseen-
signer accuracy, or silently close the quality gate. training_ready remains false.
No model training, topic-free UI change, physical latency proof, launcher change,
Phase5C/history/sensor/Pi/cutover. The original realtime product goal remains unfinished.

## 2026-10-12 - Latest snapshot: candidate index verified; data gate still open

User resumed the authorized realtime/data work. Goal remains 20-30 signs, no mandatory
topic choice, under 1000ms actual-end-to-display, with better real-user accuracy.
This session delivers preparation tooling and evidence, not that product outcome.
User asked whether a dataset was already available after the VSL400 identity question.
Explained public KVSL/VSL-GH limitations; no personal details supplied and no signature
or external request sent. VSL400 remains an additional route, not the only option.

Changed files (11): added app/desktop_collector/vsl_candidate_manifest.py and
tests/test_vsl_candidate_manifest.py; updated docs/DATA_SCHEMA.md,
docs/VSL_DATA_QUALIFICATION.md, docs/VSL_DATA_ACCESS_REQUEST.md,
docs/REALTIME_RECOGNITION_FEASIBILITY.md, docs/SESSION_LOG.md, this handoff,
PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md and CHANGELOG.md.

Delivered behavior: offline segment review index with unchanged source splits,
metadata Git-blob verification and SHA-256 input receipts. Excludes groups with
conflicting full annotations, split/signer leakage or shared quarantined metadata
before label filtering. Compatible exact copies retain aliases; repeated gloss tokens
have distinct recording-ID/boundary-index identities. No slicing/training. Outputs
remain review_only and training_ready=false. Tree SHA is not a verified commit identity.
The preparation_review agent completed two read-only reviews and identified that
provenance distinction; the final code/report incorporates it.

Real result: 3279 annotation segments for 25 proposed glosses from 2037 canonical
feature records; train/val/test = 2801/240/238 segments. Ten conflicting groups (23 rows)
excluded; 30 compatible groups collapsed (39 aliases). These are source-wide group
counts. Metadata segments are not verified video clips or independent recordings.
The earlier 2100 structurally invalid rows remain quarantined. No source media edited.

Commands/results actually run:
- .venv Python -m pytest tests/test_vsl_candidate_manifest.py tests/test_vsl_data_audit.py
  tests/test_kvsl_manifest.py tests/test_dependencies.py -q, with fresh --basetemp
  .design-cache/vsl-data-preparation-20261011/pytest-affected-2: **82 passed in 15.90s**,
  including22 new tests. Earlier focused22 and affected82 runs also passed.
- python -m app.desktop_collector.vsl_candidate_manifest --help: pass.
- Real-data CLI using paths in VSL_DATA_QUALIFICATION.md: pass; final v2 rerun unchanged.
- verify_result.py: every segment/alias matches source boundaries, IDs are distinct,
  all25 labels present, candidate signer/blob splits disjoint, excluded rows absent,
  original KVSL manifest SHA-256 unchanged. No added-line whitespace errors or deletions.
- git status --short exits128; git diff --check and git diff exit129: no root .git.
  Hash/direct review instead: 9 existing files changed, 2 added, 255 baseline files unchanged.
- Shell/UI/build checks not rerun: no app runtime/frontend changes. Affected smoke is
  actual CLI execution; older shell evidence below is historical, not rerun this session.

Evidence: .design-cache/vsl-data-preparation-20261011/ (folder began before interruption).
Use candidate-segments-v2.json, SHA-256
6ad0d3cee1d7bbf72a904d17e7f744b588f950e685051992e60819da7cac1f15.
v1 is superseded only for tree-vs-commit terminology. baseline.json, before/,
review.diff, final-review.json and verify_result.py retain the review trail. pypdf is
only in ignored temporary tooling, not app dependencies. Read the cached three-page
VSL400 PDF; actual form fields are in the request note. Dataset-page refresh returned
HTTP429; agreement page succeeded. GitHub API commit lookups were inaccessible;
no source access or commit verification inferred. One multi-file doc patch failed
context matching atomically, then was reapplied with the correct anchor.

Unverified/risks: original RGB/qualified sign-label review, full feature decode/shape/
bounds beyond the prior30-array spot check, frame boundary convention, near-duplicates,
signer provenance, use terms, idle/unknown examples and target-camera generalization.
MỆT/ĂN each have only one validation/test example. CHỜ/ĐỢI and regional variants remain
separate; the 25-word vocabulary is proposed, not a frozen runtime model map.

Next gate: obtain inspectable original RGB and trustworthy labels, resolve annotation/
feature semantics and rights, add adequate independent evaluation and unknown/idle data,
then freeze vocabulary/groups before training. VSL400 requires real applicant details,
user acceptance/signature and provider access; do not send without explicit messaging
authorization. Public-source review can proceed independently. Existing models,
runtime, launcher and source data are preserved. Phase5B physical gate stays open;
no Phase5C/history/sensors/Pi/cutover scope is opened by this data step.

## 2026-10-11 - Latest snapshot: data qualification code verified; data gate open

User authorized proceeding on data, resumed after interruption, and selected source
quality before regional preference. Work delivered: offline vsl_data_audit.py, its
tests, DATA_SCHEMA contract, VSL_DATA_QUALIFICATION.md and VSL_DATA_ACCESS_REQUEST.md.
Updated context/tracker/log/changelog and feasibility cross-reference. No production
runtime, dependencies, models, launcher, UI or sensor behavior changed.

Changed files in this data step: app/desktop_collector/vsl_data_audit.py;
tests/test_vsl_data_audit.py; docs/VSL_DATA_QUALIFICATION.md;
docs/VSL_DATA_ACCESS_REQUEST.md; docs/DATA_SCHEMA.md;
docs/REALTIME_RECOGNITION_FEASIBILITY.md; docs/SESSION_LOG.md;
docs/WORK_SESSION_HANDOFF.md; PROJECT_CONTEXT.md; PROJECT_MILESTONE_TRACKER.md;
CHANGELOG.md. Hash review: 253 baseline files unchanged, no deletions; added-line
whitespace and pinned manifest hash verified. Git status/diff unavailable (no root .git).

Evidence: .design-cache/realtime-data-20261011/ (baseline predates these changes).
Use multi-vsl-audit-v2.json, vsl-gh-audit-v2.json and candidate-25-v2.json; first report
versions predate signer-ID normalization / unique-feature-count enhancements.
Reports intentionally set training_ready=false; consistent metadata is not semantic
approval. Source files are untouched; no full dataset import, model training or
message to dataset owners occurred. Root .git remains absent; use hash/direct review.

Findings:
- Multi-VSL listing: 1000 videos, 352 center (248/40/64 train/val/test); no center class
  appears in all three splits. A 1100-item request was rejected; do not assert listing
  completeness. Three sample videos fully decode. Full data and gloss mapping pending.
- AAGCN table: 1000 text rows, duplicate ID columns agree; mapping 1-1000 to Multi-VSL
  0-999 is unconfirmed. Do not apply an assumed offset.
- VSL-GH: 2100 consistent / 2100 quarantined rows. First subset has 40 duplicate groups
  covering 92 paths. 30 NPYs (five sentences x six signers) match Git blobs, contain
  finite (T,411) arrays and in-range boundaries. No source RGB/semantic review yet.
  Proposed 25 words have very uneven coverage; some only one validation/test example.
- VOYA: 161 archive files versus 4363 label entries; bounded header probe of one
  archive finds only sequences/labels, no signer/original-recording groups. Not an
  independent evaluation source without provenance.
- VSL400: controlled access requiring applicant's completed agreement. Public PDF
  cached unchanged; local request paragraphs prepared, not sent/signed.

Checks actually run: 60 pytest tests pass in 15.61s (audit + manifest + dependencies);
CLI help and both real-data audits run; identical rerun no-op. Shell smoke sandbox
run had read-only SQLite shutdown error despite exit0; elevated rerun passes exit0.
No frontend checks rerun because no frontend change. No accuracy or physical latency
claim. Three subagents hit service limits; reported results were completed by root.

Next gate: obtain inspectable full/source data, resolve semantics/usage terms and
feature contract, review candidate vocabulary, freeze independent signer/recording
groups, add idle/unknown data, then train/evaluate. Publisher access/signature requires
the user's participation; request note is ready. Existing Phase5B physical gate and
wrong-word report remain unresolved. Do not treat this audit as product completion.

## 2026-10-11 - Latest snapshot: authorized realtime work and project dataset scan

Latest user instruction: scan the project for their additional VSL videos. Completed
read-only inventory of accessible project files, 66 ZIP/RARs and two nested ZIPs:
no separate labeled dataset found. One old pytest temp directory is inaccessible.
KVSL has 45 exported reference videos; pinned manifest has 169 recordings, one per
175 topic-local classes, zero signer/split metadata. Do not count UI test media.

Earlier in this same work, user explicitly authorized implementing 20-30 common signs,
no mandatory topic and <1000ms actual-end-to-display target, and supplementary data
research. Requirements-only restrictions in older entries are historical, not a new
request for permission. Data qualification remains a real prerequisite, not yet met.

Executed prototype reuses existing isolated MediaPipe: full-resolution feature parity
on W00395/D0098; mean extraction 35-37ms/frame; final tensor/model 9-15ms across runs;
20-second 15Hz replay each resolution processes 299/300, maximum one pending frame.
This excludes real camera, transport, boundary and UI latency; no accuracy claim.

New durable report: REALTIME_RECOGNITION_FEASIBILITY.md. Updated context, tracker,
changelog, session log and this handoff. No new production code/dependency/model/UI
changes in this step. Scripts/results and downloaded public metadata live under
.design-cache/realtime-feasibility-20261011/. Benchmark exited 0; archive/metadata
checks executed. Application tests were not rerun for this docs/diagnostic step.
Initial script/schema errors and restricted network retry are recorded in report.
No root .git; use baseline hash/direct review rather than claiming a clean Git diff.

Multi-VSL pinned center CSVs: 20161/3713/4538 train/val/test, 1000 classes, disjoint
21/4/5 signer IDs. Full RGB access, text gloss mapping and use terms unresolved.
VSL-GH pinned metadata: 4200 rows; 2100 empty sequence labels, 2092 sequence/boundary
conflicts, 8 missing boundaries; source tree has keypoints but no RGB. Do not train
blindly from these files. No external code executed and no full video set downloaded.

Next: qualify data access/labels and choose vocabulary; only then train/evaluate a
unified classifier and integrate streaming. Current physical wrong-word report is
unresolved. Phase5B final report and physical gate remain pending. Existing baseline,
user files, model pins, launcher and raw data are preserved. Details and evidence:
[feasibility report](REALTIME_RECOGNITION_FEASIBILITY.md).

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

## Tests

- Backend affected suite: 182 passed, two existing Starlette/AnyIO deprecation warnings.
- Frontend unit: 37 passed, including ten camera lifecycle/permission/countdown/cancel tests.
- TypeScript + Vite: PASS, 121 modules.
- Browser: camera.spec.ts + recognition.spec.ts, eight passed, one opt-in real dataset
  test skipped. Camera test uses fake browser media and real backend/worker.
- Real API cleanup/regression probe: PASS after race correction; VFR real worker: PASS.
- Shell --smoke-test: exit 0; headless lifecycle, not native visual acceptance.
- Physical webcam: preview/record observed before fix; complete final recognition unverified.

Commands: repository `.venv/Scripts/python.exe -m pytest tests/test_recognition_captures.py
tests/test_recognition_persistent.py tests/test_recognition.py tests/test_recognition_worker.py
tests/test_recognition_jobs.py tests/test_recognition_topics.py tests/test_dependencies.py
tests/test_server.py tests/test_kvsl_manifest.py -q`; web `npm.cmd test`, `npm.cmd run build`,
`npx.cmd playwright test camera.spec.ts recognition.spec.ts --trace off`;
`.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase5a/lifecycle.py`.

## Files Changed

Backend: server/app.py, server/recognition_routes.py.
Recognition: new captures.py; contracts.py, jobs.py, persistent_client.py, service.py,
worker.py, worker_client.py. Frontend: new camera.ts/LiveCamera.tsx; api.ts,
Recognition.tsx, Studio.tsx, studio.css. Tests: new test_recognition_captures.py,
camera.test.ts, camera.spec.ts; recognition.spec.ts regression assertions/evidence path. Documentation: context, tracker, changelog, session log,
handoff and recognition contract. Local evidence: kvsl-phase5a baseline, scripts,
runtime JSON, cleanup/results, browser renders, report and final review.
Generated web build/tsbuildinfo refreshed separately; not authoritative source.

## Problems Found

Sandbox denied pytest OS temp access; scoped elevated run passed. First API test expected
401 without Origin, corrected to actual secure 403. PowerShell piped test generation
lost Vietnamese text; fixed fixture Unicode. An early npm exec invocation misparsed
flags and hung in test-runner teardown; its exact owned process tree was stopped.
Preview needed explicit play and waiting for frames, not just granted getUserMedia.
Early hot reload disrupted a long browser run. Edge fake-media had frame/disconnect
instability; software-rendered test launch passed, production flags unchanged.
OpenCV WebM FPS=1000 required PTS-based live timing. A repeated shutdown probe exposed
temp-root deletion racing terminal file removal; serialized cleanup fixed it.
Native Camo/USB availability remains inconsistent; no fabricated hardware PASS.


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

### Phase 4 handoff verification and changed files

Only the six canonical docs carrying this entry and new docs/KVSL_EVALUATION.md changed.
No durable runtime source or tests changed. Local evidence tests: six PASS. Audit,
quality scan, one real persistent diagnostic and evidence reconciliation each exited 0.
Exact commands/results are in docs/KVSL_EVALUATION.md; final-review.json records scoped
hash/diff review and script hashes. Previous phase test counts below are historical.
No frontend suite/build, broad backend suite, external public retrieval, held-out model
evaluation, full missing-asset decode, semantic sign adjudication or signer audit by
appearance was performed. Current accuracy evaluation eligibility is zero, not 49 or 175.
The retained 47 compatibility probe memberships reuse prior results explicitly; only
D0532 was freshly inferred. No failures are hidden and no next task has started.

## 2026-10-10 - Current: Phase 3A PASS WITH FIXES

Current user authorization: attached Phase 3A persistent-worker request and subsequent
continue messages. This supersedes older proposed Phase 3A language below. Prior
phases were not repeated. No next roadmap task has been started or implicitly approved.

### Delivered behavior and decisions

Studio → existing API → RecognitionJobService → RecognitionService → lazy
PersistentRecognitionWorkerClient → long-lived isolated ML Python → cached verified
provider → PredictionResult. One execution at a time; no new HTTP server or dependency.
Collector torch/mediapipe/torch_geometric remain absent and unimported.

New worker-v2 handshake/JSONL lifecycle, ID-only prediction frames, trusted paths only
at startup. Existing one-shot worker-v1 remains for internal compatibility. All data,
feature, preprocessing, model/vocabulary/provider and manifest contracts remain pinned.
Holistic constructed once, graph reset between clips. Models load lazily and remain
verified worker-lifetime snapshots; at most ten registry entries, no preload/eviction.
Disk changes are not loaded into an existing cached model; restart still enforces pins.
Existing API preflight continues rejecting changed disk hashes independently.

Windows venv Python launches another interpreter. New suspended launch + kill-on-close
Job Object owns the launcher and descendants before code runs. Actual interpreter PID
is validated as a member of that job. Cancel/timeout/corruption terminates and reaps the
worker tree; next request starts fresh, without silently retrying current inference.
Server/job/CLI teardown closes idle workers too. Cleanup errors do not falsely produce
cancelled status. Pipe I/O and waits are bounded. Full protocol/lifecycle/cache and
teardown bounds are in docs/RECOGNITION_CONTRACT.md, current Phase 3A section.

Diagnostic compatibility: quality.worker_exit_status is null for a live worker, never
a fabricated exit 0. Quality/latency metadata adds cache/feature/load/startup evidence.
Public route shapes, job states, ownership, auth and frontend behavior are unchanged.

### Measured results

Units: milliseconds; limited local observations, not benchmark accuracy or real-time.

| Sample / case | Old one-shot total | Persistent total | Notes |
| --- | ---: | ---: | --- |
| W00395 do_vat cold | 10438.971 | 8857.992 | 3636.546 cold-start ms |
| W00395 same-provider warm | 10438.971 | 5309.367 | 49.1% reduction, cache hit |
| D0098 cau_hoi first use | 8953.338 | 5122.447 | New lazy provider, same worker |
| D0098 warm | 8953.338 | 4997.572 | 44.2% reduction, cache hit |
| W00395 return | 10438.971 | 5254.486 | Previous provider reused |
| D0532 so_dem first use | Not remeasured | 4203.597 | Known 5 / 3 / 8 ordering preserved |

Baseline measured before production edits: imports ~4496/3339ms, preprocessing
~5216/4982ms, forward ~30.7/5.1ms. The baseline shutdown tail includes parent response
validation (~471/435ms); do not relabel it as a pure OS shutdown measurement.
Remaining warm bottleneck is video preprocessing (~5s). Six normal requests used one
process with three cache misses and three hits. No all-topic benchmark or preload.

W00395 top-three unchanged: ca .43561261892318726, cày .13568049669265747,
bộ sách .1329399198293686. Separate old-source/current/repeated preprocessing comparison:
(60,65,3) → (65,180), maximum float32 difference 0; masks/timestamps identical.
D0098 mapping/scores and D0532 known model error are preserved, not repaired in code.

Memory, Windows working set/private committed (MiB): startup 324.09/1260.50;
after first complete prediction 538.67/1520.52; after three providers 544.34/1524.79.
Separate model-only probe: ~316.84/1252.39 at startup, 350.64/1303.26 with one model,
366.54/1321.82 with three. Parameters 732240/721960/739436 bytes. Model deltas include
other runtime allocations; these are not private-working-set measurements. Lazy
registry-bounded cache is appropriate; long-duration RSS/ten-model residency untested.

Real authenticated cancellation: 47ms, worker terminated, next prediction succeeded
in a fresh process. Real crash and .25s timeout: current job failed, next real job
succeeded after restart. Running+queued server shutdown: 187ms, both jobs cancelled,
executor/server stopped, port rebind succeeded. Retained Windows handles prove all
four actual ML interpreters and their launchers exited; no orphan claim based solely
on Popen launcher status. Evidence: worker-lifecycle.json.

### Fresh commands and verification

1. `.venv/Scripts/python.exe -m pytest tests/test_recognition_persistent.py tests/test_recognition.py tests/test_recognition_worker.py tests/test_recognition_jobs.py tests/test_recognition_topics.py tests/test_dependencies.py tests/test_server.py tests/test_kvsl_manifest.py -q`
   — final **168 passed**, 56.94s, two existing Starlette/AnyIO deprecations. Includes
   31 new persistent tests plus a job cleanup-failure regression; fake processes are
   lifecycle evidence only. Tests cover handshake, serial/switching/correlation,
   malformed/oversized/duplicate output, blocked input, bounded stderr, timeout/cancel/
   restart/crash/shutdown, whitelist/path rejection, caching and fresh-process ML guard.
   External-temp tests used scoped escalation; no security invariant was weakened.
2. `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase3a/measure.py`
   — six real predictions, one worker, unchanged scores, graceful worker exit 0.
3. Isolated extraction-env Python: `.design-cache/kvsl-phase3a/parity_memory.py`
   — exact feature parity and three-provider memory probe. Rerun captured by collector
   subprocess.run confirmed child exit 0 in parity-process.json; native stderr benign.
4. `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase3a/lifecycle.py`
   — final real API cancel/crash/timeout/restart/shutdown all passed, script exit 0.
5. `.venv/Scripts/python.exe -m app.desktop_collector.shell --smoke-test`
   — exit 0. Headless runtime lifecycle, not native visual/DPI acceptance.
6. From web, `RECOGNITION_REAL=1; npx.cmd playwright test --config D:/Smart-Gloves/.design-cache/kvsl-phase3a/browser/playwright.config.ts --trace off`
   — **8 passed**, 48.0s. Ignored copy of existing recognition.spec.ts changes only
   import/root/evidence paths and two worker_exit_status expectations to null.
   Durable frontend tests/source untouched. After final protocol hardening the same
   command with `--grep 'real W00395'` passed **1 test**, 33.5s, real do_vat and cau_hoi
   through Studio/API/jobs/ML/UI; shell bridge teardown exit 0. No authenticated traces.
7. npm test/build not rerun: frontend implementation and dependencies untouched.
   No newly claimed Vitest/build/native visual result. Browser evidence is actual UI.

### Changed files

Runtime: app/desktop_collector/recognition/{contracts.py,worker_client.py,worker.py,
service.py,jobs.py,cli.py}; new persistent_client.py and process_group.py.
Tests: new tests/test_recognition_persistent.py; tests/test_recognition_jobs.py.
Documentation: PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md, docs/RECOGNITION_CONTRACT.md.
Local ignored evidence: .design-cache/kvsl-phase3a/ baseline copies/hash index,
baseline-latency.json, persistent-latency.json, memory.json, real-regression.json,
parity-process.json, worker-lifecycle.json, browser evidence, REPORT.md, source.diff
and final-review.json. No runtime dependency on Phase 3A evidence.

### Problems encountered and review limits

Windows launcher PID mismatch required whole-tree ownership rather than a direct
PID-equality handshake. Test harness initially used an absolute executable path; fixed
to the existing relative-path contract. Sandbox pytest temp access was denied; an
in-repo basetemp then correctly failed identity-storage policy. Scoped external-temp
runs passed. A PowerShell native-stderr invocation displayed exit 1 despite successful
parity output; subprocess capture independently confirmed exit 0. Read-only upstream
Git initially reported sandbox ownership mismatch; exact command-scoped safe.directory
resolved it without global config edits. No automatic approval rejection occurred.

Root still has no .git: no root clean-status claim. Hash/direct diff replaces root
Git review. Upstream status/diff-check empty and exit 0. Final-review.json lists all
durable changes, unchanged protected references and preserved manifest hash. No
frontend/build/assets/registry/dependency/launcher/hardware files were intentionally
changed. No commit, push, merge or release was requested or performed.

Final review: 13 existing files changed, three new files, no deletions, 264 baseline
files unchanged. All 16 direct no-index whitespace checks produced no diagnostics;
exit 1 denotes the expected content difference. The audit script initially treated
that as failure, then treated CRLF as trailing whitespace after disabling autocrlf;
fixed its command-local CRLF-aware check without reformatting source. Manifest hash
is unchanged and a fresh bind confirms browser Vite port 5173 was released.

### Remaining risks and next gate

License/redistribution unknown; signer identity unknown; official split unknown;
training overlap unknown; generalization unknown; scores uncalibrated. LSTM and
continuous sign segmentation unresolved; sensor recognition, Raspberry Pi deployment,
production packaging and non-Windows persistent lifecycle unverified. Native PyWebView
visual/DPI and human screen-reader checks were not performed. Long-duration runtime
memory behavior and all-ten-model residency were not measured. First use/recovery is
still cold; video preprocessing remains several seconds. Desktop-local Phase 0 asset
paths still need a separately authorized packaging plan. No accuracy or real-time claim.

**Next gate is the user's priority decision:** A hardware/sensor phase, B recognition
UX/video preview, C model evaluation/data quality, or D Raspberry Pi preparation.
Recommend C to establish trustworthy evaluation provenance; do not start automatically.
Existing unrelated visual, hardware/capture, Qt cleanup/cutover and release gates remain.

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

### Changed files

- app/desktop_collector/recognition/: adapter.py, cli.py, contracts.py, jobs.py,
  service.py, worker.py, worker_client.py; new registry.py.
- app/desktop_collector/server/recognition_routes.py.
- app/desktop_collector/web/src/Recognition.tsx; web/tests/recognition.spec.ts.
- tests/test_recognition.py, tests/test_recognition_jobs.py; new test_recognition_topics.py.
- PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
  docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md, docs/RECOGNITION_CONTRACT.md.
- Generated local web build rebuilt separately; no production dependency or asset added.

### Fresh verification

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

### Unverified items and risks

License/redistribution unknown; signer identity unknown; official split unknown;
training overlap unknown; generalization unknown. No remaining unverified topic
among these ten pinned GCN artifacts, but untested clips/classes are not evaluation
evidence. LSTM unresolved; continuous sign segmentation unresolved; sensor recognition
unverified; persistent worker optimization not implemented; Raspberry Pi/production
packaging unverified. Native PyWebView visual/DPI review and human screen-reader
review were not performed. Runtime package/source validation still occurs at worker
execution; catalog availability is a local prerequisite check, not a runtime guarantee.

Root has no .git; no root cleanliness claim. Before copies/hashes and direct diff
review are in .design-cache/kvsl-phase3b/before/, before.json, source.diff and
final-review.json. Original manifest and protected design references remain unchanged.
Upstream git status --short and diff --check returned empty, successful output.
The ten PTH entries in the pinned historical GCN tree match the full audited inventory.

Evidence: topic-inventory.json, checkpoint-inventory.json, source-provenance.json,
provider-verification.json, real-sample-results.json, coverage.json, real-ui-result.json,
real-ui-new-topic.json and light/dark PNGs. Candidate verification used a local audit
copy of the same service/worker with a candidate registry before production promotion;
no unverified candidate was exposed through the real application's model list.

Problems encountered: sandbox pytest temporary-directory and shell local-account
storage permissions required scoped escalated reruns. Initial unit fixtures patched
the old single-model adapter only; updated registry fixture injection. One browser
fixture left its second sample supported, so the new correct default selected it;
fixture corrected. Sandbox Playwright teardown left its own Node/Vite processes
running after the Python bridge exited; identified/stopped those exact test processes
and reran outside sandbox. No automatic approval-review rejection occurred.

<!-- END PHASE3B CURRENT -->

## 2026-10-10 - Current: Phase 2 Desktop Recognition Vertical Slice PASS WITH FIXES

Authorization: current attached Phase 2-only brief and subsequent continue messages.
This supersedes older Phase 2 proposed/unapproved wording below. Phase 0A, Phase 0B
and Phase 1 remain complete; no importer rebuild, training or model architecture rewrite.

Delivered flow: existing Studio Dataset → manifest sample selection → authenticated
ID-only FastAPI job → one RecognitionJobService executor → Phase 1 RecognitionService
→ isolated ML subprocess → validated PredictionResult → real top-k UI. Verified only
kvsl-gcn-do-vat / do_vat / 20 classes. Model hash and preprocessing pins remain unchanged.
Full API/state/config/security contract: docs/RECOGNITION_CONTRACT.md, Phase 2 section.

Jobs use smartglove-recognition-job-v1, UUID hex IDs, UTC timestamps, one concurrent
worker, at most 8 active/queued jobs and 32 terminal snapshots. They are RAM-only and
owned by authenticated user session. No DB/manifest/raw-data writes. Terminal results
are immutable. Queued cancel is immediate; running cancel reports request pending until
worker kill/drain/reap completes. Shutdown rejects submissions, cancels queue/worker,
joins executor (5s maximum), and bounds Uvicorn graceful request drain at 2s.

UI: one KVSL card inside existing Dataset composition, shared One UI primitives,
read-only do_vat sample selector/metadata, Recognize/Cancel, truthful job status,
separate Dataset label and Prediction, top-3 Model scores plus model/preprocessing.
750ms initial / 1000ms subsequent polling, abort/cleanup on terminal/unmount,
transient retry and explicit connection recovery. No telemetry state coupling.
Preview deferred. Existing import/train/evaluate/camera/live-translation drafts remain
unimplemented. No new assets, dependencies, runtime font, design system or navigation.

Exact durable files changed/added:
- Backend: app/desktop_collector/recognition/jobs.py (new), service.py,
  worker_client.py; app/desktop_collector/server/recognition_routes.py (new), app.py;
  app/desktop_collector/shell.py.
- Frontend: app/desktop_collector/web/src/Recognition.tsx (new), api.ts, Studio.tsx,
  App.tsx, studio.css.
- Tests: tests/test_recognition_jobs.py (new), tests/test_recognition_worker.py;
  app/desktop_collector/web/src/api.test.ts;
  app/desktop_collector/web/tests/recognition.spec.ts (new).
- Documentation: PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
  docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md, docs/RECOGNITION_CONTRACT.md.
- Local production bundle rebuilt; generated build output is not source or a commit.

Fresh checks actually run (not historical counts):
1. Root: .venv/Scripts/python.exe -m pytest tests/test_recognition.py tests/test_recognition_worker.py tests/test_recognition_jobs.py tests/test_kvsl_manifest.py tests/test_dependencies.py tests/test_server.py -q
   Final 126 passed, 2 existing Starlette/AnyIO deprecation warnings, 41.00s.
   Includes 12 new job/catalog/API/lifecycle tests, 18 worker boundary tests,
   existing recognition/manifest/dependency and bridge suites.
2. Web: npm.cmd test — 27 passed in 5 files (including new typed API security test).
3. Web: npm.cmd run build — TypeScript and Vite PASS, 119 modules; final build after
   polling retry change. No dependency install or lockfile change.
4. Web: RECOGNITION_REAL=1; npx.cmd playwright test recognition.spec.ts --trace off
   At that point 6 passed: 5 mocked-API browser workflows + 1 real Studio/ML smoke.
   Subsequently added one visual/state test and fixed bounded bridge shutdown.
5. Web final: npx.cmd playwright test recognition.spec.ts --grep-invert 'real W00395'
   6 passed, 21.9s, bridge child exit 0. Covers select/Unicode, queued/running/success,
   annotation separation, failure/cancel, unavailable/unsupported, transient polling,
   terminal/unmount cleanup, delayed loading, long label selection and both themes.
   No second successful ML inference was needed for the later retry/shutdown changes.
6. Root: .venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase2/verify_lifecycle.py
   Final real cancellation ~125ms; real shutdown with one running + one queued job
   ~219ms; both worker exits 1 after requested Windows termination, neither process
   alive; executor/server stopped; port rebind succeeds. Collector torch/mediapipe/
   torch_geometric all absent via find_spec and absent from sys.modules.
7. Root: .venv/Scripts/python.exe -m app.desktop_collector.shell --smoke-test
   Exit 0. This is headless shell runtime verification, not a native visual review.
8. Actual browser render: result in light/dark at 1440x900,1280x720,820x1180;
   running/error and loading states at smaller desktop size. Six result-state and
   two running-state scoped Axe scans found 0 WCAG A/AA violations. No page horizontal
   overflow in the six real-result viewport/theme checks. Screenshots inspected.
9. Root git status remains unavailable (no .git). Upstream KVSL git status and
   diff --check clean. Root hash/direct diff review replaces unavailable Git checks.
   Final review: 16 existing durable files changed, 5 durable files added, 358 baseline
   files unchanged; generated build index/CSS replaced separately, no source deletions
   or added-line whitespace errors. Manifest and design references unchanged.
   Baseline/protected-reference/manifest comparisons: final-review.json/source.diff.

Real result (actual Studio → server API → worker, no inference mock):
- Sample kvsl:do_vat:W00395; recording kvsl:W00395; dataset annotation ca.
- Job a2ced456d3124441900f2eaab7767615; queued → running → succeeded.
- ca 0.43561261892318726; cày 0.13568049669265747; bộ sách 0.1329399198293686.
- Worker exit 0; preprocess 10766.5771ms, model 34.9193ms, total 24917.5044ms.
- Exact Phase 1 regression scores; not benchmark accuracy or a latency guarantee.
  This run overlapped other test activity. UI/API result retained in real-ui-result.json.

Problems/fixes: sandbox helper initialization failed, so scoped escalated execution
was used (no automatic approval rejection). First frontend cancellation fixture reused
one terminal ID for a new job; fixed fixture to generate distinct IDs. Browser teardown
then reproduced a pre-existing unbounded Uvicorn drain: temporary SQLite remained open
and process exited 1. Added timeout_graceful_shutdown=2.0 plus a pending-request cleanup
regression. Initial pending-request fixture was behind the static mount; fixed test
route ordering, reran all affected tests. Final browser teardown passes. Polling retry
now remains available after automatic polling stops. These failures were not hidden.

Local ignored evidence: .design-cache/kvsl-phase2/before.json and before/, source.diff,
final-review.json, real-ui-result.json, real-lifecycle.json, verify_lifecycle.py,
review.py, light/dark viewport PNGs, running/failure PNGs and loading.png.
Trace recording is explicitly off in recognition browser tests to avoid retaining
RAM-only auth headers; final test output contains no trace archive. No secrets were
added to source/evidence or new API URLs. Existing shell launch-fragment behavior
was preserved; it was not redesigned or newly introduced by recognition integration.

Unverified/risks: license/redistribution unknown; signer identity unknown; official
split unknown; training overlap unknown; generalization unknown; only do_vat GCN
verified; other topics unverified; LSTM unresolved; continuous sign segmentation
unresolved; sensor recognition unverified; persistent worker optimization not
implemented; Raspberry Pi/production ML packaging unverified. Native PyWebView
visual/DPI and human screen reader review not performed in this phase. Model
availability checks file prerequisites; package/source compatibility is checked by
the worker at execution. Jobs do not survive app close and old-session jobs cannot
be accessed after sign-out. Video preview remains deferred. No accuracy claim.

Next gate: Phase 3 — Recognition UX / Provider Expansion Decision. Before any Phase 3
implementation, choose A: improve desktop UX/persistent-worker latency; B: verify
more KVSL topics; or C: prepare hardware/sensor pipeline. Do not start automatically.
Existing hardware/capture, Qt cleanup/cutover, unrelated visual acceptance and release
gates remain unchanged. No push, merge, commit, model training or release performed.
Earlier entries below are historical snapshots.

## 2026-10-10 - Current: Phase 1 Offline Recognition Provider Boundary PASS

Latest authorization: the new attached Phase 1-only request. Phase 0A and Phase 0B
remain complete; neither was rebuilt or repeated. Implemented offline callable code,
not Studio recognition or any bridge route. Phase 2 remains proposed/unapproved.

Final flow: manifest membership → KVSLVideoAdapter → isolated subprocess → versioned
FeatureSequence → KVSLGCNProvider → validated PredictionResult. Use sample ID
`kvsl:do_vat:W00395` (recording `kvsl:W00395`, topic membership do_vat); Phase 0B has
no separate sample_id field and its schema/importer is unchanged. Model registry is
one frozen descriptor. No sensor identity/catalog, raw data or acquisition coupling.

Provider `kvsl-gcn-do-vat`, 20 classes, source e5165d79f373a12a4964e2c3d1bf59c911416667,
artifact/model version 4634b5d9f695f1118f99a6d09c9487f81bde0b3c. Historical checkpoint
app/backend/Model/gcn/do_vat.pth; SHA-256
ea64129ba9a3f66a955a65b65340906ede701ff4d2f1f97bb4031979817eaade.
Preprocessing remains kvsl-gcn-do-vat-60x65x3-v1; feature schema
mediapipe-pose23-left21-right21-xyz-v1. Feature/Prediction/Descriptor schema IDs are
smartglove-feature-sequence-v1, smartglove-prediction-result-v1,
smartglove-model-descriptor-v1; worker protocol smartglove-recognition-worker-v1.
Full contracts, configuration/security/lifecycle and commands: RECOGNITION_CONTRACT.md.

Exact durable changed/added files:
- Main application code: app/desktop_collector/recognition/__init__.py, contracts.py,
  adapter.py, worker_client.py, service.py, cli.py.
- Isolated worker: app/desktop_collector/recognition/worker.py (never imported by
  normal application/orchestration; ML imports are lazy inside worker execution).
- Tests: tests/test_recognition.py, tests/test_recognition_worker.py.
- Documentation: PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
  docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md, docs/RECOGNITION_CONTRACT.md.

Checks actually run in this session:
- `.venv/Scripts/python.exe -m pytest tests/test_recognition.py tests/test_recognition_worker.py tests/test_kvsl_manifest.py tests/test_dependencies.py -q`:
  final 89 passed (39 recognition unit/adapter, 16 worker/process, 33 manifest, 1
  existing dependency test). Initial run 87 passed/1 failed due to missing UTF-8 flag
  in the test process; fixed and rerun. Final adds child-reaping test.
- `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase1/smoke.py`:
  three real service samples W00395/W00170/W00380; all ok, child exits 0, unique
  request IDs. Real runtime/checkpoint/video; no final-inference mocks.
- `.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase1/verify_cli.py`:
  actual module CLI W00395, exit 0, child exit 0, empty CLI stderr, valid Unicode.
- Fresh-process import guard covers collector main/shell, manifest and orchestration.
  Separate collector find_spec check: torch=false, mediapipe=false, torch_geometric=false.
- Four normalized worker source pins match immutable source-commit Git blobs.
  Root has no .git; scoped baseline hash/direct diff review replaces root Git checks.
  Final scoped review: five existing documents changed, ten intended files added,
  264 other baseline files unchanged; added-line whitespace passes. Phase 0B manifest
  hash unchanged. Upstream clone Git status, diff and diff --check are clean.

W00395 annotation ca; prediction ca .43561261892318726 / cày .13568049669265747 /
bộ sách .1329399198293686, exactly Phase 0A. Service preprocess 5182.885ms, model
29.321ms, total 10682.662ms including startup/import/load/shutdown. Separate CLI
total 9025.753ms. These are local regression measurements, not benchmark accuracy
or performance guarantees. Nonfatal MediaPipe/protobuf messages remain in diagnostics.

Local ignored evidence: .design-cache/kvsl-phase1/before.json, before/, smoke.py,
real-smoke.json, worker-diagnostics.log, verify_cli.py, cli-result.json, cli-stderr.log,
source.diff, final-review.json. Baseline predates all seven recognition source files.
No model/video/data binaries are added to runtime source. A source-only checkout
fails clearly until verified local assets and isolated environment are configured;
no auto-download/install. Missing files do not authorize rerunning Phase 0 automatically.

Unverified/risks: license/redistribution unknown; signer identity unknown; official
split unknown; training overlap unknown; generalization unknown; only do_vat GCN
verified; other topics not verified; LSTM unresolved; continuous sign segmentation
unresolved; sensor-domain recognition unverified; Raspberry Pi/production packaging
unverified. Other OS/relocated environment and packaged distribution are untested.
No confidence rejection policy, real-time workflow or recognition UI exists.
Frontend, desktop GUI, acquisition and bridge suites were intentionally not rerun;
their code is unchanged. No environment/dependency change or source asset rewrite.

Next gate: explicit authorization for Phase 2 — Desktop Recognition Vertical Slice
(select manifest-backed Studio video → submit job → display real PredictionResult).
Do not begin it automatically. Existing visual, Qt cleanup/cutover, hardware/capture
and release gates retain prior status. No push, merge or release occurred.
Earlier entries below are historical snapshots, not the current scope gate.

## 2026-10-10 - Current: Phase 0B KVSL Manifest Importer COMPLETE

Latest explicit authorization: new Astra session, read canonical documents and Phase
0A report, implement ONLY Phase 0B. This supersedes the earlier same-day proposal
wording below. Phase 0A remains complete; its 20-video inference test was not repeated.

Delivered `app.desktop_collector.kvsl_manifest`: offline Python module/CLI using only
the standard library and installed Git. Reads the existing full local KVSL clone at
source e5165d79f373a12a4964e2c3d1bf59c911416667 and artifact
4634b5d9f695f1118f99a6d09c9487f81bde0b3c. Ignores current HEAD/worktree edits;
does not fetch, checkout, copy media, decode, run inference or train. No ML libraries
were added to the collector. No desktop route/UI was added.

Contract and reproducible CLI/test commands: `docs/DATA_SCHEMA.md`, Phase 0B section.
Version `smartglove-kvsl-manifest-v1`: exact CSV/maps/videos commit/blob/SHA-256/size,
original recording IDs, scoped topic class IDs, Unicode labels, all original source
rows and explicit unknown signer/session/split/license/training-overlap metadata.
Conflicting labels/invalid metadata fail; missing assets and identical-content groups
are reported. Generated JSON is deterministic; atomic publication refuses overwrite,
identical reruns are unchanged. Recovery and filesystem limitations are documented.

Real result: 187 CSV rows -> 169 original recordings, 175 recording/topic memberships,
10 topics / 175 topic-local classes. 12 repeated annotation rows retain provenance.
Zero missing referenced videos, zero identical-content groups. 309 historical video
paths include 140 unreferenced paths which receive no guessed labels. No accuracy claim.

Changed durable files (exact list):
- app/desktop_collector/kvsl_manifest.py (new)
- tests/test_kvsl_manifest.py (new; synthetic metadata/video-byte fixtures only)
- docs/DATA_SCHEMA.md
- PROJECT_CONTEXT.md
- PROJECT_MILESTONE_TRACKER.md
- CHANGELOG.md
- docs/SESSION_LOG.md
- docs/WORK_SESSION_HANDOFF.md

Checks actually run:
- `.venv/Scripts/python.exe -m pytest tests/test_kvsl_manifest.py tests/test_dependencies.py -q`:
  final 34 passed (initial smaller suite 30 passed).
- `.venv/Scripts/python.exe -m app.desktop_collector.kvsl_manifest --repository
  .design-cache/kvsl-phase0a/upstream --output .design-cache/kvsl-phase0b/manifest.json`:
  exit 0, created complete real manifest.
- `.venv/Scripts/python.exe .design-cache/kvsl-phase0b/verify_import.py`: exit 0,
  byte-identical repeat import; all 187 original rows preserved; all 20 Phase 0A asset
  hashes/blob IDs/sizes agree; upstream Git worktree/diff --check clean.
- Fresh-process import test confirms no torch/MediaPipe/NumPy/Qt/FastAPI/WebView imports.
- Root has no .git, so root Git status/diff checks are unavailable; local source hash
  baseline/direct diffs are used. No historical app suite results are claimed as new.
- Final scope audit: exactly the eight files above changed/added; all 253 other
  baseline files unchanged. Added-line whitespace check passed. Review artifacts:
  `.design-cache/kvsl-phase0b/source.diff` and `final-review.json`.

Local-only evidence: `.design-cache/kvsl-phase0b/manifest.json`, `verification.json`,
`verify_import.py`, `before.json` and six pre-edit document copies under `before/`.
Manifest SHA-256: b266b70af7408d944c3c7713537a60b0770a7dcd79b5a25bb767c343d59a99a6.
These ignored files and the upstream clone are not portable with a source-only checkout.
Importer source/tests/contract are portable; provide a local full KVSL clone to reproduce.

Unverified/risks: hashing does not validate video decoding, labels or signer identity;
split/training overlap and redistribution permissions remain unknown. No new model,
all-topic inference or benchmark evidence. Final app/backend/Qt/frontend suites and
GUI smoke were not rerun because the importer is standalone with no application wiring;
the affected smoke path is the real importer CLI. Atomic publication requires a local
filesystem supporting hard links; unsupported storage fails without partial output.

Next gate: separate explicit authorization for any further phase or app/model integration.
Existing visual review, Qt cleanup, hardware/capture, cutover and release gates retain
their status. No push/merge/release. Earlier entries remain historical evidence.

## 2026-10-10 - Current: KVSL Phase 0A complete, PASS WITH FIXES

User task: prove real KVSL video -> upstream MediaPipe -> trained model -> Vietnamese
prediction, in isolation. Confirmed sole primary repo: https://github.com/LeNguyenAnhKhoa/KVSL.
Result: PASS WITH FIXES for one 20-class do_vat GCN path. No LSTM artifact was found;
LSTM 40/60 mismatch is unresolved. No mock, model training, importer or app integration.

Source main: e5165d79f373a12a4964e2c3d1bf59c911416667 (2025-12-31).
Artifact/video commit: 4634b5d9f695f1118f99a6d09c9487f81bde0b3c.
Checkpoint: app/backend/Model/gcn/do_vat.pth, 735156 bytes,
SHA256 ea64129ba9a3f66a955a65b65340906ede701ff4d2f1f97bb4031979817eaade.
Map SHA256 050f8b0781ecf6a37a0971560a765555ed63c3c6ba211506096861ba528db47e.
Both README Drive links returned 404; full Git history contains real assets.
309 distinct historical MP4 blobs and ten GCN checkpoints inventoried; only the selected
20 videos and one checkpoint were decoded/run. CSV: 187 rows, 169 unique labels/videos.
Topic-local indices are not global class IDs; do_vat's repeated row was deduplicated.

Workspace: .design-cache/kvsl-phase0a/ (ignored, local-only).
Read REPORT.md first; supporting records: asset-inventory.json, verification-summary.json,
preprocessing-contract.json, results-1.json, results-20.json, batch-summary.json,
batch-execution.json, requirements-resolved.txt, verified-batch-stdout.jsonl and stderr log.
These artifacts are not tracked/portable; do not assume another checkout has them.
Canonical contract kvsl-gcn-do-vat-60x65x3-v1: 60x65x3, pose 0..22 then left/right
21 each, XYZ, unnormalized MediaPipe output, missing groups zero; linspace integer
resampling (repeat/subsample), float32 nodes 65x180, fully connected graph, 20 logits.
Source and weights support this inference contract; original training manifest is absent.

Actual commands/results (from cache, 2026-10-09):
- extraction-env/Scripts/python.exe -X utf8 run_feasibility.py --limit 1: exit 0;
  W00395 annotated/predicted ca, top-3 ca .4356126 / cày .1356805 / bộ sách .1329399.
- extraction-env/Scripts/python.exe -X utf8 verify_batch_process.py: parent/child exit 0;
  20 unique original clips, 2415 frames, exact extraction/resampling parity, finite output,
  20 annotation matches. Process 95.74s; median extraction 4753.42ms/clip including setup
  and parity checks; warmed model forward median 2.59ms. Not accuracy/independent evaluation.
- First PowerShell batch wrapper exited 1 on native INFO stderr despite all clip results.
  Both logs retained; the full direct-subprocess rerun resolves actual process exit status.
- Upstream git status/diff --check/diff clean. Root has no .git: root Git review unavailable.
  No app suite/build rerun; no reuse of historical app results as current results.

Environment: isolated extraction-env, Python 3.12.13 CPU, torch 2.5.1+cpu, PyG 2.4.0,
MediaPipe 0.10.14, NumPy 1.26.4, OpenCV-contrib 4.10.0.84. Full freeze retained.
Root collector .venv remains without torch/mediapipe/torch_geometric.
Upstream CUDA/Python pins were not reproduced; only this CPU environment is verified.

Changed durable files: PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
docs/SESSION_LOG.md and this handoff. Cache adds isolated harness/environment/evidence.
No source, schema, runtime dependency, UI, acquisition, simulator or hardware edits.

Unverified/risks: valid held-out split/signer identity and original training provenance;
code/data/model redistribution permissions; other topics/checkpoints; LSTM; continuous
segmentation; generalization; Raspberry Pi/production packaging. Missing groups zero-fill
without model rejection; scores uncalibrated. Fully connected pooled GCN is not an anatomical
temporal graph architecture. Nonfatal MediaPipe/protobuf warnings remain in evidence.

Next task proposed: Phase 0B KVSL manifest importer with pinned provenance, topic mappings,
deduplication and explicit unknown metadata. Not implemented or authorized by this result.
Future adapter/preprocessor/model-provider/prediction-result boundary is specified in report;
do not port upstream FastAPI/CORS/server binding. Existing M1 visual review, Phase E cleanup,
M2 hardware, M3 capture, cutover and release gates are unchanged. Earlier entries are history.

## 2026-10-05 - Current: accepted capsule motion, slightly faster timing

User accepted the corrected motion and requested a small speed increase. Changed
only app/desktop_collector/web/src/runtime-activity.css: opening 640ms -> 540ms,
closing 520ms -> 440ms. Duration is about 16% shorter; smoothstep, sequential text,
clipping, reversal and the production s/ms conversion remain unchanged. Production
build has been refreshed. An already open desktop window needs reopening to load it.

Docs changed: CHANGELOG.md, PROJECT_MILESTONE_TRACKER.md, docs/SESSION_LOG.md,
this handoff. Accepted motion behavior is recorded; the new speed still awaits user
review. No other gate/scope changes. No additional asset, dependency or test edits.
Verification: TypeScript/Vite production build PASS (118 modules). Focused Playwright
capsule checks PASS 5/5 with --grep 'live notification|compact hover|drawer collapses'.
Full suite and native DPI/recording were not rerun for this two-token change; the prior
640/520ms native measurements are historical, not measurements of the new speed.
Git remains unavailable in this downloaded copy. Next gate: review the slight speed
adjustment using the current build through run_app.ps1.

## 2026-10-05 - Current: production capsule flash fixed

**Previous capsule motion was rejected by the user. Corrected implementation awaits
review.** Main bug: production CSS minifies 460ms to .46s; parseFloat treated .46 as
milliseconds. Development timing checks missed that 1000x difference. Now explicitly
convert seconds/milliseconds for WAAPI. Also replace the front-loaded spring with
640ms open/520ms close smoothstep; retain width-leading-height, clipping, sequential
unscaled text, focus, telemetry and partial-distance reversal. Separate Quick Status
page animation remains unchanged. No later milestone/cutover or release gate opened.

Figma reauthentication was verified on this resume: whoami succeeds as Fish / Full /
Student, and live design context plus screenshot for 838:4076 are readable again.
The earlier user's desktop process had closed. Launched the current production build
through run_app.ps1 -SkipBuild for review; SmartGlove Dataset Studio is responding,
with empty launcher stderr. This is not user acceptance of the corrected motion.

Changed source/tests:
- app/desktop_collector/web/src/RuntimeActivityView.tsx
- app/desktop_collector/web/src/runtime-activity.css
- app/desktop_collector/web/tests/one-ui-system.spec.ts
Docs:CHANGELOG.md,docs/SESSION_LOG.md,docs/ASSET_INVENTORY.md,this handoff.
Baseline copies/direct diffs:.design-cache/quickstatus-motion-20261005-v2/.
Git repository is absent; no-index comparisons replace unavailable worktree diff/status.

Verification actually run:
- npm.cmd test -- --run:26/26 in5 files.
- npm.cmd run build:TypeScript/Vite118 modules, production bundle rebuilt after unit fix.
- npx.cmd playwright test one-ui-system.spec.ts --config
  ../../../.design-cache/oneui-refinement-20260928/playwright.config.ts:11/11.
  Includes visible travel regression for stylesheet and.64s/.52s token values.
- powershell -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1 -SmokeTest -SkipBuild:0.
- Visible native PyWebView production bundle1426x863,DPR1.25,both themes:10-90% height
  travel~376ms open/~316ms close; serialized CSS.64s; no reduced motion. Two capsule Axe
  scans0 violations,0 page errors, final bridge exit0/empty stderr. User's window untouched.
  Evidence:native-visible/results.json,timings.json,native-environment.json and screenshots.
- Real-app responsive review: 1440x900, 1280x720, 820x1180, both themes; six capsule
  Axe scans: 0 violations, 0 browser errors; review bridge exit0/empty stderr.
  Video and captures: .design-cache/quickstatus-motion-20261005-v2/after/.
- Hidden native runs are invalid timing evidence (RAF throttles to~1s); earlier harness
  and teardown failures are retained in SESSION_LOG. Final visible run passed.

Limits: native 100%/150%, screen reader and full historical E2E/backend suites were not
rerun. No claim of increased FPS or exact Samsung timing. This resume changed only
documentation and launched the verified build; no additional source change or test rerun.
Next gate: user review of corrected capsule motion. Figma access is restored.

## 2026-10-05 - Current: header Live Status capsule motion

**Implemented and verified; awaiting user motion review.** The user supplied motion.mp4
and the Packet gaps/SIM/Hz capsule screenshot. Scope is the header capsule, not the
separate Quick Status interaction page or Account. Prior accepted composition and gates
remain unchanged; no hardware, schema, acquisition, cutover or release scope opens.

Delivered: shell width leads height, a restrained spring settles the opening, closing is
monotonic, outgoing/incoming text remains sequential and unscaled. Reversals start from
the current visible geometry and shorten with remaining distance.460ms open/380ms close
are desktop adaptations. Preserve all telemetry, keyboard, focus, clipping, drawer and
reduced-motion behavior. Figma838:4076 design context/screenshot was read live; whoami
passed as Fish/Full/Student. Local Figma indexes/assets/recording remain unchanged.

Changed implementation files:
- app/desktop_collector/web/src/RuntimeActivityView.tsx
- app/desktop_collector/web/src/runtime-activity.css
Documentation: CHANGELOG.md, docs/SESSION_LOG.md, docs/ASSET_INVENTORY.md, this handoff.
No tests or dependencies changed. Source baseline copies and direct diff are in
.design-cache/quickstatus-motion-20261005/baseline/ and source.diff. This downloaded
workspace currently has no Git repository; status/diff commands fail. Use the scoped
baseline comparison, do not treat historical parent-Git statements as current truth.

Checks actually run:
- web: npm.cmd test -- --run ->26 tests/5 files passed.
- web: npm.cmd run build ->TypeScript and Vite118 modules passed.
- web: npx.cmd playwright test one-ui-system.spec.ts --config
  ../../../.design-cache/oneui-refinement-20260928/playwright.config.ts ->final9/9.
  First run8/9 failed Account focus return; unchanged repeat passed. Cause unconfirmed;
  retain as an intermittent test risk, not a capsule regression proven fixed.
- powershell -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1 -SmokeTest -SkipBuild
  ->exit0 with the new production build.
- Real authenticated simulator app: light/dark,1280x720,1440x900,820x1180. Six capsule
  Axe WCAG A/AA scans:0 violations;0 page errors/overflow; clipped sequential text in
  every sampled frame; bridge clean exit0/empty stderr. Open460-465ms, close386-388ms,
  early-reversal276-277ms in this sample run. No FPS improvement claim.

Review: .design-cache/quickstatus-motion-20261005/index.html links before/after videos,
responsive captures, intermediate frames and results.json. Screenshots/frame sheets
were inspected from actual app output. Native PyWebView/DPI, screen reader, entire
historical E2E suite and user-workload performance remain unverified in this pass.
Backend tests were not rerun for this frontend-only change. C disk remains low after
user-authorized pip cache cleanup; source write integrity was checked on resume.
Next gate: user review of capsule motion. No push/merge/release or later milestone.

## 2026-10-04 - Current: Account customization and Quick Status motion

**Implemented and verified; awaiting user visual/motion review. Font embedding remains
pending a permitted source.** Continue from this snapshot, not the historical visual-only
restriction. The user considers the desktop visual direction largely complete and asked
for Quick Status motion, richer account editing and clearer administration. Confirmed:
retain Participant/Researcher/Administrator/Developer; no per-user permission toggles;
add full name, contact-only email and organization/team alongside display name/avatar.

Figma gate: current whoami succeeds as Fish/Full, required file wzEFGRLl9MU1nB1JxUSyhD
was read live (11 page names, Card245:399 variants, Button1497:12222 variants, Top App
Bar1495:10799, text font properties and Welcome font hyperlink). Earlier reauthentication
failures correctly paused without source edits. StIo1CdCci8HQXMmdhXZG8 remains cover-only
and intentionally excluded. Real source owns functionality; recordings own behavior.

Recovery: `backups/SmartGlove-PRE-ACCOUNT-MOTION-20261004-024916.zip`, SHA256
`96c8e27cbfb9876e01958620d5525e6fba6f10c592fd9fb489cf6dc03e29b673`.
All232entries/CRC/hash verified, no source changes between its creation and this pass.
The v1 identity database separately receives an automatic SQLite backup before schema2
migration; recovery and exact API/input contract are in docs/AUTH_PERSISTENCE.md.
No production identity database was used for verification.

Delivered:

- Quick Status/shared secondary pages use one 400ms-open/320ms-close compositor transform.
  No double-RAF start or fixed unmount timer. Interruptions freeze the presented transform;
  close retains content until animation completion, with focus return and reduced motion.
  The existing full-page push/pop geometry and accepted component sizes remain.
- Own profile editor persists display name, full name, contact email, organization/team,
  and optional avatar. All four roles have access, including the Participant limited-access
  screen. Profile save preserves the user cookie and does not invoke the login/reset path.
- PNG/JPEG avatar validation/normalization uses Pillow12.x (local12.3.0): bounded dimensions,
  2MiB input, static images only, EXIF orientation, 256px square crop, metadata removal.
  Remove avatar restores the existing exact Figma default. No raw photo files in the repo.
- Schema2 adds nullable profile columns; v1 backup uses SQLite backup API including WAL,
  then an atomic migration. Own-profile API rejects arbitrary IDs/roles. Security audit
  records the event without personal values. Existing RBAC/final-admin/session rules stay.
- Account and create/edit-user forms show existing role capabilities. Role-change copy
  correctly says current sessions end immediately. No new per-user permission system.

Font result (not an implemented font change): the exact live family is One UI Sans APP VF.
Welcome node4:47 links to
https://drive.google.com/file/d/1K9eSoU58dxCMGzLj7vXjMRwODB9Cr6X0/view
and the public preview title is `Variable One UI Sans.ttf`. No application-embedding or
redistribution grant was found. AGENTS7.5 says "Do not distribute or extract proprietary
Samsung font binaries from the repository or tool environment" and requires a licensed
source. No font binary was installed/copied, and the fallback stack is unchanged. Do not
claim the application now renders Samsung font. The exact source link is delivered for
the user's follow-up; do not replace it with SamsungOne or a lookalike.

Exact changed implementation/test files:

- app/desktop_collector/auth.py
- app/desktop_collector/persistence.py
- app/desktop_collector/server/app.py
- app/desktop_collector/web/src/AccountProfile.tsx
- app/desktop_collector/web/src/AccountProfileEditor.tsx (new)
- app/desktop_collector/web/src/RolePermissions.tsx (new)
- app/desktop_collector/web/src/App.tsx
- app/desktop_collector/web/src/AuthScreens.tsx
- app/desktop_collector/web/src/UserManagement.tsx
- app/desktop_collector/web/src/account-profile.css
- app/desktop_collector/web/src/api.ts
- app/desktop_collector/web/src/one-ui/interaction-page.tsx
- app/desktop_collector/web/src/one-ui/interaction-page.css
- app/desktop_collector/web/tests/one-ui-system.spec.ts
- pyproject.toml (Pillow dependency only)
- tests/test_auth_persistence.py
- tests/test_account_profile.py (new)

Documentation: PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
docs/AUTH_PERSISTENCE.md, docs/ASSET_INVENTORY.md, docs/SESSION_LOG.md and this handoff.
Protected catalog/prototypes/assets/recordings/launcher remain unchanged. All56prior
protected hashes match. No hardware/Studio backend/acquisition/cutover changes, push,
merge or release. Parent Git still reports `?? ./`; archive diff is authoritative.
Full pytest regenerated five legacy Qt test PNGs; only those generated changes were
restored byte-for-byte from the verified pre-test archive. No user work was reverted.

Checks actually run:

- `python -m pytest -q` through repository .venv: PASS75, two existing Starlette deprecation
  warnings. Then added two decoder cases (animation/dimensions and JPEG EXIF); all14cases
  in `tests/test_account_profile.py` passed. Full77case suite was not rerun.
- Earlier affected backend run:45passed, including four-role authorization, session
  preservation, personal-field persistence, v1 recovery backup and failed-migration rollback.
- From web `npm test -- --run`: PASS26/5files. `npm run build`: PASS118modules.
- From web `npx playwright test one-ui-system.spec.ts --config ../../../.design-cache/oneui-refinement-20260928/playwright.config.ts`:
  final PASS9/9 (32.9s), clean bridge shutdown. Includes profile/avatar save/removal and
  focus/session, Participant narrow820x1180, Quick Status reversal/reduced motion/focus,
  plus six previous navigation/notification/checkbox/Search regressions. The ignored
  config uses the owned Vite server; normal standalone config requires port5173 free.
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1 -SmokeTest -SkipBuild`:
  PASSexit0 after production build.
- Real PyWebView1426x863CSS/DPR1.25: light/dark, continuous page samples, profile edits,
  role preview, four Axe WCAGA/AA scans with zero violations, zero browser errors,
  bridge exit0/empty stderr. Screenshots opened and inspected.
- Scoped `git diff --check` passes; archive/hash review required because source is untracked.

Evidence: `.design-cache/account-motion-20261004/index.html` links actual before/after
Quick Status videos, final screenshots, native125% images and exact font source.
`before/`, `after/`: actual-app videos/screens and per-frame geometry; `verified/`: final
1280/1440/narrow profile evidence; `native/native-results.json`: DPI, motion and Axe results;
`backup-info.json`, `before-manifest.json`, `source.diff`, `changed-files.json`: audit.
Baseline/new sampled settle times approximately265/406ms, max sampled position step170/103px.
Do not claim higher FPS: new run had one28ms frame gap versus14ms baseline. Tests rule out
duplicate/missing content and discontinuities in exercised cases; final perceived motion
still requires user review, especially on the user's normal workload.

Resolved intermediate failures are recorded in SESSION_LOG, including the stale schema
assertion, too-long pytest IDs, incorrect Participant button selector and review theme/
animation capture timing. None is counted as passing evidence.

Remaining: native100%/150% DPI, real screen reader, historical whole Playwright suite and
performance under the user's workload are UNVERIFIED. Samsung font integration remains
pending a permitted source. Next gate is review of this bounded Account/motion change;
do not extend visual redesign, hardware or Studio backend while awaiting that review.

## 2026-10-04 - Previous: interaction refinement and consistent circular glyphs

**Implemented and verified; this refinement awaits user visual review.** The preceding
comprehensive desktop composition was explicitly accepted by the user and is the saved
baseline. Older entries saying that baseline is pending are historical. Continue from
current source; do not restart, implicitly roll back or reopen later feature milestones.

Latest steering supersedes the proposed decorative illustrations: no hand beside Device
Manager; no mixed 3D folder/test-tube/hand icons in Search. Search featured/category items
and Studio workflow now use exact existing Figma glyphs in consistent circular surfaces.
No newly exported PNG is shipped. The rejected exports remain only in ignored cache.

Source gate: whoami (Fish, Full) and meaningful One UI wzEFGRLl9MU1nB1JxUSyhD reads passed
before edits and again on October 4. Exact Button Grid 1497:11799 design context/screenshot
and relevant glyphs/components were inspected live during implementation. Cover-only
StIo1CdCci8HQXMmdhXZG8 is intentionally excluded. Required project context and original
pasted brief were read. Source owns functionality; recordings own behavior; One UI owns
components. Full node/variant/adaptation/hash mapping is in ASSET_INVENTORY.

Recovery checkpoint, created before this pass:
`backups/SmartGlove-APPROVED-DESKTOP-20260928-115820.zip`
SHA256 `a8d0fc2a4c102839e93b6cf815c8d1d0ce9a009e6027c325096a94135803f4e6`.
All 230 entries, per-file SHA256 and ZIP CRC reverified. Dependencies, databases, raw data,
cache and proprietary fonts are excluded. Restore only reviewed, authorized paths from
this archive; never blanket-reset the user's workspace. Manifest is in the review cache.

Delivered behavior:

- Tabs alone move right before reaching the desktop menu, preserve 16px clearance and
  reduce available width before utility controls. Horizontal tab scrolling remains;
  workspace geometry and narrow bottom navigation stay unchanged.
- Notification uses one 400ms-open/320ms-close reversible timeline, sequential outgoing/
  incoming text, fixed text size and continuous rounded clipping. These durations are
  approved desktop adaptations, not measured recording timings. The focus ring follows
  the visible surface. A containing-layout observer fixes collapsed anchoring after resize.
- Opening navigation collapses notification to a visible live capsule beneath the scrim.
  It is inert while the drawer owns focus; closing the drawer does not reopen it.
- Shared 8px checkbox scroll clearance protects hover/focus for first/middle/last items.
  Artwork, card shape, header and label alignment remain.
- L/R boxes are removed from all affected views. Stable Left/Right text remains beside
  source names; chart colors and solid/dashed lines continue to distinguish sources.
- Shared 24px sourced glyphs use 40px featured, 44px workflow and 48px category circles.
  Studio accents are uniform; unavailable states stay neutral. Search browse provides
  the results-region ID referenced by its input.

Verification actually completed during this interrupted pass (September 28):

- `npm test -- --run`: PASS 26 tests / 5 files.
- `npm run build`: PASS TypeScript and Vite, 116 modules.
- From web: `npx playwright test one-ui-system.spec.ts --config ../../../.design-cache/oneui-refinement-20260928/playwright.config.ts`: PASS 6/6, final run 24.0s, clean temporary-bridge exit. The ignored config used the owned Vite server; normal standalone command is `npx playwright test one-ui-system.spec.ts` when port 5173 is free.
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1 -SmokeTest -SkipBuild`: PASS exit 0 after the production build.
- 18 sections x 2 themes x 5 viewports = 180 actual-app captures: 1100x720, 1280x720,
  1440x900, 1920x1200 and 820x1180. Devices Overview, Studio Overview and Dataset images
  were refreshed after the icon correction. Search adds 10 final icon/geometry checks.
- 36 matrix Axe scans, 4 supplemental scans, 2 final Search scans, 2 web Dataset scans
  and 2 native Dataset scans found zero WCAG A/AA violations. This is bounded automated
  coverage, not a claim of full accessibility compliance.
- Web and actual PyWebView each passed 9 motion cases across two themes: open/close,
  repeated reversal, drawer/scroll interruption, real packet loss after acknowledged
  configuration, Pause/Mark and continuing acquisition. Native viewport 1426x863 CSS,
  devicePixelRatio 1.25 (Windows 125%). Final native bridge exited 0 with empty stderr.
- Expanded resize checked in 10 theme/viewport cases; collapsed resize and menu/utility
  separation are now regression assertions. Keyboard, focus return, forced colors,
  reduced motion and monochrome hand distinction were exercised.
- Actual interaction video and 70 extracted frames were recorded; intermediate cropped
  contact sheets were inspected for clipping, text handoff and surface continuity.
- Read-only independent code review found no additional actionable issue. Final archive
  comparison confirms protected references, backend, launcher and dependencies unchanged.
  Scoped `git diff --check` passes; per-file archive diff is authoritative here.

Known limitations and resolved failures:

- Physical Windows 100% and 150% are NOT tested. No OS display setting was changed.
- Initial native Axe new-page automation was unsupported; in-page Axe succeeded. One
  native packet-loss run raced configuration acknowledgement; the final run waits for
  the successful real PUT before sampling. No telemetry response was fabricated.
- Some early test teardowns hit Windows socket reset / temporary SQLite file locks.
  The final fixture unmounts React, disposes the client and waits for the application's
  WebSocket to close. An intermediate fixture incorrectly waited for Vite HMR too and
  timed out; restricting it to the bridge host fixed that. The final 6/6 run exited cleanly.
  Production backend lifecycle was not changed as part of this UI pass.
- Historical broad E2E tests have stale selectors and were not claimed run. Backend
  pytest was not needed/run because core/API/schema code is unchanged.
- Real simulator samples naturally differ across screenshots. No production user data,
  account database, API/schema, Studio capability or launcher was changed.

Review artifacts under `.design-cache/oneui-refinement-20260928/`:

- `index.html`: offline before/after, final circular-icon Search/Studio, native 125%
  captures, motion video and 180-state gallery. All visuals are real implementation output.
- `icons-current/icons-review.json`, `matrix/matrix-results.json`,
  `native-current/interaction-results.json`, `supplement/supplement.json`.
- `accepted-icons/interactions.webm`, `accepted-icons/interaction-results.json`,
  `accepted-icons/contact-*.png`: final glyph version; folder name does NOT mean user approval.
- `backup-info.json`, `before-manifest.json`, `protected-manifest.json`, `figma-sources.json`,
  `source.diff`, `final-source-manifest.json`, `final-audit.json`: recovery/source/scope evidence.

Changed implementation/test files relative to the accepted checkpoint:

- `app/desktop_collector/web/src/DeviceManager.tsx`
- `app/desktop_collector/web/src/GlobalSearch.tsx`
- `app/desktop_collector/web/src/LiveMonitor.tsx`
- `app/desktop_collector/web/src/QuickStatus.tsx`
- `app/desktop_collector/web/src/RuntimeActivityView.tsx`
- `app/desktop_collector/web/src/SensorChart.tsx`
- `app/desktop_collector/web/src/SourceStatistics.tsx`
- `app/desktop_collector/web/src/Studio.tsx`
- `app/desktop_collector/web/src/device-layout.css`
- `app/desktop_collector/web/src/one-ui/controls.css`
- `app/desktop_collector/web/src/one-ui/figma-icon.css`
- `app/desktop_collector/web/src/one-ui/figma-icon.tsx`
- `app/desktop_collector/web/src/one-ui/shell.css`
- `app/desktop_collector/web/src/one-ui/shell.tsx`
- `app/desktop_collector/web/src/quick-status.css`
- `app/desktop_collector/web/src/runtime-activity.css`
- `app/desktop_collector/web/src/search.css`
- `app/desktop_collector/web/src/studio.css`
- `app/desktop_collector/web/src/styles.css`
- `app/desktop_collector/web/tests/one-ui-system.spec.ts`
- `app/desktop_collector/web/src/one-ui/navigation-context.ts` (new)
- `app/desktop_collector/web/src/one-ui/workspace-icons.ts` (new)

Documentation changed: PROJECT_CONTEXT.md, PROJECT_MILESTONE_TRACKER.md, CHANGELOG.md,
docs/SESSION_LOG.md, docs/ASSET_INVENTORY.md, this handoff, and
app/desktop_collector/web/src/assets/one-ui/ASSET_USAGE.md.

Git: downloaded directory has no local .git; parent repository HEAD is
45350ae27713e319e868393f424c4377c361b545 and scoped status is `?? ./`. No commit/push/merge.
Unrelated work and historical missing app/frontend/index.html are preserved. The owned
review Vite server is no longer listening on 5173; the user's current app is left running.
Next gate: review this refinement's appearance/interactions. No Phase E/M2, hardware,
Studio backend, architecture cutover, dependency removal or release gate has opened.

## 2026-09-27 ? Comprehensive One UI system pass (current)

**Implemented; final user visual acceptance remains OPEN.** This supersedes the earlier
current overlay-only snapshot below. Continue from actual source, do not restart or roll
back implicitly. The user approved the full plan; no further feature milestone is opened.

Source gate: Figma whoami succeeded (Fish, Full) before edits and on resume. Actual One UI
`wzEFGRLl9MU1nB1JxUSyhD` pages/components were readable; Version 4.0 / Modern variants
were inspected beyond the historical catalog. Cover-only `StIo1CdCci8HQXMmdhXZG8` is
intentionally excluded. Required project documents and the original pasted brief were
read. The 20260912 transfer file is absent; 20260910 is historical. Source determines
functionality; real Samsung recordings determine motion. Full mapping: ASSET_INVENTORY.

Baseline: actual application, 52 pre-change images and 38 checks in
`.design-cache/oneui-coherence-20260927/baseline-system/`. Before-source backup:
`backups/SmartGlove-PRE-ONEUI-SYSTEM-20260927-204731.zip`
SHA256 `b3b85d65dd27e2f0db9dbc7670419af2fefb7db31979c17a65f49bf071e53547`.
All 229 archived source/runtime-asset entries verified with SHA256 and CRC. Runtime assets
were matched to their pre-edit protected hashes before inclusion. Dependencies, databases,
raw datasets, caches and proprietary fonts are not included. Restore individual authorized
paths from this checkpoint after reviewing current work; do not blanket-reset the project.

Delivered: one interruptible, clipped notification portal with separate 44px target/32px
visual; semantic compact hover; one rounded Search focus owner; shared spacing, surfaces,
state feedback, typography and tooltip lifecycle. Devices simplifies redundant metrics;
Monitor keeps chart-first density; Simulator distinguishes draft/applied configuration;
Studio retains truthful unavailable actions; Account uses bounded profile/list/security
cards and shared Search; Search reduces excess header space; notifications group active
attention and history. Existing icons are exact reused Figma exports. Desktop scale,
overlay navigation, narrow dock, real state and product functionality are preserved.

Verification actually run:

- `npm test`: PASS, 26 tests / 5 files.
- `npm run build`: PASS, TypeScript + Vite, 114 modules.
- From web: `npx playwright test one-ui-system.spec.ts --config ../../../.design-cache/oneui-system-20260927/playwright.config.ts`: PASS 3/3; temporary config uses the already running owned Vite server. Normal standalone command: `npx playwright test one-ui-system.spec.ts` after port 5173 is free.
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1 -SmokeTest -SkipBuild`: PASS (exit 0).
- Real authenticated temporary bridge review: 37 main checks passed before a harness breakpoint timing race; corrected narrow-navigation synchronization, then both remaining draft/login checks passed. Separate priority harness 5/5 and final interaction harness 5/5 passed. These are bounded checks, not a claim that the entire historical E2E suite ran.
- 18 sections ? 2 themes ? 4 viewports = 144 real captures; no horizontal overflow and 32px titles. Final Account changes were checked again in all 24 Account combinations, all passed.
- Axe: final 36 section scans, then 6 final Account scans and 2 Account-search scans: zero detected WCAG A/AA violations. Supplemental Dataset scan also passed. Automated Axe does not establish complete accessibility compliance.
- Actual PyWebView/WebView2: light/dark at devicePixelRatio 1.25, 1426?863 CSS viewport; hover, notification opening/closing frame samples, Search focus passed. Owned host and all temporary bridges exited cleanly.
- Keyboard portal order, Escape focus return, tooltip viewport/dismissal, telemetry changes during morph, Pause/Mark, draft preservation, reduced motion and forced colors were exercised. Hover checked Live/Paused/Packet gaps/Disconnected in both themes (8 cases), then Connecting in both themes by delaying real connect requests 1800ms in test routing (10 cases total).
- 28.4s real-app interaction WebM and 50 extracted intermediate frames recorded; reviewed cropped contacts for opening/reversal/closing. Text remains clipped; text size stays fixed and collapsed visual rests at 32px.

Review artifacts (ignored, real implementation output):

- `.design-cache/oneui-system-20260927/index.html`: offline before/after review with video, native captures and 144-state gallery; final Account images override earlier matrix captures.
- `final-review/one-ui-interactions.webm`; `final-review/contact-0.png` through `contact-4.png`: video / intermediate-frame review.
- `matrix/matrix-results.json`, `accessibility/matrix-results.json`, `account-final/matrix-results.json`, `interactions/interaction-results.json`, `final-review/final-review.json`, `native-final/native.json`, `connecting/connecting.json`, `full/checks.json`, `tail-final/tail-results.json`: evidence by check scope.
- `backup-info.json`, `before-manifest.json`, `protected-manifest.json`, `source.diff`, `final-source-manifest.json`, `final-audit.json`: recovery and scope audit.

Known limits / failures resolved:

- Windows physical scaling 100% and 150% has NOT been tested. No OS display setting was
  changed. Native hover evidence covers Live; other status hover cases were checked in
  Edge. Connecting was held visible through test-only request latency; no production state
  or backend response was fabricated.
- Initial Axe scan found an unsupported aria-label on the focus proxy; removed, final
  scans pass. A build found a redundant type prop on shared Account Search; removed,
  final build passes. Initial harness resize race and startup-transition assertions were
  corrected to wait for actual settled UI; no product failure is hidden as a passed run.
- The broader historical Playwright suite has stale selectors and was not claimed run.
  No backend pytest was needed/run because backend/core/protocol files are unchanged.
- No exact tooltip/chart component was available in Figma. Existing anatomy is retained
  and adaptations are explicitly documented; no substitute asset/library was introduced.
- Real simulator UI is used with isolated temporary accounts; no fake product data or
  user database mutation. Samples/counters differ naturally between before/after captures.

Changed implementation files:

- `app/desktop_collector/web/src/DeviceManager.tsx`
- `app/desktop_collector/web/src/RuntimeActivityView.tsx`
- `app/desktop_collector/web/src/UserManagement.tsx`
- `app/desktop_collector/web/src/account-profile.css`
- `app/desktop_collector/web/src/device-layout.css`
- `app/desktop_collector/web/src/one-ui/controls.css`
- `app/desktop_collector/web/src/one-ui/controls.tsx`
- `app/desktop_collector/web/src/one-ui/feedback.css`
- `app/desktop_collector/web/src/one-ui/overlays.css`
- `app/desktop_collector/web/src/one-ui/shell.css`
- `app/desktop_collector/web/src/one-ui/surfaces.css`
- `app/desktop_collector/web/src/runtime-activity.css`
- `app/desktop_collector/web/src/search.css`
- `app/desktop_collector/web/src/studio.css`
- `app/desktop_collector/web/src/styles.css`
- `app/frontend/shared/one-ui/tokens.css`
- `app/desktop_collector/web/tests/one-ui-system.spec.ts`

Documentation updated: PROJECT_CONTEXT, CHANGELOG, SESSION_LOG, ASSET_INVENTORY and this
handoff. Milestone gates are unchanged: no visual acceptance, Phase E/M2, hardware,
backend, cutover, dependency removal or release was approved. No push/commit performed.
The directory has no repository-local .git; parent repository scoped status is `?? ./`
(HEAD 45350ae27713e319e868393f424c4377c361b545). Per-file archive diffs are the meaningful
review. Existing missing app/frontend/index.html and unrelated user work are preserved.

Final scope audit: 56 protected reference/assets match pre-edit hashes; 229 backup entries
match the baseline manifest; backend, launcher and dependency files are unchanged. No
whitespace errors in the archive-based diff; scoped git diff --check passes. Owned Vite
review server was stopped and port 5173 released.

Next gate: user visual acceptance of the complete system and remaining native DPI review.

## 2026-09-27 — Overlay navigation and integrated visual refinement

Resume verification after the user's limit interruption: Figma whoami succeeded again
(Fish, Full seat) and live One UI access was rechecked against expanded rails 1316:9258/
9261, Card 245:399 and equalizer_2 341:16, including actual children and geometry.
The existing passing results were reconciled with source; no implementation was restarted.
Owned Vite review process was stopped and loopback port 5173 released. Final source hashes
are saved in the ignored audit folder as final-source-manifest.json.

Current state: implemented and verified within the authorized frontend scope; awaiting
user visual review. The user explicitly rejected navigation that pushes content aside.
The earlier desktop proportion correction remains approved. Do not infer acceptance of
this new pass or open Phase E/M2, hardware, backend, launcher cutover or Qt cleanup.

Delivered behavior:

- At >=1100px, a 280px expanded drawer overlays stationary content. Selecting a
  destination, outside click or Escape closes it. Focus starts on the current destination,
  stays within drawer controls and returns to the menu on dismissal. Resizing closes the
  desktop drawer and exposes the existing narrow bottom dock. Same four destinations.
- Shared contextual selection moves between tabs; interrupted peer motion continues
  from its visible transform/opacity. Drawer uses 360ms, peer/page transitions 240ms and
  the shared Samsung basic curve. Reduced motion removes travel. These are deliberate
  desktop timings, not claimed exact measurements of Samsung's recording.
- Exact equalizer_2, existing labs pair and speed glyph replace disputed Monitor,
  Studio and Quick Status icons. Snackbar separates from the dark canvas. Focus uses a
  restrained 2px outline. Existing glyphs make Studio empty-state treatment consistent.
- Simulator uses editable settings plus a distinct applied configuration from real
  application state; it does not present draft values as active. Statistics uses two
  source cards with actual counts/rates/sequence and cumulative loss. Devices and Monitor
  stop claiming live rates after disconnection/bridge loss. The decorative channel ring
  is now a neutral channel count. Existing chart-first Overview and pause behavior remain.
- Desktop type/control scale stays 32px title / 14px body / 40px actions / 44px underline
  fields / 48px Search. Simulator CSS is consolidated instead of adding competing patches.

Source gate and mapping:

whoami succeeded and live One UI file `wzEFGRLl9MU1nB1JxUSyhD` was meaningfully read
before source edits. All 11 live pages were enumerated; the entire Icons page (2,403
components) was searched, plus applicable App Components, Behind the scenes, System UI,
Workspace and local paint/text styles. Cover-only `StIo1CdCci8HQXMmdhXZG8` is intentionally
excluded as a SmartGlove UI source. Current real source owns functionality and real state.

| Shared implementation | Live Figma source | Desktop adaptation |
|---|---|---|
| Overlay drawer | Expanded Rail `1316:9258/9261`, rows `1316:8906/8887` | 280px width, 48px rows, 24px glyph, 14px text; original radius 28/9 retained |
| Cards and composition | Card `245:399`, dark/light `245:400/432` | Existing 20px padding / 28px radius; bounded product panes |
| Context selection | Top Nav `1540:31020`, selected `1540:31014` | Existing capsule geometry with continuous selected indicator |
| Snackbar | Toast `479:8074`, inner `479:8060` | Existing radius/padding/type; raised theme surface for visibility on black canvas |
| Semantic icons | `341:16`, `340:8858/8859`, `340:8580` | Exact SVG export/reuse and currentColor masks |

The supplied galaxy-note.mp4 was reviewed across its whole 6.63s duration and densely
at 0.15s intervals. It establishes overlay rather than push behavior. Prior supplied
Samsung recordings remain the behavioral basis for other shell interactions. Official
sources reviewed: [design system](https://developer.samsung.com/design-system),
[motion](https://developer.samsung.com/one-ui/motion/basic.html),
[large screens](https://developer.samsung.com/one-ui/largescreen-and-foldable/large_screen_layout.html),
[visual depth](https://developer.samsung.com/one-ui/structure/visual-depth.html),
[symbols](https://developer.samsung.com/one-ui/iconography/symbol.html) and
[toasts](https://developer.samsung.com/one-ui/comp/toast.html).

Recovery checkpoint, created before production edits and reverified at handoff:

`backups/SmartGlove-PRE-OVERLAY-COHERENCE-20260927-194108.zip`
SHA256 `5210909a263e0d34cea2eb9b3e7ea5fd827fc901c53ac1d4a1a7d6ac489697e3`.
All 249 entries checked against SHA256 manifest and archive CRC. This is a source/config/
reference checkpoint, not a dependency or captured-data backup. Rebuild generated web
output after recovery. Compare subsequent user changes before restoring; no restore was
performed and previous archives remain. Manifest/info are under the ignored audit folder.

Verification actually run:

- `npm test` in app/desktop_collector/web: 5 files, 26 tests PASS.
- `npm run build` in the web directory: TypeScript + Vite PASS after final source changes.
- `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_app.ps1 -SkipBuild -SmokeTest`:
  PASS; process-scoped policy only, launcher unchanged.
- Actual React/Vite + Edge + authenticated temporary simulator: 38/38 main checks and
  5/5 focused checks PASS. Main review covers all 18 sections plus Search tabs/results,
  Quick Status, Notifications, profile/password/create account, dropdown, snackbar,
  disconnect dialog, live notification, dataset draft and login. Draft/pause survive
  navigation; edit/apply distinction is verified. Focused checks cover focus trapping,
  current destination, closing geometry, resize, forced colors, disconnect and bridge loss.
- 52 main + 3 focused real screenshots. Viewports: 1920x1200, 1440x900, 1280x720,
  820x1180; both themes, reduced motion and forced-color checkbox/form checks.
- 14 Axe page/theme states: 0 detected WCAG2A/AA violations; 0 browser errors.
  Temporary bridge shutdowns exit 0. Pre-edit audit covered 18 sections in 39 screenshots.
- Scoped Git diff/check has no output; status remains `?? ./` under parent repository.
  Meaningful review uses the pre-edit archive and full source diff: no missing source,
  unrelated deletion, protected-reference change or added-line whitespace issue.
  Vite's generated bundle replacement is expected and excluded from source deletion checks.

Evidence: `.design-cache/oneui-coherence-20260927/verified/results.json`,
`supplemental/results.json`, corresponding real screenshots, source.diff and file-review.json.
The initial final/ attempt stopped at an overly strict reduced-motion harness assertion;
the passing evidence is verified/ plus supplemental/. The focused harness also initially
sampled an unfinished peer transition; it was corrected before the final passing run.
Earlier/intermediate attempts are not counted as passing evidence.

Not verified: full historical Playwright suite, native PyWebView GUI, human screen reader,
physical monitor/DPI or real hardware. Frame sampling checks continuity/geometry; it does
not certify physical-display FPS. Visual acceptance remains the next gate. Run the existing
run_app.ps1 for review; no commit, push, merge or release was performed.

Exact changed/new durable files (20 frontend source/assets + 6 documentation files):

- `CHANGELOG.md`
- `PROJECT_CONTEXT.md`
- `PROJECT_MILESTONE_TRACKER.md`
- `app/desktop_collector/web/src/DeviceManager.tsx`
- `app/desktop_collector/web/src/GlobalSearch.tsx`
- `app/desktop_collector/web/src/LiveMonitor.tsx`
- `app/desktop_collector/web/src/QuickStatus.tsx`
- `app/desktop_collector/web/src/RuntimeActivityView.tsx`
- `app/desktop_collector/web/src/SourceStatistics.tsx`
- `app/desktop_collector/web/src/Studio.tsx`
- `app/desktop_collector/web/src/assets/one-ui/figma/equalizer-2.svg`
- `app/desktop_collector/web/src/device-layout.css`
- `app/desktop_collector/web/src/one-ui/controls.css`
- `app/desktop_collector/web/src/one-ui/feedback.css`
- `app/desktop_collector/web/src/one-ui/interaction-page.css`
- `app/desktop_collector/web/src/one-ui/interaction-page.tsx`
- `app/desktop_collector/web/src/one-ui/navigation.tsx`
- `app/desktop_collector/web/src/one-ui/shell.css`
- `app/desktop_collector/web/src/one-ui/shell.tsx`
- `app/desktop_collector/web/src/one-ui/surfaces.css`
- `app/desktop_collector/web/src/source-statistics.css`
- `app/desktop_collector/web/src/studio.css`
- `app/desktop_collector/web/src/styles.css`
- `docs/ASSET_INVENTORY.md`
- `docs/SESSION_LOG.md`
- `docs/WORK_SESSION_HANDOFF.md`

Backend/core/protocol/acquisition, raw data, dependencies, protected frontend reference
material, local Figma catalog, original videos and run_app.ps1 remain unchanged. The
downloaded project has no local .git; parent main HEAD is
45350ae27713e319e868393f424c4377c361b545. Preserve unrelated parent-repository work.

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

Exact changed/new files for this refinement (source and durable documentation):

- `CHANGELOG.md`
- `PROJECT_CONTEXT.md`
- `PROJECT_MILESTONE_TRACKER.md`
- `app/desktop_collector/web/src/App.tsx`
- `app/desktop_collector/web/src/GlobalSearch.tsx`
- `app/desktop_collector/web/src/LiveMonitor.tsx`
- `app/desktop_collector/web/src/QuickStatus.tsx`
- `app/desktop_collector/web/src/RuntimeActivityView.tsx`
- `app/desktop_collector/web/src/Studio.tsx`
- `app/desktop_collector/web/src/assets/one-ui/figma/arrow-right.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/completed.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/control-play.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/devices.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/drawer.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/notification-outline.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/notification.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/report.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/translate.svg`
- `app/desktop_collector/web/src/assets/one-ui/figma/upload.svg`
- `app/desktop_collector/web/src/one-ui/controls.css`
- `app/desktop_collector/web/src/one-ui/controls.tsx`
- `app/desktop_collector/web/src/one-ui/feedback.tsx`
- `app/desktop_collector/web/src/one-ui/figma-icon.css`
- `app/desktop_collector/web/src/one-ui/figma-icon.tsx`
- `app/desktop_collector/web/src/one-ui/interaction-page.css`
- `app/desktop_collector/web/src/one-ui/shell.css`
- `app/desktop_collector/web/src/one-ui/shell.tsx`
- `app/desktop_collector/web/src/quick-status.css`
- `app/desktop_collector/web/src/runtime-activity.css`
- `app/desktop_collector/web/src/studio.css`
- `app/desktop_collector/web/src/styles.css`
- `docs/ASSET_INVENTORY.md`
- `docs/SESSION_LOG.md`
- `docs/WORK_SESSION_HANDOFF.md`

Recovery: verified archive restores the pre-refinement source state. Do not blindly
extract over subsequent user edits; compare the manifest first. Existing earlier
archives and user-owned deletions/untracked files remain preserved. No new runtime
dependency or network service was introduced. Run the existing run_app.ps1 to review.

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

## 2026-09-26 — Design Kit refinement delivered; visual review available

The previous overhaul is the accepted baseline for this second pass, explicitly stated
in attachment `4cffd1dd-36bc-4978-84d0-f7909b9635a1/pasted-text-1.txt`. This authorizes
system-wide conformance refinement, not a second IA/motion redesign. Earlier entries
below describe prior work; their test claims do not substitute for this session.

**Access/recovery.** Fresh whoami Fish (Full/student/admin) and live file read succeeded.
One UI `wzEFGRLl9MU1nB1JxUSyhD` is required; cover-only `StIo1CdCci8HQXMmdhXZG8` is
intentionally excluded. Current real application source is the functionality baseline.
No project-local `.git`; parent `C:/Users/ASUS` reports `?? ./`, so project HEAD/branch
and Git diff are unavailable. Filesystem hashes against a verified backup supply scope.
Backup: `backups/SmartGlove-POST-ONEUI-OVERHAUL-PRE-DESIGNKIT-REFINE-20260926-073716.zip`,
216 entries / 927896 bytes; created 2026-09-26 07:37 local, CRC and entry hashes checked.
SHA256: `9b3cf5d597077aa46fc02554697e67d46799810823e8372c104817fd85687070`.
Original pre-overhaul backup and delivered patch were not overwritten.

**Discovery.** All 11 live pages enumerated: Welcome, Styles, App Components, System UI,
Icons, Emojis, Workspace, Behind the scenes and three empty separator pages. Relevant
canvas guidance read, not just component names; whole icon page (2403 components)
searched along with profile imagery, SmartThings, Camera, Notes, wallpaper/media assets.
19 paint and 6 text styles inspected. Correction to prior inventory language: one empty
variable collection exists, with zero variables. Relevant pages expose no real motion
reactions/timelines; no animation numbers fabricated. Existing complete-video review
retained, with dense Galaxy Store/Gaming Hub transition samples revisited this pass.
Fresh ignored audit JSONs and concise system matrix are under
`.design-cache/oneui-designkit-audit-20260926/DESIGN_KIT_INDEX.md`.

Written notes support sentence case, zero-gap grouped rows with dividers, optional
card icon/info/switch properties, modern versus legacy variants, and encapsulated
app-bar buttons on scroll. Large-screen rail guidance was considered; the explicitly
approved four-domain floating dock is deliberately retained. OS panels/keyboards,
widgets, emoji and unrelated branded imagery are references only.

**Delivered.** Exact Shape checkbox 1549:8505 and its unselected ellipse 1549:8506 now
serve Monitor, auth and Studio; removed rounded-square CSS, duplicate auth tick and
screen-specific shape overrides. Native input semantics/loading remain; forced colors
shows the native checkbox. Dropdown chevron 340:8893 replaces a long arrow; checked
options use the same real selected artwork. Feedback now uses exact error 341:15,
close 341:113, existing info and selected-check assets instead of character/CSS symbols
and a hand-drawn close path. Snackbar dismiss target is 40px; timers/announcements stay.
Modern dialog actions adapt to desktop at 44px high, 16px/600 (from 52px,18px/700);
removed decorative destructive exclamation and blur behind an opaque dialog. Menus
share neutral surface/elevation instead of black glass/purple shadow. Table headers
no longer force uppercase; four excessive 800 weights use 700.

Account/profile already uses the exact default avatar and real identity/security data;
retained its composition. No new imagery was better suited than existing source/folder/
avatar assets. Search, 40px controls/42px fields, cards, neutral themes, four domains,
selected navigation, state preservation and video-derived motion remain appropriate.
The draft camera option stays a checkbox: an immediate switch would imply a live camera
feature that does not exist. Technical charts, L/R labels and progress spinner remain
product-specific; no equivalent appropriate kit component justified replacement.

**Changed production files**, relative to `app/desktop_collector/web/src/`:
- `one-ui/controls.tsx`, `controls.css`, `feedback.tsx`, `feedback.css`, `overlays.css`,
  `surfaces.css`, `styles.css`.
- Five new exact assets in `assets/one-ui/figma/`: `checkbox-selected.svg`,
  `checkbox-unselected.svg`, `chevron-down.svg`, `close.svg`, `error-outline.svg`.
Asset node IDs/hashes are in `docs/ASSET_INVENTORY.md`. Old exports are preserved but
superseded imports no longer ship them. No dependency/backend/protocol/launcher/Qt,
protected reference, raw-data or production security changes. No push/merge/commit.
Durable docs: this handoff, SESSION_LOG, ASSET_INVENTORY, CHANGELOG, PROJECT_CONTEXT
and PROJECT_MILESTONE_TRACKER. Audit/review scripts and screenshots remain ignored.

**Verification actually run.**
- `npm run build`: TypeScript + Vite PASS, 100 modules.
- `node .design-cache/oneui-designkit-audit-20260926/static-check.cjs`: 11 CSS parses PASS.
- `npm test -- --run src/one-ui/overlays.test.ts`: 3/3 PASS.
- One comprehensive real runtime review (`runtime-review.mjs`): actual React/Vite,
  Edge headless, authenticated ephemeral bridge, simulator data, isolated review user.
  Devices/Monitor/Studio/Account/Search/profile/Now Bar/dialog/chrome; dark and light;
  1920x1200,1280x720,1440x900,820x1180; keyboard, draft/pause retention, compact nav,
  reduced motion, login/forced colors. 13/15 checks initially passed, 0 page errors,
  Devices light Axe WCAG2A/AA scan 0 violations. Manual screenshots inspected.
- Follow-up was limited to incomplete shared-control checks. Initial harness incorrectly
  used Signals instead of Channels, Users instead of Accounts, looked for a select in
  a draft using segmented controls, and expected a URL filename despite Vite inline
  assets. These are preserved in evidence, not relabeled PASS. Corrected source-based
  checks in `resolved-controls.mjs`: Monitor keyboard/visible exact variant and Account
  Role dropdown keyboard/focus both PASS. `targeted-controls.mjs` separately verified
  success notification/exact dismiss artwork and dismissal. No source change required.
- Each temporary bridge reported exit 0 with empty stderr this pass. No claim that
  earlier intermittent Windows cleanup issue is fixed. No full E2E, native PyWebView,
  full accessibility audit, error-toast runtime injection, hardware or backend suite.
- Git status/diff/check executed but cannot substantiate changes in an untracked child
  workspace. Backup/hash comparison and normalized full source diff reviewed instead;
  protected baseline files unchanged. Only whitespace formatting followed runtime.

**Remaining/next gate.** User can review the delivered refinement using actual screenshots
under the ignored audit directory. No user acceptance of this new refinement is assumed.
Phase E/M2, firmware/ML, backend, launcher cutover, Qt cleanup and publication remain
closed. No implementation item remains in this refinement scope. Desktop dimensions,
licensed font fallback, opaque menus and retained dock are intentional adaptations.

## 2026-09-26 — Full One UI frontend overhaul implemented; user visual approval pending

Current authorization: `0759753e-b28a-4171-8499-7413f4b6721d/pasted-text-1.txt`, followed
by the explicit cover-only Figma correction. This supersedes historical visual
freeze/Stage 1-only instructions below. No permission checkpoint between screens.

**Access and baseline.** Figma `whoami` succeeded as Fish (Full/student). Before source
edits, One UI `wzEFGRLl9MU1nB1JxUSyhD` was meaningfully read through live metadata and
design context; subsequent audit traversed all 11 pages. `StIo1CdCci8HQXMmdhXZG8` is
cover-only and intentionally excluded, not an authentication failure. Current source
at `C:/Users/ASUS/Downloads/Smart-Gloves` supplied screens, functionality, state and IA.
There is no project-local `.git`; discovery reaches unrelated `C:/Users/ASUS`, where
this project is untracked. No project branch/HEAD is claimed. Historical publication
checkout and user archives remain intact. `SESSION_TRANSFER_20260912.md` was absent;
the available 20260910 transfer and canonical context/source were reconciled instead.

**Verified pre-edit recovery.** `backups/SmartGlove-PRE-ONEUI-OVERHAUL-20260926-024246.zip`
contains 208 source/config/document/reference files (927881 bytes), excluding
dependencies, builds, caches, runtime data and secrets. Created 2026-09-26 02:42 local
time. Archive CRC and every entry's hash were checked against the pre-edit files.
SHA256: `179bfb3d77dfdede88198ed315fcafe5fdc30c2a911f212a3ea35344c1c04931`.
Baseline hashes and verification metadata: `.design-cache/oneui-overhaul-20260926/`.

**Delivered system.** Neutral light/dark backgrounds and matte cards replace glossy
gradients/glows; shared typography is 32px page / 24px profile / 20px card / 14px body.
Segoe UI/local licensed DM Sans are retained. Shared desktop controls are 40px, fields
42px, compact actions 36px; narrow touch layouts retain larger targets. Simulation
fields align on one baseline. Accent #387AFF remains, with primary-button fill #2563D8
for small white text contrast. Canonical light/dark surface hierarchy and 28px card
radii are retained/adapted; chart colors and non-color hand distinction remain.

**Navigation/motion.** Devices, Monitor, Studio and Account remain the four domains.
Context sections are true content destinations, never scrollspy substitutes. Native
sticky owns the context bar; utilities float independently, with no opaque shelf.
A stable header-derived threshold changes capsule opacity. New contextual headings
clear the capsule via a one-time measurement; no per-frame geometry interpolation,
content-height/hover feedback, title-hold transform or scroll-linked page translation.
Peer content enters horizontally (240ms/32px), detail pages use 280ms, capsule opacity
180ms; these are deliberate desktop adaptations, not exact video measurements.
Incoming transitions cancel on rapid navigation and respect reduced motion. Bottom
dock is 392×58px desktop, mildly translucent/6px blur with dark inset selection.
Domain scroll/section state is retained. Studio drafts and Monitor channels/window/
freeze/follow/zoom ranges survive navigation in memory; sign-out/user changes reset
view drafts. Inactive charts unmount; acquisition remains in the existing store.

**Screens.** Devices preserves two gloves, flex emphasis, compact 13-channel summary,
flat packet metrics and aligned simulation fields. Monitor preserves two-hand charts,
all 13 channels, units/timestamps and pause/follow/zoom semantics. Studio uses exact
workflow/source icons and honest empty/readiness states; no data/ML/camera capability
was fabricated. Shared AccountProfile adds the exact default avatar, real identity,
role/status, joined/last-sign-in/password state and profile action. Local-access counts
and security activity come from the existing API. Account CRUD/password/logout remain.
Search retains its large title, Back, scope, recents, grouped results and bottom input.
Search/detail pages make the underlying shell inert and restore focus on return.
Now Bar/status actions keep the existing runtime behavior and unobstructed hit areas.

**Source evidence.** Figma discovery included Styles, App Components, System UI, Icons,
Emojis, Workspace, Behind the Scenes and separator/cover pages, beyond the old JSON.
Live contexts include Card 245:400, Buttons 1497:12222, Header 1549:8784, Top Navigation
1540:31020, Top Bar 1495:10624, In-App Navigation 1495:9664, Floating Toolbar 1495:11133,
Search 1497:12549, Drop Down 1497:11901, Dialog 1493:8950 and avatar 827:4723.
App Dock 1491:8142 and health/wearable illustrations were inspected; unsuitable
phone/app-launcher geometry and unrelated robot/health content were not forced into
this product. Six exact new assets and hashes are in `ASSET_INVENTORY.md`. Product
telemetry/chart/profile composition remains custom because it represents app-specific
data; its controls/surfaces use inspected Figma primitives, not another component kit.

All three original recordings were reviewed across complete timelines, with dense
samples around transitions: Galaxy Store → contextual/sticky chrome, Search and dock;
Gaming Hub → avatar/profile grouping and page depth; Samsung Health → calm data cards
and chrome/content separation. Video bytes are unchanged. Official sources consulted:
[layout](https://developer.samsung.com/one-ui/layout/basic.html),
[grid](https://developer.samsung.com/one-ui/layout/grid.html),
[large screens](https://developer.samsung.com/one-ui/largescreen-and-foldable/intro.html),
[motion](https://developer.samsung.com/one-ui/motion/basic.html).

**Changed production files** (relative to `app/desktop_collector/web/src/`):
- `App.tsx`, `AuthScreens.tsx`, `DeviceManager.tsx`, `LiveMonitor.tsx`, `SensorChart.tsx`,
  `Studio.tsx`, `UserManagement.tsx`; new `AccountProfile.tsx`, `account-profile.css`.
- `styles.css`, `studio.css`, `search.css`; `one-ui/controls.tsx`, `controls.css`,
  `shell.tsx`, `shell.css`, `navigation.tsx`, `interaction-page.tsx`,
  `interaction-page.css`, `overlays.css`, `surfaces.tsx`, `surfaces.css`, `index.ts`.
- Six exact files under `assets/one-ui/figma/`: `account-avatar.png`,
  `security-outline.svg`, `camera-outline.svg`, `pause.svg`, `arrow-down.svg`, `check.svg`.

The previous shell CSS stack was replaced by one ~6.4KB implementation; superseded
same-selector declarations and ornamental rules were consolidated in shared styles.
Unused shell rail/hero/fallback APIs were removed. No new production dependencies,
backend/protocol changes, protected reference edits, raw-data writes or launcher
cutover. Durable docs changed: this handoff, `SESSION_LOG.md`, `ASSET_INVENTORY.md`,
`ONE_UI_DESIGN_RULES.md`, root `PROJECT_CONTEXT.md`, `PROJECT_MILESTONE_TRACKER.md`,
`CHANGELOG.md`. Old sessions below are historical, not current verification claims.

**Verification actually executed.**
- `npm run build`: final TypeScript + Vite PASS, 97 modules. An intermediate nullability
  error in shell navigation was fixed before this successful final build.
- PostCSS parse of all 11 frontend CSS files: PASS.
- `npm test -- --run src/store.test.ts src/runtimeActivity.test.ts src/one-ui/overlays.test.ts`:
  15/15 PASS. These existing unit subjects were not modified afterward.
- Actual React/Vite + authenticated temporary bridge, Edge headless: Devices, Monitor,
  Studio, Account, Search, Profile, expanded/compact chrome, dock and Now Bar reviewed
  at 1920×1200; additional 1440×900, 1280×720, 820px and 600px layouts. Dark primary
  review plus light Account/Create Account/Devices checks. No generated/mock screenshot.
- PASS: navigation state, Studio draft retention/reset, Monitor pause/window retention,
  keyboard context/menu focus, Search inert/return, simulation field alignment,
  Now Bar trigger/hit-test access, reduced motion, selected check visibility,
  Signals chart width/heading clearance, stable compact bar and settled Account hover.
- Axe WCAG2 A/AA Devices: 0 violations in dark and light after correcting primary fill.
  This is a scoped automated check, not whole-product accessibility certification.

Runtime review exposed and fixed primary-button contrast, Signals grid width, select
arrow sizing and heading clearance. Initial compact-bar automation scrolled the target
into view; direct pointer input verified the actual interaction. A hover measurement
taken during navigation animation failed; settled profile/utility hover passed. Browser
startup also needed a longer initial page-load timeout. These are recorded rather than
reporting the initial pass as fully green. Evidence lives only in the ignored audit
folder: `after/`, `final-details/`, `final-followup/` with screenshots/results JSON.

**Limits/remaining risk.** One review run hit Windows connection reset and a temporary
SQLite file lock during bridge cleanup (exit 1); the last follow-up closed exit 0 with
empty stderr. This intermittent harness shutdown issue is not claimed fixed by frontend
changes. Native PyWebView GUI, launcher smoke, hardware, full E2E/backend suite,
screen-reader speech and quantitative FPS/performance benchmarks were NOT RUN.
Visual approval remains with the user. No push, merge, release or Qt removal.

**Delivery/next gate.** One direct-root patch ZIP:
`patch/SmartGlove-ONEUI-OVERHAUL-20260926.zip`; source/docs/assets plus `PATCH_INFO.txt`,
no build/dependencies/cache/screenshots/videos/catalog dump. Review the current real
application; next gate is user visual acceptance. Do not open Phase E/M2 from this pass.

Final filesystem review: 28 existing files changed, 8 new files, zero baseline
deletions or unrelated baseline changes. Backup SHA/CRC, protected reference/catalog
hashes and all three video hashes were rechecked. Parent `git status --short -- .`
returns `?? ./`; project-scoped tracked diff is empty because no project baseline
is tracked there. A separate before/after `git diff --no-index --check` produced no
whitespace diagnostics (exit 1 indicates the compared trees differ). Source review
used the backup-derived diff, not that empty tracked diff.

## 2026-09-12 — SignFlow source-only publication

- User explicitly authorized replacing old files on HFuoc/SignFlow and pushing only project source, excluding APK, patches, unrelated Markdown and archives.
- Downloaded workspace has no local .git. Isolated checkout: `.design-cache/signflow-publish`, origin `https://github.com/HFuoc/SignFlow.git`, branch `main`, parent `b9149d1db153f1d605f744727248e4a61c44384d`. Original local archives/APK/patch/reference material preserved. No history rewrite.
- Prepared 169 source/config/test/asset/technical-documentation files (about 1.34 MB); removes old unpack workflow, backup ZIP and BACKUP_BASELINE.md from published branch. Runtime/Qt rollback files retained. Session logs and project planning snapshots remain local.
- Changed local files: README.md (complete Windows setup/run/auth/dev/test/troubleshooting guide), .gitignore (publication exclusions), app/desktop_collector/web/src/store.test.ts (two stale Vietnamese error expectations updated to existing English app copy), CHANGELOG.md, docs/SESSION_LOG.md, docs/WORK_SESSION_HANDOFF.md.
- Verified in filtered checkout: npm.cmd ci PASS; Python pytest 63/63 PASS (two dependency deprecation warnings); Vite/TypeScript build PASS; Vitest initially 15/17, then 17/17 PASS after expectation correction; PySide smoke exit 0; bridge smoke initially hit sandbox read-only database on shutdown, escalated rerun exit 0 with no error output.
- Git staged artifact/credential-pattern audit PASS; all published file bytes match corresponding workspace files. git diff --check on unstaged changes PASS; staged diff --check reports pre-existing trailing whitespace/EOF blanks in imported source, preserved rather than reformatting unrelated work.
- NOT RUN: fresh Python dependency install, full Playwright, interactive GUI and visual acceptance. Publishing does not approve new UI, open ML/hardware milestones, change launcher cutover or authorize Qt cleanup. Next product gate remains manual runtime/visual acceptance.
- Publication status: pushed successfully to HFuoc/SignFlow main as c49a2aa70930ed38fdd289c1a4a753a9f535317c (fast-forward from b9149d1). Isolated checkout is clean; final git diff --check and git diff are empty. Original workspace archives and unrelated files remain intact.

# Work session handoff

## 2026-09-11 — IMPLEMENTED — AWAITING USER MANUAL TEST

Authorization: attachment `8bc052ac-240e-41a2-a249-540e861724e5/pasted-text-1.txt`.
Figma initially required reauthentication; after user reconnect, exact design context was retrieved for Top App Bar `1495:10799`, Buttons `1497:12219`, Accent `1497:12231`, Drop Down `1497:11901`, Selection Menu `1497:12842`, Search `1497:12549`, Card `245:399`, and icon nodes `340:8901`/`340:8902`. Fresh exact SVG bytes replace `info-outline.svg`/`info.svg`; no hand-authored icon geometry.

Delivered: shared `one-ui/interaction-page.tsx` + CSS with retained context, Back/Escape/focus restoration, forward/reverse transitions and reduced motion. Search uses vertical entry; Quick Status and Create Account use page-depth entry with content-specific layouts. No routing rewrite, modal environment or body scroll lock. Create Account preserves fields, API, validation and existing Figma-derived password/role primitives. Security log remains scrollable and now keyboard focusable without scrollbar chrome. Device control scales are 46px for page actions/settings, 42px for device actions; compact simulation widths preserve units/behavior.

Changed frontend files: `App.tsx`, `GlobalSearch.tsx`, `UserManagement.tsx`, `styles.css`, `search.css`, `one-ui/index.ts`, new `one-ui/interaction-page.tsx`, new `one-ui/interaction-page.css`, and `assets/one-ui/figma/info-outline.svg`, `info.svg`. Related records: this handoff, `CHANGELOG.md`, `docs/SESSION_LOG.md`.

Checks actually run: `tsc.cmd --noEmit -p tsconfig.app.json` PASS; PostCSS parsing of the three modified CSS files PASS. No runtime, screenshot, browser, E2E, pytest or accessibility automation. This downloaded copy has no local Git repository; parent Git treats it as untracked, so no tracked baseline diff is available.

Unverified/next gate: user manual runtime/visual acceptance, including focus transitions, desktop/narrow layouts and both themes. No claim of matching unavailable video timing exactly. Main/contextual navigation, Now Bar, sign-in, F11, Live Monitor, Studio content, backend and APK remain outside this pass. Phase E remains closed. No push/merge/release.

Tệp này là snapshot chuyển giao ngắn gọn của dự án SmartGlove Dataset Studio giữa
các tài khoản ChatGPT, Work session và Codex Goal. Nó bổ sung, không thay thế,
`PROJECT_CONTEXT.md`, `PROJECT_MILESTONE_TRACKER.md`, `CHANGELOG.md` và các tài liệu
canonical trong `docs/`.

## Quy tắc bắt buộc cho mọi agent

1. Đọc `AGENTS.md`, `PROJECT_CONTEXT.md`, `PROJECT_MILESTONE_TRACKER.md`, phần mới
   nhất của `CHANGELOG.md`, `docs/SESSION_LOG.md` và tệp này trước khi lập kế hoạch
   hoặc sửa dự án.
2. Đối chiếu snapshot này với repository thật bằng `git status --short`, diff hiện
   tại và các tài liệu canonical. Repository hiện tại luôn có quyền ưu tiên nếu
   snapshot đã cũ.
3. Sau mỗi thay đổi material về code, kiến trúc, UI, dependency, test, milestone,
   quyết định của người dùng hoặc gate, phải cập nhật tệp này trong cùng phiên làm
   việc trước khi handoff.
4. Chỉ ghi kết quả kiểm thử đã thực sự chạy. Dùng `NOT RUN`, `UNVERIFIED`,
   `AWAITING USER APPROVAL` hoặc `BLOCKED` khi chưa có bằng chứng.
5. Không xóa lịch sử quan trọng để làm trạng thái trông sạch hơn. Chuyển chi tiết
   dài sang `docs/SESSION_LOG.md`/`CHANGELOG.md` và giữ ở đây kết luận cần thiết để
   agent tiếp theo tiếp tục chính xác.
6. Không ghi password, cookie, bridge token, session credential, Wi-Fi secret,
   dữ liệu người dùng hoặc raw dataset vào tệp handoff.
7. Một tài khoản/agent khác khi tiếp nhận phải tiếp tục dùng đúng quy tắc này và
   giữ nguyên tên tệp `docs/WORK_SESSION_HANDOFF.md`.

## Thứ tự nguồn quyết định

Khi có khác biệt, dùng thứ tự sau:

1. Yêu cầu và quyết định mới nhất của người dùng.
2. Repository/source/test và Git state hiện tại.
3. `AGENTS.md` và tài liệu canonical hiện hành.
4. `PROJECT_MILESTONE_TRACKER.md` và snapshot trong tệp này.
5. `CHANGELOG.md`, `docs/SESSION_LOG.md`, audit và artifact lịch sử.
6. Backup/recovery cũ chỉ dùng để phục hồi hoặc xác minh provenance.

Không biến nội dung `Planned`, `Proposed`, `TBD` hoặc audit recommendation thành
phạm vi đã được phê duyệt.

## Snapshot hiện tại — 2026-09-10

### Figma component-conformance pass — IMPLEMENTED — awaiting user visual approval

The user explicitly requested stronger reuse of One UI/Figma component anatomy instead of treating Figma only as a visual reference. This pass is bounded to frontend UI normalization and does not open real MediaPipe/camera/training/backend work.

**Current component policy:** approved SmartGlove screens remain frozen; new/shared UI follows exact Figma component -> adapted Figma component -> composition -> custom-last. React cannot execute Figma instances directly, so the runtime uses reusable coded equivalents mapped to exact catalog nodes/assets/tokens.

**Delivered:** shared `OneUICard`, `OneUIEmptyState`, `OneUIKeyValueList`, `OneUISelectionMenu`, `OneUISearchField`, `OneUISelectField`, `OneUITopNavigation`, `OneUIAppDock` and `OneUIUtilityToolbar`. Studio/Search/shell consume these primitives. Relevant mappings: Card `245:399`, Search `1497:12549`, Selection Menu `1497:12842`, Top Navigation `1549:2831`, In-App Navigation `1495:9649`, App Dock `1491:8142`, Top App Bar `1495:10992`, Floating Toolbar `1495:11133`.

**Visual normalization:** dark/light container tokens use the One UI catalog values; Studio contextual navigation is bounded rather than full-width; four-item bottom dock is more compact; utility background still has zero opacity at page top and progressively reveals on scroll; disabled primary actions are neutral; Search uses the exact Figma search SVG and shared search/selection surfaces.

**Production files changed in this pass:** `App.tsx`, `SensorChart.tsx`, `Studio.tsx`, `studio.css`, `GlobalSearch.tsx`, `search.css`, `one-ui/controls.tsx`, `one-ui/controls.css`, `one-ui/feedback.tsx`, `one-ui/overlays.tsx`, `one-ui/index.ts`, `one-ui/shell.tsx`, `one-ui/shell.css`; new `one-ui/surfaces.tsx`, `one-ui/surfaces.css`, `one-ui/navigation.tsx`.

**Verification actually run:** final TypeScript no-emit check passed. Full Vite build is NOT VERIFIED in Linux because the uploaded Windows `node_modules` lacks Rollup's Linux optional binary; no toolchain repair was attempted. Actual-source deterministic SSR + Chromium review renders passed visually for Studio Overview, MediaPipe and Global Search under `.design-cache/figma-conformance-pass1/review/`.

**Checkpoint/evidence:** `.design-cache/figma-conformance-pass1/pre-edit.zip`, `.design-cache/figma-conformance-pass1/pre-edit.sha256`, and `.design-cache/figma-conformance-pass1/review/`. No Git repository exists in this downloaded copy; no push/merge/release occurred.

**Remaining scope:** full legacy English glossary normalization (notably auth/account paths), broad responsive/Axe/smoke suites, and any further component migration are not claimed complete. Next gate is user review of the actual-source renders; do not begin real ML/runtime work from this pass alone.

### Studio/Search frontend — IMPLEMENTED — awaiting external sandbox verification

Current authorization: attachment `5ae3ecc9-4114-4410-8da0-e1a9a9d85507/pasted-text-1.txt`.
The user explicitly approves/freezes the current visual baseline and authorizes six
Studio sections plus global Search, UI-only. This replaces the old visual-approval
stop for the baseline below. It does not approve the new implementation's visuals,
open ML/runtime work, or authorize Phase E/M2, cutover, cleanup, push or release.

**Delivered:** Devices | Monitor | Studio | Account in the existing floating dock.
Studio contextual sections are Overview, Dataset, MediaPipe, Train, Evaluate and
Translate. Existing cards, field/button primitives, themes and shell motion are
reused. Studio has genuine empty/readiness states and editable metadata/configuration
drafts; drafts persist between Studio sections and reset when Studio is unmounted.
No file picker/parsing, camera permission/capture, MediaPipe, training, inference,
evaluation metrics or translation output is implemented. Sensor and visual provenance
are separate frontend types; combined input references both without an alignment algorithm.

Search indexes real collector device/channel definitions and implemented destinations/
actions. Datasets, labels, models and runs remain empty categories. Keyboard search
results open their destination after sheet exit and modal focus cleanup. Search shares
the existing utility group; the background still starts at zero opacity and uses the
unchanged continuous scroll progress. Administrators retain user management; other
collector roles use the existing Account sheet. Participant access rules are unchanged.

**Exact production files changed** (relative to `app/desktop_collector/web/src/`):

- `App.tsx` — integration, navigation, utility mutual exclusion.
- `Studio.tsx`, `studioModel.ts`, `studio.css` — six screens and presentation types.
- `GlobalSearch.tsx`, `search.ts`, `search.css` — Search sheet and frontend index.
- `one-ui/shell.tsx`, `one-ui/shell.css`, `one-ui/index.ts` — extensible utility/context
  slots, section/target navigation, four-item dock and required narrow-layout rules.
- `one-ui/overlays.tsx` — optional English dismiss label and post-close callback;
  existing consumers preserve their defaults.
- `RuntimeActivityView.tsx` — page prop uses the extended ShellPage type only.
- `assets/one-ui/figma/search.svg` — exact Figma export, no hand-authored geometry.

**Documentation changed:** `CHANGELOG.md`, `PROJECT_CONTEXT.md`,
`PROJECT_MILESTONE_TRACKER.md`, `docs/SESSION_LOG.md`, `docs/ASSET_INVENTORY.md`,
`docs/WORK_SESSION_HANDOFF.md`.

**Verification actually run:** exactly one command in `app/desktop_collector/web`:
`node_modules\\.bin\\tsc.cmd --noEmit -p tsconfig.app.json` — exit 1, TS2305/TS1261/
TS1149 due to Windows module-name ambiguity between `Studio.tsx` and the initial
`studio.ts`. Fixed the cause by renaming the latter to `studioModel.ts` and updating
imports. No rerun, in compliance with the user's single-check budget. Final-source
compilation is UNVERIFIED; historical passing suites below do not verify this change.

**NOT RUN:** build, Vitest, pytest, Playwright, screenshots, responsive review, Axe,
smoke tests. No new dependency or toolchain installation. No review evidence generated.

**Worktree/preservation:** this downloaded copy has no local `.git`; requested Git
status/diff are unavailable, and the unrelated parent Git repository is untouched.
All existing user files, checkpoints, reference catalogs, protected prototype trees,
backend/protocol, raw data, launcher, DeviceManager, LiveMonitor and SensorChart source
are preserved. No acquisition, channel/timestamp, chart-axis or Raw Signals change.

**Remaining risks / next gate:** external agent must verify final-source compilation
first, then actual-source render, Search handoff/focus, Studio drafts, four-item dock,
both themes, narrow Studio contextual scrolling and utility pill at top/mid/compact
states. None is claimed visually/runtime approved. The disk-helper error was transient
and not diagnosed; no cleanup was performed. Stop this implementation pass here.

## Historical snapshot — 2026-09-09

### Full One UI visual system — IMPLEMENTED — awaiting explicit user visual approval

Current authorization is attachment
`0bd30823-fc7c-44c0-a322-bf006bca9409/pasted-text-1.txt`: refine the reusable system,
then Device Manager and Live Monitor, preserving the existing Direction B composition.
This supersedes the historical Stage1-only restriction and frozen geometry below;
it does not approve the new visuals or authorize Phase E/M2, cutover, rollback removal
or release. Stop at this review gate. Do not begin another redesign iteration.

**Figma gate passed before application edits.** Authenticated account, exact draft
metadata at `0:1`, then actual design context/code and screenshots were retrieved
successfully for `wzEFGRLl9MU1nB1JxUSyhD`. No access error or catalog-only fallback.
All 13 local catalog files were inspected as discovery sources and left unchanged.
Exact live nodes inspected in this session:

| System / existing code | Actual live reference | Implemented desktop adaptation |
| --- | --- | --- |
| Surfaces / `styles.css` | Containers `247:613`, Card `245:399` | Shared 28px card radius, 20px inset, solid/tonal primary surfaces |
| Titles / page headers | Header Container `1549:8784` | Shared 36/700 page title, 14px supporting copy; existing local font |
| Controls / `one-ui/controls.css` | Buttons `1497:12222`, Search `1497:12549`, Slide Navigation `631:2757` | 52px buttons, 48px compact actions, 58px fields, compact shared segmented controls |
| Shell / `one-ui/shell.*` | Top App Bar `1495:10992`, Top Navigation `1549:2831`, Dock `1491:8142` | 50px utility targets/24px glyphs, consistent contextual nav and page spacing |
| Live activity | Now Bar content `744:3582`, Floating Toolbar `1495:11133` | Keep approved capsule/morph implementation; restore its lane and Quick Status on Monitor |
| Feedback / `one-ui/feedback.*` | Toast `479:8075` | Shared capsule placement, responsive bounds, action-hover contrast and landmark semantics |
| Overlays / `one-ui/overlays.*` | Dialog `632:1999` | Shared dialog/sheet geometry, theme/forced-color/reduced-motion cascade, stable confirm accessible name |

Device cards, chart controls and Raw Signals reuse these primitives. Chart axes,
legends and two-hand layouts remain SmartGlove-specific adaptations, not claimed
exact Figma chart components. Existing icons are retained; no new SVG approximations,
icon library, exported assets, Samsung fonts or short-lived URLs were introduced.

**Delivered behavior.** Both screens use the same title/card/control hierarchy and
shared shell status. Device flex bars use available real samples only, with explicit
missing/offline state; sample-rate/source copy no longer implies unavailable data.
Monitor retains independent two-hand telemetry, all 13 channels, raw values/units,
pause/follow/zoom and L/R text plus solid/dashed distinction. Each channel has a stable
theme-appropriate legend color. Theme/channel redraw preserves the visible x range,
including frozen/explored data. Raw values are not normalized or filtered.
Raw Signals has one internal scroll region; hidden checkbox inputs are anchored to
their rows. Focusing first/last channels no longer scrolls the panel shell blank,
and tablet layout no longer inherits the obsolete multi-column fieldset grid.

**Changed production files** (all under `app/desktop_collector/web/src/`):

- `styles.css`, `DeviceManager.tsx`, `LiveMonitor.tsx`, `SensorChart.tsx`.
- `one-ui/controls.css`, `one-ui/shell.css`, `one-ui/shell.tsx`.
- `one-ui/feedback.css`, `one-ui/feedback.tsx`, `one-ui/overlays.css`, `one-ui/overlays.tsx`.

Added `app/desktop_collector/web/tests/visual-system.spec.ts`. Updated `CHANGELOG.md`,
`docs/SESSION_LOG.md`, this handoff and the current snapshot in
`PROJECT_MILESTONE_TRACKER.md`. No backend, protocol, acquisition, dependency, launcher,
protected prototype, production asset or reference-catalog change.

**Actual final verification:**

- `npm.cmd run build`: PASS, TypeScript and Vite, 53 modules. Final generated assets
  `index-CyuFOiX-.css` and `index-D-N7GSa6.js`; generated build is not source.
- `npm.cmd test`: PASS, 4 Vitest files / 17 tests on final source.
- `npm.cmd run test:e2e -- tests/visual-system.spec.ts --trace off`: PASS, 5/5, 30.2s,
  one worker. Actual React/Vite application and authenticated dynamic loopback bridge;
  only the test launcher is replaced in RAM. No token is written to URL/storage/trace.
  Covers 13-channel selection/empty/recreate, frozen canvas while packet counters grow,
  zoom/follow-live, time-window preservation through theme round trips, disconnect/
  reconnect/missing bars, Now Bar expansion without page reflow, modal/sheet focus
  return, snackbar bounds, keyboard/forced colors and both themes at four viewports.
  First/last channel focus explicitly checks complete row visibility inside the
  internal scroll region and zero scroll on the containing panel.
- Axe: 28 saved scans, zero violations; manual-review targets retained in each JSON.
  Contrast on layered backgrounds is incomplete. Quick Status additionally retains
  its existing `.quick-status-content` generic-label manual target; no claim of full
  accessibility certification or complete contrast validation.
- Direct `.\.venv\Scripts\python.exe -m app.desktop_collector.shell --smoke-test`:
  exit 0 after authorized retry for sandbox-restricted local account storage.
- Final-build launcher smoke: `powershell.exe -NoProfile -ExecutionPolicy Bypass
  -File .\run_app.ps1 -SkipBuild -SmokeTest`, exit 0. Initial direct script call was
  blocked by execution policy; only this process used Bypass, no system-policy change.
- Earlier iterations exposed snackbar overflow, generated punctuation in a button
  accessible name and a snackbar landmark issue; these were fixed before the final
  passing E2E. Earlier failures are historical, not claimed as passes.
- Final scroll-fix verification also encountered worker native exit 3221226505,
  bridge startup exit 1 (stderr unavailable in that attempt), and a 90s whole-test
  timeout surfaced in axe. Handles were terminal/missing and project processes
  revalidated absent before retries. Redacted startup diagnostics and named scan
  logs were added; isolated interaction 1/1 (14.9s), then full affected 5/5 (30.2s)
  passed with unchanged axe rules. These transient failures have no proven root
  cause. No browser/runtime/dependency/security workaround was applied.

**Review evidence** is ignored under `.design-cache/visual-system-refinement/`.
`review/` contains Device Manager and Live Monitor PNGs for dark/light at 1440×900,
1280×720, 800×1100 and 640×450; additionally:
`device-manager-dialog-dark-1440x900.png`, `quick-status-dark-1440x900.png`,
`live-monitor-all-channels-dark-1440x900.png`. These are actual-app captures using
simulated sources, not hardware data or mock UI. Narrow/short windows intentionally
use native vertical scrolling; lower charts/legend/settings remain reachable.
Baseline renders, original 132-file hash manifest and copies remain in `baseline/`,
`before-manifest.json` and `before/`. Final per-file audit/diff are in the same root.

**Git/preservation limit.** This downloaded workspace has no local `.git`.
`git status --short` could not provide a project-scoped status: sandbox execution
failed, and the unrestricted discovery reached the unrelated parent user repo.
Do not use that parent repository as project history or stage/commit there.
Final review uses SHA256 comparison with this session's pre-edit snapshot and
`git diff --no-index --check` per changed file (empty whitespace diagnostics;
exit 1 indicates file differences, with CRLF advisory warnings). No deleted snapshot
files. This proves preservation against the current download, not historical Git.

**Unverified / next gate.** Full historical collector/runtime E2E suites were not
run; several assert the superseded rail/frozen geometry. Backend pytest and legacy
Qt smoke were not run for this frontend-only pass. Native PyWebView visual review,
screen-reader speech, normal-speed human motion playback and remaining axe manual
targets are unverified. No commit, push, merge, release or next milestone was started.
Next action requires explicit user visual approval of these real implementation
renders; automated success does not supply that approval.

## Historical snapshot — Stage1 fidelity (superseded scope, evidence retained)

### One UI 9.0 fidelity — Stage 1 IMPLEMENTED, AWAITING USER VISUAL APPROVAL

Active Goal references attachment `6cdc1d70-a64a-493a-8d55-e04152dbdf69/pasted-text-1.txt`.
This is a new authorized fidelity pass, not unfinished V.3. User designates file
`wzEFGRLl9MU1nB1JxUSyhD` authoritative and explicitly unfreezes visual geometry needed
to match it. Functional/security/accessibility/acquisition boundaries remain intact.
Stage1 is Device Manager, then STOP for user visual approval before any wider rollout.
Historical V.3/frozen statements below do not override this authorization.

#### Final authorized verification — 2026-09-09 (current outcome)

The user authorized one additional v2-recorded smoke, then conditional Edge/E2E
verification without another permission pause. These gates now passed; the historical
BLOCKED/INCONCLUSIVE sections below remain evidence, not the current stopping reason.
No production/test source edit or rebuild occurred in this continuation.

- Before launch, previous smoke PID34348 was absent and no Node/Python process existed.
  Exactly one direct smoke ran01:51:39–01:51:40+07. **Actual Python exit0**, no timeout;
  stdout/stderr saved empty. Evidence: `recorder-v2-Smoke-20260909-015139/direct/` under
  `.design-cache/artifacts/one-ui9-device-manager/`. This is not a wrapper-only result.
- One isolated headless Edge page/context creation, content read and close passed:
  `edge-recovery-20260909-015217/`, process exit0. No browser retry.
- Final production-preview E2E: **6/6 passed,1.3min**, one worker, trace off; process
  exit0 and saved `.last-run.json` passed/no failures in `final-six-20260909-0153/`.
  Covers final app-bar accessibility inventory, Device Manager source anatomy/review,
  Now Bar truth/focus/collision, morph/modal/no-reflow, reversal/effective200%, and
  pause/transient-overflow. The bounded snackbar helper now passed. This is a targeted
  result, **not a full-suite pass**. Only color-environment warnings in stderr.
- Device Manager8viewport/theme states:0axe violations,0incomplete. Now Bar16
  combinations/3728frames retain400×60 collapsed and520×325 expanded, zero transient
  scrollbar; pause does not stop acquisition. `device-review.json`/`now-bar-after.json`.
- Reused earlier Stage1 unit17/17 (tested state/overlay logic unchanged), successful
  final51-module build, final-build launcher SkipBuild exit0 and unaffected pending/
  dialog/two-glove/rail/forced-color/Monitor-breakpoint checks. These were **not rerun**.
  Final build still uses `index-17l4M1_h.css` and `index-CQSvcnQ8.js`; hashes unchanged.
- Ten actual app PNGs and native-scale `source-comparison.png` refreshed. Same visual
  CSS as previously reviewed8viewport/theme states; final1280light,compact both,
  settings both and source comparison inspected at original resolution. Small windows
  intentionally use native vertical scrolling; field/apply focus reachability passed.

Reviewed all four production diffs against pre-stage1.zip: Device Manager presentation,
page-scoped shell and shared app-bar group roles only; handlers/constraints unchanged.
No new Stage1 defect requiring source edits was exposed. No auth/Argon2/dependency/
settings/backend/launcher/protected-asset change, unrelated process termination, commit
or push. No Node/Python process remained after E2E; diff check passed with line-ending
warnings only. Final record: `final-verification-20260909.json` in the evidence directory.

**Preservation/limitations:** original pre-stage1.zip,53-file continuation archive and
previous INCONCLUSIVE smoke result are hash-unchanged. Two historical pre-edit gaps
remain: already-untracked `web/tests/runtime-activity.spec.ts` and already-dirty
`docs/ASSET_INVENTORY.md`. No claim of complete historical rollback coverage.

**Next gate: user visual approval only before any wider rollout.** Human native-window,
motion playback and real screen-reader review remain pending. Existing Quick Status
inventory still has2manual-review rules (`aria-prohibited-attr`, `color-contrast`),
not new Stage1 regressions or a claim of full accessibility certification. Keep the
disclosed Segoe UI/font and task-glyph reference gaps/desktop adaptations. Do not
redesign Monitor, Account, auth or overlays, open PhaseE/M2, or infer user approval.

#### Bounded recovery authorized — 2026-09-09 (historical)

User now authorizes checkpoint reconciliation, exactly one isolated direct smoke,
then (only if successful) one isolated Edge page-creation check, then outstanding
targeted Stage1 verification sequentially with one worker. The one smoke attempt is
now consumed; its child exit code was not captured, so recovery remains UNPROVEN.
This supersedes the launch prohibition in the historical reconciliation below; it
does not authorize retries after an environmental failure or wider visual rollout.

Before any launch or further source edit, saved and hash-verified all53 modified
tracked/nonignored untracked files in
`.design-cache/artifacts/one-ui9-device-manager/continuation-20260909-014158/current-worktree.zip`.
Its `manifest.json` records paths/hashes, retained build hashes and provenance.
Ignored build/dependencies/runtime data are not included in this source continuation.
Original10-entry `pre-stage1.zip` remains unchanged, SHA256
`D1A5B8F8C31082FF5E7FE7C34DAAC8BCEDDC049FA85A996250898C94360B13A3`.

Four previously uncovered paths reconciled:

- `web/playwright.config.ts` existed and was tracked clean in recorded pre-Stage1
  intake. Its HEAD blob is saved separately in `historical-config-only.zip`; this
  recovers the repository-normalized baseline, not original working-tree CRLF bytes.
- `web/tests/runtime-activity.spec.ts` existed, already untracked. Exact pre-Stage1
  content remains unrecovered; older `pre-v3.zip` is not an equivalent checkpoint.
- `docs/ASSET_INVENTORY.md` existed, already dirty. Exact pre-Stage1 content remains
  unrecovered; current Stage1 prefix alone does not establish all historical bytes.
- `docs/ONE_UI_DESIGN_RULES.md` was newly created in Stage1; prior absence is recorded
  from intake listing/status and creation evidence, not replaced by an invented file.

**Two historical rollback gaps remain and were disclosed before further edits.**
The current-state archive protects continuation only; it does not repair these gaps.
No production/test source changed in this recovery so far. The checkpoint helper's
first attempt stopped before ZIP creation because a PowerShell compression assembly
was not loaded; explicitly loading the built-in assembly allowed archive verification.
This was not an application launch or environment-recovery pass. Empty first-attempt
directory was retained; no cleanup performed.

**Bounded attempt result: INCONCLUSIVE, not PASS and not an established app failure.**
Exactly one direct smoke ran alone at01:43:00–01:43:02+07 using the existing venv,
`-m app.desktop_collector.shell --smoke-test`, and unchanged final build. Evidence:
`one-ui9-device-manager/direct-recovery-20260909-014300/{stdout.log,stderr.log,result.json}`.
Both streams are saved and empty. `WaitForExit(60000)` returned true with no timeout,
but the PowerShell `Start-Process` object's `ExitCode` was `null`. The recorder then
incorrectly converted `exit $null` to wrapper exit0. **That0 is not a captured Python
exit code.** No pass is inferred from empty logs, expected code flow or the wrapper.
Read-only Security4689 query found no matching process-exit event; exact child status
could not be recovered from inspected evidence. The test helper itself is retained
as failure evidence and must be repaired before any newly authorized attempt.

Prelaunch snapshot:4390180KiB physical /3741792KiB virtual free; no Node/Python process.
Post-attempt check again found no Node/Python and only the same five unrelated Edge
processes. Nothing was terminated or changed in the system. No Argon2 traceback was
emitted this time, but that does not establish recovery or explain the previous errors.
Final CSS/JS hashes match the recorded successful build. `git diff --check` passed
(existing LF/CRLF warnings only). No production/test/dependency/launcher edit or rebuild.

**STOP: Edge page creation and targeted E2E were NOT RUN.** The required successful
smoke gate is not established, and exactly-one authorization has been consumed.
Recorder repair/validation is now complete without the app (see below). Next step:
request fresh authorization for one direct smoke before another application launch.
Only a captured exit0 permits one Edge page check and then sequential one-worker,
trace-off missing Stage1 checks. Final-role axe/anatomy, three Now Bar regressions and
snackbar cleanup validation remain outstanding; completed unaffected results remain
reusable. Stage1 remains incomplete and user visual/native-window/screen-reader review
is still pending. `recovery-results-20260909-014300.json` records this new terminal
recovery outcome separately; the earlier iteration ledger is preserved unchanged.

**Recorder-only follow-up —01:46:53+07:** the previous Goal turn made progress by
preserving checkpoint coverage and establishing the smoke observation failure. This
automatic continuation did not renew launch authorization. Added ignored diagnostic
`run-isolated-smoke-v2.ps1`, retaining the original recorder and smoke evidence.
The new recorder owns a `Diagnostics.Process` handle, drains stdout/stderr concurrently,
captures the child's numeric exit code before disposal, and fails closed for null/error.
Its default mode is SelfTest; Smoke mode was NOT invoked. Exactly two synthetic
PowerShell children emitted known stdout/stderr and exited0/7. Both codes, statuses
and streams were captured exactly:2/2 recorder checks passed, not application tests.
Saved result: `one-ui9-device-manager/recorder-v2-SelfTest-20260909-014653/selftest.json`.
No Python, app, Edge or E2E launch; no application source/build/security/settings change.
The old smoke remains INCONCLUSIVE; recorder correctness does not prove environment
recovery. Fresh user authorization is still required for another bounded direct smoke.

**Goal gate: BLOCKED pending fresh bounded-launch authorization.** The same gate has
persisted across three resumed Goal turns: the inconclusive single smoke, recorder-only
repair, and this read-only revalidation. The recorder repair was concrete progress,
but did not renew the consumed smoke allowance. Saved results remain unchanged and
no Node/Python process is live. No authorized application/browser verification remains
available until the user permits a new attempt. Stage1 is not implemented complete;
resume this checkpoint (do not restart) after explicit user direction.

#### Reconciled interruption checkpoint — 2026-09-09 (historical)

User requested saved-state reconciliation only: **no browser/smoke launch in this
reconciliation**. Stage1 is still IN PROGRESS / verification stopped, not implemented
complete. Do not restart implementation, repeat Figma intake, or roll out to other pages.
The existing Goal is now BLOCKED after the verification gate persisted across three
consecutive Goal turns (failure, saved-state reconciliation, read-only revalidation).
Latest revalidation still finds the terminal failed result and no Node/Python process.
Resume the same Goal only after user direction permits the bounded recovery check;
the automatic continuation did not authorize another browser/smoke launch.
The initial implementation notes after this subsection are historical, not current
test/process status. All seven recorded browser invocations are terminal; none is live.

**Completed source/build:** current files contain the Device Manager28px/20px groups,
60px/20px actions,58px/radius30 fields,36px sample rate,14px support, device-state
placement and removal of the duplicate summary. Four metrics share a row at1200px+;
smaller windows use2×2. Simulator fields use4→2→1 columns. The Devices-only shell has
the draft palette,20px title, viewport-height88px rail with54×50 icon surface/30px
glyph and visible labels. Compact navigation grew62→68px; its reserved row78→84px
retains8px bottom clearance. Monitor geometry and Now Bar production logic are unchanged.
The two app-bar groups now have `role="group"` (shared semantic correction, no visual
rollout). The test-only snackbar cleanup now bounds its click to1000ms and accepts a
detached notice only after verifying it is hidden; a still-visible failure rethrows.

Source/test edits: `src/DeviceManager.tsx`, `src/styles.css`, `src/one-ui/shell.tsx`,
`src/one-ui/shell.css`, `playwright.config.ts`, `tests/collector.spec.ts` and
`tests/runtime-activity.spec.ts`, under `app/desktop_collector/web/`. Tests now use
source-anatomy/relational Device Manager assertions and retain exact Monitor baselines;
collision checks clip the collapsed bar to its scroll viewport and check actual header
hit ownership. `ONE_UI9_REVIEW=1` uses installed Vite preview and separate evidence.
Documentation edits: design rules, adoption guide, asset inventory, handoff, session
log, changelog and milestone tracker. No launcher/backend/auth/dependency edits in Stage1.

Final build completed at01:08:22+07,51modules, with retained `build/index.html` pointing
to `index-17l4M1_h.css` (73857bytes) and `index-CQSvcnQ8.js` (342187bytes). These files
exist and postdate the four production source edits. Terminal build output confirms
success; this is not inferred merely from timestamps. Unit17/17 passed earlier in
Stage1; not rerun after the final role-only/formatting edits. No Python suite was run.

**Terminal browser results**, in order (counts are per invocation, not a full-suite pass):

| Run | Terminal result | Evidence / consequence |
| --- | --- | --- |
| Initial preview | Startup failure before browser | Missing npm preview script; fixed test command to installed Vite binary |
| Focused anatomy | 1/1 passed,27.1s total | Eight viewport/theme states |
| Seven selected | 4passed /1failed /2not run | Two-glove, dialog/pending,1280 and1440 passed;1024 bottom-clearance failure fixed in CSS |
| Twelve selected | 8passed /1failed /3not run | Rail/sheets, forced colors, inventory, breakpoints,1024,800,200%, source review passed; runtime selector for removed duplicate summary failed |
| Four runtime selected | 0passed /1failed /3not run | Collision measurement included clipped pixels; corrected measurement and added hit test |
| Four runtime selected | 1passed /1failed /2not run | Truth/focus/collision test passed; morph test timed out180000ms on a snackbar that detached while clicking; helper fix not yet verified |
| Final six selected | 0passed /1failed /5not run | `page.evaluate: Target page, context or browser has been closed` during axe inventory; no subsequent browser launches |

`iteration-results.json` preserves these outcomes. Current Playwright `.last-run.json`
is **failed**, failedTests `48ffe395b9129fa21083-0da167a04b57ff88ae37`; the retained
`browser-closed-error-context.md` confirms the final inventory failure. Earlier pass
counts are supported by terminal command output in this thread and the saved ledger;
there is no separate full raw stdout file for each invocation. Missing output is not a pass.

**Smoke evidence and discrepancy:** final command output explicitly recorded
`final-direct-smoke-exit=1`, traceback ending
`argon2.exceptions.HashingError: Memory allocation error`, then
`final-launcher-smoke-exit=0`. `iteration-results.json` records both. No standalone
direct/launcher smoke log files were found in the scoped saved artifact/test-result
locations; the raw evidence available is the prior command's stdout/stderr in this
thread, not two independent disk logs. Do not claim such log files were archived.

Direct invocation failed in `AuthService.__init__` while computing its dummy password
hash, before bridge startup/health-check. Read-only inspection confirms the launcher
uses the same `.venv/Scripts/python.exe -m app.desktop_collector.shell --smoke-test`,
with a Python-version/build-presence check and repository cwd; it propagates the
application exit code. It does not bypass auth or lower Argon2. Both commands were
sequential within one shell while a separate E2E invocation was active. The launcher
exit0 is a terminal success for that invocation, not proof the direct invocation passed.
Time-varying memory availability/contention is plausible, but no contemporaneous
per-allocation measurements establish why the later call succeeded. Argon2 allocation
failure is confirmed; the exact cause of Edge closing is **not established**.

Latest failure **was saved before interruption**: browser error copy at01:08:55+07 and
updated iteration ledger at01:10:03+07 contain the failure and smoke outcomes. This
handoff had not caught up. Post-failure snapshot recorded2298292KiB physical and
2357156KiB virtual free; these are after-the-fact values, not failure-time proof.
Reconciliation found no task-owned Node/Python/Edge process; five unrelated Edge
processes remain untouched. No settings, processes, Argon2 parameters or auth changed.

**Recovery coverage is partial:** `pre-stage1.zip` is readable and has exactly10
entries, not a complete backup of all14 Stage1 source/doc paths or the dirty worktree.
Missing existing files: `web/playwright.config.ts`, `web/tests/runtime-activity.spec.ts`
and `docs/ASSET_INVENTORY.md`; new `docs/ONE_UI_DESIGN_RULES.md` is also absent.
The config was clean before Stage1, so HEAD preserves its baseline; the runtime test
was already untracked and asset inventory already modified. Their exact pre-Stage1
contents are not established by this archive. The older V.3 checkpoint is not an
equivalent pre-Stage1 snapshot. Do not replace missing originals with today's bytes
and label them pre-change. Neither archive was changed during reconciliation.

**Retained visual evidence:** `one-ui9-device-manager/` has eight viewport/theme PNGs,
two scrolled-settings PNGs, two exact Figma PNGs, native-scale `source-comparison.png`,
layout/anatomy/axe JSON and checkpoint/iteration records. Eight viewport images and
comparison were inspected before interruption. They predate only the role/formatting
correction, not the final visual CSS; they are valid visual evidence, not final-role
axe proof. `device-review.json` has8states,0violations and1incomplete rule per state:
two labeled app-bar divs lacked roles. Source now fixes both; final verification did
not complete. Earlier inventory has8states,0violations, retained manual items for
auth/Quick Status. No human screen-reader or native-window acceptance is claimed.

**Exact remaining work / bounded next step (not executed now):**

1. Preserve this current interrupted state in a clearly labeled current-state snapshot
   plus manifest before further edits; record partial historical rollback coverage.
2. After user confirms environment recovery, read resources/task processes once. Run
   at most one direct smoke **alone**, with separate persistent stdout/stderr and exit
   record. Do not overlap smoke and browser processes. Stop if allocation fails;
   do not change Argon2/auth/system settings or repeatedly launch.
3. Only after that gate passes, one isolated headless Edge page-creation check. If it
   fails, save exact error and stop. If it succeeds, use one worker/trace off to verify
   final app-bar roles/axe, focused source anatomy/evidence and remaining Now Bar morph,
   reversal/effective200%, pause/transient-overflow checks, including snackbar cleanup.
   Retain completed unaffected results rather than restarting the entire suite.
4. Reconcile test coverage against all Stage1 acceptance requirements, run only missing
   affected checks, confirm final build/source and clean smoke shutdown, then finish
   source/asset/security diff review and documentation. No current final-source full
   E2E pass, completed Now Bar regression set or successful direct smoke may be claimed.
5. Mark Stage1 implemented only after these requirements pass; then stop for user
   visual approval before Monitor/Account/auth/overlay visual rollout. Authorized
   Device Manager geometry changes remain allowed; functional/security boundaries stay.

#### Initial Stage1 notes (historical; superseded by reconciliation above)

- Loaded Figma design-to-code workflow. Live context + screenshot succeeded for Buttons
  1497:12222, Containers247:613, Top App Bar1495:10992, Rail1589:7438,
  Search/field1497:12549 and Floating Toolbar1495:11133. No root scan or Figma writes.
  Samsung button/depth/layout-and-typography/large-screen-layout pages read live.
- New concise source contract: `docs/ONE_UI_DESIGN_RULES.md`. Source fonts and glyph
  gaps/adaptations are disclosed; no assets/fonts/dependencies copied or installed.
- Recoverable10-entry checkpoint: `.design-cache/artifacts/one-ui9-device-manager/pre-stage1.zip`.
  Original V.3 checkpoint/evidence untouched. Preserve all accumulated tracked/untracked work.
- First implementation: content-sized28px/20px glove groups,18/14px headings/support,
 36px rate,60px/20px button anatomy,58px/radius30 numeric fields, separate simulator
  heading/action and4→2→1 fields. Removed duplicate connection summary (individual
  state + existing SIM/Now Bar remain). Pending handlers, fields/contracts unchanged.
- Shared shell has `data-page`; new palette/title/rail/compact-nav visual variant applies
  only to Devices. Reference dark canvas010102/container17171A. Rail selected54×50
  surface/30px glyph plus visible label; rail spans available height. Other pages retain
  their shell geometry/style; no independent redesign or Now Bar interaction change.
- Unit17/17 and TypeScript/Vite build51modules passed on initial implementation.
  Build retained. No Python tests/smokes yet. Initial production-review command failed
  BEFORE browser launch because npm had no preview script. Fixed test configuration to
  invoke the existing Vite binary's preview command; no package/dependency edits.
- `ONE_UI9_REVIEW=1` now selects built application preview and a separate evidence root.
  New focused anatomy/axe/viewport/focus test is running/awaiting result; do not claim
  browser pass. Resource read ~804MiB physical/~2.47GiB virtual free; five unrelated
  Edge processes, none task-owned. Resource exhaustion is NOT a confirmed failure cause.
- Remaining: inspect focused result, actual visual review/source comparisons, replace
  superseded Device Manager frozen rect assertions with source-anatomy/relational layout
  checks while keeping Monitor baselines, run affected existing interaction/responsive/
  accessibility/NowBar checks on final source, build/smokes as needed, final diff review
  and evidence/docs. Do not call Stage1 implemented until all required checks complete.

Next gate remains user visual approval after implemented Stage1. No PhaseE/M2,
backend, launcher, dependency, system-setting, commit or push changes are authorized.

### V.3 — implemented; awaiting user visual approval

Latest bounded recovery: resource check showed ~2.80GiB free physical / ~7.53GiB free
virtual memory and no task-owned stale browser. One isolated Edge page-creation check
passed in 1063ms; its own server/context closed successfully. Unrelated Edge processes
were untouched. No Figma re-audit, implementation restart or system-setting change.
The existing `V3_FONT_GEOMETRY=1` diagnostic ran once and reproduced 469.1875px;
group legends used font-dependent `normal` line boxes. Explicit legend `line-height: 1.3`
retains Segoe UI/11px text and restores the frozen compact allocation to **467.78px**
versus **467.8px** baseline. Targeted compact geometry plus dialog/pending/copy checks
passed 2/2; temporary diagnostic code removed (JSON retained as evidence). Direct
connect-all pending-label bounds/width/height regression passed in a further 1/1 run.

Final verification and completion evidence:

- One full V.3 E2E run: **24/28**, before the final contrast correction. Three failures
  were the same selected/pressed foreground contrast (4.12:1); the fourth was missing
  in-memory contact-sheet input after failed-test worker restart. Fixed actual contrast
  by mixing accent foreground with semantic text color. No assertion was relaxed.
  Full result is preserved in `full-e2e-result.json`; full E2E was NOT rerun.
- Final affected/evidence run selected **17 tests** and completed with Playwright
  `.last-run.json` status `passed`, no failedTests, and every expected final artifact.
  Its process handle disappeared across continuation, so final stdout/duration was
  unavailable; checked saved result and complete artifacts instead of restarting.
  Covers auth, pending/error/copy, both-glove pause/acquisition, responsive geometry,
  forced colors, axe inventory, four viewports, 200%, Now Bar collision/morph/reversal/
  pause, contact sheets and recording. Unaffected tests passed in the full run.
  **Do not describe this as a final-source full 28/28 pass.**
- Selected/pressed contrast: **5.028:1 light**, **6.388:1 minimum dark** (chart pressed
  dark 6.864:1). Eight final axe inventory states have zero violations; incomplete
  manual-review targets remain recorded, not silently passed. Expanded Now Bar running
  and paused axe checks at effective 200% pass in both themes.
- Final `now-bar-after.json`: **16 combinations / 3065 frames**, four required sizes
  in both themes; stable **400×60 collapsed / 520×325 expanded**, **0 transient
  scrollbar frames**, stable page position, sensor packet counters continue.
  Before: expanded **520×290 → 520×325**, scrollbar in **70/232 light / 69/232 dark**
  frames. Collapsed width drift was not reproduced in baseline. Native overflow remains
  accessible when actual content exceeds viewport; reversal data is separate.
- Unit **17/17** reused because subsequent production changes were CSS-only. Final
  TypeScript/Vite build **passed, 51 modules**, retained for SkipBuild. Existing
  `npm ls --depth=0` clean and unchanged dependency manifests/lockfile reused.
  Direct `.venv/Scripts/python.exe -m app.desktop_collector.shell --smoke-test` and
  `run_app.ps1 -SkipBuild -SmokeTest`: **both exit 0** on final build. These modes
  verify bridge startup/health/shutdown, not native-window visual rendering.
  Python tests intentionally not run (no Python/backend change).
- Final protected comparison **177/178 byte-identical**; sole api.ts exception is the
  previously verified generic user-facing sentence only. `git diff --check` passes;
  HEAD unchanged; no commit/push, dependency/system-setting/backend/launcher edits,
  protected asset changes, or rollback cleanup.
- Exactly **six PNG + one WebM** under `.design-cache/artifacts/one-ui-v3/`:
  `review-auth.png`, `review-account-users.png`, `review-collector.png`,
  `review-overlays-feedback.png`, `now-bar-overlay-expanded-dark-1440x900.png`,
  `now-bar-overlay-expanded-light-800x1100.png`, `now-bar-production-morph.webm`.
  All six images reviewed at original resolution; contact sheets preserve captured
  pixels. Reviewed hierarchy, Vietnamese diacritics, fields/actions, auth gradient,
  L/R distinction and unclipped Now Bar actions. Frozen macro geometry still yields
  dense 11px chart controls and short-viewport scrolling; this is not a claim of a
  pixel-perfect Samsung mobile layout.
- WebM metadata: **1440×900, 25fps, 6.08s**, produced by real open/pause/resume/close/
  reversal UI actions. No supported human video-viewing tool was available; timing
  and continuity are browser-measured, not human playback approval. FFmpeg metadata
  read succeeded; null-output decode was unsupported by the bundled minimal binary,
  so full decoder verification is NOT claimed. Narrator/NVDA speech and native-window
  visual review remain **UNVERIFIED**.
- Summary: `final-verification.json`, `verification-data.json`, font/geometry/reversal
  reports and the 24-entry recoverable checkpoint. No known implementation/test blocker
  remains. **Next gate: user visual approval**; Phase E and macro changes still need
  separate approval. The following stopped-checkpoint entries are historical only.

Previous stopped-checkpoint history (superseded by the successful recovery above):

The existing Goal is now marked BLOCKED after the same browser-verification blocker
persisted through three consecutive Goal turns. Latest read-only check found no live
Node/Edge test process, the saved page-setup/context-close timeout still terminal, and
no channel-font diagnostic output. Non-browser checks are complete; remaining geometry,
visual and runtime verification needs a functioning browser environment. No additional
browser launch or system-setting change was made. Resume this Goal, not a new Goal,
after environment recovery; preserve the exact continuation instructions below.

- Existing Goal resumed after successful Figma preflight; V.3 is explicitly authorized
  by attachment `292d158e-b915-4d92-a86a-c23fffffcec3/pasted-text-1.txt`.
- HEAD remains `bf7720825a368b051dee5748f83f487fc8191abc`; pre-edit status was
  25 tracked modifications and 17 untracked entries. Recoverable checkpoint:
  `.design-cache/artifacts/one-ui-v3/pre-v3.zip` (21 original entries, extended to 24
  before touching api.ts, store.test.ts and one-ui/shell.tsx). Protected hashes
  are in `protected-before.json` beside it. First archive attempt lacked the .NET
  compression assembly and created no archive; explicit assembly load succeeded.
- Live context AND screenshots succeeded in this V.3 Goal for `1491:6362` LiveActivity,
  `1497:12222` Buttons, `632:2006` Dialog, `1497:12842` Selection Menu,
  `631:2757` Slide Navigation, `1495:10992` Top App Bar, `1589:7438` Rail,
  `744:3668` Edge Panels, `1497:12549` Search/field primitive, `247:613` Containers,
  and `1495:11133` Floating Toolbar, all in `wzEFGRLl9MU1nB1JxUSyhD`.
  whoami returned Fish, Full/student. No root scan or Figma write. Reuse these reads.
- Current production diagnosis: at 1440×900, collapsed pause/resume stays 400×60;
  expanded changes 520×290 → 520×325 and exposes scrolling in 70/232 light frames
  and 69/232 dark frames. Six toggles per sample include rapid reversals.
  `now-bar-before.json` records each frame's size, overflow and page scroll.
- Initial correction reserves both chart-status texts in one intrinsic grid area,
  with only the current state visible/accessibility-exposed. Scrolling is enabled
  only if measured full content exceeds available viewport height. Accepted morph,
  chart state ownership and acquisition remain unchanged.
- Actual CDP font inspection found mixed DM Sans/Segoe UI within Vietnamese sentences
  (Now Bar description 21/5 glyphs; Monitor helper 98/17). React now uses Windows
  Segoe UI first, without copying or bundling a font. Reinspection confirms Segoe UI
  only for both sentences and Segoe UI Bold for the app-bar title.
- Shared buttons reserve both normal/pending labels in one grid slot; ordinary action
  type is 14px, peer icons 18px. Modern segmented selection is tonal with an underline;
  pressed Now Bar commands are tonal only when actually paused. Dialogs retain equal
  text regions/divider with 16px labels and a rounded focus/hover region, and permit
  scrolling at constrained heights. Native role select matches the existing fields.
  Auth headings have more line space and less tracking; Quick Status and user/audit
  supporting text is clearer; event names and usernames may wrap. User-flow copy removes
  telemetry/bridge/audit/timeline/Unicode jargon without changing behavior.
- Targeted runs so far: initial 2/2, font diagnostic 1/1, shared/frozen/1280 checks 4/4.
  Broader run 5/7: auth, 1440, 1024, all-size pause regression and reversal/200% passed;
  dialog test retained obsolete 0px action-radius expectation (updated to 12px), and
  800px channel panel grew 1.39px with the font change (under diagnosis, not waived).
  The follow-up two-test run's saved result contained only the 800px failure; its
  process handle disappeared before final stdout could be retrieved. A subsequent
  diagnostic run failed during browser setup, before reaching the application:
  `browserContext.newPage: Test timeout of 30000ms exceeded`; context close also timed
  out. Playwright terminated its own Edge process tree. Browser testing is stopped;
  do not repeatedly relaunch failed browsers or modify system settings. A later
  read-only memory check found ~1.34GiB free physical / ~2.20GiB free virtual memory,
  but the exact cause of Edge's setup failure is NOT established.
- Current-source non-browser verification: `npm test` **17/17**, `npm run build`
  **passed, 51 modules**, `npm ls --depth=0` **clean**, `git diff --check` **exit 0**
  (existing LF/CRLF notices only). Production build retained. V.3 full E2E and both
  PyWebView/SkipBuild smokes NOT RUN; no new browser image/video evidence emitted.
  Python suite NOT RUN because no Python/backend logic changed.
- `now-bar-after.json` has 16 viewport/theme/expanded combinations: 1440×900,
  1280×720, 1024×768 and 800×1100, both themes. Each keeps 400×60 collapsed or
  520×325 expanded, zero scrollbar frames. `now-bar-reversal.json` records interrupted
  dimensions/overflow/numeric alignment; effective-200% native scrolling and pause
  reachability passed. These browser results predate the final connection-copy edit.
- Final copy edit removes ordinary-flow "Bridge" and recovery-window jargon.
  App-bar/Quick Status now say "Đã kết nối / Đang kết nối"; api.ts changes only the
  exported generic error sentence. Checkpoint comparison proves exactly that string
  replacement, with no transport/authentication/error-handling change. Updated existing
  assertions, not their behavior coverage. Protected comparison: **177/178 byte-identical**;
  the sole differing file is this verified copy-only api.ts. Package/lockfile, launcher,
  backend, core, shared tokens, protected frontend references and rollback stay unchanged.
- V.3 is NOT complete. Next: resolve compact font geometry, targeted checks, then final
  suites and six native-pixel contact/still images + one open/pause/resume/close/reversal
  video. Macro F42/F43/F44 and rollback/backend boundaries remain frozen. Visual approval
  remains pending. Historical artifacts are not overwritten.

Exact V.3 changed files relative to the checkpoint (not all accumulated Git changes):
`app/desktop_collector/web/src/{RuntimeActivityView.tsx,runtime-activity.css,App.tsx,
DeviceManager.tsx,AuthScreens.tsx,UserManagement.tsx,styles.css,api.ts}`;
`src/one-ui/{controls.tsx,controls.css,shell.tsx,shell.css,overlays.css,feedback.css}`;
`src/store.test.ts`; `tests/{collector.spec.ts,runtime-activity.spec.ts}`;
`CHANGELOG.md`, `PROJECT_MILESTONE_TRACKER.md`,
`docs/{SESSION_LOG.md,WORK_SESSION_HANDOFF.md,ASSET_INVENTORY.md}`.

Resume checkpoint: inspect the existing browser environment after recovery, then run
the bounded `V3_FONT_GEOMETRY=1` 800px diagnostic once. It writes
`channel-font-geometry.json` only after reaching the page (currently absent). Resolve
the confirmed 469.19px versus 467.8px channel-panel drift without relaxing frozen
assertions; remove the temporary diagnostic afterward. Verify latest copy and pending
controls, then run the intended-source full E2E once with `PRODUCTION_REVIEW=1`, both
smokes and native-resolution six-image/one-video review. No completed phases need redo.
Frozen limitations remain: 76px app bar, 88px rail / 54×62 destinations, 358×62 bottom
navigation, 209×60 chart group with 88×48 restore and 107×48 pause, established card/
simulator/chart allocation and breakpoints. Do not silently enlarge these to mobile-kit
60px button anatomy. Proposals to enlarge compact chart labels/targets require a separate
geometry decision; current 11px chart-command exception is retained and disclosed.

| Surface | Observed gap | Verified reference | V.3 correction |
|---|---|---|---|
| Now Bar | Pause inserts 35px and flashes scrollbar | LiveActivity + approved A.1 motion | Stable intrinsic state region; viewport-based overflow (initial fix delivered). |
| Shared controls | Tiny pending labels; primary/selected/toggle treatment inconsistent | Buttons, Slide Navigation, Floating Toolbar | Consistent peer anatomy, intrinsic label reservation, distinct emphasis/selection/focus. |
| Dialog and sheets | Dialog pair already equal; field/action hierarchy needs review | Dialog, Selection Menu, Edge Panels | Retain equal pair/divider; match native field/action hierarchy; constrain scrolling, not content access. |
| Auth, management, Account, feedback | Developer jargon and small supporting text | Containers, field, App Bar; Samsung writing | Concise copy, readable supporting hierarchy, wrapping audit names, verified Segoe UI rendering. |
| Devices, Monitor, navigation | Dense helper text; frozen macro bounds limit growth | Rail, App Bar, Containers, Floating Toolbar | Shared font/control treatment; shell allocation preserved; explicit legend line boxes restore compact panel. |

V.3 control decisions (desktop adaptations, not pixel-identical mobile-kit components):

| Role | Product treatment and consumers |
|---|---|
| Primary | High-contrast filled: connect-all, apply, auth submission, Create User, save profile. Existing theme-dependent monochrome fill is not selection semantics. |
| Secondary | Neutral contained: disconnect-all, disconnected per-device connect, Account password action, Now Bar chart action when running. Independent content widths. |
| Tertiary | Quiet text: refresh, back, notification maintenance, secondary account operations. |
| Destructive | Danger text plus explicit verbs for per-device disconnect and account deactivation; dialog confirm also has `!`. Existing confirmation policies preserved. |
| Toggle | Actual `aria-pressed` state: chart pause/resume; selected tone only while paused. Chart restore remains a separate availability-driven command. |
| Selected navigation/segment | Actual current destination/window; tonal selected region with non-color marker. Focus ring remains separate. |
| Pending/disabled | Native disabled + busy/progress only during real requests; label slots reserve intrinsic width. Equivalent dialog actions use equal regions, not equal sizing everywhere. |

Terminology: keep established **Device Manager / Devices**, **Live Monitor / Monitor**,
**Quick Status**, **Account**, **Notifications**, **Simulator**, **Raw signals**, sample-rate
and packet labels. Use **Kết nối / Ngắt kết nối**, **Tạm dừng biểu đồ / Tiếp tục biểu đồ**,
**Đang nhận dữ liệu**, **Tạo tài khoản**, **Lưu hồ sơ và vai trò**, **Nhật ký bảo mật**
consistently. Chart pause never implies sensor acquisition or dataset recording stops.

Samsung pages actually opened: One UI index; `motion/basic.html`,
`accessibility/layout-and-typo.html`, `accessibility/color-contrast.html`,
`structure/visual-depth.html`, `writing/focused-and-purposeful.html`,
`writing/simple-and-human.html`, `comp/app-bar.html`, `comp/button.html`,
`largescreen-and-foldable/large_screen_layout.html` under
`https://developer.samsung.com/one-ui/`. Use responsiveness, clear action language,
readability and restrained depth principles; retain product breakpoints rather than
importing Android dp classes. Official motion demos were not actually watched;
screenshots do not establish timing. Existing approved A.1 timing remains unchanged.
Native checkbox/select are product adaptations of verified Containers/Selection Menu/
field primitives; the recorded bounded audit has no exact checkbox-row node.

Historical verification below belongs to the preceding production integration, not V.3.

### Trạng thái tổng

- M1 hoàn thành.
- React/Vite trong PyWebView là collector mặc định; PySide vẫn là rollback qua
  `run_app.ps1 -Legacy`.
- Product Foundation P.0 hoàn thành.
- Product Phase P.1 authentication, SQLite identity persistence và RBAC đã được
  triển khai end-to-end.
- D.2.6 Stage 2B.3.1 đã được người dùng phê duyệt và là design-foundation baseline.
- One UI Visual + Motion V.2 đã xử lý đủ 40 finding Class A/B.
- One UI V.2.1/P.1 đã được người dùng phê duyệt visual cuối; gate visual-approval đã
  đóng; baseline này tiếp tục khóa geometry. User đã phê duyệt riêng việc tích hợp Now Bar
  A.1 và bounded visual alignment production ngày 2026-09-07; visual của pass mới chưa được duyệt.
- M1.1 còn mở vì Phase E cleanup vẫn cần phê duyệt trực tiếp riêng và hoàn tất theo
  điều kiện milestone hiện có.
- P.2.1 Runtime Activity đã được người dùng phê duyệt riêng và triển khai. Visual đầu
  tiên bị từ chối; alignment correction, P.2.1.1 scroll correction và P.2.1.2 semantic
  shared-activity correction đều đã được triển khai, nhưng P.2.1.2 inline expansion tiếp
  tục bị từ chối visual. Approved A.1 Now Bar hiện đã tích hợp vào production cùng bounded
  One UI alignment; đang chờ user review sản phẩm chạy thật. Phần P.2 khác, V.3, Phase E
  và M2 chưa được mở.

### Production One UI alignment + approved A.1 Now Bar — current implementation

- Authorization: user approved the refined A.1 HTML's Now Bar, not its synthetic page.
  The prototype's old “integration not authorized” line is historical; the current
  production brief supersedes it. The HTML/spec/comparison images were not edited.
- Figma blocker resolved after the user disconnected/reconnected the connector.
  Actual registered whoami returned Fish (Full/student); get_design_context on
  file `wzEFGRLl9MU1nB1JxUSyhD`, node `1491:6362`, returned LiveActivity's ten
  variants plus its 482×163 screenshot. No root scan or Figma write. Earlier failed
  reauthentication attempts were stopped, not bypassed; the existing Goal was resumed.
- Delivered: 400×60 collapsed reservation, no expansion glyph, accessible whole-capsule
  trigger; singular shared glove/identity/description/rate/count, 520px maximum opaque
  expanded surface and content-driven height. Runtime rates, L/R source state and
  App-owned chart pause remain truthful. Monitor uses one routine chart command;
  other pages can show Open Monitor, and disconnected sources can expose Open Devices.
  Packet/loss statistics remain on Monitor/Quick Status; Notifications remain through
  Quick Status with the same atomic sheet handoff.
- Preserved the production anchor, 78px measured lane (the prototype's “80px” was
  descriptive, not authority to change it), no underlying reflow, internal page scroll
  lock, inert background, focus trap/return, shell handoff and transparent dismissal.
  The accepted 240ms basic path and 140ms detail fade have no opening delay. Letter
  spacing now interpolates to remove the reported rate-width jump on reversal.
  Boundary-measured pixel width prevents the first-frame viewport-width flash.
  A closing fallback handles zero-distance reversals. At short/effective-200% viewports,
  the contained surface itself scrolls so actions remain reachable without smaller type.
- Shared alignment: genuine existing DM Sans 600 files, less heavy supporting text,
  readable field/help/status/account/notification type, clearer action hierarchy and
  quieter Quick Status border. Existing semantic palette, auth wash, product-owned
  icon family, single theme control and English/Vietnamese terminology are preserved.
  Auth/User Management/Device Manager/Monitor reuse shared changes; already-aligned
  composition, snackbar behavior and shell/control bounds were not redesigned.

#### Reference → gap → production adaptation

All component-family reads below succeeded live in this Goal before the initial
implementation checkpoint; the Now Bar identity/context was revalidated after reconnect.
These are Community-kit observations, not Samsung certification or motion specifications.

| Surface / prior gap | Verified Figma node | Applied adaptation |
|---|---|---|
| Now Bar density, nested metrics, expansion glyph | Live Activity `1491:6362` | Compact icon/value hierarchy; desktop dimensions and expanded motion come from user-approved A.1, not the kit's 10px/12px chips. |
| Shared controls / heavy small labels and values | Buttons `1497:12222`, field primitive `1497:12549` | Semibold actions, regular field values, readable labels/help within existing bounds; no search feature added. |
| Shell title/subtitle/navigation hierarchy | Top App Bar `1495:10992`, rail `1589:7438` | Lighter subtitle and readable navigation text; retain product 76px bar, 88px rail and 54×62 targets rather than copying mobile sizes. |
| Cards, auth, Account, User Management and related sheets | Containers `247:613`, Edge Panels `744:3668` | Shared type/depth hierarchy, opaque contextual sheets, existing accessible desktop palette; auth gradient retained. |
| Dialog actions and Notifications | Dialog `632:2006`, Notification Header `620:1523` | Readable text actions and notification metadata; existing 372px dialog anatomy and feedback lifecycle retained. |

Official Samsung pages actually consulted earlier in the same implementation pass:

- [One UI index](https://developer.samsung.com/one-ui): source entry point.
- [Basic motion](https://developer.samsung.com/one-ui/motion/basic.html): predictable
  spatial continuity; does not establish an exact Now Bar choreography.
- [Layout and typography](https://developer.samsung.com/one-ui/accessibility/layout-and-typo.html):
  readable hierarchy and enlarged-content access without losing functionality.
- [Visual depth](https://developer.samsung.com/one-ui/structure/visual-depth.html):
  restrained depth and related information grouping.
- [Focused writing](https://developer.samsung.com/one-ui/writing/focused-and-purposeful.html):
  immediate state/action copy rather than duplicated statistics.
- [Color contrast](https://developer.samsung.com/one-ui/accessibility/color-contrast.html):
  readable contrast and information not conveyed by color alone.

Expanded Now Bar anatomy/Figma-authored motion is not claimed as verified in the kit.
The approved glove glyph and pause/play paths are existing product references, not
newly drawn approximations of unavailable Figma assets.

#### Exact files, evidence and verification

Production files under `app/desktop_collector/web/src/`:
`RuntimeActivityView.tsx`, `runtime-activity.css`, `App.tsx`, `styles.css`,
`one-ui/controls.css`, `one-ui/shell.css`, `one-ui/overlays.css`,
`one-ui/feedback.css`. Test changes: `web/tests/runtime-activity.spec.ts` and
`web/tests/collector.spec.ts`. Documentation: this handoff, `CHANGELOG.md`,
`PROJECT_MILESTONE_TRACKER.md`, `docs/SESSION_LOG.md`, `docs/ASSET_INVENTORY.md`.

- Final-source Vitest: **17/17**; TypeScript/Vite build: **PASS, 51 modules**;
  `npm ls --depth=0`: clean. Build retained for `-SkipBuild`.
- Targeted checks before full run: Now Bar **4/4**, shared-surface/geometry **6/6**.
- The required single full E2E run: **23/27**, BEFORE final line-height/test fixes.
  Failures: one dialog test sampled its baseline during opening scale; simulator band
  shrank 1–2px in compact layouts; contact-sheet assembly lost RAM images after a worker
  restart. Subsequent compact verification also exposed a 0.75px metric-row drift.
- Fixes kept frozen bounds: simulator labels retain 15px line boxes; metric labels retain
  their original 13.75px line boxes at the more readable 12px size. Dialog measurement
  waits for the actual opening animation. No baseline or tolerance was relaxed.
- Final affected/evidence run: **13/13**, including auth, dialog/pending behavior,
  pause geometry, sheets, axe inventory, breakpoint boundaries, all four review sizes,
  contact sheets, Now Bar morph/reversal and 200% access. **No final-source full-suite
  pass is claimed; full E2E was not rerun.**
- All **308 numeric layout fields** match the existing V.2.1-path baseline within
  0.05px (comparison reported no differences); frozen F42/F43/F44 checks pass.
  Auth contrast minimum across the full wash is **5.1657:1**. Axe inventory retains
  manual-review targets; expanded Now Bar axe has zero violations in both themes at 200%.
- Direct `python -m app.desktop_collector.shell --smoke-test` and
  `run_app.ps1 -SkipBuild -SmokeTest`: **exit 0**. No Python tests were run because
  Python/backend boundaries were not changed.
- Protected comparison: **187/187** source/reference/asset/dependency hashes unchanged
  from the resumed checkpoint. Initial archive held the 14 planned files; its preserved
  contents were extended with the asset inventory before that documentation correction
  (15 entries total). Unrelated dirty/untracked user work remains intact.
- Final `git diff --check`: **exit 0**, existing LF-to-CRLF notices only; scoped
  whitespace search on the changed untracked UI/test files found no trailing whitespace.
- Iteration disclosure: initial sandbox test/build access failure was resolved by the
  approved unsandboxed run. Now Bar viewport-width first frame and invalid aside/dialog
  role were fixed before the full run. Normal-speed WebM metadata reads as 1440×900,
  25fps, 5.04s; optional automated playback validation timed out, and the bundled FFmpeg
  lacks a null output muxer. Neither is represented as a playback pass. No package
  installation, system setting change, compression or cleanup workaround was used.

Current evidence directory: `.design-cache/artifacts/production-one-ui-alignment/`

- `review-auth.png`
- `review-collector.png`
- `review-account-users.png`
- `review-overlays-feedback.png`
- `now-bar-overlay-expanded-dark-1440x900.png`
- `now-bar-overlay-expanded-light-800x1100.png`
- `now-bar-production-morph.webm` (one recording; Now Bar source unchanged after capture,
  later shared line-height corrections are covered by final stills and targeted tests)
- `verification-data.json` (current-run contrast/axe/layout diagnostics)
- `pre-integration.zip` (recoverable dirty-worktree checkpoint)

All six stills are from running React, not the HTML demo; the four contact sheets assemble
current-run screenshots only. Intermediate review captures remain in RAM rather than
overwriting historical evidence. Incidental hover/tooltips were neutralized; synthetic
test identities are used without exposing credentials.

The final 13-test affected/evidence command, from `app/desktop_collector/web`, was:

```powershell
$env:PRODUCTION_REVIEW='1'
$env:OPENBLAS_NUM_THREADS='1'
$env:OMP_NUM_THREADS='1'
npm.cmd run test:e2e -- --grep 'first-run setup|confirmation dialogs|review captures|builds bounded|Approved Now Bar morphs|accessibility inventory|frozen chart|immediate sheets|pause and resume|interrupted motion' --trace off
```

These environment values were process-local. The single earlier full run used the same
values and `npm.cmd run test:e2e -- --trace off`. Final unit/build/dependency commands
were `npm.cmd test`, `npm.cmd run build`, `npm.cmd ls --depth=0`; smoke commands ran
from repository root using `.\.venv\Scripts\python.exe` and `.\run_app.ps1`.

Remaining gate: **user visual approval of the running production application**.
Human normal-speed motion review and real NVDA/Narrator speech remain **UNVERIFIED**.
No unresolved frozen-geometry exception remains. No authorization for other P.2 features,
V.3, Phase E cleanup, M2, hardware/protocol or backend work is implied.

### V.2.1 đã giao (historical approved baseline)

- User visual approval được ghi nhận ngày 2026-09-06 cho auth light/dark và composition
  V.2, nhãn rail `Tài khoản`, Account, Quick Status, Create/Edit User sheets,
  opening/settling behavior, navigation và responsive behavior đã có trong evidence.
- Source, test, config và evidence V.2.1 không bị sửa trong task đóng gate tài liệu này;
  F42/F43/F44 tiếp tục frozen.

- Khôi phục gradient/wash đăng nhập V.1 bằng pseudo-element không tương tác, giữ
  composition V.2.
- Nhãn `Tài khoản` trên rail hiển thị đầy đủ.
- Baseline đúng là target `54×62 px`; giá trị `54×50 px` trong brief cũ là lỗi
  specification.
- Account, Quick Status và Create/Edit sheet mount opaque và nhận focus/modal state
  ngay; opening settle 6 px trong 100 ms, không chờ API.
- Giữ lifecycle đóng, focus restoration và reduced-motion hiện hành.
- Contrast thấp nhất trên auth wash là 5,17:1. Axe không có violation; các node
  pseudo-element mà axe không tự phân giải đã được giữ và review thủ công.

### Lịch sử P.2.1 / P.2.1.3 trước tích hợp A.1

- Trước pass production ngày 2026-09-07, P.2.1.3 là correction đang chờ duyệt. Collapsed Now Bar vẫn là first normal-flow child trong
  `.app-content`, giữ allocation 400×60 và cuộn khỏi viewport tự nhiên. Khi mở, chính cùng
  DOM surface được đo đúng tại toggle boundary rồi morph từ collapsed rectangle thành
  shallow anchored overlay; placeholder collapsed-size giữ nguyên tọa độ nội dung bên dưới.
- Lifecycle `collapsed/opening/open/closing` dùng project basic path 240ms cho width/height/
  radius và detail settle 140ms/6px. Reduced motion chuyển ngay và bỏ transform. Expanded
  state khóa internal scroll, đặt page siblings inert, trap focus; header/Escape/outside
  click đóng bằng reverse morph và trả focus/scroll ổn định.
- Backdrop hoàn toàn trong suốt, không dim/blur. Overlay có thể phủ page content nhưng
  nằm dưới frozen Top App Bar, rail và compact bottom navigation. Notification Center
  nhận atomic handoff; Quick Status, Account và theme control đóng Now Bar trước khi nhận
  quyền tương tác, nên không có simultaneous shell/overlay conflict.
- Runtime reducer/RBAC/RAM-only lifecycle, source/rate/packet/chart truth, single
  App-owned pause state và acquisition/counter continuity không đổi. Không thêm portal,
  duplicate card, request/measurement loop, backend/API, dependency hoặc later-phase work.
- P.2.1.2 inline expansion là lịch sử bị từ chối về visual, không phải current baseline.
  Các semantics disclosure và runtime truth hữu ích của nó được giữ trong P.2.1.3.
- Samsung verification bắt đầu từ `https://developer.samsung.com/one-ui` và
  `https://developer.samsung.com/one-ui/motion/basic.html`, sau đó chỉ mở exact official
  URL liên quan được liệt kê cùng rule áp dụng trong
  `.design-cache/artifacts/product-p2-1-alignment/REFERENCE_AUDIT.md`. Samsung không quy
  định exact Now Bar anatomy/desktop placement/expansion behavior. Một live Figma context
  call được phép cho node `1491:6362` thất bại vì tool unavailable và không retry; prior
  live node data chỉ hỗ trợ compact anatomy/spacing/proportion/states. Exact expanded
  anatomy và Figma-authored motion là `UNVERIFIED`.
- File thay đổi trực tiếp cho P.2.1.3: `RuntimeActivityView.tsx`, `runtime-activity.css`,
  `tests/runtime-activity.spec.ts`, current reference audit và bốn status documents.
  Evidence current gồm đúng một video và hai still tại
  `.design-cache/artifacts/product-p2-1-3-anchored-overlay/`.

- P.2.1.2 đã sửa semantic interaction theo quyết định khi đó: Now Bar là disclosure
  của chính live telemetry activity, không phải dropdown/menu/navigation launcher. Toàn
  bộ collapsed header là một button với `aria-expanded`/`aria-controls`; click, Enter và
  Space toggle; Escape từ expanded content collapse và trả focus về header.
- Collapsed surface hiển thị status mark, `Live telemetry`, `Đang nhận dữ liệu cảm biến`,
  connected-source count và aggregate sample rate. Expanded surface morph trong cùng
  container và chỉ thêm dữ liệu có thật: left/right source status/rate, packet/loss,
  chart state và action hiện có `Open Monitor`, pause/resume chart, Notification Center.
  Không có Account/Settings/Theme/user management, fake carousel, capture/recording,
  reconnect/retry mới, menu/listbox/nav semantics hoặc portal.
- Motion dùng `--ou-motion-standard`/`--ou-ease-basic-transform` hiện có cho grid-row,
  radius và detail settle 6px/fade. Reduced-motion đưa shape/position interpolation về
  immediate token và loại transform. Không dùng JS layout measurement; width không đổi.
- `pause-chart`/`resume-chart` đều cập nhật duy nhất `chartPaused` đã lift trong `App`;
  acquisition/counters tiếp tục. Expanded state chỉ ở local component state, không lưu
  browser/SQLite/backend. Notification Center vẫn dùng atomic overlay và focus return.
- P.2.1.2 browser gate đạt tại 1440×900, 1280×720, 800×1100 và tiếp tục xác minh lane
  nằm trong `.app-content`, expansion/scroll đều normal flow, không collision với app
  bar/navigation/page content. Ba ảnh current evidence ở
  `.design-cache/artifacts/product-p2-1-2-shared-activity/`.

- P.2.1.1 đã sửa regression scroll được user xác nhận: activity lane trước đó là shell
  grid row nằm ngoài `.app-content`, nên đứng yên dưới Top App Bar trong khi Live Monitor
  cuộn và đi phía dưới. Lane hiện là child đầu tiên trong normal flow của chính internal
  scroll root; nó hiển thị ở đầu page rồi cuộn khỏi viewport tự nhiên.
- Không đổi anatomy/kích thước của bar, Top App Bar, rail, bottom navigation, breakpoint,
  chart/card, pause/resume commands, runtime reducer/actions, Notification Center/focus,
  RBAC hoặc acquisition. CSS chỉ đổi grid-row ownership cần thiết; không thêm offset,
  measurement runtime, dependency, backend hay later-phase feature.
- P.2.1.1 Playwright kiểm tra top/middle/lower ở 1440×900, 1280×720 và 800×1100, gồm
  ownership trong scroll root, lane scroll-away, Raw Signals/hai chart header/controls/
  plot reachability, frozen chrome/command/card geometry và compact bottom safe area.
  Hai ảnh current evidence ở `.design-cache/artifacts/product-p2-1-1-scroll/`; bốn ảnh
  `product-p2-1-alignment/` là evidence của pass trước regression này.
- Gate Samsung được recheck từ đúng hai URL user chỉ định trước source edit. Bảng exact
  URL → bounded rule vẫn nằm trong `product-p2-1-alignment/REFERENCE_AUDIT.md`. Không
  trang chính thức nào đã đọc quy định exact Now Bar anatomy, dimensions, desktop
  position hoặc fixed-vs-flow; anatomy/spacing/proportion/state chỉ dựa trên năm node
  Figma live.

- Typed reducer giữ tối đa 50 activity trong RAM và hỗ trợ upsert/dedup, unread/read,
  dismiss/clear; reset khi logout, session invalidation, đổi user hoặc app exit.
- Visual đầu tiên tại `.design-cache/artifacts/product-p2-1/` bị user từ chối vì Now Bar
  che nội dung, copy Việt hóa quá mức và status chips mất treatment xanh. Không dùng bộ
  ảnh đó làm current baseline.
- Alignment correction đã đọc live Figma file `97artOnuCMCiOPdD2r3ST2`, đủ năm node
  `1491:6362`, `620:1523`, `1003:13022`, `744:3668`, `247:613`, cùng hướng dẫn One UI
  chính thức. Audit trước source edit nằm tại
  `.design-cache/artifacts/product-p2-1-alignment/REFERENCE_AUDIT.md`.
- Samsung-reference addendum đã đối chiếu lại từ hai URL do user chỉ định và ghi bảng
  exact URL → rule applied trong audit. Không trang Samsung nào đã đọc quy định exact
  Now Bar/Live Activity anatomy, dimension, desktop placement hoặc fixed-vs-flow; lane
  hiện tại là product adaptation theo hierarchy/readability. Anatomy, spacing,
  proportion và visual states chỉ dựa trên năm node Figma live. Hybrid language là
  user/product decision, không phải Samsung prescription.
- Now Bar hiển thị bridge/resync/kết nối/pause/telemetry có thật với running copy
  `Live telemetry`; không có copy hoặc behavior ghi/finalize dataset. Bar nằm trong
  activity lane có allocation riêng dưới Top App Bar, không còn fixed/floating overlay
  hoặc runtime collision scanner. Khi modal mở, bar bị suppress nhưng trigger vẫn mount
  để trả focus ổn định sau exit.
- Hai status chip tonal mint `Bridge online` và `SIM 2/2` đã được khôi phục. Controlled
  hybrid glossary cho navigation, product/technical labels và Notification Center nằm
  trong `docs/ONE_UI_DESKTOP_MOBILE_ADOPTION.md`; hướng dẫn/nghiệp vụ thường vẫn tiếng Việt.
- Notification Center dùng cùng side-sheet instance với Quick Status, nhận focus trực
  tiếp khi chuyển surface và lọc activity theo role. Item không là live region; snackbar
  là nơi live-announce khi cùng biểu diễn operation result.
- Chỉ adapter tín hiệu hiện có được dùng: bridge lifecycle, resync, packet loss,
  device/simulator operations và administrator operations. Action chỉ gọi method hiện có
  hoặc điều hướng thật; không thêm endpoint hay dependency.
- Pause chart có một nguồn state ở `App`; `LiveMonitor` là controlled component. Pause chỉ
  dừng render chart, không dừng acquisition/counters và không đổi geometry control frozen.
- File implementation/test P.2.1: `App.tsx`, `DeviceManager.tsx`, `LiveMonitor.tsx`,
  `SensorChart.tsx`, `RuntimeActivityView.tsx`, `UserManagement.tsx`, `one-ui/shell.tsx`,
  `one-ui/shell.css`, `runtime-activity.css`,
  `runtimeActivity.ts`, `runtimeActivity.test.ts`, `store.ts`, `store.test.ts` và
  `tests/runtime-activity.spec.ts`; selector expectations liên quan trong
  `tests/collector.spec.ts`. Current scroll-correction evidence gồm đúng hai ảnh tại
  `.design-cache/artifacts/product-p2-1-1-scroll/`; audit provenance và verification
  của alignment pass trước nằm ở `product-p2-1-alignment/`. `product-p2-1/` là evidence
  cũ bị từ chối.

### Geometry và behavior đang khóa

- Top App Bar: 76 px.
- Landscape rail allocation: 88 px.
- Navigation target: 54×62 px; icon: 24 px.
- Rail threshold: 1260 px, đồng thời giữ điều kiện chiều cao/aspect ratio hiện hành.
- Chart breakpoint: 900 px.
- Bottom navigation: 358×62 px theo V.2 baseline.
- Chart command group: 209×60 px.
- Restore live: 88×48 px.
- Pause/resume: 107×48 px, không đổi kích thước theo label.
- Effective-200% flow và device/chart/simulator outer allocation được giữ.
- Đủ 13 channel; L/R phải dùng chữ và solid/dashed ngoài màu sắc.
- Pause biểu đồ không dừng acquisition. Follow-live, zoom, timestamp, sequence,
  packet loss và authentication truth không được làm sai hoặc trì hoãn vì animation.

### Kiến trúc và bảo mật phải bảo toàn

- `DataSource`/domain/acquisition độc lập presentation/framework.
- FastAPI chỉ bind `127.0.0.1`, dùng port động, exact Host/Origin và bridge token
  RAM-only.
- User session là lớp riêng bằng cookie HttpOnly/SameSite; RBAC được thực thi ở
  backend cho REST và WebSocket.
- SQLite identity database nằm ngoài repository; raw dataset persistence chưa tồn tại.
- Không trộn packet simulated và packet thật; raw capture tương lai phải append-only
  và immutable sau finalization.
- Không sửa/xóa PySide, Qt adapter hoặc dependency trước Phase E approval riêng.
- Không thêm firmware, BLE/Serial, capture, ML/inference hoặc Android nếu phase/gate
  tương ứng chưa được phê duyệt.

### Kiểm chứng lịch sử trước pass production 2026-09-07

- P.2.1.3 ngày 2026-09-06: targeted P.2.1.3 Playwright đạt 1/1; final Vitest 17/17;
  TypeScript/Vite production build đạt với 51 modules; affected P.2.1 Playwright đạt 4/4;
  đúng một lượt full Playwright cuối đạt 26/26 trong 3,7 phút. Direct desktop collector,
  PyWebView shell và `run_app.ps1 -SkipBuild -SmokeTest` đều exit `0`; `npm ls --depth=0` sạch; `git diff --check`
  exit `0` với các notice LF→CRLF đã có; protected prototype diff rỗng. Python tests
  `NOT RUN` vì không sửa Python/backend.
- Browser gate xác minh same-DOM anchored morph, exact collapsed origin, <=1px underlying
  geometry delta, scroll lock/inert/focus trap, keyboard/outside/reduced-motion behavior,
  shell handoff, atomic Notification Center, pause/counter continuity, accessibility và
  shell chrome không bị che tại 1440×900, 1280×720 và 800×1100.
- Evidence current: `now-bar-anchored-overlay-morph.webm` (1440×900, 25fps, 4,52s),
  `now-bar-overlay-expanded-dark-1440x900.png` và
  `now-bar-overlay-expanded-light-800x1100.png`. Hai still đã review original resolution.
  Tool hiện có không cho phép playback video thật ở normal speed, nên human motion review
  là `UNVERIFIED`; real NVDA/Narrator và user visual approval cũng còn `UNVERIFIED`.
- Iteration được disclose: một Vitest startup từng fail `ENOSPC`; NTFS compression cho
  repository-local `.venv`/`node_modules` khôi phục dung lượng mà không đổi Git content.
  Playwright FFmpeg chỉ được cài ở user cache. Các targeted failure trước final gate gồm
  border tolerance 1px, thiếu FFmpeg, first-frame width flash thật đã sửa, test focus
  neutralization và expectation close-transition cũ.

- P.2.1.2 ngày 2026-09-06: targeted reducer Vitest 5/5 và TypeScript check đạt. Full
  Playwright chạy đúng một lần và đạt 25/25 trong 3,5 phút, nhưng lần chạy này diễn ra
  trước khi targeted lifecycle check sau đó phát hiện scroll jump thật lúc mở/đóng
  Notification Center. Bản sửa cuối giữ expanded allocation/state khi bar bị suppress;
  sau đó final Vitest 17/17, production build 51 modules, affected P.2.1 Playwright 3/3,
  direct PyWebView và `run_app.ps1 -SkipBuild -SmokeTest` đều đạt. Full suite không chạy
  lại để tuân thủ giới hạn một lần.
- Scenario mới kiểm tra mouse/Enter/Space/Escape, ARIA disclosure/focus, no menu/listbox/
  navigation semantics, independent Account, atomic Notification Center focus lifecycle,
  single pause state, counter continuity, reduced motion, expanded/collapsed collision và
  P.2.1.1 scroll preservation tại cả ba viewport. Axe serious/critical bằng 0.
- Ba screenshot đã mở tại original resolution:
  `product-p2-1-2-shared-activity/now-bar-collapsed-dark-1440x900.png`,
  `now-bar-expanded-dark-1440x900.png`, `now-bar-expanded-light-800x1100.png`.
  Tooltip/hover/focus/snackbar ngẫu nhiên đã được neutralize. Manual user visual approval
  và real NVDA/Narrator vẫn `UNVERIFIED`; Python tests `NOT RUN` vì không sửa backend.
- Các lần browser bổ sung có startup OOM, target timeout/crash và bundled Chromium chưa
  được cài; đây là host-resource/tooling failures, không phải product assertion failures.
  Final targeted run dùng Edge với giới hạn Node memory và đạt.

- P.2.1.1 ngày 2026-09-06: targeted implementation Playwright cuối đạt 1/1; full Vitest
  17/17; TypeScript/Vite production build đạt với 51 modules; affected P.2.1 Playwright
  đạt 2/2. Full Playwright chỉ chạy đúng một lần theo scope: 23/24 đạt; failure duy nhất
  là race test-only trong `resetReviewViewport` khi helper reset `scrollTop` một lần trước
  khi flow-owned lane ổn định. Sau khi helper chờ hai animation frames và reset tới khi
  layout ổn định, đúng test command-geometry đó đạt targeted 1/1; full suite không chạy
  lại. Direct PyWebView và `run_app.ps1 -SkipBuild -SmokeTest` đều exit `0`.
- Hai screenshot cuối đã mở ở original resolution:
  `product-p2-1-1-scroll/live-monitor-scrolled-dark-1440x900.png` và
  `product-p2-1-1-scroll/live-monitor-bottom-compact-light-800x1100.png`. Tooltip,
  hover, focus và snackbar ngẫu nhiên đã được loại khỏi evidence. Manual user visual
  approval và real NVDA/Narrator vẫn `UNVERIFIED`; Python test `NOT RUN` vì không sửa
  Python/backend.

- P.2.1 alignment correction ngày 2026-09-06: targeted Vitest 14/14, full Vitest 17/17,
  TypeScript project check, production build, targeted Playwright 1/1 và final full
  Playwright 23/23 (một worker, trace off) đạt. Browser scenario xác minh flow-owned
  placement, status-chip treatment, hybrid copy, focus/lifecycle và collision với app
  bar/nav, descriptions, metrics, cards, channel panel, plots, simulator và overlay
  actions tại 1280×720/1440×900/1024×768/800×1100; axe serious/critical bằng 0.
  Direct PyWebView và `run_app.ps1 -SkipBuild -SmokeTest` đều exit `0`; `npm ls --depth=0`
  sạch; `git diff --check` exit `0` với cảnh báo LF-to-CRLF đã có. Bốn ảnh final đã
  được mở lại ở original resolution sau final suite.
- Disclosed test iteration: ba targeted browser run đầu phát hiện stale test expectations;
  full Playwright đầu đạt 19/23 và làm lộ bốn absolute-Y assertions cũ không tính activity
  lane 80px. Sau khi test giữ geometry frozen và chỉ chuẩn hóa theo measured flow offset,
  targeted review đạt 4/4 và final full suite đạt 23/23. Không ẩn failure trung gian.
- Python suite không chạy vì correction không sửa Python/backend. Protected prototype diff
  (`app/frontend/index.html`, `desktop/`, `mobile/`) rỗng. Backend/API/store/launcher/
  `pyproject.toml` vẫn có dirty entries tích lũy đã tồn tại từ preflight, không do correction.
- Samsung-reference addendum sau implementation chỉ sửa audit/handoff/session/verification
  records; không sửa source, test, dependency hoặc ảnh. Product suite không chạy lại.
- Historical first P.2.1 run below passed automation but its visual result was later
  rejected; retain these facts only as execution history, not as current evidence:
- P.2.1 ngày 2026-09-06: targeted Vitest 12/12, full Vitest 17/17, targeted Playwright
  1/1 và full Playwright 23/23 đạt. TypeScript/Vite production build đạt; direct
  PyWebView shell smoke và `run_app.ps1 -SkipBuild -SmokeTest` đều exit `0`;
  `npm ls --depth=0` sạch; `git diff --check` exit `0` với cảnh báo LF-to-CRLF đã có.
- Không chạy Python suite vì không có Python/backend change. Package manifests, backend,
  database, launcher, protected `app/frontend/index.html`, `desktop/`, `mobile/` và frozen
  One UI geometry không bị thay đổi bởi P.2.1.
- Final browser scenario xác minh exact copy, atomic focus, live-region ownership,
  chart-only pause/counter continuity, cùng pause-button bounding box, collision tại
  1280×720/1440×900/1024×768/800×1100, no-overflow và axe serious/critical bằng 0.
- Bốn ảnh của lần đầu đã được tạo và review ở original resolution tại
  `.design-cache/artifacts/product-p2-1/`; `MANIFEST.md` và `VERIFICATION.md` ghi provenance,
  hash và trạng thái lúc đó. Bộ ảnh này hiện bị từ chối; human NVDA/Narrator vẫn
  `UNVERIFIED`.
- Gate-closing docs-only ngày 2026-09-06: `git diff --check` exit `0` với các cảnh báo
  LF-to-CRLF đã có; 6/6 source/test hash trong manifest V.2.1 khớp. Không chạy lại
  product test/build/smoke/visual suite.
- V.2.1: full Vitest 11/11; full Playwright 22/22 trước refinement cuối.
- Sau settle refinement: targeted overlay/lifecycle 2/2, auth/Create/Edit/rail 2/2
  và structural Vitest 3/3.
- Vite production build, direct PyWebView shell smoke và `-SkipBuild` smoke đạt.
- 268 numeric layout fields không đổi so với V.2; protected hashes 12/12 khớp.
- Python suite không chạy lại trong V.2.1 vì không có Python/backend change.
- Human NVDA/Narrator spoken-output route vẫn `UNVERIFIED`.

### Mong muốn sản phẩm đã ghi nhận

- Người dùng đã phê duyệt visual V.2.1/P.1 và muốn chuyển trọng tâm sang tính năng thật;
  visual P.2.1 đầu tiên bị từ chối và correction hiện vẫn chờ review riêng.
- Các hướng mong muốn: history, global search/filter, Now Bar, actionable
  notifications, settings/quick actions và năng lực developer/administrator.
- Login/account/user management/auth audit đã có từ P.1; không lập lại như feature mới.
- Tính năng chỉ được đưa vào navigation khi workflow thật hoạt động end-to-end; không
  tạo placeholder hoặc màn hình giả ít dữ liệu.
- Desktop và mobile có presentation riêng; chỉ chia sẻ contract/logic phù hợp.
- Prompt giao việc cho Codex nên viết bằng tiếng Anh, ngắn theo delta và dẫn chiếu
  tài liệu/checkpoint; trao đổi với người dùng dùng tiếng Việt. UI áp dụng controlled
  hybrid glossary P.2.1: product/technical labels English, hướng dẫn thường tiếng Việt.

### Git/worktree hiện tại

- Branch `main`, HEAD `bf7720825a368b051dee5748f83f487fc8191abc`.
- `git status --porcelain`: 25 tracked modified và 17 untracked entries. Đây là worktree
  tích lũy P.0/P.1/V.2/V.2.1/P.2.1; không được reset/clean hoặc tách bỏ thay đổi người dùng.
- `glove_ble.py` vẫn là file thử nghiệm BLE không liên quan và được giữ nguyên.
- P.2.1 không sửa Python/backend, launcher, dependency manifests, protected prototype
  `app/frontend/index.html`, `app/frontend/desktop/`, `app/frontend/mobile/` hoặc evidence
  V.2.1 hiện có.

### Gate và bước kế tiếp

1. Production One UI alignment và approved A.1 Now Bar đã implemented. Gate tiếp theo
   là user visual/motion review sản phẩm chạy thật với sáu ảnh và một WebM tại
   `.design-cache/artifacts/production-one-ui-alignment/`; không tích hợp lại prototype.
2. Geometry V.2.1/P.1 vẫn frozen; bounded visual refinement mới chưa được user duyệt.
3. M1.1 vẫn còn blocker Phase E: trước cleanup chỉ làm audit/inventory khi được giao,
   liệt kê chính xác file/dependency PySide/Qt,
   reference còn lại, dung lượng, rollback và test matrix. Chưa xóa nếu chưa có phê
   duyệt trực tiếp riêng.
4. Không mở rộng ngoài P.2.1 đã duyệt; history/search/settings/capture và phần P.2 khác
   vẫn cần quyết định riêng.
5. Human NVDA/Narrator spoken-output vẫn `UNVERIFIED`; không suy diễn visual approval
   thành real-AT acceptance.
6. M2 firmware/protocol/Serial và hardware gate vẫn tuân theo tracker; không được
   suy diễn rằng P.1 hoặc V.2.1 đã mở M2.

## Mẫu cập nhật sau mỗi thay đổi

Agent kết thúc công việc phải cập nhật tối thiểu các mục sau:

```markdown
## Latest handoff update — YYYY-MM-DD

- Goal/phase:
- User authorization:
- Status: IMPLEMENTED | AUDIT ONLY | BLOCKED | AWAITING APPROVAL
- Delivered behavior:
- Exact changed files:
- Tests actually run and results:
- Tests not run/unverified:
- Frozen/protected scope confirmation:
- Worktree notes and preserved user changes:
- Evidence/checkpoint location:
- Remaining risks:
- Next approval gate:
- Recommended next action:
```

Nếu thay đổi làm snapshot ở trên không còn đúng, sửa trực tiếp snapshot thay vì chỉ
thêm một entry mới mâu thuẫn ở cuối file.

## Câu lệnh cho tài khoản/agent tiếp nhận

Sử dụng lời nhắc ngắn sau khi chuyển dự án:

> Read `AGENTS.md`, `docs/WORK_SESSION_HANDOFF.md` and the canonical files referenced
> there before planning or editing. Reconcile the handoff with the current Git state.
> Continue only from the latest approved gate. After any material work, update the
> same handoff file before finishing. Do not extend P.2.1 or start V.3, Phase E or M2
> unless the user explicitly approves that scope.

### 2026-09-10 — bounded Figma normalization continuation
- Verified Figma connectivity in the replacement ChatGPT session (`whoami` succeeds on the Education Full seat).
- Pulled exact design context for Selection Menu `1497:12842` and Drop Down Menu `1497:11901`.
- Replaced temporary derived state assets with exact Figma exports where an actual counterpart exists: `apps_outline` `340:8389`, filled `settings` `340:8610`, filled `sound` `340:8594`.
- Initial exact-name search left several fallbacks; follow-up icon-page pairing resolved Devices and Account with exact semantic pairs. Remaining derived fallbacks are limited to contextual `equalizer`, `speed` (Statistics), `list`, and `list_filter` semantics.
- Refined `OneUISelectField` popup styling toward the Figma dropdown language: 28 px radius, 24 px blur, tonal translucent dark/light surfaces, larger 18 px menu rows, and reduced generic web focus/selection appearance.
- Runtime UI Vietnamese-string scan returned no matches for the known legacy labels in `web/src`.
- Targeted build could not be completed in this sandbox because dependency installation timed out and left `node_modules` incomplete (`vite/client` type definition missing). Do not interpret this environment failure as a source compile failure; rerun `npm ci` then `npm run build` in a normal networked environment.
- No broad redesign was performed. Devices/Monitor/Studio composition remains unchanged.
### 2026-09-10 — exact state-pair + auth continuation
- Continued the bounded normalization pass without redesigning Devices, Monitor, Studio, shell geometry, backend, or ML behavior.
- Figma icon-page inspection confirmed exact `device/device_outline` (`341:67`/`341:65`) and `contact/contact_outline` (`341:99`/`341:98`) pairs. Runtime Devices/Gloves and Account stateful icon paths now use those exact pairs instead of custom outline approximations.
- Figma inspection also confirmed exact `password_show/password_hide` nodes (`340:8737`/`340:8738`). `AuthScreens.tsx` now renders those exported assets and no longer hand-authors the password eye SVG.
- Removed the remaining generated-looking 2x2 square auth mark; auth identity remains text-only (`SmartGlove` + existing `Dataset Studio`) and uses the same shared One UI primitives as the product.
- Auth card radius normalized from 30 px to 28 px after checking Figma Card `245:399`; no broader auth composition rewrite was performed.
- Quick Status now uses exact Figma `info/info_outline` (`340:8902`/`340:8901`) for closed/open state, eliminating its previous `speed` + derived-outline pairing.
- Remaining derived state fallbacks are limited to contextual semantics without a suitable exact pair in this bounded search (`equalizer`, `speed` for Statistics, `list`, `list_filter`). Do not claim those fallbacks are exact Figma assets.
- Verification in this sandbox: TypeScript `transpileModule` syntax checks passed for `AuthScreens.tsx`, `one-ui/shell.tsx`, and `one-ui/controls.tsx`; all newly referenced relative SVG imports resolve. Full `npm run build` / Vitest / Playwright remain unavailable because the prior dependency install left `node_modules` incomplete.
- Actual-source screenshot review is still pending a runnable web dependency environment; do not substitute generated mockups.


### 2026-09-10 — Auth V2 underline implementation + full-draft implementation inventory
- User explicitly changed the login direction after checking Samsung Account desktop/mobile behavior: pill credential fields are no longer preferred; login should use the lighter underline pattern. Accent CTA remains pill-shaped.
- Performed a read-only top-level scan of the full Figma draft. Pages confirmed: Welcome `0:1`, App Components `13:32`, System UI `744:3363`, Icons `320:2`, Emojis `1326:8985`, Behind the scenes `478:695`. Deep implementation inventory was taken from App Components/System UI and already-resolved relevant icon nodes; see `docs/FIGMA_IMPLEMENTATION_INVENTORY_20260910.md`.
- Pulled live Figma design context for Buttons `1497:12222`, Shapes/checkbox `1549:8493` / `1549:8505`, and rechecked Drop Down Menu `1497:11901`. The kit inventory does not expose a generic underline text-field component; underline auth fields are an explicit product adaptation to the user-approved Samsung Account reference, not falsely labeled as an exact Figma component.
- Implemented login-only Auth V2 in `web/src/AuthScreens.tsx` + `web/src/styles.css`: centered login copy, 392 px bounded credential column, underline Username/Password fields, exact Figma password visibility asset retained, circular `Remember username` checkbox, and the existing Figma-grounded `#387AFF` accent CTA.
- `Remember username` persists only the trimmed username in browser local storage after successful authentication and deletes it immediately when the user unchecks the control. Passwords and session tokens are never stored by this behavior.
- First-run administrator setup and change-password forms remain unchanged visually (shared pill field) pending separate review. No backend, auth API, Devices, Monitor, Studio, shell geometry, Phase E, or ML behavior change.
- Verification actually run: TypeScript `transpileModule` syntax check for `AuthScreens.tsx` passed. `npm run build` was attempted but the sandbox `node_modules` remains incomplete and fails before project typechecking because `vite/client` is missing. This is the same environment limitation recorded in the prior pass.
- Review evidence generated from an actual-source static harness using the current shared token/component CSS and exact login markup. This is not an AI-generated mockup; full React/PyWebView screenshot remains pending a complete dependency environment.
- Status: IMPLEMENTED — AWAITING USER VISUAL APPROVAL for Auth V2 before propagating underline treatment to other auth forms or beginning the broader screen-by-screen icon-enrichment pass.
### 2026-09-10 — Auth V2 centered-title sandbox refinement
- User explicitly preferred `Sign in` centered. Implemented a bounded CSS-only refinement in `app/desktop_collector/web/src/styles.css`; no auth logic, backend, routes, storage contract, or non-login screen changed.
- Login card header now spans full width; `.one-ui-card__copy h1`, eyebrow and description are centered; the 392 px underline credential/form column and accent CTA are centered on the same axis; field labels remain left aligned.
- Actual-source review harness measurement at 1440×900: card/title/form center delta = `0 px` for dark and light. Review screenshots are external sandbox artifacts only.
- Full Vite build could not run because transferred `node_modules/vite` is incomplete (`vite/client` missing); `npm ci` timed out. Preserve this as an environment limitation, not a product failure.
- Auth V2 centered-title visual gate: APPROVED BY USER on 2026-09-10. Keep underline credentials and centered sign-in copy; first-run/change-password remain unchanged until separately reviewed.



### 2026-09-10 — Post-approval shell fade + menu/icon refinement

- User explicitly approved the centered Auth V2. The login underline-field treatment and centered identity/copy are now the accepted auth baseline.
- Added a gentle lower-edge content mask to `web/src/one-ui/shell.css`, paired with the existing top fade so scrollable content eases out before the floating dock instead of ending abruptly. The lower fade is deliberately softer/longer than the top cue.
- Re-read live Figma Selection Menu `1497:12842` and kept its core contract: 28 px radius, 24 px blur, translucent light/dark surface, 20 px semibold optional title, and vertically spaced menu slots. Adapted plain SmartGlove rows to 18 px for desktop density while preserving richer search/result rows.
- Refined `OneUISelectionMenu` with an optional title and explicit rich/plain row state. Drop-down selected rows now use typography + the existing check affordance instead of stacking an extra selected pill inside the blurred popup.
- Added exact Figma outline/filled icon pairs for Studio contextual destinations: folder/dataset (`340:8955`/`340:8960`), image/MediaPipe (`340:8900`/`341:604`), labs/train (`340:8858`/`340:8859`), info/evaluate (`340:8901`/`340:8902`), sound/translate (`340:8588`/`340:8594`), plus existing apps overview. `settings_outline` `340:8609` is also now an exact runtime asset.
- Studio top-context items are enriched inside the shared shell only when their existing semantic item has no icon; app behavior/routes and the approved page composition are unchanged.
- Syntax-only TypeScript verification passed for `one-ui/shell.tsx` and `one-ui/surfaces.tsx`. Full Vite build remains unavailable in this transferred sandbox because the packaged `node_modules` is incomplete (`vite/client` missing); this is an environment limitation, not treated as production verification.
- Review evidence was rendered from actual sandbox source/CSS and exact exported SVGs in dark/light. Current gate: USER VISUAL REVIEW of the shell/menu/icon pass. Phase E and M2 remain unopened.
