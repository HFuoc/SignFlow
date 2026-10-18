## 2026-10-19 - Authorized reproducible CPU bundle and README demo

Published-source preparation adds configs/recognition-assets with56 selected
existing frozen CPU models/reference files (11,032,535bytes), hash/path manifest
and attribution README. GH MIT source notice is retained. ViSign previews carry
publisher CC-BY4.0 attribution and source limitations. No raw dataset archive.
Setup installs compatibility copies into existing ignored worker paths; bundled
files are not imported into the Vite app. docs/demo/reference-tracking.webm is
an actual1440x900 app viewport recording (13.28s), explicitly requested by user.
The source Chao is incorrectly classified Toi; no correctness claim is made.
See docs/demo/README.md. Not pushed yet; clean setup remains unverified.

## 2026-10-18 - GH landmark replay assets

Active ignored directory:`.design-cache/gh-landmark-references-20261018-v2/`.
25WebM clips,731source frames,5,878,353media bytes; every clip was decoded and
frame count/resolution verified. Manifest SHA256:
2288fd61f6656abc5338a37d9e9db2161589724d043845b84412e51408e5fd05.
Each item records training signer/segment/boundaries, source Git blob and segment
SHA256, rendered SHA256/bytes and30fps. SOURCE_LICENSE.txt preserves publisher MIT.
Source:https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation.
Generator:`app/desktop_collector/vsl_gh_reference_media.py`; source data unchanged.
Selection is train-only tracking coverage/duration, without prediction filtering.
Rendering uses original XY positions plus separately centered hand details; no
invented human video, no AI-generated app screenshot. Label on every frame says
LANDMARK REPLAY - NOT ORIGINAL VIDEO; source labels/timing remain unverified.
Draft v1 remains ignored and unregistered. No raw frames are added to data/raw.
The existing ReferenceVideo/One UI controls are reused, with provider-specific
catalog routing, slow playback and warning copy. No new visual assets/dependencies.

## 2026-10-18 - Optional TCN camera artifacts

The user-approved Capture adapter now consumes two existing ignored artifacts:
`.design-cache/multiuser-data-20261018/gh25/background-run1/tcn.pt`
(SHA2569e782ad74e8d56b3d7c158dfecdc440fe38abff403a4a3b5e94667d1c2afe12e)
and `normalization.npz`
(SHA256e942bd2c80dbcd0ebc22424cdbfff436957cc8e281fb0db61e1a343591c3d25b).
Missing/modified artifacts make this provider unavailable; no automatic download.
The UI reuses existing One UI SelectField/Button/Card primitives (indexed anchors
1497:12222 and245:399); no new icons, fonts or Figma-reference modifications.
Old ViSign reference videos are hidden for this different vocabulary. GH source
RGB examples remain unavailable; there is no claimed reference-video equivalence.

## 2026-10-18 - VSL-GH public landmarks and offline research models

Source: https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation
Publisher README explicitly licenses project AND dataset MIT; sourceLICENSE is
retained in .design-cache/realtime-feasibility-20261011/vsl-gh/LICENSE and copied
with provenance into the new download area. Tree6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a
is a tree identity, not independently established commit metadata. Every1,342NPY
download verifies its Git blob, byte length and SHA256;255,297,560bytes total.
No RGB source video was available for these landmarks. Anatomical/temporal source
inspection does not certify human provenance or VSL label correctness.

Ignored root:.design-cache/multiuser-data-20261018/gh25/. download-receipts.json,
sample-plan.json, candidate-manifest.json, source-audit/ and prepared/audit.json
preserve provenance. run1/ holds25class research ridge/TCN; background-run1/ holds
25+OTHER. Both have SHA256-linked results and separate CPU replay receipts.
None is a production asset, app default, public release or source-media redistribution.
No camera data, secrets, Figma/reference assets, font or app visuals changed.

## 2026-10-18 - Public multi-user research data, outside runtime assets

Local ignored root: .design-cache/multiuser-data-20261018/. Kaggle source versions,
public request URLs and SHA256 values are retained in metadata fetch receipts;
raw/cropped/augmented metadata remains separate. ZIP indexes are Range-read metadata
only, not proof that every listed video has downloaded or decoded. VSL400-derived
mirror media/tensors were not acquired for fitting; conflicting source rights remain.

VSL-word ngamcphuong/vsl-word version1:50 sampled RGB AVI files,20,482,266 bytes,
2,258 decoded frames. rgb-sample-manifest.json records every path/label/hash;
rgb-probe.json links predictions to inputs and the existing pinned checkpoint.
rgb-contact.jpg is derived from decoded public frames, not an app screenshot or
generated visual. One earlier single-video availability probe is separately retained
as vslword-sample.avi; it duplicates the later 1.An/100 sample and is not counted twice.
No source media, keys, user camera data or new visual assets enter the app bundle.
Dataset source semantics, signer independence and redistribution remain unverified.

See [the dataset review](VSL_MULTIUSER_DATASET_REVIEW.md) for source links and scope.

## 2026-10-15 - VideoMAE experimental model selection

Reuses the existing OneUISelectField, card, status message, PredictionView and
reference-video panel. Card245:399 and Buttons1497:12222 remain the existing
foundation; no icon, vector, font, CSS system or Figma catalog changes.
No exact new Figma geometry claim. Both models share the existing 25 local
reference previews and their pinned original provenance; no media duplication.

Actual React app renders are in
`.design-cache/videomae-integration-20261015/browser/`, at 1280x720,
1440x900 and 768x1024 in both themes. Synthetic camera and mocked model replies
verify selection, rejected-word withholding, completed-word display and return
to V25; screenshots are not model-accuracy evidence. Scoped WCAG A/AA automated
checks report zero violations.

## 2026-10-14 - Live tracking overlay

No added image/icon/font assets. SVG skeleton is live data visualization; edges
come from pinned MediaPipe Holistic connections, with existing75-point packing.
Camera diagnostics reuse the approved card/typography foundation (Card245:399,
Buttons1497:12222 unchanged). Local catalog inspected; no live Figma tool available.
No exact Figma geometry claimed. Review uses actual app renders under
`.design-cache/camera-tracking-20261014/browser/` and identifies synthetic fixtures.

## 2026-10-14 - Local reference videos in Live Camera

V25 now exposes25 local source examples through authenticated media fetches, outside
the frontend bundle. Originals remain under `.design-cache/vsl-immediate-20261012/`;
derived VP8/WebM previews and provenance manifest are under
`.design-cache/visign-references-20261014-v2/`. Preserve both alongside the experiment.
The manifest records source/video/curation hashes, archive paths, group/split status,
native geometry/frame count/fps and conversion settings. The pinned curation and
effective research split select the smallest source SHA per label from screened
training clips, independent of model scores;25 training sources/750 frames total.
Manifest SHA256: `42de9f617d90f513d2bb2784ac5ba2ff0c810e4ec3028714bbdcc7782386db48`;
25 previews total4,096,616bytes. The earlier unserved preview directory remains as
audit evidence after correcting two stale proposed-split assignments.
Source labels and source
rights provenance retain their existing unverified status; local viewing does not
establish semantic approval or authorize publishing the dataset.

Preparation: use the existing isolated CV Python to run
`-m app.desktop_collector.vsl_reference_media --workspace D:\Smart-Gloves` into the
new default directory (fails if already present). Optional `--output` must stay in
ignored cache storage. No new dependency or conversion in the app runtime. VP8 is
lossy; frame order, full frame count, geometry and source speed are preserved; no
mirror/resize/audio. Playback0.5x changes only the player. Missing/damaged files are
shown as unavailable. Restore the exact pinned preview set/manifest from a trusted
local backup; a fresh encoding can differ in bytes and requires deliberate manifest
review/repinning in `recognition/references.py`, never silent acceptance.

UI reuses OneUICard, OneUISelectField, OneUIButton and state-message primitives.
Local component/variable/system/icon/internal indexes were inspected. Live context
and screenshot for Drop Down Menu1497:11901 (file wzEFGRLl9MU1nB1JxUSyhD) reviewed
using figma-design-to-code; existing desktop fields remain the adaptation. Card245:399
and Buttons1497:12222 remain existing anchors. Native video transport is product
behavior, not a new Figma icon/component approximation. No new fonts/icons/copied
Figma assets or reference-catalog changes. Actual review evidence belongs in
`.design-cache/reference-viewer-20261013/browser/`.

## 2026-10-13 - Streaming recognition result states

Reuses the existing LiveCamera OneUICard, Auto segmented control, PredictionView,
status text and result typography/CSS. Local component/variable/system/icon/internal
catalogs inspected; live Figma context/screenshot retrieved for Card245:399 in
file wzEFGRLl9MU1nB1JxUSyhD. This is a behavior/status-text adaptation, not new card
geometry. No new icons, fonts, vectors, copied assets or reference-catalog edits.
Review renders of the actual app belong in `.design-cache/visign-stream-20261013/browser/`;
mocked predictions are UI/lifecycle evidence, not model or physical webcam evidence.

## 2026-10-12 - Experimental camera model panel

Reuses existing OneUICard, OneUISelectField, button/status primitives and app tokens.
Discovery used the protected local component/variable/system/icon/behind-the-scenes
catalogs. Retrieved live Figma design context for Drop Down Menu1497:11901 in
file wzEFGRLl9MU1nB1JxUSyhD; Card245:399 and the existing selection-menu adaptation
remain reference anchors. No new icons/fonts or proprietary asset exports; no catalog
edits. Desktop geometry remains the approved application implementation.

Research checkpoint remains in ignored `.design-cache/visign-baseline-20261012/run1/`;
the exact pinned SHA256 and feature/vocabulary contracts are recorded in DATA_SCHEMA.
No model/video bytes are copied into frontend assets or source control. Real app
review renders and transient derived WebM probes belong to
`.design-cache/visign-app-20261012/`; fixture media is not physical-camera evidence.

## 2026-10-05 - Capsule correction after user motion rejection

The same motion.mp4 and previously retrieved compact1491:6391/expanded838:4076
remain the sources; no geometry/assets/catalog edits. The user rejected the preceding
speed.640/520ms smoothstep is now the desktop adaptation, replacing460/380ms springs.
Crucial functional fix: CSS minification may serialize milliseconds as seconds; convert
both to WAAPI milliseconds. Figma whoami initially required reauthentication during the
bug fix. On the subsequent resume it succeeds as Fish / Full / Student; live design
context and screenshot for 838:4076 were retrieved again. No new runtime asset was added.
Actual production native evidence: .design-cache/quickstatus-motion-20261005-v2/native-visible/.

## 2026-10-05 - Header capsule motion reference

- User-supplied .design-reference/one-ui-illustration/motion.mp4: 720x1568,
  12.766708 seconds. Browser-decoded frame sheets inspected at 40ms spacing around
  opening0.90-1.30s and collapse6.24-6.64s. Reference recording stays unchanged.
- Existing component sources: compact1491:6391, expanded838:4076. Live design context
  and screenshot retrieved for838:4076; same equalizer-2.svg, no new asset or font.
- Adaptation: preserve current desktop sizes/content; sampled opening/closing springs,
  width-leading-height, sequential opacity, partial-distance timing.460/380ms are
  implementation choices, not exact source timings or an exact mobile reproduction.
- Actual-app evidence: .design-cache/quickstatus-motion-20261005/index.html.

## 2026-10-04 - Profile extension and font-source discovery

Live whoami/file reads passed for One UI wzEFGRLl9MU1nB1JxUSyhD. Reused runtime assets
remain byte-identical; no new decorative/icon library or proprietary font binary shipped.
Profile composes Card245:400/245:432, Button1497:12223/12227/12231, existing default avatar
827:4723 and user-approved underline fields. Interaction page anatomy remains Top App
Bar1495:10799/1495:10992; motion is based on existing Samsung-recording navigation with a
400/320ms desktop adaptation. Avatar photos are user-provided data, normalized to PNG,
not design-system artwork. Roles use existing key/value typography, no new icon geometry.

Exact text font inspected live: `One UI Sans APP VF`, regular400/semibold600/bold700.
Welcome text4:42 recommends installing the variable font. **Node4:47** contains the link:
[Variable One UI Sans.ttf](https://drive.google.com/file/d/1K9eSoU58dxCMGzLj7vXjMRwODB9Cr6X0/view).
The public preview title was verified. This is the kit author's link, not a verified
Samsung redistribution license. [Official font guidance](https://developer.samsung.com/design-system/font)
describes SamsungOne, a different family; it does not provide permission for this binary.
No application-embedding terms were found. Font integration remains pending under AGENTS7.5;
current Segoe UI/local fallback is unchanged and must not be called Samsung font.

Verified: profile/editor/avatar across light/dark, 1280x720/1440x900, Participant820x1180,
and real PyWebView125%; source mappings and evidence in the current handoff.

## 2026-09-28 - Consistent glyph circles; decorative art superseded

Live One UI file wzEFGRLl9MU1nB1JxUSyhD was readable after successful whoami, including
exact design context and screenshots. Cover-only StIo1CdCci8HQXMmdhXZG8 is excluded.
The user's latest correction supersedes the proposed hand/folder/test-tube/chart PNG
illustrations. They are not runtime assets; rejected exports and hashes remain only in
ignored review cache. No new production image, font or icon dependency was added.
Existing SVG bytes below match the accepted checkpoint.

| Component/use | Live source and variant | Desktop adaptation | Verification |
|---|---|---|---|
| Search category/featured circles, Studio workflow | Button Grid dark `1497:11799`, children `1497:11800` through `1497:11805`; icon shapes `1549:8493/8496/8497` | Circular foreground surface; 48px category, 40px featured, 44px workflow with existing 24px glyph. Theme tokens and one restrained workflow accent. Source mobile grid is about 61px, deliberately not copied at mobile scale. | Both themes, five widths, actual 125% PyWebView, glyph geometry/contrast/keyboard |
| Scrolled tabs | Modern Top Navigation `1540:31020` and existing variants | Only tab strip translates by measured menu clearance; width reduced accordingly, horizontal overflow retained | 1100/1280/1440/1920 plus narrow, forward/reverse scroll |
| Live notification | Compact `1491:6391`, expanded `838:4076` | Existing 32px capsule/44px target, 360px expanded, 28px radius; single 400/320ms controller with sequential text and clipped content | Reversals, drawer, telemetry, resize, scroll, Pause/Mark, keyboard, reduced motion, forced colors |
| Navigation | Existing `1316:9258/9261` | Overlay drawer with contextual notification collapse/inert; capsule stays beneath scrim | Focus, Escape, acquisition continues; narrow dock unchanged |
| Raw Signals checkbox | Existing exact artwork `1549:8505` | Add 8px safe space inside shared scrolling boundary, compensate outside margin | First/middle/last hover/focus, Space, forced colors |

Motion timing is the approved desktop adaptation. Recordings remain the primary
behavior reference; official motion guidance supports sequential outgoing/incoming text.
Text labels replace L/R boxes without a new graphic. Chart colors and line styles remain.

| Existing runtime SVG | Figma node | SHA256 (unchanged) |
|---|---|---|
| `devices.svg` | `341:63` | `e6fa1e6cf04e38ff426d3b0d208df0082b942f7a0e02c01fc347cd7714eb0189` |
| `equalizer-2.svg` | `341:16` | `e5900e33051ce662d41f360dbc84bae824c5d1877bcc5b905a4795bf810407ce` |
| `folder-outline.svg` | `340:8955` | `b106fe5e8b775a6fad3cb36d2dade0f1351b27313df6c368678747ba829923e0` |
| `labs-outline.svg` | `340:8858` | `791d45ef85f6eb5651084cd6580f4ebd64a33a37c99ef5bf8bed2642ec723c39` |
| `report.svg` | `340:8653` | `ecccd2159152cbd355b06e61c14224f9efc9d103dabcca8213a9b3b357fdda1b` |
| `translate.svg` | `340:8511` | `4ab02d7c1751f1eb21f1ba4abb6712b905318cd138ffffff2d0bcc6757b57348` |
| `apps-outline.svg` | `340:8389` | `72f136ccc13f549de51ca70749a021ed9043d1b16fc7b7f9cdaa40e995ee2bfd` |
| `contact-outline.svg` | `341:98` | `f72764b6f2e10423c9ade960149d66958e044385671cd6bcece05e8b873dbc2f` |

`one-ui/workspace-icons.ts` maps Devices, Monitor, Studio, Account, Dataset, Train,
Evaluate and Translate to these exact assets. Existing list glyph remains the gesture
category. Search and destinations share semantics; no OS emoji or manually drawn vector
is used. Earlier entries below describe historical implementations and source provenance.

## 2026-09-27 ? Comprehensive One UI system standardization

Source access was reverified with whoami and live One UI pages/nodes before editing,
and rechecked after the interrupted session. [One UI kit](https://www.figma.com/design/wzEFGRLl9MU1nB1JxUSyhD) identifies Version
4.0 and Modern/Legacy variants, including explicit One UI 9 additions. All 11 pages and
the 2,403-component Icons page were searched beyond the historical JSON inventory.
`StIo1CdCci8HQXMmdhXZG8` remains intentionally excluded: cover-only, not an app draft.
No new production assets, fonts or icon library were added in this pass. Existing exact
exports are reused; local Figma JSON, recordings and protected desktop/mobile references
remain unchanged.

| Component / use | Live node and variant | Desktop adaptation | Checked states |
|---|---|---|---|
| Card / Devices, Simulator, Studio, Account | `245:399`; dark `245:400`, light `245:432` | Existing 28px radius / 20px inset; content-driven height, 20px layout gaps | 18 sections, both themes, four sizes |
| Live Activity / expanded notification | `1491:6391`; `838:4076`, header `836:4015`, actions `836:4029` | 32px visual inside 44px target; 360px expanded width / 28px radius; one interruptible geometry controller, fixed text and rounded clipping | Open/close/reversal, telemetry change, resize/scroll, Pause/Mark, keyboard, reduced motion; native 125% |
| Search | `1497:12549`, dark specimen `1497:12550` | 48px height / 26px radius / 14px text; container alone paints focus; reused for Account filtering | Empty/results/categories, pointer/keyboard focus, both themes, forced colors |
| Top navigation / interaction page header | `1540:31020`, Modern `1540:31021/31028/31035`; `1549:8784` | Existing capsule selection; Search header reduced to 104px desktop / 120px narrow | Both tabs, page return, responsive, reduced motion |
| Desktop drawer / narrow dock | `1316:9258/9261`, rows `1316:8906/8887`; Modern `1495:9650/9657/9664/9671`, dock `1491:8142` | Existing 280px overlay / 48px rows, bottom dock below 1100px; workspace remains stationary | Selection, outside/Escape, keyboard, narrow breakpoint |
| App bar | `1495:10623`, default `1495:10650/10662`, elevated `1495:10624/10637` | Preserved responsive/scroll behavior; aligned menu and workspace gutters | Scroll, overlay stacking, both themes |
| Buttons / paired actions | `1497:12222`, dark inner `1497:12224`, light inner `1497:12228`; `1497:11308` | Existing 40px controls / 22px radius; readable disabled state, shared feedback tokens | Normal/hover/pressed/disabled/loading, keyboard and forced colors |
| Selection menu / dialog | `1497:11901`, `1497:12842`; `632:1999` | Existing source anatomy; opaque readable surfaces, elevation reserved for floating overlays | Select, create-account/password forms, disconnect confirmation, Escape/focus |
| Snackbar | `479:8074`, inner `479:8060` | Existing Toast anatomy, raised theme surface; clearance above Search and narrow dock | Action feedback, dismiss, light/dark, narrow |
| Profile / lists | Existing avatar `827:4723`; Card variants above | Existing exact avatar; bounded 1120px overview, aligned profile + access/security groups, page scrolling | Overview/Accounts/Security + profile/password; both themes and four sizes |
| Semantic glyphs | `341:16` equalizer_2, `340:8858/8859` labs, `340:8580` speed, `341:63` devices, `341:46` drawer | Existing exact local exports and outline/selected pairs, currentColor masks; no path edits | Navigation, Search, telemetry, both themes |

Source gaps are explicit: no exact desktop tooltip or product-specific telemetry chart
component was found in the live kit. Existing tooltip radius/inset and product charts
are retained; tooltip positioning/dismissal, shared text/surface tokens and chart legend
density are desktop adaptations, not claimed exact Samsung components. Existing 44px
underline forms retain the user-approved Samsung Account pattern; no new pill field or
invented vector replaces missing source. Typography uses the existing licensed/local
font stack (Segoe UI preference), never extracted Samsung font binaries.

Motion comes from the supplied real recordings. The geometry controller uses the shared
240ms / (.22,.25,0,1) desktop token, not a timing inferred from static Figma frames.
Official principles reviewed: [motion](https://developer.samsung.com/one-ui/motion/basic.html),
[layout](https://developer.samsung.com/one-ui/layout/basic.html),
[depth](https://developer.samsung.com/one-ui/structure/visual-depth.html),
[large screens](https://developer.samsung.com/one-ui/largescreen-and-foldable/large_screen_layout.html),
[Search](https://developer.samsung.com/one-ui/comp/search.html) and
[Toast](https://developer.samsung.com/one-ui/comp/toast.html).

## 2026-09-27 — Semantic navigation glyphs

Live source: `wzEFGRLl9MU1nB1JxUSyhD`; the complete live Icons page was searched,
including alternatives beyond the historical local inventory. Geometry was inspected
in Figma and exported with SVG_STRING; no manual paths or new icon library.

| Runtime asset | Figma node | Use / provenance |
|---|---|---|
| `app/desktop_collector/web/src/assets/one-ui/figma/equalizer-2.svg` | `341:16` | New exact equalizer_2 export; Monitor, telemetry and Search |
| Existing `figma/labs-outline.svg`, `figma/labs.svg` | `340:8858`, `340:8859` | Reused outline/selected pair for Studio |
| Existing `figma/speed.svg` | `340:8580` | Reused for Quick Status and matching Search action |

New equalizer-2.svg SHA256:
`e5900e33051ce662d41f360dbc84bae824c5d1877bcc5b905a4795bf810407ce`.
Only this one new production asset is added; candidate exports stay in ignored cache.
Existing account, drawer, folder, camera, lab, report and translation assets are reused.
Semantic monochrome glyphs use currentColor masks without altering their vector paths.
No proprietary font binary, catalog JSON or short-lived Figma URL enters the bundle.

Protected behavioral reference reviewed this session: galaxy-note.mp4, 1080x2316,
6.631578s, SHA256 `eb5a770cbbe0e6a1fe8bb62bb2d798d417cae8161b1237cd9dfbe740496f084a`.
Original recordings remain unchanged; sampled review frames are ignored audit output.

## 2026-09-26 — Live-status refinement exact assets

Live source: `wzEFGRLl9MU1nB1JxUSyhD`, Figma Plugin API SVG_STRING exports.
Ten new runtime SVGs; existing list.svg was re-inspected and confirmed to have identical
live geometry, so its original bytes are retained. Exact paths are used as images or
currentColor masks; no geometry is reconstructed. Only used assets enter the bundle.

| Asset in app/desktop_collector/web/src/assets/one-ui/figma | Node | SHA256 |
|---|---|---|
| `drawer.svg` | `341:46` | `9a2c632e640a763bfa333fa7342f6b75a8f0de31f2305d9ca108918b7fc15028` |
| `devices.svg` | `341:63` | `e6fa1e6cf04e38ff426d3b0d208df0082b942f7a0e02c01fc347cd7714eb0189` |
| `notification.svg` | `340:8758` | `f8edef4d5a89849fb3603ae11f3a137fc6a54d9dd348ee3a4d32c2ce5de68e05` |
| `notification-outline.svg` | `340:8757` | `de154e2cf37e72ff5f75027b0a871838917407aa8363bb08cce60b3e7154b24e` |
| `control-play.svg` | `341:92` | `772a0ec1bade191892d3272e46bca02c1f56fd8a4e4abcb18bc3fa49a8a7881c` |
| `completed.svg` | `515:716` | `54d8a51b391fa76026bb66655ed5f3816f95ff98f5613be3b4a29e58cd90aa0e` |
| `translate.svg` | `340:8511` | `4ab02d7c1751f1eb21f1ba4abb6712b905318cd138ffffff2d0bcc6757b57348` |
| `report.svg` | `340:8653` | `ecccd2159152cbd355b06e61c14224f9efc9d103dabcca8213a9b3b357fdda1b` |
| `list.svg` | `340:8846` | `11bb43a6bef14a4a5b573c805d98c2aec2a46f91a133a925f5303185c9025b04` |
| `upload.svg` | `340:8499` | `b8334284c7a2b8259dbf0c3d985931e83a0e44b87cfd9090fdb8bfdebf1b5bdf` |
| `arrow-right.svg` | `340:8385` | `680011883f6829a192ac20b4e8fca86cb709c45e1981cdfa50aa7332806ce593` |

Uses: drawer→navigation toggle; devices→generic hardware/source grouping (no glove
silhouette is claimed); completed→success; control-play→resume; report→evaluation;
translate→translation; list→gesture labels; upload→dataset import setup;
notification pair→read/unread entry; arrow-right→navigate into notifications.
Existing account/avatar, theme, search, camera, folder, lab, equalizer and form assets
remain reused where semantically appropriate. Checkbox artwork is reserved for selection.

## 2026-09-26 - Strict normalization export

Refreshed `app/desktop_collector/web/src/assets/one-ui/figma/search.svg` from live
One UI `wzEFGRLl9MU1nB1JxUSyhD`, node `340:8619`, using SVG_STRING export.
SHA256: `023600c5d92b8c495d90e5a02050378b67a553aa91da2595b0d99b34b144d276`.
This replaces the older28px/partial-opacity export with exact24px source artwork.
Existing exact close341:113, error341:15, info and checkbox1549:8505 assets are reused
for status/notification/Search controls. No generic replacement library, proprietary
font, transient asset URL or catalog JSON is shipped. Avatar827:4723 remains exact.

## 2026-09-26 — Design Kit refinement exports

Source file `wzEFGRLl9MU1nB1JxUSyhD`; exported through live Figma Plugin API
`SVG_STRING`, unchanged vector geometry, no transient URL in runtime.

| Local asset (`app/desktop_collector/web/src/assets/one-ui/figma/`) | Figma node | SHA256 |
|---|---|---|
| `close.svg` | `341:113` | `cd2cebbdb19863948d22bdebc6518cf3e7c5fd3a70f983f57b5ac2b96749fa24` |
| `error-outline.svg` | `341:15` | `ee8292e407a8764315c61e194fc84855c6679916431b367bbdbe49c9c893460a` |
| `chevron-down.svg` | `340:8893` | `8fb277dc37e1639a5a0a29e5b094942ad28c730ee2119015cd1186b04b25b755` |
| `checkbox-selected.svg` | `1549:8505` | `a745e9e80db5ef3792159ec2b58d0dc706f035cb2f644109a437776deaa75a71` |
| `checkbox-unselected.svg` | `1549:8506` | `01bd0ad40530f808e89f62f65764db93e5a8767c5d4168cbd6992c1d095e8052` |

Checkbox unselected is the real ellipse layer under Shape checkbox; Selected boolean
controls its selected group. Existing `info-outline.svg` is reused for neutral/waiting
feedback. `arrow-down.svg` and `check.svg` remain historical assets but controls now
import the newly selected semantic assets. No external icon library added.

## 2026-09-26 — Full-system One UI overhaul

Six exact live exports from `wzEFGRLl9MU1nB1JxUSyhD` are stored in
`app/desktop_collector/web/src/assets/one-ui/figma/`. Figma Plugin API `exportAsync`
provided the original PNG/SVG bytes after remote asset downloads returned empty
responses. No hand-authored replacement paths or expiring runtime URLs were used.

| Asset | Exact node | SHA256 |
|---|---|---|
| `account-avatar.png` | `827:4723` | `42cb68fc3464542704297492e49666508342a3c8ee593412fedc5c8fbf2501c3` |
| `security-outline.svg` | `340:8616` | `764913f5012f9f454bcac2f5871f8fe9a07e3e9730e7328e8a29e54f977e01a0` |
| `camera-outline.svg` | `341:126` | `fba5912826216b5bf17e0c173de2972a2e342bcf50d331b89a0ea7d861872331` |
| `pause.svg` | `341:94` | `4bb354efcdaf5bd851d86b58cbb92f0a8cd40d9cccc5a7d24771a89e203fb2ba` |
| `arrow-down.svg` | `340:8388` | `02e91779354d2d08212db253c3d1ad4ae3ff26533aef2fc44111975a318ad7ef` |
| `check.svg` | `515:709` | `7590d703226806b1549c663482b1e1e723ac4115a5a607ebbf5af2a7e53f5729` |

Uses: default account avatar (not a real user's photo); local security summary;
Studio visual-input source; chart pause; select-field arrow; selected checkbox/menu.
Existing exact device, contact, apps, folder, labs, info, sound, speed and equalizer
assets are reused. Unsupported derived outline variants are no longer imported by
the shell. Existing files remain preserved. The old static Studio preview asset is
no longer rendered, but its source file is retained.

Live discovery traversed all 11 pages, including the three separator pages, and
searched component sets, variants, icons, System UI, Workspace and Behind the Scenes.
The kit exposes paint/text styles; no variable collection was returned. New discovery
evidence stays ignored under `.design-cache/oneui-overhaul-20260926/`; the durable
catalog JSONs were not regenerated or shipped in the application.

`StIo1CdCci8HQXMmdhXZG8` is a promotional cover only and contributes no SmartGlove UI.
No Samsung font binaries were extracted. Segoe UI and the existing licensed local
DM Sans remain. Samsung recordings and protected frontend reference assets are unchanged.

# Asset inventory

## 2026-09-10 — Global Search

- Added `app/desktop_collector/web/src/assets/one-ui/figma/search.svg`, downloaded
  unchanged from live Figma file `wzEFGRLl9MU1nB1JxUSyhD`, Collapsed Search `1589:7648`,
  dark search instance `1589:7626`. Native SVG viewBox is `0 0 28 28`; the shell uses
  its existing 24px utility glyph size and theme filter. No expiring URL in source.
- Studio dock reuses existing `apps.svg` (indexed `340:8390`). Studio contextual
  sections use text labels in the existing contextual navigation; no speculative
  camera/translation glyph or external icon library was added.
- Live context also retrieved Search `1497:12549` and Card `245:399`. Existing controls,
  card and overlay adaptations remain authoritative; no Figma code, font, full library
  or review screenshot enters the runtime bundle. The local reference catalog is unchanged.

## One UI9 Stage1 — Device Manager

The2026-09-09 fidelity pass introduces no runtime asset or font. Exact Figma exports
are ignored review-only evidence under `.design-cache/artifacts/one-ui9-device-manager/`.
Device-scoped palette, control geometry,30px rail glyph sizing and Segoe UI fallback
provenance are governed by [ONE_UI_DESIGN_RULES.md](ONE_UI_DESIGN_RULES.md), superseding
the older collector-wide numeric examples below only on that representative screen.
Existing product glyphs are retained and explicitly not claimed as kit glyph matches.
Protected desktop/mobile assets and technology-neutral shared tokens remain untouched.

## Milestone 1.1 React usage

The React collector uses two minimal Vite aliases:

- `@one-ui` resolves directly to the confirmed production asset root at `app/frontend/desktop/assets/`.
- `@one-ui-shared` resolves to the asset-free design contract at `app/frontend/shared/one-ui/`.

`server.fs.allow` contains only the React web root and these two exact roots.

| Source asset | React location | Use |
|---|---|---|
| `one-ui/devices.svg` | `App.tsx` | Device Manager navigation. |
| `one-ui/sound-outline.svg` | `App.tsx` | Live Monitor navigation. |
| `fonts/dm-sans-latin*.woff2` | `styles.css` | Retained DM Sans 400/500/600/700 fallback subsets; V.3 uses system Segoe UI first on Windows. |

No production asset was copied into `app/desktop_collector/web/`, no WOFF2 was converted and no source SVG/font was modified. Generated Vite bundles are ignored and are not a production source asset tree.

V.3 rendered-font inspection found mixed DM Sans/Segoe UI glyphs in Vietnamese text.
The React-only font-family override now prefers Windows Segoe UI; no system font is
copied or bundled. Current CDP evidence is `one-ui-v3/rendered-fonts.json` under the
ignored artifacts directory. Shared token and protected asset files remain unchanged.

The approved production Now Bar integration (2026-09-07) now maps weight 600 to the
existing licensed 600 WOFF2 subsets instead of declaring the 700 files as 600–700.
Its glove glyph is reused from the user-approved A.1 review, and pause/play uses the
existing product command paths. No Figma-exported image, Samsung font, or new asset
file was introduced. Live Figma references and desktop adaptations are recorded in
`WORK_SESSION_HANDOFF.md`; the HTML review itself remains unchanged.

Phase D.1 provenance is also recorded next to the React visual layer at `app/desktop_collector/web/src/assets/one-ui/ASSET_USAGE.md`. That file is documentation only: no image was extracted from either master SVG because the required navigation icons already exist in the confirmed desktop asset source.

## Phase D.2 shared design contract

`app/frontend/shared/one-ui/` contains exactly two CSS sources plus one README:

- `tokens.css`: semantic light/dark color pairs, typography, spacing, radius, control size, elevation and frosted fallback values.
- `motion.css`: duration and easing tokens, including reduced-motion overrides.
- `README.md`: source priority, adoption boundary, accessibility invariants and license/provenance notes.

The contract contains no icon, image, font, reset, component class or application logic. The collector is its only current adopter; the user-owned desktop/mobile prototypes were not modified.

OneUI-Web was inspected at exact commit `b20b1dd7b4094e2c501a6d9712d1c8f2fc77a52f` under ignored `.design-cache/vendor/OneUI-Web/`. Only its MIT-licensed `easeOutCubic` value informed `--ou-ease-standard`; `oui.css`, global reset, mobile container, CDN resources, icons and Samsung fonts are not imported or bundled. OneUIX and Android-Dex contribute no production code or asset.

## Approved design references

These ignored files are design references only and are never imported by Vite:

| File | Bytes | SHA-256 |
|---|---:|---|
| `.design-cache/one-ui/one-ui-master.svg` | 47,290,808 | `BAA04DAAB0601A7B3674D0C935E103C5FB8D984CF4DEED374F9A360849829E10` |
| `.design-cache/one-ui/one-ui-secondary.svg` | 19,368,000 | `4895C59E05E8A762AADC20D97BDFF42539917523E51CCAB551ECCD79B509F13B` |

Local renders/crops generated during the initial design review informed app shell, top bar, card, segmented control, alert/status and token choices. Stage D.2.6 Stage 2A additionally used connector context for Buttons `1497:12222`, Top App Bar `1495:10992`, Slide Navigation `631:2757`, Status Bar `1491:6323`, Live Activity `1491:6362`, Search `1497:12549`, Card `245:399` and Containers `247:613`; these were structural/state references only and contributed no runtime asset. Superseded intermediate renders were later consolidated during authorized repository hygiene; the original master SVGs and recorded provenance remain separate from production assets. Semantic collector copy comes from the application domain, not OCR or traced text.

Stage D.2.6 Stage 2B used focused connector context for Edge Panels `744:3668`, Notification Header `620:1523`, QS/Notification `1003:13022`, Dialog `632:2006`, dialog dark/light `1493:8950`/`1493:8968`, Toast `479:8075`, toast dark/light `479:8074`/`479:8116`, Live Activity `1491:6362` and Containers `247:613`. Only overlay/feedback geometry, surface hierarchy, scrim restraint, typography and spacing were adapted; no Figma code, font, logo, image or raster asset was imported or copied.

Stage D.2.6 Stage 2B.2 used only the already-retained audit evidence in `.design-cache/audits/one-ui-system-d2-6/`: Dialog `632:1999`, Action Bar `1589:4316`, Navigation Rail, Slide Navigation `631:2757`, Floating Toolbar `1495:11133`, Simple Lower Bar `1549:8371`, Status Bar and Top App Bar comparisons. Final application screenshots, focused states, measured geometry and six required comparison/reference sheets are retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b2/`. These Community kit captures are project design references, not official Samsung certification; they remain ignored review evidence and are never imported into the runtime bundle.

Stage D.2.6 Stage 2B.3 used one focused connector inspection each of Top App Bar `1495:10992`, Headers `1316:10528`, Navigation Rail `1589:7438`, In-App Navigation `1495:10175`, Floating Toolbar `1495:11133`, Simple Lower Bar `1549:8371`, Status Bar `1491:6323` and Slide Navigation `631:2757`. Review-only node screenshots, final full/focused captures, measurements and native/fixed-scale comparison sheets are retained at `.design-cache/artifacts/m1.1-ui-d2-6-stage2b3/`; none is imported by the runtime. Runtime navigation and command glyphs are product-owned inline SVG geometry, not copied Samsung assets.

## Vị trí và nguyên tắc

Repository không có `/asset` ở root. Hai cây thực tế là:

- `app/frontend/desktop/assets/`
- `app/frontend/mobile/assets/`

Hai cây có 42 file và trùng byte theo SHA-256 tại thời điểm kiểm kê lại sau Phase D. Desktop collector dùng cây desktop làm nguồn chỉ đọc; không xóa, đổi tên, chỉnh SVG hoặc chuyển đổi font.

## One UI SVG

Nguồn: One UI Design Kit (Community), provenance và Figma node nằm trong `assets/one-ui/SOURCE.md`.

| File | Figma node | Dùng trong desktop collector |
|---|---:|---|
| `bluetooth.svg` | 341:164 | Chưa dùng ở Milestone 1; dành cho Serial/BLE sau này. |
| `delete-outline.svg` | 341:68 | Chưa dùng. |
| `devices.svg` | 515:565 | Navigation Device Manager. |
| `edit-outline.svg` | 341:39 | Chưa dùng; tên thiết bị dùng input có label. |
| `history.svg` | 515:561 | Chưa dùng. |
| `play.svg` | 341:92 | Chưa dùng. |
| `settings-outline.svg` | 340:8609 | Chưa dùng. |
| `sound-outline.svg` | 340:8588 | Navigation Live Monitor. |

Các component One UI tham chiếu trong nguồn web: Card Light `245:432`, Simple Lower Bar Light `1549:8382`, Top App Bar `1495:10992`.

## Figma SVG cũ

13 file: `icon-history.svg`, `icon-live.svg`, `icon-profile-top.svg`, `icon-profile-bottom.svg`, `nav-asset-1.svg` đến `nav-asset-6.svg`, `status-battery.svg`, `status-cellular.svg`, `status-wifi.svg`.

Milestone 1 không dùng trực tiếp nhóm này; giữ nguyên cho prototype web.

## PNG

- `app-icon-192.png` — 192×192.
- `app-icon-512.png` — 512×512.
- `apple-touch-icon.png` — 180×180.

Đây là icon sinh cho PWA hiện có, không phải export One UI. Milestone 1 không dùng chúng làm icon desktop.

## Font

- DM Sans 400/500/600/700, Latin và Latin-ext: 8 WOFF2.
- Poppins 500/600/700, Latin và Latin-ext: 6 WOFF2.
- `DM-Sans-LICENSE.txt`, `Poppins-LICENSE.txt`, `fonts.css`.

PySide rollback thử nạp DM Sans WOFF2 bằng `QFontDatabase` và fallback Segoe UI nếu Qt không hỗ trợ. React đọc trực tiếp các subset DM Sans đã có; không tạo TTF.

## Design tokens áp dụng

- Reference accent `#387AFF`; filled light controls use accessible `#1556D8` with white text, while dark controls use `#8EB3FF` with dark text.
- Light canvas `#F1F1F3`, container `#FCFCFF`, raised container `#FFFFFF`.
- Dark canvas `#17171A`, container `#222226`, raised container `#2B2B30`.
- Radius scale: control 18 px, card 28 px, detached shell 32 px, pill/chip 999 px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32 and 40 px; minimum primary control height 46 px.
- Left: nhãn `L`, đường liền, dải xanh.
- Right: nhãn `R`, đường đứt, dải cam.
- Focus uses a two-layer visible ring; reduced-motion collapses animation/transition duration.
- Axe kiểm tra không có vi phạm serious/critical; filled accent was separated from the reference accent after automated contrast measurement found white on `#387AFF` was only 3.89:1.
