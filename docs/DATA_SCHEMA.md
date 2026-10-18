## Explicit stream boundary and rejected-score diagnostics (2026-10-19)

Additive capability in the existing authenticated stream handshake: `manual_finish=true`.
New clients send optional `finish_segment` (strict integer1..10,000,000) on the next
fresh frame only after this capability is advertised. It identifies the currently
observed moving/ending segment; no standalone command, new endpoint or pixel queue.
Both PNG and RGBA headers accept this field. Sequence/time/rate/size/auth checks
are unchanged. The worker ignores stale segment IDs and idle requests; frame gaps
and max-duration rejection take precedence. A valid explicit boundary emits final
with `quality.boundary_reason=manual_finish`; stillness remains automatic otherwise.
The existing minimum frame/hand-coverage and model acceptance checks still apply.
No tensor preprocessing/weights/threshold change. Evaluate manual boundaries
separately from automatic stillness using the recorded boundary reason.

After a manual or timed-out segment,500ms of stillness OR absent hands can rearm.
Absent hands during an active TCN/VideoMAE sign still do not end it. Lowering hands
after a finished/discarded attempt therefore cannot leave Auto permanently waiting.

TCN and VideoMAE rejected results may carry `quality.candidate_top_k`: exactly3
canonical entries in the same shape/order as top_k, retaining native26/100-way
probability mass. Host validation checks registered labels/indices, uniqueness,
finite bounded scores, sorted order and mass<=1. This field is only legal for
rejected uncertain_sign/outside_vocabulary results from these two providers.
`native_winner_supported` is a required boolean when candidates exist. Candidates
are diagnostic guesses, never accepted predictions; rejected `top_k` stays empty.
Incomplete/missing-hand segments have no candidates. TCN retains its frozen
0.9992662072181703 threshold. UI shows unconfirmed guesses and capture details;
the accepted-word display remains exclusive to status=ok. No recordings are saved.

## Tracking runtime and current-frame recovery (2026-10-19)

Stream protocol/framing, full original camera pixels, authentication, one-frame
backpressure and limits are unchanged. Camera quality now requests either
1920x1080 (existing default), 1280x720 or 960x540, each at ideal/max60fps, video
only. Actual negotiated dimensions/rate remain visible. There is no browser
resizing, coordinate interpolation or duplicate-frame submission.

All three streaming providers use the pinned MediaPipe0.10.14 complexity1 graph,
existing models/smoothing/confidence0.5, with XNNPACK CPU inference set to2threads
where the graph uses legacy inference options. No CUDA delegate is claimed.
This execution-only change was checked for exact landmark/presence parity on
750 retained reference frames. Capture/offline feature extraction is unchanged.

TCN Auto adds a separate current-frame palm detector on original input pixels.
Only missing hands with a visible current pose wrist are eligible. Associate by
distance to the two pose wrists, not screen order or mirrored handedness; reject
ambiguous/duplicate/nonfinite/out-of-frame candidates. Failed searches cool down
100ms. After a successful recovery, infer on each new frame while the primary
tracker still misses that hand; never hold an old landmark across missing frames.
Reset at the existing750ms gap and close both graphs on shutdown. Extra recovery
work can increase tail latency; recovery is experimental, not verified accuracy.

This changes TCN Auto features: preprocessing_id is the model's base ID plus
`-stream-palm-recovery-v2`. Preserve its model hash, GH137 encoding, normalization,
native26-way probabilities and frozen rejection threshold. Capture still uses
the original preprocessing. Do not pool these two preprocessing versions as if
they were the same evaluation. UI explicitly identifies experimental recovery.

Additional quality diagnostics: tracking_resolution, tracker_profile,
recovery_attempted, recovered_hands, recovery_ms; bridge authorization_ms,
worker_roundtrip_ms and bridge_ms. The browser locally adds capture_ms and
payload_bytes to its callback. Timings use local monotonic clocks/durations;
Frame RTT still includes capture, transport and processing, not sensor exposure.
Tracking FPS counts fresh acknowledged results, not preview/held overlays.

## VSL-GH experimental camera provider (2026-10-18)

User authorized integrating the trained model for webcam testing, then requested
Auto and references. Provider `vsl-gh-tcn-25`, topic `vsl_gh25`, family `gh_tcn`
supports experimental Capture and Auto and remains optional.
It pins `background-run1/tcn.pt` (epoch44) and `normalization.npz` by SHA256 in
`recognition/gh_tcn.py`. Existing default and streaming providers are unchanged.

Capture receives bounded original/unmirrored WebM, resizes each complete frame to
360x360 and uses isolated MediaPipe0.10.14 Holistic complexity1, smoothing enabled,
detection/tracking0.5. Pose25 and hands42 use the publisher's GH137 slot order;
unused face70 slots stay zero. Reuse `vsl_gh_experiment.encode_segment` exactly:
32x279 features, training mean/scale, tensor1x279x32, native output1x26.
Native labels are the pinned25 source glosses followed by `__OTHER__`; public
vocabulary/class_count stays25. Never expose OTHER as a translated word.

Softmax is computed across26 classes. Preserve native probability mass in public
top3 (`uncalibrated_softmax_subset`); do not renormalize25 outputs. Native OTHER
wins -> `outside_vocabulary`; known score below0.9992662072181703 -> `uncertain_sign`.
Threshold comparison uses Python float precision and precedes rounding. Rejections
have empty top_k. Missing hands/shoulders fail as insufficient_data. Job errors
are sanitized by the existing job service; temporary captures are deleted at
terminal states. No new storage, bridge protocol or raw-data changes.
Finish capture can end the4second manual clip. Auto uses the existing authenticated
RAM-only stream and75-point overlay; separately packs rawGH137 after resizing360.
Streaming preprocessing ID is the capture preprocessing ID plus`-stream-v1`.
The TCN stream uses400ms pre-roll,500ms stillness and a3-sample motion median,
without provisional inference or ending on missing hands. The existing5.5second
maximum and750ms frame-gap reset apply. Truncated/interrupted signs never produce
a word. Infer only final segments, with the same encoder, native26-way probabilities
and frozen threshold. Existing minimum5tracked frames/50%hand coverage also applies.
Source-label scores and rejection behavior are not verified webcam accuracy.

GH reference IDs`gh25-00`..`gh25-24` are separate from`visign25-*`. Catalog uses
the existing authenticated/no-store references routes and4MiB media limit. Manifest
`gh-landmark-replays-v1` pins bytes/SHA256 and25identities; public entries add
`kind=landmark_replay`. Only training examples S01–S04 are selected by tracking
coverage/duration, never model success. The renderer verifies Git blob and segment
SHA256, preserves source coordinates/order and uses publisher30fps timing. Replays
contain source face dots, upper body/hands and hand-detail views. They are visibly
labeled reconstructed landmarks, not original human footage or verified instruction.

## VSL-GH offline experiment contract (2026-10-18)

Schema `smartglove-vsl-gh-experiment-v1`; feature contract
`gh137-body-hands279-32-v1`. The offline module itself does not register providers.
The separate camera adapter above reuses its encoder without changing the existing
75point feature contract, transport or finalized capture storage.

Input NPY: finitefloat32 `(T,411)`, reshape `(T,137,3)`:25selectedpose,
70face,21lefthand,21righthand; absent groups are zero. Pin Git blob and source
metadata hash. Full-recording boundaries must match rounded timestamps exactly
and satisfy nonoverlapping0<=start<end<=T. Source labels explicitly use[start:end].
Never clamp invalid boundaries. Exclude the full recording on a boundary fault.

Encoding:32nearest temporal samples; body subset0,9,10,11,12,13,14,19,20,
both hands95:137. Shoulders are9/10 (fullMediaPipe11/12). GlobalXY uses median
shoulder center/distance; handlocalXYZ uses wrist/palm scale separately.51XY pairs,
51presence masks,42localXYZ points =279channels. Missing points stay masked/zero;
no face, absolute position, duration, signer or sentence ID as input. Segments
shorter than4frames/nohands/noshoulders/degenerate scale are rejected explicitly.

Preserve S01–S04train/S05val/S06test. Sample max40/gloss/signer by fixedSHA256.
Deduplicate before fitting; exact segment/encoded conflicts across signer/split/
label are quarantined. Record arrays, labels, IDs and source receipts together.
Train checks finite shapes, label ordering, all per-class support, array/provenance
agreement and cross-split exact content. Output cannot overwrite existing runs,
source metadata/features, or data/raw. Failure leaves a partial new research
directory for inspection; resume with a new output path, never rewrite raw input.

Both models normalize only from train. Ridge alpha/TCN epoch/model family use
validationmacroF1; persist selection before test scoring. Save numericNPZ and
locally generated PyTorch state_dict; load with allow_pickle=False/weights_only=True
and verify saved hashes. CLI replay loads every saved normalization/label/weight in
a separate process and checks predictions against the run receipt.

The follow-up adds __OTHER__ as class26, preserving25source glosses. Original
negative glosses remain in source_gloss; they are not relabeled in raw data.
Threshold rule: accept iff argmax!=OTHER and maxscore>=threshold, choose usingS05
only;5%unknown budget is an experimental policy. This evaluation is exploratory
because S06was already examined. No production-confidence calibration is implied.

## Cropped VSL source qualification report (2026-10-18)

Offline schema smartglove-vsl-cropped-audit-v1 extends the audit tool; no runtime,
packet or capture contract changes. Inputs are immutable canonical train/test JSON,
one or more raw front-view JSON arrays and optional augmented metadata. Raw identity
is (video_id, exact gloss, signer_id); processed fields are videoid/gloss, optional
is_augmented boolean/source_videoid and train/test split for augmented input.
IDs remain strings with leading zeros. Duplicate raw IDs fail as ambiguous. A gloss
conflict or missing source never supplies a signer. Augmented samples must carry
their source ID; non-augmented rows cannot borrow another recording identity.

Output preserves source hashes, candidate current25 identities, known/unknown signer
coverage, raw-label conflicts and split intersections for signers and parent recording
IDs. Both canonical and augmented summaries are retained. It always states
audit_scope=metadata_only and training_ready=false; absence of overlaps is not
semantic/media/rights acceptance. Separate proposals never rewrite source splits.
Output uses existing write_manifest protections; identical rerun is unchanged,
different existing output and source/raw-session replacement are rejected.

## VideoMAE Auto completion policy (2026-10-16)

Supersedes the VideoMAE provisional800ms cadence described below. VideoMAE Auto
now collects/tracks a segment without provisional classifier calls and runs its
RGB classifier once after termination. This prevents synchronous classification
from blocking receipt of the same sign's next frames. Final score/margin rules,
500ms end hold,750ms gap reset,5500ms maximum duration and bounded RAM history
remain unchanged. Users wait for the result before starting the next sign;
final classification still delays tracking and this is not continuous translation.

VideoMAE segmentation uses a causal three-sample median of hand-motion scores
to suppress isolated landmark jumps. RGB frames and stored model inputs are
unchanged. The filter resets on real frame gaps and adds a short boundary delay.
This is an engineering mitigation; idle/unknown false-activation remains unverified.

Motion onset uses the existing hysteresis thresholds: an active sample>=0.035
starts a candidate; neutral motion(0.020,0.035) retains it; quiet<=0.020 or missing
hands resets it. Another active sample after>=100ms starts the segment. A single
spike followed only by neutral/quiet values cannot start a sign. Both streaming
providers share onset/end hysteresis: neutral motion also preserves a pending
quiet interval, while active motion cancels it. V25 retains provisional classification.
VideoMAE alone no longer treats missing hands as quiet/end-of-sign; its RGB
history spans temporary tracking occlusion. Persistent loss still reaches the
bounded maximum duration and cannot yield an accepted word. Hand-coverage
requirements are unchanged; no missing frames/landmarks are fabricated.

No packet fields, model weights, input tensor, vocabulary or score thresholds
change. A real frame_gap still discards an incomplete segment. The UI now reports
that interruption, instead of silently asking the user for a new gesture. The
25-sign personal-camera/idle/unknown acceptance gate remains open.

## Experimental VideoMAE RGB provider (2026-10-15)

Provider/model ID: `visign-videomae-25`; topic: `visign25_rgb`; modality:
`rgb_video`; feature schema: `rgb-uint8-224-square-v1`; preprocessing:
`videomae-rgb-16-uniform-imagenet-v1` (Auto adds `-stream-v1`).
The application descriptor represents 25 projected outputs, shape (1,25).
The native model has 100 outputs and receives (1,16,3,224,224). Existing V25
canonical label IDs/order are reused. Native indices, in that order:
16,14,22,24,26,32,46,48,49,51,52,54,55,70,73,74,76,77,80,85,86,92,94,95,98.
The pinned config and model hashes define the native label mapping.

New score kind `uncalibrated_softmax_subset` preserves native softmax mass:
each projected value is in [0,1], and the 25 values sum to at most one.
Do not rescale them to one or present them as measured accuracy.
Quality includes native_class_count, native_top1_id/score, native_margin,
subset_mass, stable_updates, acceptance_policy, device and gpu_name.
Top-k source_class_index remains the canonical 25-class index; native identity
is separate in quality. Rejected/insufficient results have empty top_k.

Heuristic policy v1 requires a native winner inside the 25-word vocabulary,
margin >=0.25 and final score >=0.80. Provisional acceptance requires >=0.90,
at least 1000ms of selected motion and the same native winner on two consecutive
inferences. Selected durations below 700ms, hand coverage below half, gaps or
maximum-duration termination cannot yield an accepted word. These are uncalibrated
heuristics, not validated open-set recognition: unknown_rejection remains false.
A confident wrong word is still possible; valid signs may be rejected.

The stream authentication message accepts the old exact {type,token} fields or
{type,token,provider_id}. Omission selects V25. Only V25 and VideoMAE may stream;
unknown providers fail after normal authentication. Token stays only in the
message body/RAM. Ready includes provider_id; worker replies and predictions must
match the selected model. Exact Host/Origin, role/session authorization, one
frame in flight, dimensions/rate bounds and cancellation/reaping remain enforced.

Transport and Holistic overlay use original unmirrored RGB. VideoMAE separately
resizes the shorter edge to 224, center-crops a 224-square frame, uniformly selects
16 temporal frames and applies the pinned ImageNet normalization. The transform
is recorded; off-center hands may be cropped. Auto RGB history is uint8, at most
356 frames (53,587,968 bytes for pixels), plus landmark/IPC/runtime allocations.
History remains RAM-only and is cleared with the segment/session. Manual WebM
retains existing temporary-storage/delete semantics; no raw dataset writes.

VideoMAE Auto uses 500ms end hold and 800ms provisional inference spacing;
V25 defaults remain 350/250ms. Per-frame CUDA inference is synchronous when due:
it delays acknowledgement/tracking, so 60FPS is still a ceiling, not a promise.
GPU startup has a 120s default worker deadline and 125s browser deadline.
The provider requires CUDA and fails rather than silently falling back to CPU.
Artifact availability in the catalog does not prove that CUDA can initialize.

Capture keeps one lazy CUDA worker warm. The app service reserves model execution
for a clip or one Auto stream; conflicts return recognition_busy, and stale
stream owners cannot release another reservation. Stream start reaps idle manual
workers before loading a model. All workers stop on app shutdown. Dependencies
are selected only inside the isolated worker; no Torch import in the desktop host.
The existing reference previews are shared; their V25 provenance is not rewritten.

# SmartGlove data schema

## Camera performance negotiation (2026-10-15)

Camera capture prefers 1920x1080 at60FPS, with those same maximum dimensions/rate
and audio disabled. These are device negotiation preferences, not measured throughput.
The UI reports the negotiated track dimensions/rate separately from observed camera
FPS. Observed FPS uses `requestVideoFrameCallback` cumulative `presentedFrames`
deltas, including frames presented between callbacks; it is not a sensor-clock probe.

The compatible stream-v1 ready message adds `frame_formats:["rgba8","png"]` and
raises `max_fps` to60. New clients choose RGBA8 only when advertised; otherwise they
send legacy PNG. The binary envelope and acknowledgement identities are unchanged.
An RGBA header has exactly the legacy fields plus `format:"rgba8"`, integer `width`
and `height`. Payload is row-major, four uint8 sRGB channels per pixel, exactly
width*height*4 bytes. Full1080p is8,294,400 bytes, within the existing8MiB limit.
Both host and isolated worker independently reject malformed dimensions, sizes,
sequence, timing and rate. Legacy three-field PNG headers remain valid.

RGBA avoids per-frame PNG encoding/decoding. It preserves full source dimensions
and RGB pixels without resizing, cropping, mirroring or lossy compression. The worker
converts RGBA to read-only RGB for the same pinned Holistic graph and classifier.
Optional quality fields `frame_format`, `decode_ms` and `tracking_ms` distinguish
transport conversion from tracking; existing `processing_ms` still covers the frame.
Local WebSocket per-message deflate is disabled. Authentication, exact Host/Origin,
RAM-only pixels, receive queue1 and one frame preparing/in flight remain enforced.

Feature history is bounded at356 frames to retain the same400ms pre-roll plus5500ms
maximum segment at60FPS. End hold350ms, maximum gap750ms and provisional250ms cadence
are unchanged. Higher temporal density can change segment/model results: transport
pixel parity does not establish training parity or physical recognition accuracy.
60FPS is a ceiling; actual tracking depends on processing and local transport.
Isolated workers bound OMP/OpenBLAS/MKL pools to1 before library imports to avoid
inheriting large host pools; MediaPipe graph executors and host settings are retained.
Update web bundle and Python bridge together to use the negotiated fast path.
Older PNG clients still work; there is no raw-storage or firmware migration.

## Camera overlay diagnostics (2026-10-14)

Additive optional stream-v1 `quality.tracking` has schema `holistic-overlay-v1`:
75 normalized unmirrored `xy` pairs, 75 boolean `present` flags, 33 finite
`pose_visibility` values and at most100 index-pair `connections`. Order is the
existing pose33/left-hand21/right-hand21 packing. Connections come directly from
the pinned MediaPipe Holistic constants. No face mesh, extra detector or altered
model input. Payload belongs to the acknowledged frame's sequence/timestamp;
it stays in RAM. Original coordinates are not clamped or modified for inference.
Display hides absent/out-of-frame points and pose visibility below0.5, mirrors
only the overlay/preview and preserves contain letterboxing. Stale display expires
after1second and clears on stream/camera stop, navigation and hidden-page shutdown.
Older workers without this optional field retain recognition without an overlay;
malformed/unknown overlay versions are ignored. No persistent/firmware migration.

Camera FPS measures presented video-frame counter deltas; Tracking FPS measures received
acknowledgements, both over a rolling1second window (at least2 samples). Unsupported
or stale measurements show a dash. Frame RTT uses one browser monotonic clock from
pre-encoding capture to acknowledgement; it includes encoding, IPC/transport and
worker processing, excludes screen rendering, and is not network ping or gesture
latency. Processing is worker per-frame elapsed time, not classifier time alone.

## Local V25 reference previews (2026-10-14)

Additive read-only endpoints under `/api/v1/recognition`, protected by existing exact
Host/Origin, RAM bridge-token header, user session and collector-role checks:
- `GET /references?provider_id=visign-ridge-25`: exactly one provider query; returns
  `references` in canonical V25 order. Each entry contains `reference_id` (`visign25-00`
  through `visign25-24`), `label_id` (`visign:visign25:0` through `:24`), `display_name`,
  `available`, `source_semantics_verified=false`, `media_type=video/webm`.
  Registered KVSL providers return an empty list. No local paths are exposed.
- `GET /references/{reference_id}/media`: no query parameters; returns verified
  WebM bytes with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
  Unknown identity is 404; missing, damaged or mismatched preview/manifest is 503.

The runtime reads the pinned `visign-reference-previews-v1` manifest under
`.design-cache/visign-references-20261014-v2/`. Manifest limit128KiB, each media limit4MiB;
resolved paths must remain inside workspace/reference storage. Verify manifest SHA256,
canonical vocabulary/order/filename, exact byte count, WebM signature and media SHA256
before serving the same bytes. Missing/corrupt storage yields unavailable entries;
there is no runtime conversion, arbitrary file URL or fallback to raw source videos.

Frontend fetches media with authorization headers/cookie, then creates a memory Blob
URL for the native video player. No credential enters a media URL or browser storage.
Selection changes abort stale fetches, detach the old player and revoke Blob URLs;
unmount does the same. Hidden pages pause playback. References never enter inference
or select a target label. Camera consent, preprocessing and prediction remain separate.
No camera/raw dataset/storage migration or firmware contract change.

## ViSign RAM-only frame stream (2026-10-13)

Protocol `smartglove-recognition-stream-v1`, WebSocket
`/api/v1/recognition/stream`, no query parameters. After exact Host/Origin validation,
the first bounded JSON message is `{type:"authenticate",token:<RAM-only bridge token>}`.
The existing user cookie/session, collector role and password-change policy also apply.
No token in URL, storage, media, diagnostics or recorded browser traces.

Server sends `ready` only after the isolated pinned V25 model/graph is initialized:
`type`, `protocol`, `stream_id`, `max_fps=60`, `max_frame_bytes=8388608`,
`max_width=1920`, `max_height=1080`, `max_pixels=2073600`, `idle_timeout_ms=10000`,
`session_timeout_ms=1800000`, plus segmentation limits. Browser sends one frame and
awaits its acknowledgement before encoding another; there is no growing frame queue.

Binary frame: uint32 big-endian header length, UTF-8 JSON header (at most1024 bytes),
then negotiated RGBA8 or legacy PNG bytes (at most8MiB; see the extension above).
The legacy PNG header has exactly `type:"frame"`, `sequence` (integer,
starts0, increases by1), `timestamp_ms` (finite browser monotonic capture time,
strictly increasing). Original unmirrored source dimensions/pixels, no resizing;
8-bit RGB/RGBA PNG only, dimensions checked before decode. Pixels/features stay in RAM.
Server and worker validate order, size and rate independently; source timing remains
distinct from arrival timing. WebSocket receive queue is1 and max message is8MiB+1028.

Acknowledgement: `type:"frame"`, echoed `sequence`/`timestamp_ms`,
`state:"ready"|"moving"|"ending"`, `phase:null|"provisional"|"final"`,
`segment_id`, `prediction:null|PredictionResult`, `quality`. Prediction is emitted
only on a new provisional update or finalization. Null idle acknowledgements retain
the last completed result; a new segment/gap reset invalidates stale provisional text.
Quality reports hand presence/motion, bounded history length, frame gaps/reset reason,
resolution and processing duration. No semantic confidence follows from these fields.

Stream PredictionResult has `source_kind="live_camera_stream"`, null sample/capture/
recording IDs, and provenance `{stream_id,segment_id}`. It uses the pinned V25 model,
ordered labels and raw_ridge scores, with preprocessing ID
`visign-body-relative-xy-mask-16-stream-v1`. Training's75-point packing/16-sample encoder
are reused; continuous graph tracking, sparse arrival and partial windows are explicitly
experimental and not claimed equivalent to independently reset complete clips.
Prediction quality records partial_gesture/continuous_tracking, coverage and boundaries.

Bounds: one active global stream; 30s worker-operation deadline,10s idle,
30min session; at most356 landmark frames/5.5s segment and400ms pre-roll. Gap>750ms
resets graph/history. Stream close or `{type:"stop"}` cancels work; worker termination,
pipe/process cleanup and ownership release follow normal cancellation/shutdown paths.
Errors use bounded code/message JSON, then close. Recovery is explicit Auto on again;
no interrupted frame or previous feature window is replayed into a new stream.

Migration: additive experimental endpoint/protocol only. Existing batch worker-v3,
capture/live-jobs, dataset/model pins, raw storage and manual/KVSL behaviors retain
their contracts. No persistent storage migration or firmware/sensor packet change.

## Experimental camera provider and model catalog (2026-10-12)

Explicit user authorization permits experimental app testing. The existing model
catalog adds `family`, `experimental`, `requires_topic`, `supported_words`, `score_kind`.
KVSL defaults remain `kvsl`, false, true, [], `uncalibrated_softmax`. The separately
whitelisted `visign-ridge-25` uses internal routing key `visign25`, family `visign`,
experimental=true, requires_topic=false, the pinned 25-label ordered vocabulary and
`raw_ridge`. This routing key is not a user-required topic or a KVSL dataset topic.
The existing authenticated WebM live-jobs endpoint and transient capture ownership,
size/time/resolution limits, cancellation and deletion contracts remain unchanged.
No arbitrary user checkpoint paths, automatic retraining or dataset write is exposed.

Checkpoint: `.design-cache/visign-baseline-20261012/run1/model.npz`, SHA256
`e525679567b115b2a66202f46ac58c079ec1852241902ca9840606f050a08a31`.
Load verified bytes with allow_pickle=false; fields mean/scale(3600), weight(3600,25),
bias(25), Unicode labels(25). Require exact labels, finite floating weights and positive
scales. No source/semantic provenance is promoted by registration.

ViSign reuses `vsl_features.pack_landmarks` and `vsl_baseline.encode_clip/scores`:
MediaPipe0.10.14 Holistic complexity1, detection/tracking0.5, fresh tracking per clip,
75 points, original unmirrored RGB frames, no resize/interpolation. Encoder uses16
uniform floored time indices, body-relative clipped XY plus presence masks(3600).
Preprocessing ID `visign-body-relative-xy-mask-16-v1`; model version
`source-label-baseline-20261012-run1`; vocabulary digest is SHA256 of canonical
contracts.encode(ordered words). Vocabulary ID uses `visign:visign25:<digest>`.

`PredictionResult.score_kind=raw_ridge` permits finite signed/unbounded scores and
stable descending top3, never probabilities. Host validation ties score kind to the
selected descriptor; KVSL softmax bounds/sum checks remain intact. ViSign currently
accepts camera captures only. Less than50%frames with either hand yields
insufficient_data/hands_missing. This is a tracking-quality check, not calibrated
unknown/idle rejection; visible-hand idle/out-of-vocabulary signs can still misclassify.
Quality includes hand_coverage, frames/missing groups, cache_hit, experimental=true,
source_semantics_verified=false, unknown_rejection=false. Latency includes model,
preprocess, provider_load, cold_start and total; total excludes recording and UI polling.

## ViSign source-label research baseline (2026-10-12)

The user explicitly authorized offline research without exhaustive manual semantic
review. Existing source/curation `training_ready=false` and pending review fields are
preserved. This experiment requires `--allow-unreviewed-source-labels`; it does not
authorize production model replacement or establish sign correctness.

CLI: `python -m app.desktop_collector.vsl_baseline --pilot PATH --features PATH
--groups PATH --rgb PATH --curation PATH --output-dir NEW_PATH
--allow-unreviewed-source-labels`. Uses existing isolated NumPy/threadpoolctl, lazy
imports, no collector dependency change. Curation is rebuilt from source receipts,
verified videos/features/groups and the source-pinned RGB diagnostic, then compared
to the supplied curation before fitting. Output must be new, outside input directories
and `data/raw`. Source data and earlier reports remain immutable.

`split.json` (`visign-research-split-v1`) is written before fitting. Only screened
records participate; whole related groups remain together. Preserve every prior test
member. Where a class has fewer than two validation groups, move train groups ordered
by SHA-256 of fixed seed plus group ID until it has two; require at least two remaining
train groups and one test group. Record every move; never borrow from test. This is
fixed for this experiment, not a signer-independent benchmark or production vocabulary.

Encoding `16-nearest-body-relative-xy-plus-mask-v1`: use decoded-frame order, sample
16 uniform nearest frame indices, concatenate 75×2 normalized XY coordinates and
75 presence values per sampled frame (3,600 values). Across each whole clip, use median
shoulder midpoint and shoulder distance for body translation/scale; if no shoulders
are emitted, use median present XY and median radial distance. Scale floor0.05,
normalized XY clipped to[-4,4]; absent XY reset to zero. Ignore depth because families
have differing depth conventions. No sign boundary, original timing or causal webcam
compatibility is inferred. These are derived features; no video/NPZ source is modified.

Model: multiclass ridge least squares on one-hot targets. Feature mean/std and target
bias fitted only on train; std floor0.05. Test data does not fit normalization or
select parameters. Try alpha0.1,1,10,100, select by validation macro-F1, then accuracy,
then larger alpha for ties. No retraining on validation. Numeric `model.npz` contains
mean/scale/weight/bias and Unicode labels; read with `allow_pickle=false`, round-trip
checked before reporting. Scores/margins are not probabilities or unknown rejection.

`run-input.json` starts `prepared_not_completed`; only final `report.json`
(`visign-source-label-baseline-v1`) marks complete after model/predictions/review queue
publication. Partial directories remain incomplete; retry with a new path. Report
contains candidate validation scores, chosen alpha, train/val/test accuracy, macro-F1,
balanced accuracy, confusion matrices, per-class support, majority baseline, model
hash and package versions. `production_ready=false`, source semantics unverified,
signer independence not established. Small test class supports must remain visible.

`predictions.json` retains IDs, source labels, partition/group, predictions and top3.
`review-priority.json` uses validation only, mismatches first then ascending score
margin. Predictions never replace source labels or fill semantic review decisions.
Classifier-only timing excludes encoding, MediaPipe, camera, segmentation and UI;
it is not physical-end-to-display latency. A separate local51-clip review shortlist
contains27validation mismatches plus one deterministic correct prediction per class
where available(24), all pending semantic review. Future tuning after test inspection
requires fresh independent evaluation; this test set is now a development reference.

## ViSign conservative curation index (2026-10-12)

Offline CLI: `python -m app.desktop_collector.vsl_curation --pilot PATH --features
PATH --groups PATH --rgb PATH --output NEW_PATH`. Contract: `visign-curation-review-v1`.
It screens the existing proposal without changing source media or accepting labels.

Inputs are the local pilot, complete feature report, prior recording-group proposal
and `visign-flat-frame-diagnostic-v1` RGB diagnostic. Source video hashes are checked;
the feature review is recomputed from NPZ bytes and must equal the supplied proposal.
The RGB diagnostic must reference the exact pilot SHA-256 and the fixed rule: spatial
standard deviation of every BGR channel at most 1.0 on 0–255 pixels. This command
validates the diagnostic's source, coverage, labels, frame counts and unique sorted
zero-based frame indices; it does not decode RGB again. Its output states that limit.
Duplicate/missing/foreign records, inconsistent coverage and modified groups fail.

Any flat frame or either-hand coverage below 0.5 quarantines the **whole connected
group**, including members with no direct flag. Exactly 0.5 passes this technical
threshold. Existing quarantine reasons persist. Remaining groups retain their prior
proposed assignments; there is no reshuffle to conceal missing validation classes.
No frame is trimmed, filled, mirrored or recolored, and no source file is deleted.

Output includes input SHA-256 receipts, policy, groups with `previous_proposed_split`,
per-member flags, records with video paths/coverage/frame indices, per-class partition
coverage and recomputed summary. `quarantine` means omitted from the current proposal,
not erased. Other records are `screened_pending_semantics`, never approved. All semantic,
boundary and tracking review fields start `pending`; `training_ready=false`,
`status=screened_not_approved`, signer independence `not_established`. No production
importer consumes this artifact. Publication uses the atomic/no-overwrite writer,
outside all input directories and `data/raw`; identical reruns are unchanged.

The local HTML/CSV review pack is a cache artifact, not a production UI or annotation
approval mechanism. It references immutable videos in place and sends nothing online.
Manual CSV fields may record pending/accept/reject/uncertain plus reviewer/notes;
editing them does not automatically authorize training or alter this curation index.

## ViSign offline features and recording review (2026-10-12)

`python -m app.desktop_collector.vsl_features --pilot PATH --output-dir NEW_PATH
--workers 2` reads the local `smartglove-visign-local-pilot-v1` candidate index.
Run extraction only in the existing isolated MediaPipe 0.10.14 environment. The
collector runtime does not import MediaPipe through this offline module.
Every candidate must have a unique SHA-256, a matching `videos/<sha256>.mp4`, a
nonempty label and an audited integer frame count (1–720). Source hashes are checked
before extraction and again by each worker. No source file is rewritten.

Feature contract: `visign-holistic-75xyz-mask-v1`. Holistic complexity 1, detection
and tracking thresholds 0.5, temporal tracking reset per clip; no resizing, mirroring,
interpolation or resampling. Each numeric-only NPZ contains:

| Field | Shape / dtype | Meaning |
| --- | --- | --- |
| `xyz` | `(T,75,3)` float32 | Pose 0:33, left hand 33:54, right hand 54:75 |
| `present` | `(T,75)` bool | True only where MediaPipe emitted a landmark |
| `pose_visibility` | `(T,33)` float32 | Emitted pose visibility, zero when absent |
| `frame_index` | `(T,)` int32 | Zero-based decoded frame index; not wall-clock time |
| `visual_signature` | `(8,32,32)` uint8 | Uniformly sampled grayscale frames for similarity review |

Coordinates retain MediaPipe's normalized image-landmark output, including each
landmark family's native depth convention; they are not a shared metric 3D skeleton.
Absent coordinates are zero with `present=false`. An emitted coordinate equal to
zero remains present. Presence does not certify tracking correctness. Face landmarks
are not included. No compatibility with existing KVSL model tensors is asserted.

Each run uses a new directory outside source directories and `data/raw`. NPZ publication
is exclusive via a flushed temporary file and hard link; existing artifacts are never
overwritten. `run-input.json` records config and source receipt with
`state=prepared_not_completed`. Only after all expected videos succeed does
`feature-report.json` record `state=complete`, source/config, per-video feature hashes,
counts and summary. A failed or interrupted run without this final report is incomplete;
preserve it and choose a new output directory to retry. Do not combine partial runs.

`python -m app.desktop_collector.vsl_feature_review --pilot PATH --features REPORT
--output NEW_PATH` verifies the source receipt, complete feature coverage, feature
hashes, annotations, array shapes, finite values, frame indices, missing masks and
hand-coverage agreement. NPZ loading uses `allow_pickle=false`.
Report schema: `visign-recording-group-review-v1`.

Grouping unions every source filename and exact-copy alias family (same directory
and stem with a trailing `_<digits>` removed), then conservative visual hints: eight
32×32 grayscale frames with mean absolute pixel error ≤2 and every frame error ≤4
on a 0–255 scale. Connected components stay together. These hints neither establish
signer identity nor prove that all related recordings have been found.
Cross-label groups and groups containing a clip with no detected hand are quarantined.
Classes with fewer than five remaining groups are unassigned. Other classes receive
a deterministic development split proposal, using SHA-256 of seed plus group ID:
floor 20% of groups each for test/validation (minimum one), remainder for training.
Clip counts can differ from those proportions. Group IDs hash sorted member hashes.

This is `status=proposal_not_frozen`, `training_ready=false`; signer independence
and absence of near duplicates remain `not_established`. A proposed test partition
is not an independent production benchmark. Source semantics, sign boundaries and
idle/unknown examples still require review. All artifacts are derived research data,
separate from captured raw sessions and production model manifests. Review JSON uses
the existing atomic/no-overwrite writer, outside the source and feature run directories;
an identical rerun is unchanged, a different result needs a new output path.

## VSL-GH candidate segment review index (2026-10-12)

Offline CLI: `python -m app.desktop_collector.vsl_candidate_manifest`, schema
`smartglove-vsl-candidate-manifest-v1`. Inputs: `--metadata`, `--tree`, `--candidates`;
output: `--output`. This creates an index for review, not cut clips or training tensors.
It has no network, media decoding, ML dependency or production app integration.

The candidate JSON contains `source` matching the supplied Git tree's `sha` and
`labels[]` with distinct exact `gloss` strings. Coverage in that input is not trusted:
all counts are recomputed. Unknown labels fail; no synonyms or regional variants merge.
The complete tree and metadata pass `vsl_data_audit` first. Metadata bytes must match
the tree entry `data/dataset.json` by Git blob SHA-1; SHA-256 receipts cover all inputs.
`source_tree_sha` is a tree identity, not proof of a commit. The manifest explicitly
records `source_commit_verification=not_established_by_tree_input`.

Before vocabulary filtering, check signer identities and feature groups across all
rows, including quarantined annotations. Exclude an entire feature group if it shares
quarantined metadata, spans splits, has conflicting signer identities, includes a
signer appearing across splits, or has conflicting full sequences/frame boundaries.
Identical, compatible copies use the lexicographically first recording ID with every
other ID retained in `duplicate_aliases`. No original split is reassigned.

Each `segments[]` entry retains `recording_id`, `boundary_index`, exact `gloss`,
`source_start`, `source_end`, `signer_id`, `split`, `feature_git_blob`, and alias segment
IDs. `segment_id=recording_id:boundary_index` distinguishes repeated words in one
sentence. Frame index base and inclusive/exclusive end semantics remain unverified;
the tool never slices arrays or converts frames to milliseconds. `recordings[]` is
the feature retrieval/review inventory; listing a path does not mean it was downloaded.

`coverage[]` distinguishes segment count, unique full-recording feature blobs and
signers per split. Repeated words are not independent recordings. Exclusion and
deduplication group counts are source-wide, before candidate filtering. Every output
has `status=review_only`, `training_ready=false`, `semantic_review=pending`, and
`media_validation=pending`. Near-duplicate detection and actual signer provenance are
also unverified. Structural acceptance cannot close the training gate.

Publication uses the existing atomic/no-overwrite writer described below. Input
replacement and output inside source metadata/tree directories or `data/raw` are
refused; identical reruns are unchanged. A different result requires a new filename.
Recovery does not rewrite source data; the same temporary-file rules apply.

## External VSL qualification report (2026-10-11)

Offline CLI: `python -m app.desktop_collector.vsl_data_audit` with `multi-vsl` or
`vsl-gh` subcommand. Report schema: `smartglove-vsl-data-audit-v1`. This is an audit
report, not a normalized training dataset or a runtime recognition contract.

Common fields: `dataset`, `audit_scope=metadata_only`, `training_ready=false`,
`sources[]` with filename, exact bytes and SHA-256, `issues[]` and `unverified[]`.
No user identity, network request, media decode or model execution occurs in this CLI.
Ambiguous duplicate JSON fields and non-finite JSON literals fail before publication.

Multi-VSL inputs are the three local `*_1_1000_center_ord1.csv` files with exact
`name,label,video_lb_id` header. Report includes per-split rows, parsed unique rows,
class counts, signer IDs parsed from filenames, filename/signer/video-ID overlaps
and contradictory labels. Decimal signer/video IDs are normalized for comparison;
source files and exact label strings remain unchanged. Optional inventory JSON uses
`files[].title` for exact filename joins. Missing inventory produces `null`, not
zero available videos. A supplied listing is explicitly not evidence of completeness,
downloadability, correct semantics or usage rights. Duplicate titles are reported.

VSL-GH inputs are local `dataset.json` and a complete Git tree (`truncated=false`).
IDs, signer/split fields, nonempty sequences, ordered frame ranges and correspondence
to frame-boundary glosses are checked. Unsupported/inconsistent records appear in
`quarantined[]` with zero-based row index, original ID and reasons. No annotation is
silently repaired. `consistent_ids` and `gloss_coverage` describe structural validity
only, with nominal recordings, unique feature-blob counts and signer counts per split.
Git-blob duplication groups and cross-split feature overlap are reported separately.
The CLI does not prove frame counts, boundary timing or human semantic correctness.

Publication reuses the existing no-overwrite `write_manifest` mechanism: deterministic
UTF-8 JSON, identical reruns leave the file unchanged, different content requires a
new output name, same-directory temporary file plus atomic exclusive hard link.
Errors remove the temporary file; a crash can leave a `.kvsl-*.part` that is never a
completed report. `data/raw`, input-file replacement, symlink output and output within
the Multi-VSL split directory are rejected. No migration or in-place rewrite occurs.
Evidence and media stay under ignored `.design-cache/`; do not ship external datasets.

Qualification results and reproducible commands: [VSL data qualification](VSL_DATA_QUALIFICATION.md).

## Phase 0B — offline KVSL manifest (2026-10-10)

Implemented contract: `smartglove-kvsl-manifest-v1`, `importer_version=1`.
This is an external video metadata index, separate from sensor packets, the gesture
catalog and future capture storage. It does not alter the bridge or identity database.
Implementation/CLI: `app.desktop_collector.kvsl_manifest` (standard library plus Git).

From the repository root, using the existing full local clone:

```powershell
.\.venv\Scripts\python.exe -m app.desktop_collector.kvsl_manifest --repository .design-cache/kvsl-phase0a/upstream --output .design-cache/kvsl-phase0b/manifest.json
.\.venv\Scripts\python.exe -m pytest tests/test_kvsl_manifest.py tests/test_dependencies.py -q
```

The clone path is supplied explicitly; the importer has no dependency on Phase 0A
scripts or environment. CLI revisions are fixed to KVSL source
`e5165d79f373a12a4964e2c3d1bf59c911416667` and artifact
`4634b5d9f695f1118f99a6d09c9487f81bde0b3c`. Python callers can supply full commit
SHAs explicitly (also used by synthetic tests); outputs always record those revisions.
Git must already have both commits and their objects. No clone/fetch, URL access,
checkout, video extraction/decoding, model loading, training or app integration occurs.
Read immutable Git objects, not HEAD or working-tree files; disable replacement objects
and lazy fetching. SHA-256 refers to exact Git blob bytes, without CRLF normalization.

| Field | Meaning |
| --- | --- |
| `source` | Canonical upstream URL, both commit SHAs, CSV provenance. |
| Provenance object | `commit`, repository-relative POSIX `path`, `git_blob` (SHA-1), `sha256`, `bytes`. Git blob identity is independently checked. |
| `topics[]` | Topic ID/name, label-map provenance, complete topic-local class mapping. |
| `classes[].label_id` | `kvsl:<topic_id>:<class_index>`, scoped to the manifest's pinned vocabulary; not a global class number or sensor gesture ID. |
| `recordings[]` | One entry per exact CSV video filename, sorted deterministically. |
| `recording_id` | `kvsl:<filename without .mp4>`; original recording identity, not a row/augmentation identity. |
| `annotations[]` | One membership per recording/topic, carrying exact Unicode label and local index. |
| `source_rows[]` | All original CSV fields as strings plus 1-based data `record_number` (header excluded); repeated rows remain traceable. |
| `asset_status` | `verified_git_blob` or `missing_at_artifact_commit`. Missing assets retain commit/path with null hash/blob/size. |
| `modality`, `simulated` | `video`, `false`: externally sourced video, never synthesized sensor data. |
| Unknown metadata | `signer_id`, `session_id`, `split` are null; `training_overlap` and `license` are `unknown`. No automatic train/validation/test split. |
| `media_validation` | Always `not_performed`; hashing does not establish video decodability or sign correctness. |
| `limitations` | Code/data/model permissions unknown, original training manifest unavailable, independent evaluation not established. |
| `diagnostics` | Counts, duplicate annotation rows, missing recordings, identical-content groups, historical video paths and unreferenced paths. |

Deduplication uses original filename, then recording/topic membership. Topic membership
does not multiply recordings. Repeated metadata (including differing LEVEL/URL fields)
stays in `source_rows`; no arbitrary row wins. Contradictory labels for one recording,
conflicting topic names, invalid/missing maps, non-contiguous or repeated class indices,
duplicate CSV IDs, malformed CSV and unsafe filenames fail before output publication.
Identical bytes under different filenames are flagged for review, not silently merged.
Unreferenced historical videos are inventoried by path only and receive no guessed label.
Missing referenced videos are explicit diagnostics; missing Git objects fail the import.

Output is deterministic UTF-8 JSON (Unicode labels retained, no timestamp/local path).
An identical rerun returns `unchanged` without touching the file; a different existing
output is refused. Publication writes/fsyncs a same-directory temporary `.part`, then
creates a hard link atomically without replacement. A filesystem without hard-link
support fails closed. Normal errors remove the temporary file; a process crash before
publication can leave `.kvsl-*.part`, which is never treated as a manifest. After a crash,
rerun to the same destination; a valid identical output remains unchanged. Remove only
an identified orphan temporary file after checking that no importer is running.
There is no in-place migration/overwrite; future schema versions use a new destination.
CLI output inside the upstream repository and any resolved `data/raw` path is refused.
The importer does not write video/model binaries. Keep generated manifests local under
ignored output until dataset redistribution permissions are established.

Pinned-source verification: 187 CSV rows, 169 recordings, 175 recording/topic
annotations, 10 topics / 175 topic-local classes, 12 duplicate annotation rows,
0 missing referenced videos, 0 identical-content groups. Historical inventory: 309
video paths, 140 unreferenced. These are inventory counts, not accuracy or new samples.

## Milestone 1.1 local bridge contract

Milestone 1.1 does not persist samples. FastAPI serializes the existing in-memory `SensorPacket` into bounded columnar WebSocket blocks so the display can consume batches efficiently without changing the domain model.

Each telemetry block contains:

| Field | JSON type | Rule |
|---|---|---|
| `device_id` | string | One block belongs to one device; left/right timelines are never merged. |
| `sequence_numbers` | integer array | Preserves source sequence and gaps. |
| `device_timestamp_ms` | integer array | Device-local timeline. |
| `host_timestamp_ns` | string array | Decimal strings avoid JavaScript integer precision loss. |
| `status_flags` | integer array | One entry per packet. |
| `quality_flags` | integer array | Includes simulated flag. |
| `simulated` | boolean array | Must be true for every current packet. |
| `values` | object of arrays | Exactly 13 raw channel arrays; missing values remain JSON `null`. |

The 13 channel IDs are `flex_thumb_raw`, `flex_index_raw`, `flex_middle_raw`, `flex_ring_raw`, `flex_little_raw`, `fsr_raw`, `accel_x_raw`, `accel_y_raw`, `accel_z_raw`, `gyro_x_raw`, `gyro_y_raw`, `gyro_z_raw` and `distance_mm`.

The bridge schema is versioned separately as `bridge_schema_version=1.0`. It is a local display contract, not hardware protocol v1 and not an authorization to capture a dataset.

## Milestone 1 packet model

Milestone 1 giữ packet trong bộ nhớ; không tạo session hoặc CSV. `SensorPacket` là contract nội bộ chung cho simulator và transport thật ở milestone sau.

| Field | Type | Rule |
|---|---|---|
| `protocol_version` | string | Simulator dùng `sim-1`; protocol phần cứng chưa triển khai. |
| `device_id` | string | Không rỗng, ổn định theo nguồn. |
| `boot_id` | string | Phân biệt lần khởi động/khởi tạo nguồn. |
| `hand` | `left` / `right` | Không suy ra từ màu UI. |
| `sequence_number` | integer | Độc lập cho từng thiết bị, không âm. |
| `device_timestamp_ms` | integer | Clock riêng của thiết bị. |
| `host_timestamp_ns` | integer | Thời gian host nhận/tạo packet. |
| `flex_raw` | 5 integer/null | Thumb, index, middle, ring, little. |
| `fsr_raw` | integer/null | ADC raw. |
| `accel_raw` | 3 integer/null | X/Y/Z raw sensor count. |
| `gyro_raw` | 3 integer/null | X/Y/Z raw sensor count. |
| `distance_mm` | integer/null | Khoảng cách millimetre. |
| `status_flags` | integer | Trạng thái do thiết bị cung cấp trong tương lai. |
| `quality_flags` | bitmask | Cờ do collector bổ sung; simulator có `SIMULATED`. |
| `simulated` | boolean | Luôn `true` với nguồn Milestone 1. |

## Raw CSV dự kiến sau hardware gate

Mỗi dòng tương ứng đúng một packet của một thiết bị. Không ghép hai găng theo sequence, không forward-fill và không thay raw bằng giá trị vật lý.

```text
session_id
subject_id
gesture_id
gesture_display_name
session_hand
repetition_index
attempt_index
hand
device_reported_hand
device_id
boot_id
protocol_version
sequence_number
device_timestamp_ms
host_timestamp_ns
host_monotonic_ns
flex_thumb_raw
flex_index_raw
flex_middle_raw
flex_ring_raw
flex_little_raw
fsr_raw
accel_x_raw
accel_y_raw
accel_z_raw
gyro_x_raw
gyro_y_raw
gyro_z_raw
distance_mm
device_status_flags
quality_flags
simulated
calibration_id
```

Scale/range MPU6050 sẽ nằm trong hello và metadata. Giá trị `g` hoặc `degree/s`, nếu tạo, là field derived trong `data/processed/`.

## Gesture catalog

`configs/gestures.json` có `schema_version=1`. ID phải khớp `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`, không trùng và tách khỏi `display_name` Unicode. Milestone 1 chỉ validate catalog; chưa có Data Capture.

## Invariants

- Raw là nguồn gốc duy nhất và không được sửa sau khi hoàn tất session.
- Session thật và simulated không được trộn.
- Timestamp và sequence được theo dõi riêng theo thiết bị.
- Milestone 1 không ghi bất kỳ file sample nào dưới `data/`.
