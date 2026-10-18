## 2026-10-19 - User prioritizes useful webcam recognition results

User reports both incomplete/missing-hand messages and uncertain/outside-vocabulary
rejections across successive models; reference playback is acceptable. Priority
now shifts from further FPS tuning to diagnosing actual classification failures.
Delivered explicit Recognize now boundary within Auto, rearming after hands lower,
and visibly unconfirmed TCN/VideoMAE candidate rankings with actual model scores.
This removes automatic endpoint detection as a mandatory step for testing a sign
and exposes classifier behavior without changing acceptance thresholds or labels.
It is not proof of improved webcam accuracy or a model cutover. Next required
evidence is real known-word webcam output from multiple users; no such clips were
available in this session. Existing semantics/unknown/multi-user gates stay open.

## 2026-10-19 - Tracking optimization implemented; edge-on pose clarified

User clarified the failure pose: the edge of the hand faces the camera, rather
than simply extending the arm sideways. Implemented CPU-thread optimization,
experimental current-frame palm recovery for TCN Auto, fresh-video scheduling
and explicit camera quality choices (1080p default,720p,540p; each requests60fps).
Recovery changes TCN streaming preprocessing to `-stream-palm-recovery-v2`;
Capture, frozen weights/threshold and default model remain unchanged.

60fresh FPS remains an unmet target. Worker-only speed must not be presented as
end-to-end webcam throughput. Public retained RGB replays support regression and
performance checks, not unseen-user VSL accuracy. Physical edge-on detection,
false positives/identity at crossed hands, lower-resolution finger detail and
sustained camera throughput remain the next evaluation gate. Do not claim that
additional recovered landmarks reconstruct fingers hidden from the camera.

## 2026-10-19 - User prioritizes tracking speed and horizontal-hand robustness

User reports low Tracking FPS, lag behind fast hand movement, and frequent missing
hands when held horizontally despite a reported1080p/60fps camera. User requests
the next session pursue60fps tracking. This is the next engineering priority;
60fps is a requested target, not an achieved result or guaranteed capability.
TCN Auto is the working baseline from the preceding session; user has not explicitly
confirmed which provider or measured webcam capture settings reproduced the issue.

Keep speed and detection quality as separate requirements. Verify actual fresh
camera frames, fresh tracker outputs, frame age and per-hand detection/reacquisition.
Do not count interpolated/duplicated overlays as60fps tracking or silently trade
away hand coverage for a faster counter. Exact horizontal pose and environmental
conditions still need reproduction. Original-human-reference and semantic accuracy
gates remain open; they do not block investigating tracking performance.

## 2026-10-18 - TCN Auto and landmark references authorized

Latest user points out that word names alone cannot guide signing and asks to
integrate Auto. This supersedes the prior Capture-only restriction for experimental
testing. TCN now uses the existing RAM-only tracking/segmentation stream, final
predictions only; thresholds/default model remain unchanged. Added25 train-source
landmark replays as an explicitly limited visualization. No original GH RGB video
was obtained; replay does not certify sign semantics or teach correct VSL by itself.
Physical multi-user/unknown/idle testing and human references remain the next gate.

## 2026-10-18 - TCN25+OTHER webcam integration authorized

User request: "tích hợp để tôi test", followed by "tiếp tục phiên".
Approved scope is a selectable experimental Capture provider using the trained
TCN epoch44, frozen normalization and new25 source labels. Existing default model
and launcher remain unchanged. Auto for this provider is deferred until capture
and segment-boundary behavior have independent webcam evidence. This authorization
does not establish accuracy, a production cutover, or complete VSL translation.

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

Next: resolve the current-25 coverage gap (vocabulary preference was asked but
no answer yet) and source eligibility, then acquire/validate the selected data,
freeze signer/recording partitions before augmentation and train a comparable
baseline. Independent multi-user webcam, idle/unknown, temporal boundaries and
latency still gate model cutover. No claim of improved or optimal recognition.
Physical hardware, Qt, launcher and visual gates remain unchanged.

Detailed source links, counts, limitations, workflow and commands:
[VSL_MULTIUSER_DATASET_REVIEW.md](docs/VSL_MULTIUSER_DATASET_REVIEW.md).
Evidence: .design-cache/multiuser-data-20261018/.

## 2026-10-18 - Vocabulary growth is a product requirement, not a fixed25 endpoint

User clarifies that25signs are only the MVP and the product must continue to
expand. The accuracy problem is systemic, not a request to patch a few confused
words. Do not present a small personal-template recognizer or a five-word repair
as the long-term solution. Small error collections remain diagnostic evidence,
not acceptance of a restricted vocabulary or a chosen architecture.

The currently approved implementation/evaluation scope remains the existing25
signs. No new vocabulary, training architecture, multi-user acceptance target,
continuous-sentence feature or cutover is authorized by this clarification.
Model/generalization strategy and numerical acceptance criteria remain proposed
or TBD. Evaluate future expansion against both new and retained labels.

## 2026-10-16 - MVP scope: current 25 signs and reliable personal-camera recognition

User explicitly requires the current 25-word vocabulary as the first MVP, with
accurate results for their own camera. Both Auto and Capture currently fail in
the user's app; this is not accepted delivery. Prior integration approval does
not establish an accuracy, stability, or production acceptance gate.

Runtime repair bypasses a reproduced cuDNN Conv3d warmup OOM using native CUDA
FP32 with the same pinned weights. Real browser Capture and Auto tracking now
pass; one browser replay produces the correct completed wake-up sign. Another
replay did not produce a final segment within30s, so Auto reliability remains
open. Capture through all25 existing references:24 correct accepted, one bicycle
reference withheld, zero worker errors. This is source-overlapping regression
evidence, not independent accuracy. No threshold relaxation or retraining.

First repair and verify worker startup, upload, result delivery and recovery.
Then measure all 25 signs on independent physical-camera attempts, separating
correct accepted results, wrong accepted words, rejections, idle/unknown false
accepts and completion latency. No numerical acceptance threshold has been
approved. Existing reference-video replays overlap training source and cannot
establish the user's requested accuracy. No new local training is claimed.

## 2026-10-15 - Approved experimental VideoMAE GPU integration

The user's "approved", followed by "continue session", authorizes integrating the
audited pretrained RGB candidate for a personal-camera comparison. The app now
offers VideoMAE GPU alongside V25 and the ten KVSL topic models. V25 remains the
default. This supersedes the earlier "offline only/no app integration" snapshot.

VideoMAE uses the pinned publisher revision 9759fc78b5d69625317bb658b4104040f9427fa3
and full sequential checkpoint, with strict loading in an isolated CUDA worker.
The original 100-class outputs are checked before projecting to the existing
25-word vocabulary; subset softmax values are not renormalized. Heuristic
abstention withholds uncertain/incomplete outputs. This is not calibrated
unknown-sign rejection and does not establish correctness of accepted words.
Capture retains a warm worker; Auto reserves model execution and reaps idle
Capture workers to avoid simultaneous model allocation.

No local retraining occurred in this integration. Publisher notebook records
5 head-only epochs followed by 20 full fine-tuning epochs. The older local V25
baseline is Ridge regression fitted by a linear solve, not an epoch-based network.
The presence of source labels alone does not establish live-camera accuracy.

Real app-worker replay of the existing wake-up reference returns Thức dậy in
Capture. Warm processing 1418.61ms includes 1121.72ms preprocessing and 235.47ms
model inference; first requests varied from 11.33s to 70.49s. Auto replay emits
correct tentative words but the extended hold finishes rejected at native
top-one 0.7536, below the final heuristic threshold 0.80. Boundary/abstention
behavior and physical-camera accuracy therefore remain open gates.

297 affected backend tests, 73 frontend tests, four distinct browser cases,
production build, shell smoke and launcher smoke pass. Browser evidence uses
synthetic media/mocked predictions; source replay is not independent evaluation.
No webcam capture, source-dataset rewrite, launcher switch, production ML
dependency addition, hardware gate closure or unrelated feature work.

## 2026-10-15 - RTX 2050 VideoMAE execution verified separately

User requested a real GPU check and reports that Thức dậy jumps between words and
ends with a wrong Completed sign. The app still runs V25; this is not a VideoMAE
camera failure. Current streaming code reports provisional top-ranked words and has
no unknown rejection. The user's specific boundary/classification failure is unproven.

Isolated VideoMAE FP32 CUDA replay succeeded on RTX 2050 with torch 2.6.0+cu124:
39/39 source-label matches, including all nine local validation Thức dậy clips;
31/31 top-one predictions agree with the previous CPU probe. Warm model-only
p50/p95: 276.32/289.41ms. Source/training overlap prevents an independent accuracy
claim. Prefixes at 25/50/75/100 percent match Thức dậy for 1/8/9/9 of nine clips;
GPU speed alone cannot solve premature recognition or guarantee final correctness.

User also authorized safe C-drive cleanup after a paging-file error. Removed about
1.59GiB of disposable caches/temp files; observed free space initially rose by
1.58GiB. Windows then automatically expanded pagefile from 4960 to 6559MiB, leaving
C nearly full again. No manual pagefile/driver setting or installed app was changed.
Windows Update cache was inspected only: services active, no elevated admin token.

CUDA dependencies remain in ignored audit storage; original worker torch stays
2.5.1+cpu. No app model/RGB integration, camera capture, training, launcher or
production dependency change. Next is an explicit experimental RGB integration and
physical user/camera evaluation, including boundaries and unknown/idle behavior.
Existing 25-word scope and all physical/semantic/latency acceptance gates remain.

## 2026-10-15 - Existing-label pretrained route investigated

User prefers avoiding a large self-recorded dataset and asks to verify pretrained VSL
compatibility before selecting that route. Existing source labels are usable for this
authorized research; no requirement to relabel the whole collection is introduced.
Completed an isolated audit of VideoMAE VSL and four alternatives. VideoMAE has public
weights, a verified 100-entry label map and coverage of the 25 target labels through
18 exact names plus seven explicit encoding aliases pending semantic review.

Recommendation: VideoMAE as the next experimental candidate, not an accepted app
replacement. Strict weight loading and 31 source-clip replays pass, but this source
overlaps the publisher's training collection and cannot establish webcam accuracy.
CPU-only model p50 is about 1.30s; RTX 2050 GPU execution remains untested. Keep the
25-word target and subsecond requirement. No app/runtime/model cutover, training,
physical capture or milestone change occurred. See docs/VSL_DATA_QUALIFICATION.md.

## 2026-10-15 - Personal camera recognition accuracy is the next priority

User prioritizes correct recognition for themselves with their current camera before
generalization to new signers. They report tracking works reasonably well and give
Chào being recognized as Ăn as an example. User confirms Completed sign remains Ăn
or another wrong word after movement ends and about one second of stillness.
These are qualitative observations, not
measured accuracy, tracking-rate acceptance or closure of the pending physical gates.

First diagnostic priority is distinguishing premature/incorrect Auto boundaries from
full-gesture classification errors. Personalized data collection and model adaptation
remain proposed; this preference does not itself select an implementation, authorize
automatic webcam recording, or approve a replacement model. Retain the existing
25-word experimental scope, during-motion feedback requirement and subsecond target.

## 2026-10-15 - Camera throughput optimization authorized

User configured an S22+ through Camo at1080p60 and explicitly requested camera60FPS
and the highest practical tracking throughput while preserving accuracy. Their app
screenshot reported camera30, tracking6.4, frame RTT175ms and processing58ms; these
are a user observation, not a controlled benchmark or physical accuracy evaluation.
Approved scope is camera negotiation and the existing experimental recognition
pipeline. Preserve One UI composition, source pixels, pinned model/graph and bounds.
No retraining, new dependency, dataset mutation, launcher cutover or gate closure.
Requested/negotiated camera rate must remain distinct from measured tracking rate.

## 2026-10-14 - Camera tracking diagnostics

User requested visible MediaPipe tracking and FPS/latency on the app camera.
ViSign Auto reuses its existing isolated Holistic output for a mirrored pose/hand
overlay and per-hand presence, with measured camera FPS, tracking FPS, frame RTT
and processing time. Preview-only/manual/KVSL modes do not start another detector.
No runtime dependency, model, raw-data, launcher or approval-gate change.
Frame RTT is local processing round trip, not network ping or physical sign latency.

## 2026-10-14 - Reference viewing in experimental Live Camera

User explicitly requested reference video display inside the app and resumed this
work. Live Camera's V25 selection now includes a local example for each supported
sign, default Chào, native playback/replay and0.5x speed. Viewing can accompany an
explicitly started webcam; choosing a reference never changes inference inputs,
model scores or target labels. No autoplay or automatic camera permission request.
References retain unreviewed source semantics and are examples, not certified
instruction. No production-quality, physical accuracy or realtime gate is closed.

Derived browser-compatible VP8 previews live in ignored experiment storage and are
served by ID through the existing authenticated loopback bridge; original data and
model pins remain unchanged. No runtime transcoding, new dependency, cloud service,
launcher cutover, sensor/Pi/history or Qt cleanup work. See DATA_SCHEMA for the media
contract and ASSET_INVENTORY for source provenance and recovery requirements.

## 2026-10-13 - During-motion ViSign Auto correction

User tested "xin chao" with V25 and requires both useful recognition of moving signs
and word updates while performing them. The pinned vocabulary calls this label Chào.
This refines the authorized experimental camera/realtime work; it does not establish
physical accuracy, semantic approval, or production acceptance.

Audit confirmed the old Auto uploads only after a completed recording, starts recording
after 200ms sustained activity without pre-roll, and imposes a 2s minimum plus 600ms
quiet end detection. Fast motion may be lost before recording. V25 uses ordered
temporal landmarks; it is not a final-image-only classifier.

Experimental V25 Auto now uses a bounded authenticated local frame stream into the
existing isolated ML environment. It retains onset features, processes hand motion
continuously and displays explicitly tentative words during movement. The pinned
model/encoder and manual/KVSL clip paths remain available. Continuous tracking, sparse
camera frames and partial gestures have their own preprocessing identity, not an
assertion of feature parity with training clips. No model retraining or new dependency.

Saved validation-feature diagnostics show incomplete Chào prefixes can produce stable
wrong words; score margin/stability is not correctness or unknown rejection. Streaming
addresses capture/timing, but dynamic accuracy still needs independent physical-camera
evaluation. The under-1000ms gesture-end-to-display requirement remains unverified.
See docs/RECOGNITION_CONTRACT.md for transport, lifecycle and acceptance distinctions.
No sentence/history, sensor/Pi, Qt cleanup, launcher cutover or release gate is opened.

## 2026-10-12 - Experimental camera integration explicitly authorized

User approved adding the 25-sign research model to the app for testing and requested
a model selection panel. This supersedes older restrictions on experimental app
integration below; it does not approve production replacement or semantic quality.
Live Camera offers the separately pinned ViSign ridge baseline and existing KVSL topic
models. ViSign requires no user topic selection, uses raw signed scores and the exact
training encoder, and retains unreviewed-label/unknown-sign limitations. KVSL remains
available. No launcher cutover, dataset mutation or new runtime dependency is needed.
Physical new-person accuracy and under-one-second end-to-display remain open gates.

## 2026-10-12 - Confirmed research exception to manual review prerequisite

User approved the proposed approach: train an isolated experimental model using source
labels and automatic screening, then prioritize manual review. Full semantic review is
no longer a prerequisite for offline research training. It is not waived as evidence
of production quality; source labels remain unverified and existing curation artifacts
keep their original flags. Model replacement in the app is not authorized by this step.
Research splits must retain related groups and explicitly repair validation gaps before
training, with prior test membership preserved and all changes recorded.

Executed first offline baseline:25labels/593screened clips,360train/116val/117test.
Selected ridge alpha10 using validation; test81.20% accuracy against source labels,
macro-F1 0.6954. Model and complete receipts remain in ignored experiment storage;
no production model registration. Scores are uncalibrated and do not reject unknown
signs. Review priority now uses validation errors plus sampled matches(51clips).
Independent real-person accuracy and physical-end-to-display latency remain unverified.

## 2026-10-12 - Conservative data screening; semantic reviewer unavailable

User asked to continue and confirmed no VSL-competent reviewer is currently available.
Automatic group-level curation now quarantines 231 clips and retains 593 as technically
screened, pending semantic review. Prior partition assignments are preserved: 366 train,
110 validation, 117 test. Chúng ta and Uống have no remaining validation examples;
the proposal is not frozen. Local per-word video pages and pending annotation CSV are
prepared for review. No semantic correctness, source independence or training approval
is inferred. See docs/VISIGN_IMMEDIATE_DATASET.md and the curation schema.

## 2026-10-12 - Full RGB pilot feature qualification

Authorized data work now includes reusable offline extraction and recording-group
review tooling. ViSign pilot: 824 clips /24,653 frames, 19,236 frames with at least one
detected hand; eight no-hand clips and 143 below 50% hand coverage. Three conservative
visual pairs are grouped. Preliminary 510/153/153 train/val/test plus eight quarantine
is a diagnostic proposal, not a frozen or signer-independent split. Actual source
frames expose flat-color/black frames and strong color casts; visual/semantic quality
still requires review before training. No production model or realtime claim changes.
The 75-landmark mask contract is documented in DATA_SCHEMA; no KVSL compatibility
assumption. See [feature qualification](docs/VISIGN_IMMEDIATE_DATASET.md).

## 2026-10-12 - Immediate-access requirement; public RGB dataset now local

User requires Vietnamese sign data usable immediately and rejects waiting10 business
days as the main route. VSL400 is optional, not a prerequisite. Downloaded the public
ViSignLanguage-Video archive, verified its published SHA-256 and decoded all8,364 video
entries. It provides3,875 labeled entries /100 classes,2,776 distinct training sequences;
prepared824 nonconflicting distinct videos for a proposed25-word pilot. Source rights
provenance, semantics and independent signer evaluation remain unverified; source
folders overlap and cannot be treated as independent test partitions. No model trained.
See [immediate dataset report](docs/VISIGN_IMMEDIATE_DATASET.md). This new RGB option
supersedes the assumption that original inspectable video must wait for VSL400 access.

## 2026-10-12 - Public VSL candidate preparation; source review still required

Continued the authorized data step after the user's resume request. Offline candidate
index now preserves 3279 annotated segments / 2037 feature records for 25 proposed
glosses, after excluding conflicting full annotations and collapsing exact copies.
No frame slicing, training, app/model replacement or accuracy claim. Public VSL-GH
features are available; original RGB semantics and sufficient evaluation coverage
remain unresolved. User asked about available datasets; no applicant identity was
provided. VSL400 request remains prepared but unsigned/unsent, as an additional route.
See [data qualification](docs/VSL_DATA_QUALIFICATION.md) and the candidate schema.

## 2026-10-11 - Data qualification tooling delivered; training gate open

User emphasized the importance of the data step and chose source quality ahead of
regional preference. Keep regional variants and unresolved synonyms distinct.
Offline VSL data-audit CLI now detects metadata conflicts, split leakage and exact
feature duplication; reports never imply training readiness. Multi-VSL public listing
does not provide any center-view class across all three splits. VSL-GH offers a
2100-row structurally consistent subset, but requires RGB/semantic validation.
Thirty feature samples and three video samples were technically checked. Candidate
25-word coverage and access-request preparation are documented; vocabulary is not
final and no model, runtime or launcher was replaced. Next external dependency is
qualified source media/access, including publisher-required agreement for VSL400.
See [data qualification](docs/VSL_DATA_QUALIFICATION.md). No messages were sent.

## 2026-10-11 - Realtime implementation authorized; data qualification underway

User explicitly asked to implement the 20-30-sign, topic-free, subsecond camera
recognition direction, then authorized supplementary dataset research and a project
scan. This supersedes the earlier requirements-only authorization statement below.
It does not establish model quality, approve unverified labels, or close physical gates.
A local streaming extraction prototype now has measured reference replay evidence;
production runtime and model pins remain unchanged. Full-resolution features match
on two reference clips; 15 Hz / 20-second replay is feasible in this limited probe.
The project scan found no separate usable labeled dataset beyond KVSL references.
See [feasibility and data audit](docs/REALTIME_RECOGNITION_FEASIBILITY.md) for measured
latencies, scan limits, external dataset qualifications and remaining data gates.

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

## 2026-10-10 - Phase 3A: persistent recognition worker delivered

The current attached request explicitly authorized Phase 3A only, superseding the
older proposed gate below. Result: PASS WITH FIXES. Studio/API/job orchestration now
uses one lazy isolated persistent worker, serial predictions, and lazy verified
provider caching. Collector .venv remains free of ML packages. The ten providers,
vocabularies, manifest, FeatureSequence/PredictionResult/ModelDescriptor and historical
preprocessing ID are unchanged. Persistent JSONL uses worker-v2 for its new lifecycle;
the old single-use worker-v1 remains available for internal compatibility checks.

MediaPipe Holistic is constructed once and its graph run is reset between clips.
W00395 input tensor, masks, timestamps and top-three scores match the old path exactly.
Windows venv launchers spawn the actual interpreter: a suspended launch assigned to
a kill-on-close Job Object now owns the whole tree before execution. Cancellation,
timeout or stream corruption terminates/reaps it; later requests start fresh without
silently retrying the failed prediction. Server/CLI owners explicitly close the worker.

Measured local totals (ms): old W00395 10438.971 / D0098 8953.338; persistent cold
W00395 8857.992; warm W00395 5309.367, D0098 4997.572; return W00395 5254.486.
Warm reductions: 49.1% / 44.2%; video preprocessing remains about five seconds.
This is bounded regression evidence, not real-time performance or model accuracy.
Working set: ~324 MiB ready, ~539 MiB after first prediction, ~544 MiB after three
providers. Three measured models contain ~0.69–0.71 MiB parameters each. Retain lazy
loading, bounded by the ten-entry registry; no all-model preload or generic eviction.

Fresh final affected backend suite: 168 passed; browser regression: 8 passed, then
the real two-topic test rerun after protocol hardening: 1 passed. Real cancellation
47ms and running+queued shutdown 187ms; actual interpreter and launcher exits checked,
executor stopped, port reusable. Headless shell smoke exit 0. Frontend source/tests
and production build unchanged. Full details: docs/RECOGNITION_CONTRACT.md and
docs/WORK_SESSION_HANDOFF.md; ignored evidence: .design-cache/kvsl-phase3a/.

Next scope requires a user decision; no hardware/sensor work, UX/video preview,
evaluation, Raspberry Pi deployment, packaging or existing visual/cutover gate is
automatically approved. Previous dated sections are historical.

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

## 2026-10-10 - Phase 2 desktop recognition vertical slice delivered

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

## 2026-10-10 - Phase 1 offline recognition boundary delivered

The current attached request explicitly authorized Phase 1 only, superseding the
same-day next-scope gate below. Implemented framework-neutral frozen contracts,
manifest video adapter, offline service/CLI and one single-use isolated JSON worker.
Only `kvsl-gcn-do-vat` is registered. Phase 0B semantics remain unchanged; recognition
sample `kvsl:do_vat:W00395` means recording `kvsl:W00395` plus its topic membership.

The existing Phase 0A checkpoint, source and preprocessing pins are retained; source,
model and selected video hashes are checked. Normal orchestration imports no ML;
collector .venv still lacks torch, mediapipe and torch_geometric. The worker uses the
existing isolated extraction-env and performs no downloads/installations. Contract,
configuration and commands: `docs/RECOGNITION_CONTRACT.md`.

Result PASS: fresh affected suite 89 passed; three real service samples and a real
CLI invocation exited successfully. W00395 reproduced the exact historical top-3
scores. These are regression checks, not held-out accuracy. No UI/API/bridge,
acquisition, sensor, hardware, launcher, dependency or manifest changes. Phase 2
Desktop Recognition Vertical Slice is proposed only and requires new authorization.
All unrelated approval gates and previously recorded model/data limitations remain.

## 2026-10-10 - Phase 0B manifest importer delivered (supersedes proposal below)

The new Astra-session request explicitly authorized Phase 0B only. Implemented an
offline, framework-neutral KVSL manifest importer in
`app/desktop_collector/kvsl_manifest.py`, exposed as a Python module CLI. It reads
immutable objects from the existing local full Git clone at the Phase 0A pins;
it does not fetch, decode videos, run models or integrate a new desktop workflow.

Contract: `smartglove-kvsl-manifest-v1`, documented in `docs/DATA_SCHEMA.md`.
One entry per original video filename; each topic membership retains its topic-local
class index and all contributing CSV rows. CSV/maps/video references record exact
commit, Git blob, SHA-256 and byte length. Unknown signer/session/split/license and
training overlap remain explicit. No sensor catalog migration or synthesized sensors.
Deterministic output is atomically published without overwriting existing files.

Verified inventory: 187 CSV rows, 169 recordings, 175 recording/topic memberships,
10 topics / 175 topic-local classes, 12 repeated annotation rows, 0 missing references.
140 of 309 historical videos are unreferenced and remain unlabeled. Counts are not
evaluation evidence. Phase 0A was not repeated; its limitations and all unrelated
UI, hardware, acquisition, Qt cleanup, cutover and release gates remain unchanged.
Further recognition/app integration requires a separate approved scope.

## 2026-10-10 - Confirmed KVSL primary; Phase 0A feasibility complete

The user confirmed ONE PRIMARY REPO = KVSL (LeNguyenAnhKhoa/KVSL) and authorized
isolated Phase 0A only. Result: PASS WITH FIXES for real isolated-video inference
with the historical do_vat GCN checkpoint (20 classes). LSTM is not verified:
no LSTM artifact was found in the four upstream commits; its 40/60 mismatch remains.
Source is pinned to e5165d79f373a12a4964e2c3d1bf59c911416667; artifacts were recovered
from 4634b5d9f695f1118f99a6d09c9487f81bde0b3c. Drive links returned 404.

Confirmed inference contract: 60 frames, 65 landmarks (pose 0..22, left 21, right 21),
XYZ, raw MediaPipe coordinates, missing groups zero, linspace integer frame selection,
float32 model tensor (65,180). Exact upstream extraction/backend parity passed.
Twenty unique original clips completed with child exit 0; 20 annotation matches are
a smoke result, NOT independent accuracy. Training overlap/signer split are unknown.
Full evidence/contract/environment live in ignored .design-cache/kvsl-phase0a/.
See REPORT.md there and current handoff for provenance and limitations.

Proposed integration boundary: video adapter -> versioned preprocessor -> model
provider -> prediction result; no upstream server architecture is adopted.
Phase 0B manifest importer is proposed, not implemented or approved by this result.
Desktop environment/runtime, UI, acquisition and hardware remain unchanged.
Existing visual, Qt cleanup/cutover, hardware and capture gates remain unchanged.

## Current decision - 2026-10-04 Account and Quick Status

The user finds the desktop visual direction largely complete and explicitly authorized
Quick Status motion refinement plus real Account customization. Keep all accepted scale,
circular glyphs and composition. Retain the four roles; clarify existing permissions,
without individual permission switches. Self-service fields: display name, avatar, full
name, contact email and organization/team. Email is contact-only. This bounded identity
extension permits the necessary API/schema changes; earlier visual-only restrictions do
not block it. No Studio backend, hardware, acquisition, cutover or release scope is opened.

Implemented with schema-2 migration/recovery and backend authorization; contract is in
docs/AUTH_PERSISTENCE.md. Quick Status/shared interaction pages use one reversible
400/320ms compositor transform. Durations are a desktop adaptation, not recording timings.

Figma whoami and live One UI file access succeeded on October 4 after reauthentication.
Cover-only SmartGlove remains excluded. The exact draft font is One UI Sans APP VF;
Welcome node 4:47 links to a public Google Drive file titled Variable One UI Sans.ttf.
No redistribution/application-embedding permission was found. Font search is delivered,
but Samsung-font integration is pending a permitted source; no proprietary font was
downloaded into runtime or substituted under a misleading family name. Details/evidence
and remaining review gate are in WORK_SESSION_HANDOFF.

## Current decision - 2026-09-28 interaction refinement and consistent icons

The user explicitly accepted the preceding desktop composition as the
baseline. Preserve 32px titles, 14px body, 40px actions, 44px underline fields and
48px Search. The new refinement is implemented and awaiting its own visual review;
older pending language for the preceding desktop pass is historical.

Latest user feedback supersedes the proposed decorative hand/folder/test-tube art:
Search and Studio use consistent exact Figma line glyphs in circular surfaces. No
hand beside the page title and no mixed 3D illustration/category icon treatment.
Reused SVG geometry is unchanged; accents remain restrained and non-semantic.

Desktop tabs alone move aside before crossing the menu target; workspace content
stays fixed. Notification opens in 400ms and closes in 320ms, with one reversible
geometry/text timeline and persistent clipping. Opening navigation collapses it to
an inert, still-visible capsule beneath the scrim; closing navigation does not reopen
it. Raw Signals allows 8px feedback clearance. Textual Left/Right identity replaces
letter badges throughout; chart colors and solid/dashed lines are preserved.

Figma whoami and live One UI wzEFGRLl9MU1nB1JxUSyhD access were reverified. The
cover-only StIo1CdCci8HQXMmdhXZG8 remains excluded. Real source owns functionality;
recordings own behavior; Figma owns component anatomy. 400/320ms is an approved
desktop adaptation, not a measured recording claim. No backend/schema/API, product
capability, launcher, dependency, hardware or cutover change is authorized by this pass.
Recovery, actual checks, limitations and next visual gate: docs/WORK_SESSION_HANDOFF.md.

## Current decision ? 2026-09-27 comprehensive One UI system pass

The user's approved implementation plan extends the earlier overlay refinement across
shared foundations and all 18 sections. Overview pages may be expressive; Monitor,
forms and data workspaces keep desktop density. Retain 32px titles, 14px body, 40px
buttons, 44px underline fields and 48px Search; navigation overlays desktop content and
uses the bottom dock in narrow windows. Source owns functionality, live One UI Figma
owns components/assets, recordings own behavior, official guidance owns principles.

Notification geometry now has one interruptible controller and an independent clipped
portal. Search owns focus at its rounded container. Shared surfaces/feedback, form states,
page spacing, Devices hierarchy, chart legends, Account and Search compositions are
standardized. Notification history is separated from active attention items without
changing real telemetry or role visibility. No backend, schema, product capability,
launcher, dependency or hardware scope was opened.

Status: IMPLEMENTED / USER VISUAL ACCEPTANCE PENDING. Native Windows 125% was checked;
100% and 150% remain unverified. Current evidence/backup are in WORK_SESSION_HANDOFF;
component provenance and explicit source gaps are in ASSET_INVENTORY. Earlier dated
entries remain historical, not approval of this pass.

## Current decision — 2026-09-27 overlay navigation and visual coherence

The user explicitly requires desktop navigation to overlay the workspace, following
the supplied galaxy-note.mp4. This supersedes the previous push-aside rail and its
stay-open behavior. At >=1100 CSS px, the menu opens a 280px expanded One UI drawer
over stationary content; selecting a destination, Escape or outside click closes it.
At narrower widths the same four destinations remain in the floating bottom dock.
The approved desktop scale remains: 32px titles, 14px body, 40px actions, 44px underline
fields and 48px Search. Existing functionality and information architecture are retained.

The current pass improves shared navigation motion, semantic icons, focus and feedback,
then composes existing Card primitives for Simulator and source Statistics. It does not
activate the deferred Studio backend. Live One UI whoami and meaningful file access
were verified before editing; cover-only StIo1CdCci8HQXMmdhXZG8 remains intentionally
excluded. Figma owns visual anatomy; real recordings own motion; real application
source owns functionality. Exact exported/reused assets replace the disputed icons.

Status: IMPLEMENTED / AWAITING USER VISUAL REVIEW. This records the new authorized
refinement, not acceptance of its appearance. Phase E/M2, hardware, backend and launcher
cutover gates remain closed. Current evidence and recovery: docs/WORK_SESSION_HANDOFF.md.

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

## Current generic UI conformance policy - 2026-09-26

The strict-normalization request `7a589557-ebf6-43bd-a7f2-96300c633dfd` replaces the
previous selective-conformance policy for generic UI. Live One UI
`wzEFGRLl9MU1nB1JxUSyhD` is the default visual standard, with small, explicitly
justified accessibility, desktop usability, product semantics and missing-equivalent
exceptions. Implementation is delivered; user visual acceptance is not assumed.
Real source remains authoritative for functionality; recordings remain authoritative
for motion. Cover-only `StIo1CdCci8HQXMmdhXZG8` is deliberately excluded.
See the current handoff for evidence. Historical entries below remain historical.

# PROJECT CONTEXT — Găng tay nhận diện cử chỉ/ký hiệu

> Tệp này là nguồn ngữ cảnh kỹ thuật chính cho Codex khi làm việc với dự án.
> Đọc toàn bộ tệp trước khi sửa mã nguồn, sơ đồ điện, báo cáo hoặc giao diện.
> Không biến nội dung ghi **Đề xuất** hoặc **TBD** thành quyết định đã chốt nếu chưa được người dùng xác nhận.

- Chủ dự án: Nguyễn Hoàng Phước
- Ngôn ngữ làm việc mặc định: Tiếng Việt
- Cập nhật lần cuối: 2026-09-26
- Trạng thái: Đang thiết kế và dựng nguyên mẫu

### Current frontend authority — 2026-09-26

The user's full-overhaul brief `0759753e-b28a-4171-8499-7413f4b6721d/pasted-text-1.txt`
and subsequent source correction supersede the historical visual freeze/Stage 1-only
scope below. The completed overhaul is now the accepted baseline for the explicitly requested
second-pass Design Kit refinement (`4cffd1dd-36bc-4978-84d0-f7909b9635a1`).
That refinement is delivered; its new visual result has not yet been accepted by the user. Phase E/M2, hardware, backend, launcher cutover and Qt cleanup remain closed.

- Current application source is authoritative for functionality, state, screens and IA.
- One UI Figma `wzEFGRLl9MU1nB1JxUSyhD` is the required visual source. `whoami` succeeded
  as Fish (Full/student), and live pages, components, styles and exact exports were
  meaningfully inspected before source edits. Login alone was not used as access proof.
- `StIo1CdCci8HQXMmdhXZG8` is confirmed cover-only. It is intentionally excluded as a
  SmartGlove UI source and is not a blocking requirement or authentication failure.
- The three original Samsung MP4s are primary behavioral evidence; official Samsung
  guidance supplies principles. Static frames do not override observed motion.
- No newer working SmartGlove draft was identified in the current project context.

Studio drafts and Monitor view state now survive domain navigation in application
memory. They clear on sign-out/user change; no new persistence or data contract was
introduced. Detailed delivery, backup, source mapping, verification and remaining
limits are in `docs/WORK_SESSION_HANDOFF.md` (2026-09-26 entry).

### Historical frontend boundary — 2026-09-10

User attachment `5ae3ecc9-4114-4410-8da0-e1a9a9d85507` approves/freezes the existing
visual baseline and authorizes Studio/Search UI only. React now exposes six Studio
sections and a global frontend Search index through existing shell/overlay primitives.
`studioModel.ts` defines presentation types for independent sensor/MediaPipe provenance,
combined-input references and configuration drafts; these are not an approved storage,
wire, ML model or backend API contract. Drafts remain in component memory. Camera,
dataset processing, training, evaluation and inference remain unimplemented. No hardware,
protocol, acquisition, launcher or Python architecture decision changes. Verification
and current gate: `docs/WORK_SESSION_HANDOFF.md`; older phase snapshots are historical.

---

## 1. Tóm tắt dự án

Dự án xây dựng một hệ thống gồm **hai găng tay cảm biến**, mỗi găng sử dụng một ESP32 để thu nhận trạng thái bàn tay. Dữ liệu từ hai găng được truyền không dây đến Raspberry Pi 5 để đồng bộ, tiền xử lý và nhận diện cử chỉ/ký hiệu. Kết quả cuối cùng dự kiến được hiển thị trên giao diện web hoặc ứng dụng trình diễn.

Mục tiêu giai đoạn đầu là chứng minh toàn bộ pipeline hoạt động ổn định với khoảng **20–30 ký hiệu/cử chỉ định trước**. Đây là phạm vi MVP để kiểm chứng phần cứng, truyền dữ liệu, đồng bộ hai tay, thu thập dữ liệu và mô hình học máy; không phải giới hạn cuối cùng của hệ thống.

### 1.1 Phạm vi đã chốt

- Nhận diện một tập cử chỉ/ký hiệu đã định nghĩa trước.
- Thu thập dữ liệu đồng thời từ hai bàn tay.
- Mỗi găng có ESP32 và bộ cảm biến riêng.
- Raspberry Pi 5 là bộ xử lý trung tâm.
- Giao tiếp chính giữa hai ESP32 và Raspberry Pi 5 là BLE.
- MVP ban đầu gồm khoảng 20–30 lớp cử chỉ/ký hiệu.

### 1.2 Ngoài phạm vi MVP

- Chưa tuyên bố đây là hệ thống dịch ngôn ngữ ký hiệu hoàn chỉnh.
- Chưa xử lý đầy đủ mọi thông tin phi thủ công như nét mặt, khẩu hình, hướng nhìn và tư thế toàn thân.
- Chưa đặt mục tiêu nhận diện toàn bộ từ vựng hoặc câu liên tục trong giai đoạn đầu.
- Không được tự công bố độ chính xác khi chưa có dữ liệu thực nghiệm.

### 1.3 Cách mô tả dự án

Ưu tiên các cụm từ:

- “Hệ thống găng tay nhận diện cử chỉ/ký hiệu”.
- “Gesture recognition system”.
- “MVP nhận diện 20–30 cử chỉ/ký hiệu”.

Không dùng cụm “dịch ngôn ngữ ký hiệu hoàn chỉnh” nếu hệ thống chưa tích hợp đầy đủ thông tin phi thủ công và chưa được đánh giá trên ngôn ngữ ký hiệu thực tế.

---

## 2. Kiến trúc tổng thể

```text
Găng trái                         Găng phải
┌─────────────────────┐          ┌─────────────────────┐
│ 5 × Flex            │          │ 5 × Flex            │
│ 1 × FSR             │          │ 1 × FSR             │
│ 1 × MPU6050         │          │ 1 × MPU6050         │
│ 1 × VL53L0X         │          │ 1 × VL53L0X         │
│ ESP32 + Battery     │          │ ESP32 + Battery     │
│ Shield V3 + 18650   │          │ Shield V3 + 18650   │
└──────────┬──────────┘          └──────────┬──────────┘
           │ BLE                            │ BLE
           └──────────────┬─────────────────┘
                          ▼
                 ┌──────────────────┐
                 │ Raspberry Pi 5   │
                 │ BLE collector    │
                 │ Đồng bộ hai tay  │
                 │ Tiền xử lý       │
                 │ Suy luận mô hình │
                 │ API / Web UI     │
                 └──────────────────┘
```

Hai găng **không nối điện trực tiếp với nhau**. Mỗi găng có nguồn và mass riêng; dữ liệu được ghép tại Raspberry Pi 5.

---

## 3. Phần cứng mỗi găng

### 3.1 Danh sách linh kiện đã chốt

| Linh kiện | Số lượng mỗi găng | Vai trò |
|---|---:|---|
| ESP32 | 1 | Đọc cảm biến, đóng gói và truyền dữ liệu BLE |
| Flex sensor | 5 | Đo độ gập của năm ngón tay |
| FSR | 1 | Phát hiện tiếp xúc/lực nhấn tại vị trí được chọn |
| MPU6050 | 1 | Gia tốc và vận tốc góc của bàn tay |
| VL53L0X | 1 | Đo khoảng cách/proximity theo hướng đặt cảm biến |
| Pin 18650 Li-ion 1S | 1 | Cấp năng lượng cho một găng |
| Battery Shield V3 | 1 | Giữ pin, sạc pin và cung cấp các đầu ra nguồn ghi nhãn 5 V/3 V |

Tổng cho hai găng: 2 ESP32, 10 flex, 2 FSR, 2 MPU6050, 2 VL53L0X, 2 pin 18650 và 2 Battery Shield V3. Hai hệ nguồn hoạt động độc lập.

### 3.2 Linh kiện chưa chốt

| Linh kiện/phương án | Trạng thái |
|---|---|
| ADS1115 | Đang đánh giá, chưa mặc định đưa vào BOM |
| Loại ESP32 cụ thể | TBD: cần ghi rõ model/dev board |
| Mã flex sensor cụ thể | TBD: cần xác định chiều dài và điện trở thẳng |
| Vị trí chính xác của FSR | TBD |
| Dòng điện khả dụng thực tế của Battery Shield V3 | TBD: cần đo khi có tải |
| Mức điện áp thực tế của đầu ra ghi nhãn 3 V | TBD: không mặc định là 3,3 V |
| Khả năng vừa sạc vừa vận hành (power-path) | TBD: phải xác minh theo đúng phiên bản shield |
| Các chức năng bảo vệ pin tích hợp | TBD: cần xác minh tài liệu hoặc linh kiện trên mạch |

### 3.3 Lưu ý về ADS1115

- Battery Shield V3 chỉ xử lý **nguồn/sạc**, không tạo thêm kênh ADC và không thay thế ADS1115.
- Một ADS1115 chỉ có bốn đầu vào analog đơn, trong khi mỗi găng có sáu tín hiệu analog nếu đọc 5 flex + 1 FSR.
- Không được mặc định rằng một ADS1115 đủ cho toàn bộ một găng.
- Các phương án cần đánh giá:
  1. Đọc toàn bộ sáu kênh bằng ADC1 của ESP32 nếu board có đủ chân phù hợp.
  2. Dùng ADS1115 cho bốn kênh và ESP32 ADC1 cho hai kênh còn lại.
  3. Dùng thêm ADC/multiplexer nếu cần độ chính xác và số kênh cao hơn.
- Nếu sử dụng Wi‑Fi trong tương lai, ưu tiên ADC1 và tránh phụ thuộc ADC2. Với BLE, ADC1 vẫn là lựa chọn an toàn và nhất quán hơn.

---

## 4. Thiết kế nguồn

### 4.1 Kiến trúc nguồn hiện tại

```text
Pin 18650 Li-ion 1S
→ Battery Shield V3
→ đầu ra 5 V của shield
→ chân 5V/VBUS của board ESP32 (phải xác minh đúng pin theo board thực tế)
→ bộ ổn áp 3,3 V trên board ESP32
→ ADS1115 và các cảm biến dùng logic/ADC 3,3 V
```

- Người dùng đã thay phương án module sạc + ổn áp rời bằng **Battery Shield V3 có các đầu ra ghi nhãn 5 V và 3 V**.
- Phương án đấu dự kiến là dùng đầu ra 5 V của shield cấp vào chân 5V/VBUS của board ESP32, sau đó lấy 3V3 đã ổn áp trên ESP32 cấp cho ADS1115 và cảm biến. Phải xác minh model/pinout board ESP32 trước khi đấu.
- Không cấp flex, FSR hoặc đầu vào ADC bằng 5 V.
- Không mặc định đầu ra ghi nhãn 3 V của shield là 3,3 V chuẩn và không nối nó trực tiếp vào chân 3V3 của ESP32 khi chưa đo điện áp có tải, độ gợn và khả năng cấp dòng.
- Không nối đồng thời cả đầu ra 5 V và 3 V của Battery Shield vào các chân nguồn ESP32.
- Tất cả linh kiện trong cùng một găng phải dùng chung GND.
- Phải xác nhận từng breakout MPU6050/VL53L0X/ADC có tương thích nguồn và mức logic 3,3 V.
- Battery Shield V3 không thay thế ADS1115; quyết định dùng ADS1115 phụ thuộc số kênh ADC, pin map và chất lượng tín hiệu.

### 4.2 Trạng thái kiểm tra Battery Shield V3

- Battery Shield V3 đã được chọn về mặt phần cứng nhưng **chưa được xác nhận hoạt động điện đúng**.
- Lần đo gần nhất: đầu ra ghi nhãn 5 V khoảng **1,12 V**, đầu ra ghi nhãn 3 V khoảng **1,19 V**, gần như không đổi khi bật/tắt.
- Không được cấp Battery Shield này vào ESP32 cho đến khi xác định nguyên nhân và đo lại đúng điện áp.
- Khi kiểm tra: que đen vào COM và GND, que đỏ vào VΩ và lần lượt đo chân 5 V/3 V ở chế độ điện áp DC; đồng thời kiểm tra cực tính, điện áp cell, tiếp xúc khay pin, trạng thái sạc và công tắc.
- Sau khi điện áp không tải đúng, phải đo lại khi có tải phù hợp để phát hiện sụt áp; chưa được coi nhãn điện áp/dòng của shield là kết quả thực nghiệm.

### 4.3 Pin 18650 1S

Thiết kế hiện tại dùng một cell 18650 Li-ion tiêu chuẩn cho mỗi Battery Shield V3:

- Điện áp danh định khoảng 3,6–3,7 V.
- Điện áp khi sạc đầy là 4,2 V.
- Có mạch bảo vệ đúng chuẩn 1S.
- Không nối trực tiếp pin đầy 4,2 V vào chân 3V3 của ESP32.

- 18650 nặng và cồng kềnh hơn LiPo dạng túi; Battery Shield và cell nên đặt ở cổ tay/cẳng tay, không đặt trên các khớp ngón.
- Phải xác minh Battery Shield tương thích cell đầu bằng/phẳng hay đầu lồi và đúng cực tính trước khi lắp.

### 4.4 Quy tắc an toàn pin

- Không dùng cell không rõ nguồn gốc hoặc dung lượng quảng cáo phi thực tế.
- Không hàn trực tiếp lên hai cực 18650; dùng cell có tab hàn điểm hoặc khay/đầu nối phù hợp.
- Không để cell, mạch sạc hoặc dây nguồn tại vị trí thường xuyên bị gập, va đập hoặc đè ép.
- Không mặc định Battery Shield V3 hỗ trợ vừa sạc vừa vận hành nếu chưa xác minh power-path.
- Khi lập sơ đồ phải ghi rõ cực pin, GND, đầu ra 5 V và đầu ra 3 V của shield.
- Thêm bảo vệ cơ khí, chống chập và strain relief cho dây nguồn.

---

## 5. Mạch flex sensor

### 5.1 Cấu hình cầu phân áp

Mỗi flex cần một điện trở cố định riêng:

```text
3,3 V
  │
Flex sensor
  │
  ├────────→ ADC
  │
Điện trở cố định
  │
 GND
```

Với cách đấu trên, điện áp ADC giảm khi điện trở flex tăng do ngón tay uốn:

```text
Vadc = 3,3 × Rfixed / (Rflex + Rfixed)
```

### 5.2 Giá trị điện trở khởi đầu

| Loại flex | Điện trở thẳng điển hình | Điện trở cố định đề xuất |
|---|---:|---:|
| Flex ngắn khoảng 55 mm | Khoảng 25 kΩ | **47 kΩ, sai số 1%, 1/4 W** |
| Flex dài khoảng 95 mm | Khoảng 10 kΩ | **22 kΩ, sai số 1%, 1/4 W** |

Đối với găng tay, loại ngắn 55 mm thường hợp với ngón tay hơn. Nếu đúng loại này, BOM ban đầu dùng **10 điện trở 47 kΩ cho 10 flex của hai găng**.

Không chốt giá trị chỉ dựa vào hình dạng. Trước khi hàn hàng loạt:

1. Đo từng flex khi duỗi: `Rflat`.
2. Đo khi uốn trong giới hạn sử dụng thực tế: `Rbent`.
3. Giá trị khởi đầu tối ưu gần đúng:

```text
Rfixed ≈ sqrt(Rflat × Rbent)
```

4. Chọn giá trị điện trở tiêu chuẩn gần nhất.
5. Hiệu chuẩn riêng từng ngón trong phần mềm vì flex có sai số và độ trôi giữa các mẫu.

### 5.3 Lọc tín hiệu analog

- Có thể đặt tụ gốm 100 nF từ nút ADC xuống GND để giảm nhiễu ban đầu.
- Giá trị tụ/RC cuối cùng **chưa chốt**; phải kiểm tra với tốc độ lấy mẫu, trở kháng nguồn và ADC thực tế.
- Không lắp tụ lớn tùy ý vì có thể làm phản hồi chậm và che mất chuyển động nhanh.
- Nếu ADS1115 được dùng, cần kiểm tra sai số do trở kháng nguồn và thời gian ổn định của đầu vào.
- Lọc số tại phần mềm vẫn cần thiết; lọc phần cứng không thay thế hiệu chuẩn và lọc số.

---

## 6. Mạch FSR

FSR cũng là cảm biến điện trở và phải được đọc qua cầu phân áp. Tuy nhiên, giá trị điện trở cố định của FSR chưa được chốt vì phụ thuộc:

- Model FSR cụ thể.
- Vị trí lắp.
- Khoảng lực cần phân biệt.
- Mục tiêu chỉ phát hiện chạm hay ước lượng nhiều mức lực.

Không tự dùng giá trị của flex cho FSR. Quy trình đúng là đo điện trở FSR ở trạng thái không nhấn, chạm nhẹ và nhấn mạnh, sau đó chọn điện trở cầu phân áp để tạo dải điện áp hữu ích nhưng không bão hòa ADC.

---

## 7. Cảm biến số và bus I2C

Các địa chỉ mặc định thường gặp, cần xác minh trên module thực tế:

| Thiết bị | Địa chỉ I2C thường gặp |
|---|---:|
| MPU6050 | `0x68` hoặc `0x69` tùy chân AD0 |
| VL53L0X | `0x29` |
| ADS1115 nếu dùng | `0x48`–`0x4B` tùy ADDR |

MPU6050 và VL53L0X có địa chỉ khác nhau nên có thể dùng chung SDA/SCL. Cần kiểm tra điện trở pull-up I2C đã có trên các breakout hay chưa; không chồng quá nhiều pull-up làm tổng trở quá thấp.

Trục cảm biến MPU6050 phải được định nghĩa thống nhất giữa hai găng. Trong code và tài liệu phải ghi rõ:

- Trục X/Y/Z theo hướng nào trên bàn tay.
- Găng trái có cần đảo dấu hoặc biến đổi hệ trục hay không.
- Vị trí và góc đặt module trên mu bàn tay.

VL53L0X phải được cố định hướng quan sát. Khoảng cách đo chỉ có ý nghĩa khi hướng và vùng phản xạ được kiểm soát; không được mô tả nó như cảm biến xác định tuyệt đối vị trí tay trong không gian.

---

## 8. Bố trí cơ khí trên găng

- Flex chạy dọc theo mặt lưng mỗi ngón, không gập nếp hoặc bẻ tại chân tiếp xúc.
- Tạo strain relief tại mối nối flex và dây dẫn.
- ESP32 và các module nên đặt trên mu bàn tay hoặc cổ tay, tránh cản trở khớp.
- MPU6050 phải được cố định chắc để hệ trục không thay đổi giữa các lần đeo.
- VL53L0X đặt ở vị trí không bị tay áo hoặc dây che vùng quan sát.
- FSR đặt tại đầu ngón/lòng bàn tay tùy ký hiệu mục tiêu; vị trí cuối cùng là TBD.
- Pin và mạch nguồn ưu tiên đặt ở cổ tay/cẳng tay, có hộp bảo vệ và dây đai.
- Dây phải đủ mềm, có đầu nối tháo được và không chịu lực trực tiếp tại chân module.

---

## 9. Dữ liệu và giao tiếp BLE

### 9.1 Nguyên tắc đã chốt

- Mỗi ESP32 truyền dữ liệu của một găng độc lập.
- BLE có đủ băng thông cho lượng dữ liệu cảm biến dự kiến.
- Raspberry Pi 5 chịu trách nhiệm nhận và ghép hai luồng dữ liệu.
- Không ghép hai găng chỉ dựa trên sequence number vì hai ESP32 có bộ đếm và thời điểm khởi động riêng.

### 9.2 Gói dữ liệu đề xuất

Đây là schema dự thảo, chưa phải giao thức cuối:

```json
{
  "protocol_version": 1,
  "device_id": "glove-left-01",
  "hand": "left",
  "seq": 12345,
  "timestamp_ms": 4567890,
  "flex": [0, 0, 0, 0, 0],
  "fsr": 0,
  "accel_mps2": [0.0, 0.0, 0.0],
  "gyro_dps": [0.0, 0.0, 0.0],
  "distance_mm": 0,
  "battery_mv": 0,
  "flags": 0
}
```

Trong triển khai thực tế nên ưu tiên packet nhị phân cố định thay JSON để giảm overhead. JSON chỉ dùng để mô tả schema và debug.

### 9.3 Đồng bộ hai tay

Rủi ro kỹ thuật lớn nhất là hai ESP32 không có đồng hồ chung. Pipeline trên Pi nên:

1. Giữ `seq` riêng cho từng găng để phát hiện mất packet.
2. Gắn timestamp đơn điệu tại mỗi ESP32.
3. Ghi thời điểm nhận packet tại Pi.
4. Ước lượng offset/độ trôi đồng hồ theo phiên.
5. Ghép mẫu trái–phải theo timestamp gần nhất trong một ngưỡng cho phép.
6. Đánh dấu dữ liệu stale/missing thay vì âm thầm dùng lại mẫu cũ.

Tốc độ lấy mẫu cuối cùng là TBD. Điểm khởi đầu có thể thử 50 Hz cho flex/FSR/IMU và tốc độ thấp hơn cho VL53L0X, sau đó đo tải BLE và độ trễ thực tế.

---

## 10. Pipeline học máy

### 10.1 Luồng xử lý dự kiến

```text
Cảm biến thô
→ hiệu chuẩn từng găng/từng người
→ đồng bộ hai tay
→ lọc và chuẩn hóa
→ chia cửa sổ thời gian
→ trích đặc trưng hoặc tensor chuỗi
→ mô hình phân loại
→ ngưỡng tin cậy / lớp unknown
→ kết quả hiển thị
```

### 10.2 Thu thập dữ liệu

Mỗi mẫu cần lưu tối thiểu:

- Nhãn cử chỉ/ký hiệu.
- ID người thực hiện đã ẩn danh.
- ID phiên thu.
- Tay trái và tay phải.
- Timestamp và sequence number.
- Dữ liệu cảm biến thô.
- Thông số hiệu chuẩn.
- Phiên bản firmware và protocol.
- Ghi chú lỗi/mất packet nếu có.

Không chỉ lưu dữ liệu đã chuẩn hóa; luôn giữ dữ liệu thô để có thể tái xử lý.

### 10.3 Đánh giá mô hình

- Tách train/validation/test theo người hoặc theo phiên để tránh rò rỉ dữ liệu.
- Báo cáo confusion matrix và các cặp ký hiệu dễ nhầm.
- Không chỉ báo cáo accuracy tổng.
- Có lớp “unknown/no gesture” hoặc cơ chế từ chối khi độ tin cậy thấp.
- Mở rộng từ 20–30 lớp dựa trên dữ liệu và confusion matrix, không mở rộng chỉ vì phần cứng còn tài nguyên.
- Không ghi số liệu độ chính xác, độ trễ hoặc thời lượng pin khi chưa đo thực tế.

### 10.4 Mô hình

Kiến trúc mô hình chưa chốt. Có thể đánh giá theo thứ tự từ đơn giản đến phức tạp:

1. Baseline trên đặc trưng thống kê: Random Forest/SVM.
2. MLP trên vector đặc trưng.
3. 1D CNN, LSTM/GRU hoặc mô hình chuỗi nhỏ cho cử chỉ động.
4. Triển khai tối ưu trên Raspberry Pi 5 bằng framework phù hợp sau khi chốt mô hình.

---

## 11. Raspberry Pi 5 và môi trường điều khiển

### 11.1 Vai trò

- Kết nối BLE với hai ESP32.
- Nhận và ghi log dữ liệu.
- Đồng bộ hai tay.
- Chạy pipeline tiền xử lý và suy luận.
- Cung cấp API/giao diện trình diễn.

### 11.2 Trạng thái thiết lập hiện tại

- Raspberry Pi OS 64-bit đã được ghi vào microSD bằng Raspberry Pi Imager.
- Đã cấu hình headless, tài khoản người dùng, Wi‑Fi, SSH và Raspberry Pi Connect trong Imager.
- Người dùng không có màn hình HDMI rời tại thời điểm thiết lập.
- Cổng HDMI trên laptop là ngõ ra, không thể nhận trực tiếp hình ảnh từ Pi.
- Muốn xem HDMI trên laptop phải có USB HDMI capture card; phương án ưu tiên vẫn là headless.
- Lần kiểm tra gần nhất, hotspot điện thoại chỉ thấy laptop, chưa thấy Pi; kết nối Wi‑Fi/SSH của Pi chưa được xác nhận thành công.

### 11.3 Cấu hình mạng khuyến nghị cho lần thử tiếp theo

```text
SSID: Pi5Hotspot
Password: đặt mật khẩu tối thiểu 8 ký tự
Band: 2,4 GHz
Country: VN
Hostname: raspberrypi
SSH: enabled, password authentication
Raspberry Pi Connect: enabled
```

Laptop và Pi kết nối cùng hotspot; SSH không bắt buộc dây Ethernet:

```powershell
ssh <username>@raspberrypi.local
```

Nếu mDNS không hoạt động, dùng IP hiển thị trong danh sách thiết bị của hotspot.

### 11.4 Active Cooler

- Active Cooler chính hãng điều khiển quạt theo nhiệt độ; dưới khoảng 50°C quạt có thể đứng yên.
- Quạt thường được kiểm tra rất ngắn lúc boot, có thể khó quan sát.
- Nếu quạt không quay khi nhiệt độ vượt ngưỡng, tắt nguồn và kiểm tra giắc 4 dây tại cổng FAN.
- Không cắm/rút quạt khi Pi đang có điện.
- Khi SSH được, kiểm tra nhiệt độ bằng:

```bash
vcgencmd measure_temp
```

---

## 12. Giao diện phần mềm

Giao diện web trình diễn hiện gồm hai bản web/PWA độc lập:

- `app/frontend/desktop/`: bản tablet/desktop.
- `app/frontend/mobile/`: bản mobile-only.

Hai bản giữ giao diện và deployment riêng; không hợp nhất thành một UI responsive duy nhất. Khi bổ sung kết nối thật, chỉ cân nhắc chia sẻ logic không phụ thuộc presentation như BLE, API hoặc storage sau khi có kiểm thử cho cả hai bản.

Giao diện cuối nên có tối thiểu:

- Trạng thái kết nối găng trái/phải.
- Mức pin từng găng.
- Dữ liệu cảm biến trực tiếp hoặc biểu đồ debug.
- Ký hiệu đang nhận diện và độ tin cậy.
- Cảnh báo mất đồng bộ/mất packet/cảm biến lỗi.
- Chế độ thu thập dữ liệu và gắn nhãn.
- Lịch sử nhận diện ngắn.

Không để UI che giấu tình trạng thiếu dữ liệu. Nếu một găng mất kết nối, phải hiển thị rõ thay vì tiếp tục suy luận như bình thường.

---

## 13. Cấu trúc repository đề xuất

```text
project-root/
├── PROJECT_CONTEXT.md
├── README.md
├── docs/
│   ├── hardware/
│   ├── protocols/
│   └── experiments/
├── firmware/
│   └── glove/
│       ├── include/
│       ├── src/
│       └── config/
├── pi/
│   ├── collector/
│   ├── synchronization/
│   ├── preprocessing/
│   ├── inference/
│   └── api/
├── app/
│   ├── frontend/
│   │   ├── desktop/
│   │   └── mobile/
│   ├── backend/
│   └── database/
├── data/
│   ├── raw/
│   ├── interim/
│   └── processed/
├── models/
├── scripts/
├── tests/
└── config/
```

Nên dùng chung một firmware cho hai găng và khác nhau bằng cấu hình `hand=left/right`, thay vì duy trì hai codebase gần giống nhau.

---

## 14. Quy tắc dành cho Codex

Khi làm việc với dự án này, Codex phải:

1. Trả lời bằng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác.
2. Đọc tệp này trước khi đề xuất thay đổi kiến trúc.
3. Phân biệt rõ nội dung **đã chốt**, **đề xuất** và **TBD**.
4. Không tự thêm linh kiện vào BOM chính thức.
5. Không tự đổi nguồn 3,3 V, giao thức BLE hoặc vai trò Raspberry Pi 5 nếu chưa giải thích tác động.
6. Không bịa số liệu đo, độ chính xác, thời lượng pin, băng thông hoặc kết quả thử nghiệm.
7. Khi thay đổi packet BLE, cập nhật `protocol_version` và tài liệu schema.
8. Khi thay đổi pin map, cập nhật một nguồn cấu hình duy nhất; không rải số GPIO trực tiếp trong nhiều file.
9. Ghi rõ đơn vị cho mọi đại lượng: V, mA, Ω, mm, Hz, ms, °C.
10. Giữ dữ liệu thô bất biến; pipeline xử lý tạo dữ liệu mới ở thư mục khác.
11. Thêm log đủ để chẩn đoán mất kết nối, mất packet, timestamp lệch và cảm biến lỗi.
12. Ưu tiên thay đổi nhỏ, kiểm thử được; không viết lại toàn bộ hệ thống nếu không cần.
13. Không đưa thông tin Wi‑Fi, mật khẩu, token hoặc khóa bí mật vào repository.
14. Với mạch pin lithium, luôn kiểm tra bảo vệ, cực tính, điện áp tối đa và giới hạn dòng trước khi đề xuất đấu nối.
15. Sau mỗi quyết định mới được người dùng xác nhận, cập nhật mục “Decision log”.

---

## 15. Decision log

| Ngày | Quyết định | Trạng thái |
|---|---|---|
| 2026-08 | MVP ban đầu giới hạn khoảng 20–30 cử chỉ/ký hiệu | Đã chốt |
| 2026-08 | Mỗi găng dùng một ESP32 | Đã chốt |
| 2026-08 | Mỗi găng có 5 flex + 1 FSR + MPU6050 + VL53L0X | Đã chốt |
| 2026-08 | Raspberry Pi 5 làm bộ xử lý trung tâm | Đã chốt |
| 2026-08 | Hai găng truyền dữ liệu bằng BLE | Đã chốt |
| 2026-08 | Phương án buck-boost 3,3 V rời | Đã bị thay thế bởi Battery Shield V3 |
| 2026-08 | Flex ngắn 55 mm dùng điện trở khởi đầu 47 kΩ | Đề xuất, phải xác minh bằng đo thực tế |
| 2026-08 | 18650 1S có thể thay LiPo 1S về mặt điện | Đã kế thừa bởi quyết định dùng Battery Shield V3 + 18650 |
| 2026-08 | ADS1115 | Chưa chốt |
| 2026-08 | Giá trị điện trở FSR | Chưa chốt |
| 2026-08 | Tốc độ lấy mẫu, pin map, model ML và packet nhị phân | Chưa chốt |
| 2026-08-22 | Thay module sạc + ổn áp rời bằng Battery Shield V3 và pin 18650 1S cho mỗi găng | Đã chốt về phần cứng; điện áp đầu ra chưa xác nhận |
| 2026-08-22 | Battery Shield V3 không thay thế chức năng ADC/ADS1115 | Đã xác nhận |
| 2026-08-28 | Giữ hai web/PWA desktop và mobile độc lập dưới `app/frontend/`; không hợp nhất thành một UI responsive duy nhất | Đã chốt |
| 2026-08-28 | Loại bỏ mã thiết kế tham chiếu `app/resource/` và demo responsive vì không còn bổ trợ cho hướng UI đã chốt | Đã chốt |

---

## 16. Rủi ro chính

| Rủi ro | Hậu quả | Hướng xử lý |
|---|---|---|
| Hai ESP32 không đồng bộ thời gian | Ghép sai trạng thái hai tay | Timestamp, offset, ghép theo cửa sổ thời gian |
| Sai số flex giữa các mẫu/người đeo | Giảm độ chính xác | Hiệu chuẩn từng ngón và từng phiên |
| ADC nhiễu hoặc không đủ kênh | Dữ liệu dao động/mất kênh | Đo thực tế, lọc, chốt ADC/pin map |
| VL53L0X phụ thuộc hướng và vật phản xạ | Khoảng cách không ổn định | Cố định cơ khí, giới hạn vai trò, kiểm tra confidence |
| Thiếu thông tin phi thủ công | Nhầm ký hiệu có hình tay giống nhau | Giới hạn tuyên bố, cân nhắc camera/marker sau MVP |
| Pin/mạch nguồn nặng hoặc không an toàn | Khó đeo, rủi ro nhiệt/chập | Bảo vệ 1S, enclosure, đặt pin ở cổ tay/cẳng tay |
| Battery Shield V3 ra sai điện áp hoặc sụt áp khi tải | ESP32 reset, cảm biến sai hoặc hư hỏng | Chưa đấu vào ESP32; đo lại không tải và có tải trước khi sử dụng |
| Mất BLE packet | Chuỗi dữ liệu thiếu | Sequence number, flags, log và chính sách missing data |
| Rò rỉ dữ liệu giữa train/test | Kết quả đánh giá ảo | Tách theo người/phiên |

---

## 17. Việc cần làm tiếp theo

1. Xác định chính xác model ESP32 và model/chiều dài flex đã mua.
2. Đo `Rflat` và `Rbent` của toàn bộ flex; chốt điện trở cố định.
3. Xác định model FSR, vị trí lắp và dải lực; chốt cầu phân áp FSR.
4. Chốt phương án ADC và pin map đủ cho sáu kênh analog mỗi găng.
5. Dựng prototype một găng trên breadboard/perfboard trước khi làm cả hai.
6. Chẩn đoán Battery Shield V3 đang chỉ đo được khoảng 1,1–1,2 V; xác nhận đầu ra 5 V/3 V không tải và có tải trước khi nối ESP32.
7. Đo dòng trung bình và dòng đỉnh của một găng để xác nhận Battery Shield V3 đáp ứng được tải.
8. Hoàn tất kết nối headless Raspberry Pi 5 qua Wi‑Fi/SSH.
9. Định nghĩa packet BLE nhị phân phiên bản 1.
10. Viết chương trình ghi dữ liệu thô có timestamp và metadata.
11. Thu dữ liệu thử nghiệm nhỏ để kiểm tra độ ổn định trước khi thu dataset chính thức.
12. Xây baseline đơn giản và confusion matrix.
13. Sau khi pipeline ổn định, tích hợp web UI trình diễn.

---

## 18. Những thông tin Codex phải hỏi khi thiếu

Trước khi tạo sơ đồ chân hoặc code firmware hoàn chỉnh, cần có:

- Tên chính xác board ESP32.
- Ảnh hoặc mã sản phẩm flex/FSR.
- Phương án ADC cuối cùng.
- Phiên bản/pinout chính xác của Battery Shield V3 và thông số đầu ra đã đo thực tế.
- Pin map đã chọn.
- Tốc độ lấy mẫu mong muốn.
- Framework firmware: Arduino core hay ESP-IDF.
- Framework inference trên Pi: chưa chốt.
- Danh sách chính thức 20–30 ký hiệu/cử chỉ.

Nếu thiếu các thông tin này, Codex được phép đưa ra phương án có ghi rõ giả định, nhưng không được gọi đó là cấu hình cuối cùng.
