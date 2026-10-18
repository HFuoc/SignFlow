## 2026-10-15 - Camera throughput without lossy input reduction

The camera requests1080p60 and shows negotiated settings separately from observed
camera/tracking FPS. V25 Auto supports up to60 acknowledged frames per second,
bounded by actual processing and one frame in flight. The negotiated RGBA8 path
replaces PNG encode/decode with full-resolution lossless pixels; legacy PNG remains
compatible. Source orientation, pinned Holistic complexity1/confidences/smoothing,
landmark packing, encoder and model weights are unchanged. History capacity covers
the same temporal window at the higher rate. See DATA_SCHEMA for the extension.

Fixed-timestamp comparison across25 local source videos/750 frames produced identical
RGB pixels, landmark coordinates/masks, segment phases, top-k labels and scores
between the prior PNG worker and new RGBA worker. This isolates transport/processing
parity; it does not validate source labels, independent signer accuracy or results
under a changed real-time sampling rate. No60FPS tracking or physical latency gate
is inferred from a60FPS request. Camo/device negotiation still needs physical review.

## 2026-10-14 - Reference playback is separate from recognition

V25 Live Camera includes25 source-example previews (default Chào), explicit playback,
replay and0.5x/1x speeds. Reference choice affects only viewing: it is never passed
to the model, used as a target label or captured as webcam input. Camera startup and
Auto remain explicit actions; switching references preserves an already running
camera. The original, unmirrored reference is shown next to the mirrored webcam
preview on wide layouts and stacked on narrower layouts.

Only the authenticated local bridge serves pinned bounded WebM bytes by ID. Native
player uses revocable RAM Blob URLs; hidden page pauses, selection/unmount cancel
fetches and release prior media. Missing/invalid local previews have a retry state
and do not block camera use. There is no raw-source fallback or runtime converter.
Source-label semantic review, independent accuracy and physical timing gates remain
open; the existence of a viewable example is not evidence of instructional correctness.
See DATA_SCHEMA and ASSET_INVENTORY for contracts, provenance and recovery.

## 2026-10-13 - Experimental ViSign during-motion Auto

V25 Auto processes full-resolution lossless camera frames while motion continues;
manual captures and KVSL Auto keep the existing clip/job path. Camera and Auto remain
explicit user actions. No video, PNG or derived landmark history is saved by streaming.
There is no frontend landmark extractor, model/runtime download, or dataset mutation.

The existing loopback bridge adds `/api/v1/recognition/stream`. Exact Host and Origin,
RAM-only bridge authentication and the current user session/collector role are required
before frames. One global active stream owns a separate lazy worker process in the
existing ML environment. It reuses bounded pipe readers/process-group teardown from
the existing worker client; batch recognition retains its own worker/cache. Details
and limits are in DATA_SCHEMA. Hidden page, navigation, camera stop/disconnect, Auto
off and bridge disposal close the stream. Logout/session invalidation and shell
shutdown cancel work and release worker ownership. No automatic retry/reconnect.

Motion segmentation uses all available hand points relative to shoulders, with up to
400ms onset history; it removes the former 2s forced clip and recognizes prefixes
every250ms after at least5frames/300ms. Finalization uses350ms quiet, trims the quiet
tail and bounds each segment to5.5s. Frame gaps over750ms discard stale features and
reset tracking. Thresholds/boundaries are experimental heuristics, not semantic sign
boundaries. A maximum-duration segment waits for quiet before starting again.

UI distinguishes `Tentative prediction` from `Completed sign`; neither is a verified
translation. Raw signed ridge scores are not probabilities. No-hand/short segments
may reject; visible-hand idle and unknown signs can still return wrong words. Prediction
stability is not confidence. New segments and gap resets clear stale provisional text.
The UI's frame-to-update measurement includes encoding/transport/frame processing and
excludes screen rendering; it is not gesture-end-to-display latency or recognition accuracy.

Validation-only prefix diagnostics (116 cached clips, no fitting or test-set tuning)
confirm substantial prefix/full-clip mismatch: source-label matches at25/50/75/100%
of frames are39/56/70/89. On the existing Chào replay, Chào first appears at frame28/30;
earlier wrong candidates can be stable. These are diagnostics on unreviewed source
labels, not an independent online accuracy benchmark. Evidence lives under
`.design-cache/visign-stream-20261013/`.

Acceptance remains physical V25 testing of Chào and other supported dynamic signs,
separately measuring first tentative update, first correct update, final errors,
false triggers/missed signs, and end-to-display p50/p95/worst. Webcam/new-person
accuracy and the subsecond target remain open; existing validation data is not a
substitute. Later model/data work requires preserving the experimental evidence and
independent evaluation; this implementation does not claim to solve early ambiguity.

## 2026-10-12 - User-authorized experimental camera model selection

The user approved app testing of the25-sign source-label baseline with a model panel.
Live Camera selects either `visign-ridge-25` (experimental, no topic prerequisite) or
the unchanged KVSL topic family. Dataset recognition remains KVSL-only. Model changes
wait for catalog loading and are locked during capture/inference/Auto; prior results
clear on change. UI lists25supported words, source-label/unknown-sign limitations and
raw-score semantics. It shows processing time excluding recording.

Reuse the existing capture/live-jobs/persistent-worker-v3 lifecycle, ownership/auth,
cancel/recovery and cleanup. No second service, frame transport or runtime dependency.
The new independently pinned provider uses its trained75-landmark encoder and numeric
NPZ, not the incompatible KVSL65-point/GCN contract. Catalog/score details and pinned
hash are in DATA_SCHEMA. Tracker records experimental authorization, not production
acceptance. Unknown/idle visible-hand rejection, new-person accuracy and physical
gesture-end-to-display under1000ms remain unverified/unmet.

## 2026-10-11 - Confirmed next product targets; runtime contract unchanged

User selected an initial vocabulary of 20-30 commonly used isolated signs, followed
by expansion. Normal camera use must not require topic selection. Result latency
target is strictly below 1000ms after the actual gesture ends, including boundary
confirmation, remaining preprocessing, classification and result rendering.
This is not a claim about current performance. Exact vocabulary, data collection,
model design, runtime location and compatibility of streaming features remain TBD.

Proposed feasibility checks: sustained local landmark extraction without growing
frame queues; timestamp/missing-frame diagnostics; current pinned-feature comparison;
independent sign-boundary annotation for end-to-result timing; p50/p95/worst observed
latency and rejection/error counts. Accuracy must be evaluated on held-out recordings
with documented signer separation and correctly taught signs. No accuracy percentage
is promised. A subsecond classifier alone does not meet the end-to-result target.

The existing ten topic providers, live-jobs API and offline preprocessing remain
pinned. Do not merely hide the selector or rank unrelated topic softmax scores.
No new model, dependency, training, frame transport or production cutover was made
as part of recording this decision. Phase 5B integration evidence remains below.

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

## Capture Contract

- Browser records WebM/VP8, video only, approximately 2 Mbps, no microphone request.
- Default 4 seconds follows the existing Phase 4 metadata: 45 local source recordings,
  range 2.6026–5.21354 seconds, median 4.004 seconds. This reuses evidence, not a Phase 4 rerun.
- Requests ideal 1280×720, bounded by width 1920 / height 1080 / 60 camera FPS.
  Decoder accepts landscape/portrait without stretching, at most 1920×1080 pixels.
- Preview CSS scaleX(-1); recorded track pixels and model input are not flipped.
  Existing upstream extraction is unchanged; no camera-specific handedness normalization.
- Maximum 8 MiB, two concurrent uploads globally, one upload per session, 15-second
  upload deadline. Existing queue limit eight; one active live job per session.
- Worker requires at least five frames, at most 720, readable media, monotonic finite
  presentation timestamps with positive span ≤6 seconds. Bound is decoded frame span,
  not an assertion about unknown last-frame display duration.
- WebM may report FPS=1000 with valid timestamps. Live duration/diagnostic timestamps
  therefore use decoded PTS, while the exact linspace 60-frame selection and tensor
  computation are unchanged. Manifest input retains its historical timestamp behavior.
- TemporaryDirectory under the user's OS temp directory, unique UUID filenames,
  backend-owned root/IDs only. Normal success/failure/cancel/shutdown delete media.
  Sudden OS/process termination can leave an orphan directory; no crash-proof deletion claim.

## API Changes

New `POST /api/v1/recognition/live-jobs?topic_id=<verified topic>` takes raw bounded
WebM bytes. Session cookie + bridge bearer token + collector role + exact Host/Origin
are required. Query accepts only one topic ID; no filename, path or checkpoint input.
Backend maps the topic to its verified provider and returns the existing 202 job shape.

Existing GET /jobs, GET /jobs/{job_id}, DELETE /jobs/{job_id} expose/operate on both
sources, with the same session ownership. No media read/download/delete endpoint.
Existing POST /jobs remains manifest-ID-only. Models/samples routes are unchanged.
CSP permits local blob media; Permissions-Policy permits self camera and denies microphone.

## Live Input Contract

LiveCaptureRef has capture_id + topic_id. Live jobs/predictions have
source_kind=live_camera_capture, capture_id, sample_id=null, recording_id=null.
Provenance contains byte hash/size and transform behavior, no dataset annotation.
Manifest sources retain their original IDs and semantics; manifest bytes unchanged.
PredictionResult/job v1 receive additive source fields and explicit nullable live IDs.
Worker protocol is v3 because trusted capture-root startup configuration and ID-only
predict_live_capture are new. Old single-use manifest worker-v1 remains compatible.

## Recognition Integration

Live capture → RecognitionJobService → RecognitionService → persistent isolated
worker → existing MediaPipe preprocessing → cached verified GCN → PredictionResult.
No ML package installation, model training, checkpoint/vocabulary change or second
preprocessor. Feature tensor remains float32 60×65×3 → 65×180 with zero-fill.

## Topic Behavior

Explicit topic selection chooses one of ten verified topic-local providers. There is
no global 175-class classifier. Scores remain uncalibrated model scores.


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

## Phase 3A — persistent isolated execution (2026-10-10, current)

The attached Phase 3A request authorizes this execution-boundary change. It supersedes
older per-request-process descriptions below. Provider IDs/vocabularies, manifest
semantics, source/checkpoint pins, FeatureSequence, PredictionResult, ModelDescriptor,
feature schema and `kvsl-gcn-do-vat-60x65x3-v1` preprocessing remain unchanged.

### Ownership and lifecycle

Studio → existing authenticated API → RecognitionJobService → RecognitionService →
PersistentRecognitionWorkerClient → isolated ML Python → verified cached provider →
PredictionResult. One client per service, lazy first-use startup; no worker when
recognition is unused. The existing single executor serializes jobs; the client also
serializes offline concurrent callers. Pipe reads/writes run on dedicated threads,
not the FastAPI event loop. No second server or collector ML dependency is added.

States are internal: stopped, starting, ready, busy, failed. The model catalog retains
its existing local prerequisite availability check, not a guarantee that future runtime
initialization will succeed. Missing environment never prevents app startup. Runtime
startup/handshake failures fail only the current recognition job; later requests can
try a fresh worker. Public routes, ownership/auth, statuses and ID-only submission
remain unchanged. Diagnostics are not rendered as fake progress.

Windows virtualenv python.exe is a launcher with a child interpreter. Start suspended,
assign to a private Job Object with KILL_ON_JOB_CLOSE, then resume. Validate that the
handshake PID belongs to that job, rather than assuming it equals Popen.pid. Both
launcher and ML interpreter are terminated on faults; parent death also closes the
job handle. Other OS process behavior is not newly deployment-verified.

### Persistent protocol v2

`smartglove-recognition-worker-v2` is necessary because startup handshake, reusable
stream and shutdown semantics differ from one-shot v1. The old worker-v1/invoke path
is retained for internal compatibility; normal service/CLI uses v2.

Launch the fixed worker module with `--persistent`, a unique hello request ID, and
trusted operator startup configuration (workspace and relative manifest/upstream/
assets/checkpoint paths). These paths are not prediction inputs. WorkerConfig still
validates containment and the separate virtualenv executable. No shell command is
assembled from sample/provider input; Popen receives an argument list with shell=False.

The worker verifies pinned package versions, imports the required runtime and creates
Holistic before sending one READY frame. Fields: protocol_version, request_id,
status=ready, worker_identity=smartglove-kvsl-gcn, worker_version=2, sorted provider ID
list, runtime_ready=true, pid. Parent validates the exact fields, protocol/identity/
version, all ten provider IDs, runtime readiness and owned process identity.

Prediction frame fields are exactly protocol_version, operation=predict_manifest_sample,
request_id, sample_id, provider_id. Video paths, checkpoint paths, config and workspace
fields in prediction frames are rejected. Paths are derived inside the worker from
startup configuration and the backend-owned registry. Each service call generates a
UUID; the hello and shutdown IDs are independently generated. No generic RPC or code
execution operation exists.

Response fields are exactly protocol_version, request_id, prediction. Parent verifies
the currently expected ID and rejects unsolicited/duplicate/unknown/stale frames.
Semantic validation then checks the entire PredictionResult identity, provenance,
schema, vocabulary, top-k labels and finite scores. A corrupt stream/result is discarded,
never carried into a later job. A duplicate arriving after a completed response poisons
the stream for subsequent work; it cannot satisfy a new request ID.

Frames are UTF-8 newline-terminated strict JSON (no duplicate keys, nonfinite numbers,
invalid Unicode). Request limit 65536 bytes; response limit 131072 bytes. Dedicated
bounded writes preserve full frames and allow timeout/cancellation even if the worker
stops reading. Stdout is exclusively protocol; Python and native output are redirected
to stderr at descriptor level. Stderr is continuously drained with at most 64 KiB
retained; harmless diagnostics are not a failure signal.

Shutdown frame: protocol_version, operation=shutdown, request_id. It requests normal
resource closure and EOF/process exit; no shutdown acknowledgement frame is required.
An idle responsive worker exits 0. Active work is terminated; no fake cooperative
cancellation operation is offered.

### Cache, integrity and clip independence

Lazy cache keyed by verified provider_id, naturally bounded by the ten-entry registry.
No preloading or generic eviction. Before insertion validate descriptor, feature and
preprocessing contracts, contained checkpoint path, pinned SHA-256 of the exact bytes
passed to weights_only=True, input/output dimensions and strict architecture loading.
Failed loads never enter the cache. Per-request video/label-map/manifest/source checks
remain; sample identity and classes are rebound before each prediction.

Loaded weights are immutable worker-lifetime snapshots. Warm requests do not rehash
or reload that checkpoint inside the worker. Replacing its disk contents does not
change the already verified in-memory model; restart is required to observe a changed
artifact, and the original pinned hash still must match. Changing the configured path
or descriptor for a cached provider is rejected. The existing API catalog/submission
preflight additionally rechecks disk artifact hashes and can report that provider
unavailable even while an older valid snapshot remains cached. No new artifact is
silently promoted; registry/provider changes require separate authorization.

Construct one Holistic with unchanged parameters. Reset its graph run before each
subsequent independent video, resetting tracking/filter state while retaining the
object/runtime. Decode and close each VideoCapture independently. Landmark extraction,
frame selection, missing groups, dtype conversion and GCN tensor layout are unchanged.
W00395 parity: (60,65,3) → (65,180), bit-identical float32 values, masks and timestamps;
feature bytes SHA-256 b11d402d614ab8b7ea662a83e13c364adbc25cd747dbc0be8f38300709577043.

### Cancellation, faults and shutdown

Cancel/timeout stops the actual worker tree, waits/reaps it and joins pipe threads
before returning a terminal cancellation/error. Timeout includes cold start and IPC,
defaults to 120s and keeps the existing configured maximum 600s. Polling granularity
is 50ms. Crash/protocol errors fail the current job; no silent automatic retry. The
next request starts a clean worker and empty cache without restarting SmartGlove.

Shutdown rejects new work, cancels queued jobs, interrupts active execution, closes
the service worker and joins the executor. Client lock wait is bounded at 4s, graceful
idle exit at 1s, process wait at 2s and each of three pipe-thread joins at 1s; executor
join retains its 5s bound. Failure to verify cleanup raises rather than claiming success.
Exceptional teardown is bounded but can exceed the normal 5s executor-only historical
description. Real running+queued shutdown measured 187ms, with no surviving owned
worker/interpreter, executor or server and a reusable port. Both shell and FastAPI
lifespan retain idempotent teardown. Offline callers use `with RecognitionService()`
or explicitly call shutdown(); the CLI uses the context manager.

### Diagnostics, measurements and compatibility

Existing latency_ms.preprocess/model/total remain; cold_start and provider_load are
added. Quality includes cache hit/counters/loaded-provider count and feature shape/hash.
quality.worker_exit_status is **null while the worker is alive**, not 0. This is a
truthful diagnostic change inside the existing extensible quality object, not a new
PredictionResult schema. Legacy single-use replies still report their actual exit.
Lifecycle logs correlate request IDs; no credentials, raw frames or per-frame log feed.

Local totals in ms: old W00395 10438.971, D0098 8953.338. Persistent do_vat cold
8857.992; same-provider warm 5309.367; cau_hoi first 5122.447, warm 4997.572;
do_vat return 5254.486. Same-provider warm reductions 49.1% and 44.2%. W00395
ca/cày/bộ sách scores exactly .43561261892318726/.13568049669265747/.1329399198293686.
The normal six-request sequence used one process, three lazy loads and three cache
hits; D0532 preserved top-1 5, top-2 3. Video preprocessing remains the bottleneck.
These are bounded local observations, not statistical latency guarantees or accuracy.

Windows working set ~324 MiB ready, ~539 MiB after first full prediction, ~544 MiB
after three providers; private committed memory ~1261/1521/1525 MiB respectively
(not private working set). Separate no-video model probe: ~317 MiB ready, ~351 MiB
one model, ~367 MiB three models. Measured parameter storage: 732240, 721960, 739436
bytes for do_vat/cau_hoi/so_dem; process deltas also include asynchronous runtime setup
and allocator costs. Evidence favors lazy loading; no ten-model residency experiment.

Fresh checks: 168 affected backend tests, real feature parity, real authenticated
cancel/crash/timeout/restart/shutdown, shell smoke, eight browser regressions plus a
final real two-topic rerun. Browser evidence copies adapt old exit-0 expectations to
null; durable frontend source/tests/build are untouched. Full commands/results and
remaining deployment/data limitations: WORK_SESSION_HANDOFF.md. Evidence is ignored
under .design-cache/kvsl-phase3a/; production runtime does not depend on that directory.

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

### Verified provider inventory

| Topic | Classes | Recordings | Checkpoint | Compatibility | Real sample | Status |
|---|---:|---:|---|---|---|---|
| cau_hoi | 10 | 10 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| chu_cai | 34 | 34 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| do_vat | 20 | 20 | present | strict/map/preprocessing PASS | 1 completed | VERIFIED |
| gia_dinh | 24 | 24 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| hanh_dong | 18 | 18 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| nghe_nghiep | 6 | 6 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| so_dem | 27 | 27 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| thoi_tiet | 10 | 10 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| tinh_cach | 19 | 19 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |
| tu_thong_dung | 7 | 7 | present | strict/map/preprocessing PASS | 3 completed | VERIFIED |


Shared source commit: `e5165d79f373a12a4964e2c3d1bf59c911416667`.
Shared artifact/model version: `4634b5d9f695f1118f99a6d09c9487f81bde0b3c`.
All use feature schema `mediapipe-pose23-left21-right21-xyz-v1` and unchanged
preprocessing `kvsl-gcn-do-vat-60x65x3-v1` (historical ID retained; explicit reuse).
Input `(65,180)`; GCNConv 180→256→256→256, global mean pooling, Linear 256→C.
Checkpoint paths below are relative to upstream history; local files use their
basename beneath operator-configured assets. Weights are never modified.

| Provider | Topic | Classes | Checkpoint | SHA-256 | Real samples |
|---|---|---:|---|---|---:|
| kvsl-gcn-cau-hoi | Câu hỏi | 10 | `app/backend/Model/gcn/cau_hoi.pth` | `f4748abdb2b76fa53ce73e6f8cebb8acc867056ab57212682fc91eb8870f2ef7` | 3 |
| kvsl-gcn-chu-cai | Chữ cái | 34 | `app/backend/Model/gcn/chu_cai.pth` | `68b3c19a7fb4ba066e191779f99b3cf15322b6015804d98919f6755a61fb4482` | 3 |
| kvsl-gcn-do-vat | Đồ vật | 20 | `app/backend/Model/gcn/do_vat.pth` | `ea64129ba9a3f66a955a65b65340906ede701ff4d2f1f97bb4031979817eaade` | 1 |
| kvsl-gcn-gia-dinh | Gia đình - Quan hệ gia đình | 24 | `app/backend/Model/gcn/gia_dinh.pth` | `be4ca3d0b04bfb1a91995af4ff95634cd146eafb8d8e5eddacddf8ae1c09fc58` | 3 |
| kvsl-gcn-hanh-dong | Hành động | 18 | `app/backend/Model/gcn/hanh_dong.pth` | `dca3f8fcb208ecb6510c3b08d0e345d310fe17ad6cc0440cc6398657de9f60b6` | 3 |
| kvsl-gcn-nghe-nghiep | Nghề nghiệp | 6 | `app/backend/Model/gcn/nghe_nghiep.pth` | `93b7bf6d668e07008901da8cd5e229c5e62bdda1aa5af9df21c5ebb9671c6692` | 3 |
| kvsl-gcn-so-dem | Số đếm | 27 | `app/backend/Model/gcn/so_dem.pth` | `c0cd7f22594f1bfe65a4d974a7ef20ed894103d2f9f08141c75ec63cccd82643` | 3 |
| kvsl-gcn-thoi-tiet | Thời tiết | 10 | `app/backend/Model/gcn/thoi_tiet.pth` | `9aaae9592be191942b8fc4c006e95f0296bfcc2c1fb6be29201eaf9aff8ba973` | 3 |
| kvsl-gcn-tinh-cach | Tính cách - Tính chất | 19 | `app/backend/Model/gcn/tinh_cach.pth` | `7e2b6077176cad6d12f836fcc47014af386a671cd30049818d1b0b01f393dc6a` | 3 |
| kvsl-gcn-tu-thong-dung | Từ thông dụng | 7 | `app/backend/Model/gcn/tu_thong_dung.pth` | `ea644f150b4afae7834fd2996948bf943ba96665edfd03ac6b77902f91bdbb18` | 3 |

### Verification limitations

License/redistribution unknown; signer identity unknown; official split unknown;
training overlap unknown; generalization unknown. No remaining unverified topic
among these ten pinned GCN artifacts, but untested clips/classes are not evaluation
evidence. LSTM unresolved; continuous sign segmentation unresolved; sensor recognition
unverified; persistent worker optimization not implemented; Raspberry Pi/production
packaging unverified. Native PyWebView visual/DPI review and human screen-reader
review were not performed. Runtime package/source validation still occurs at worker
execution; catalog availability is a local prerequisite check, not a runtime guarantee.

<!-- END PHASE3B CURRENT -->

## Phase 2 — Desktop recognition vertical slice (2026-10-10)

Current authorization is the attached Phase 2 request. The historical Phase 1-only
scope below is superseded only for this bounded desktop integration. Phase 0A/0B
are not repeated; model, preprocessing, manifest and prediction contracts are unchanged.

Flow: Studio Dataset → authenticated ID-only REST → RecognitionJobService (one
executor thread) → existing RecognitionService → one isolated process/request →
validated PredictionResult → polling UI. No ML imports occur in the bridge process.

### API and authorization

All routes use the existing RAM-only bearer header, HttpOnly user session, exact
Host/Origin policy and collector roles (researcher, administrator, developer).
Job ownership is the current authenticated session ID; a different session receives
404 even for a known job ID. No owner/token/path is returned in public job metadata.
Development preflight adds DELETE to the existing exact-origin method allowlist.
No new CORS origin, auth bypass or recognition WebSocket is introduced.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/v1/recognition/models | Sole verified provider and local prerequisite availability. |
| GET | /api/v1/recognition/samples | Read-only do_vat manifest memberships and local asset validity. |
| GET | /api/v1/recognition/jobs | Bounded history for this user session; recover state after navigation. |
| POST | /api/v1/recognition/jobs | Submit sample_id and provider_id only; 202 with queued job. |
| GET | /api/v1/recognition/jobs/{job_id} | Poll owned job. |
| DELETE | /api/v1/recognition/jobs/{job_id} | Request cancellation of owned job. |

POST forbids extra fields, including video_path/checkpoint_path/python_path/command.
The existing WorkerConfig owns local paths; no request or browser input changes it.
Samples resolve through KVSLVideoAdapter; recognition revalidates local video hashes,
vocabulary, model and pinned worker sources. Responses do not contain absolute local
paths. No generic file server/media route is provided; preview is deferred.
Availability checks local prerequisite files/model/map identity without importing ML.
Installed ML package versions and source hashes are validated inside the worker on
execution; an available file preflight is not a full runtime health guarantee.

### Job contract and lifecycle

Schema: smartglove-recognition-job-v1. Fields: job_id (UUID hex), sample_id,
provider_id, status, created_at, started_at, finished_at, prediction, error,
cancel_requested. Times are UTC ISO strings; IDs never derive from timestamps.
Worker timeout uses monotonic timing. Prediction uses the existing explicit
PredictionResult.to_dict representation and its versioned schema, not generic
reflection-based dataclass serialization at the API boundary.

Transitions: queued → running → succeeded/failed; queued → cancelled;
running → cancelled only after the process has stopped and been reaped.
A running cancellation initially keeps status=running and sets cancel_requested=true.
The UI says cancellation was requested, without falsely declaring completion.
Terminal snapshots never change, including on repeated cancellation; public copies
cannot mutate internal records. Each new submission gets a new ID. Duplicate active
submissions for the same sample/session return 409. Unknown jobs return 404, full
queue 429, unavailable provider or stopped service 503; invalid extra fields 422.

Concurrency=1, up to 8 total active/queued jobs, up to 32 terminal records globally.
Older terminal records are evicted on completion/submission. Active jobs are never
evicted. Everything is in RAM; app exit clears history. Signing out makes old jobs
inaccessible to the new session; jobs already running can finish until app shutdown.
No identity DB schema, raw sensor data, manifest or predictions-as-labels persistence.

The executor starts with FastAPI lifespan. Shell shutdown and lifespan both call
idempotent shutdown: reject new work, cancel queued jobs, signal the running worker,
join the executor for at most 5 seconds. Uvicorn graceful request drain is bounded
at 2 seconds so outstanding connections cannot keep identity storage open indefinitely. The cancellable process path polls every
100ms, kills on cancellation/timeout and drains/waits for the child; the worker has
no children. Offline callers without a cancellation signal retain their original
subprocess.run path. No persistent worker, distributed queue or new dependency.

### Frontend

Existing Studio Dataset composes the existing OneUICard, select, key/value, button
and state-message primitives (existing Card245:399 and Buttons1497:12222 lineage).
No new asset, font, design-system primitive or Figma approximation. Browse the 20
local do_vat samples, select metadata, Recognize, cancel, view terminal status and
top-three Vietnamese labels. Dataset label is separate from Prediction; numeric
Model score values are uncalibrated softmax, never accuracy/confidence claims.

Polling starts at 750ms then 1000ms after each response; requests do not overlap.
Terminal state/unmount aborts polling and clears its timer. Transient failures retry;
auth/not-found errors stop automatic polling. Retry connection explicitly reloads
session jobs and restarts observation. Navigation recovers the latest active or last
retained job; no telemetry store coupling. While a job is active, sample changes and
new UI submissions are disabled. Status updates use one polite live region.

### Verification commands and limitations

From repository root:

~~~powershell
.venv/Scripts/python.exe -m pytest tests/test_recognition.py tests/test_recognition_worker.py tests/test_recognition_jobs.py tests/test_kvsl_manifest.py tests/test_dependencies.py tests/test_server.py -q
.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase2/verify_lifecycle.py
.venv/Scripts/python.exe -m app.desktop_collector.shell --smoke-test
~~~

From app/desktop_collector/web:

~~~powershell
npm.cmd test
npm.cmd run build
$env:RECOGNITION_REAL='1'
npx.cmd playwright test recognition.spec.ts --trace off
~~~

RECOGNITION_REAL opts into the real local W00395 test; otherwise it is skipped.
Browser tests inject credentials only into their in-memory entry-module response,
not URLs/storage/files. Authentication remains real and uses a temporary identity DB.
Recognition routes alone are mocked for focused browser tests. The opt-in smoke
uses real routes/service/MediaPipe/GCN. Trace recording is disabled for these tests
because authenticated traces may retain headers. Evidence stays in ignored cache.

Fresh real UI result: job a2ced456d3124441900f2eaab7767615, W00395 annotation ca,
top-3 ca .43561261892318726 / cày .13568049669265747 /
bộ sách .1329399198293686; child exit 0, total 24917.5044ms, preprocess 10766.5771ms,
model 34.9193ms. This is one local regression measurement under concurrent test load,
not benchmark accuracy or a latency guarantee. UI stayed usable while the job ran.
Real cancellation and shutdown are separately recorded in real-lifecycle.json:
cancel ~125ms, shutdown ~219ms, terminated child exits 1 (expected Windows kill),
no live executor/server, port reusable. Collector ML packages absent and unimported.

Remaining: video preview deferred; native PyWebView visual/DPI/screen-reader checks
not performed in this phase (headless shell lifecycle did run); only do_vat GCN
verified; licensing/redistribution, signer identity, official split, training overlap,
generalization, other topics, LSTM, continuous segmentation, sensor recognition,
Raspberry Pi and production ML packaging unverified. Persistent worker optimization
is not implemented. Existing bridge launch URL fragment behavior is unchanged;
new recognition requests use bearer headers and never put credentials into URLs.
Phase 3 needs a separate priority decision; it is not implemented automatically.

---

# Offline recognition boundary — Phase 1

Implemented 2026-10-10. Scope: local manifest-backed videos, one verified provider.
No UI, HTTP endpoint, telemetry, identity persistence, sensor adapter or job scheduler.

## Flow and ownership

`RecognitionService.recognize(sample_id)` → `KVSLVideoAdapter` → one isolated Python
process → versioned `FeatureSequence` → `KVSLGCNProvider` → `PredictionResult`.
The parent validates the manifest/video/vocabulary before launch and validates the
returned identity, provenance, labels, scores and status before returning a result.
The worker independently resolves the same manifest and validates its inputs.

Existing core models use frozen dataclasses and explicit validation; recognition
follows that convention. Existing acquisition workers are sensor threads and the
shell lifecycle owns a server, so neither is reused for ML. A single-use subprocess
requires no new dependency, HTTP server, resident runtime or shared prediction state.

Phase 0B has recording IDs and topic memberships, not a sample_id field. Phase 1
defines an external reference `kvsl:<topic_id>:<recording-stem>`, for example
`kvsl:do_vat:W00395`. It resolves to recording `kvsl:W00395` and its `do_vat`
annotation. This does not alter `smartglove-kvsl-manifest-v1`. An arbitrary filename,
unreferenced historical path or missing topic membership is not a recognition sample.

## Contracts

All schemas are UTF-8 JSON compatible. Serialization sorts keys, preserves Unicode,
and rejects duplicate keys, nonfinite numbers and invalid Unicode. IDs and versions
are explicit; unknown schemas are rejected rather than adapted.

| Contract | Version |
| --- | --- |
| FeatureSequence | `smartglove-feature-sequence-v1` |
| PredictionResult | `smartglove-prediction-result-v1` |
| ModelDescriptor | `smartglove-model-descriptor-v1` |
| Worker protocol | `smartglove-recognition-worker-v1` |
| Feature schema | `mediapipe-pose23-left21-right21-xyz-v1` |
| Preprocessing | `kvsl-gcn-do-vat-60x65x3-v1`, version 1 (Phase 0A ID retained) |

FeatureSequence carries modality `mediapipe_keypoints`, source sample/recording/dataset,
topic, provenance, values, valid_mask, timestamps, shape, dtype and preprocessing ID.
Values are `(60,65,3)` float32 at the provider boundary. The mask is `(60,65)` booleans
describing group detection, not confidence; it is diagnostic and is not fed to GCN.
Timestamps are selected frame indices divided by reported FPS, in seconds. They are
nominal frame times, not original presentation timestamps; all are null if FPS is
unavailable. Repeated timestamps are permitted when short clips repeat selected frames.
Sensor features would require a separate feature schema and provider.

Preprocessing preserves the Phase 0A implementation: OpenCV decode, BGR→RGB,
MediaPipe Holistic 0.10.14, complexity 1, detection/tracking 0.7, smooth landmarks,
default video tracking. Raw XYZ, pose 0..22, left hand 0..20, right hand 0..20;
missing groups zero, no face features, no centering/scaling/mirroring. Select frames
with `np.linspace(0,N-1,60).astype(int)`. Upstream float64 extraction is converted
to float32 at the same model boundary; transpose/reshape produces `(65,180)`.
Empty/undecodable videos return insufficient_data. No confidence rejection threshold
is invented. Observable missing-group counts cover all decoded frames, not just 60.

PredictionResult includes request/sample/recording, topic/vocabulary, provider/model/
hash, modality/feature/preprocessing IDs, provenance, top_k, quality, latency_ms,
status, error_code and rejection_reason. Status supports `ok`, `rejected`,
`insufficient_data`, `unsupported`, `error`; failures have no top-k. Each of three
top-k entries includes `source_class_index`, manifest `label_id`, `display_name`
and `score`. Scores are **uncalibrated softmax scores**, not calibrated probabilities.
Ties use ascending class index. Output must contain exactly 20 finite scores.
Vocabulary ID is `kvsl:do_vat:<label-map-sha256>`.

Latency keys `preprocess` and `model` are measured inside the worker, in milliseconds;
`total` spans parent validation, process startup, imports/loading, inference, response
validation and shutdown. Timings describe the measured local run, not a guarantee.
Quality records the actual worker exit status after successful protocol validation.

## Only registered model

- Provider/model: `kvsl-gcn-do-vat`; topic `do_vat`; 20 classes.
- Source repository: `https://github.com/LeNguyenAnhKhoa/KVSL`.
- Source commit: `e5165d79f373a12a4964e2c3d1bf59c911416667`.
- Artifact/checkpoint commit and model version: `4634b5d9f695f1118f99a6d09c9487f81bde0b3c`.
- Historical checkpoint path: `app/backend/Model/gcn/do_vat.pth`.
- Checkpoint SHA-256: `ea64129ba9a3f66a955a65b65340906ede701ff4d2f1f97bb4031979817eaade`.
- Label-map SHA-256: `050f8b0781ecf6a37a0971560a765555ed63c3c6ba211506096861ba528db47e`.
- Input `(65,180)` float32; output `(1,20)` logits. Fully connected off-diagonal graph.

Descriptor is a single frozen instance, not dynamic checkpoint discovery. Checkpoint
bytes are hashed before `torch.load(weights_only=True, map_location='cpu')`; input/
output weight shapes and strict state loading are checked. Four upstream source files
are pinned by normalized UTF-8 SHA-256, verified against immutable source-commit Git
objects. Only selected function definitions are AST-loaded from extraction/prediction
scripts, avoiding their top-level augmentation and all-topic service construction.
No upstream FastAPI application is imported.

The worker requires the existing verified CPU package versions: torch 2.5.1+cpu,
torch-geometric 2.4.0, MediaPipe 0.10.14, NumPy 1.26.4, OpenCV-contrib 4.10.0.84.
Main orchestration, contracts and adapter use only the standard library. There is no
new collector dependency. Package/version mismatch fails instead of auto-installing.
Holistic complexity 1 uses packaged local assets; the installed implementation's
lite/heavy download paths are not invoked. No runtime network/fetch/install code exists.

## Local configuration and CLI

Run from the workspace with existing verified local Phase 0 assets:

```powershell
.venv/Scripts/python.exe -X utf8 -m app.desktop_collector.recognition.cli --manifest .design-cache/kvsl-phase0b/manifest.json --sample kvsl:do_vat:W00395 --provider kvsl-gcn-do-vat
```

Output is one JSON object containing separately named `annotation`, `prediction`
and `model_descriptor`; exit is 0 on success, 1 on structured recognition failure.
Annotation is not described as held-out ground truth.

`WorkerConfig` and CLI options configure `--workspace`, `--python`, `--manifest`,
`--upstream`, `--assets`, `--checkpoint`, `--worker-module`, `--timeout`.
Paths are relative to the explicitly trusted workspace, except checkpoint, which is
relative to assets. Resolved paths including symlinks must stay inside those roots.
Defaults point to the existing `.design-cache/kvsl-phase0a/` extraction-env, upstream,
assets and Phase 0B manifest. A different trusted workspace supports relocated assets.
The executable must be a local Python in a separate virtual environment, not the
collector interpreter. Configuration is trusted operator input, never sample input.
Worker module is fixed to `app.desktop_collector.recognition.worker`; unknown modules
are rejected. No machine-specific absolute paths are embedded in runtime source.

Source-only checkouts need a separately provisioned local manifest, verified sources,
label-map, video, checkpoint and isolated environment. Missing prerequisites fail with
structured errors; inference does not download, reconstruct or install them. Nothing
is written to raw data or the manifest. No model/data binaries are bundled.

## Process protocol and failure handling

One request and one response per process, newline-terminated deterministic JSON.
Request fields: protocol_version, operation (`predict_manifest_sample` only), request_id,
sample_id, provider_id, workspace, config (resolved manifest/upstream/assets/checkpoint).
Response fields: protocol_version, request_id, prediction. Parent validates correlation,
all result fields, model/preprocessing/provenance and mapped labels before accepting.

Use an argument array with shell=False. No sample-derived command or operation executes.
Stdout is reserved for the response; Python/native stdout is redirected to stderr at the
OS descriptor level. Harmless stderr is not failure. Worker diagnostics are available
through the client reply and service DEBUG logging; normal results contain short errors,
not internal tracebacks. Nonzero exit, malformed output/UTF-8, stale IDs and timeout fail.
Timeout defaults to 120 seconds, configurable up to 600. `subprocess.run` kills and waits
for the child on timeout; the worker starts no subprocesses. Each successful request
closes video/Holistic resources and exits. No resident process or stale model result.

## Fresh verification and limits

```powershell
.venv/Scripts/python.exe -m pytest tests/test_recognition.py tests/test_recognition_worker.py tests/test_kvsl_manifest.py tests/test_dependencies.py -q
.venv/Scripts/python.exe -X utf8 .design-cache/kvsl-phase1/smoke.py
```

Affected suite: 89 passed (39 recognition unit/adapter tests, 16 process/worker boundary
tests, 33 Phase 0B tests, 1 existing dependency test). Process doubles test only process
faults; the local smoke script runs real MediaPipe, torch/PyG and the real checkpoint.
Fresh-process import guard covers collector startup modules, manifest and orchestration.
The collector also reports all three ML packages absent via find_spec.

Real service smoke: W00395, W00170, W00380, three unique requests, child exits 0.
W00395 top three exactly match Phase 0A: ca .4356126189, cày .1356804967,
bộ sách .1329399198. Local evidence: `.design-cache/kvsl-phase1/real-smoke.json`,
`worker-diagnostics.log`, `smoke.py`. This is regression evidence, not accuracy.

Still unknown/unverified: license/redistribution, signer identity, official split,
training overlap, generalization, other topics, LSTM, continuous segmentation,
sensor-domain recognition, Raspberry Pi and production packaging. Only do_vat GCN
is supported. Long clips may hit the timeout; no streaming/job scheduler or confidence
rejection policy exists. Relocation and other operating systems have not been exercised.
Phase 2 Desktop Recognition Vertical Slice requires separate authorization.
