## Current full-system contract — 2026-09-26

This section supersedes the historical Device Manager-only scope below. Current
authorization covers the full frontend; approval of this implementation is pending.

Source responsibilities: current SmartGlove code → function/state/IA; live One UI
Figma `wzEFGRLl9MU1nB1JxUSyhD` → visual primitives/assets; the three Samsung recordings
→ behavior/motion; official Samsung documentation → principles. The cover-only file
`StIo1CdCci8HQXMmdhXZG8` is intentionally excluded and must not block future work.
Do not reconstruct screens from its cover or silently substitute generic icon sets.

Use neutral canonical surfaces, Segoe UI/local licensed DM Sans, a desktop hierarchy
of 32px page / 20px card / 14px body, and shared 40px controls / 42px fields. Touch
layouts retain larger targets. Primary button fill is #2563D8 for small white-label
contrast; the Figma accent remains #387AFF. Cards adapt node 245:400's 28px radius.

The top bar uses native sticky geometry and a stable header-derived compact threshold.
Only capsule opacity changes with compact state; no per-frame width/left/top morph,
whole-page scroll translation, hover-height feedback or opaque full-width shelf.
Context destinations render real views. On selection, new headings clear the capsule
using a one-time measured scroll boundary. Domain navigation restores its view state.
Peer entry is interruptible 240ms/32px; detail pages use 280ms entry/return; capsule
opacity uses 180ms. These are desktop adaptations, not measured Samsung timings.
Reduced motion suppresses transitions. Floating bottom navigation uses restrained
6px blur, a neutral inset selection and a 58px desktop height.

Product-specific glove telemetry, charts, raw tables and runtime activity retain
their functional code and use shared visual primitives. Exact Figma assets cover
generic imagery/icons; custom product composition is necessary because the kit has
no SmartGlove telemetry/data semantics. Local reference JSONs remain read-only.

Evidence and exact asset provenance: `WORK_SESSION_HANDOFF.md`, `ASSET_INVENTORY.md`.

# One UI 9.0 — Device Manager design contract

## Authority and scope — 2026-09-09

The user's fidelity-pass authorization supersedes the V.2/P.1/V.3 visual geometry
freeze wherever matching the designated draft requires it. It does **not** relax
behavior, RBAC, accessibility, security, acquisition or data integrity. Stage 1 is
Device Manager only; shared primitives are reused with a page-scoped visual variant.
Monitor, Account, auth and overlays await approval before independent redesign.

Precedence: latest user authorization → designated Figma anatomy/variants → Samsung
layout/interaction principles → existing semantic tokens and production components.
Conflicts and desktop adaptations must be explicit. The Community draft is the
project's authoritative visual reference, not evidence of Samsung certification.
The adoption guide remains the migration/protected-asset contract; its historical
visual freeze, reference precedence and numeric rules are superseded here for Stage 1.

## Verified source map

All links use file `wzEFGRLl9MU1nB1JxUSyhD`. Context **and screenshots** were accessed
in this Goal before edits; no file-root scan. Dimensions below describe actual
components, not surrounding demonstration frames.

| Production use | Figma node / variant | Verified anatomy |
| --- | --- | --- |
| Device and simulator groups | [Containers, 247:613](https://www.figma.com/design/wzEFGRLl9MU1nB1JxUSyhD/?node-id=247-613), light/dark | 20px padding, 28px corners, 18px regular subheading, 14px regular body; light canvas/container #F1F1F3/#FCFCFF, dark #010102/#17171A; 36px display example |
| Connection/apply actions | [Buttons, 1497:12222](https://www.figma.com/design/wzEFGRLl9MU1nB1JxUSyhD/?node-id=1497-12222), dark 12223 / light 12227 / accent 12231 | Inner 248×60, radius 28, 24px horizontal padding, 20px/700 label, .2px tracking, optional 24px icon; #17171A / #FCFCFF / #387AFF. Outer 386×74 and 69px side padding are demo framing, not button padding |
| Device Manager app bar | [Top App Bar, 1495:10992](https://www.figma.com/design/wzEFGRLl9MU1nB1JxUSyhD/?node-id=1495-10992), default light 11031/dark 11019; elevated light 11006/dark 10993 | 20px/700 title, 14px/400 subtitle, 50px action targets and 24px glyphs; elevated trailing group radius25 and blur12 |
| Landscape navigation | [Rail, 1589:7438](https://www.figma.com/design/wzEFGRLl9MU1nB1JxUSyhD/?node-id=1589-7438), dark | 88px container, 17px horizontal/20px vertical padding, radius28; selected surface54×50/radius9 with 30px icon, 16px item spacing |
| Compact navigation grouping | [Floating Toolbar, 1495:11133](https://www.figma.com/design/wzEFGRLl9MU1nB1JxUSyhD/?node-id=1495-11133), dark11134/light11140 | 6px group padding, equal 54px icon-label items,24px icons,10px regular labels,14px blur. Screenshot wallpaper/outer frame is not app chrome |
| Simulator inputs | [Search/field, 1497:12549](https://www.figma.com/design/wzEFGRLl9MU1nB1JxUSyhD/?node-id=1497-12549), dark12550/light12553 | 20px horizontal/17px vertical inner spacing, radius30,16px/600 text; surrounding10/20px frame spacing is not input padding |

## Implementation rules and explicit adaptations

- Preserve existing OneUIButton/OneUITextField/StatusIndicator and their real pending,
  disabled, error and focus semantics. Reserve pending labels; do not shift layout.
- Use reference 20px/700 actions with min-height60/radius28 and natural label width,
  not hardcoded248px: Vietnamese labels and desktop tasks differ from the sample.
  Use 24px line boxes, not the generated 12px button line-height, to retain diacritics.
  Accent fill #387AFF with white **20px bold** text uses the large-text contrast rule;
  smaller text must retain the accessible semantic accent. No decorative apps icon
  is added to a connection action merely because the sample contains one.
- Device info: equal-width glove groups, 20px inset,18px regular headings,14px support,
  36px rate emphasis, readable wrapping metrics. No fixed card height or truncated
  packet values. Keep L/R text and solid/dashed hand marks, independent source truth.
  At1200 CSS px the four metrics fit one row; smaller windows use2×2. This capacity
  breakpoint is a desktop adaptation, not a Samsung numeric rule.
- Simulator: group heading and apply action above four labeled fields; two then one
  field column when capacity requires. Native number editing/min/max/units retained.
  Search anatomy is adapted to numeric input, not a fictitious search/voice feature.
  Nested fields use the existing tonal surface to remain distinguishable from cards.
- Page-scoped shell palette matches the draft. Existing contrast-safe secondary/status
  colors are retained instead of copying #848487 where small-text contrast would fail.
- Rail selection is on the54×50 icon surface; visible12px labels below are a desktop
  adaptation, not part of the icon-only reference. Rail height fits available viewport,
  not the demonstration900px. Compact navigation keeps readable12px labels and wider
  equal targets than the54px/10px toolbar sample; no irrelevant toolbar actions.
- Existing product-specific Devices/Monitor/Account/theme/status glyphs are retained
  with disclosed provenance, **not** claimed as matching the kit's home/download/
  drawer/search/more glyphs. No new glyph is drawn or asset copied. Exact task-matching
  Samsung glyphs remain a source gap. Reference screenshots are review-only.
- Kit font is One UI Sans APP VF. No permitted font file was supplied; keep Windows
  Segoe UI for complete Vietnamese, existing licensed DM Sans as fallback. Metrics and
  glyph shapes differ; do not claim pixel-identical typography or bundle system fonts.
- Now Bar's single-DOM morph,400×60/520×325,78px flow lane, focus/scroll/handoff,
  pause ownership and continuous acquisition remain unchanged. No reference for an
  expanded desktop Now Bar is invented. Dialog and other overlays retain V.3 behavior.

## Samsung principles, applied without inventing numeric tokens

- [Buttons](https://developer.samsung.com/one-ui/comp/button.html): clear immediate
  actions; gray for moderate and colored fill for high emphasis; flat dialog actions.
  Its older18dp example and one-style wording differ from this draft's28px variants:
  use the user-designated draft anatomy, one consistent contained family on the page,
  semantic emphasis per task, and retain the existing flat confirmation dialog.
- [Visual depth](https://developer.samsung.com/one-ui/structure/visual-depth.html):
  prioritize content and use depth sparingly. Static groups have no decorative shadow;
  related floating navigation may have restrained separation, not stacked effects.
- [Large-screen layout](https://developer.samsung.com/one-ui/largescreen-and-foldable/large_screen_layout.html):
  flexible grids, persistent menus with content, brief contextual tasks in small popups.
  Android600/840dp classes are not mandatory Windows CSS-pixel breakpoints.
- [Layout and typography](https://developer.samsung.com/one-ui/accessibility/layout-and-typo.html):
  support200% text without loss, adequate touch area/spacing and labels for icons.
  Keep keyboard focus, reduced motion, native scroll and unclipped Vietnamese.

## Terminology and acceptance

Retain the approved hybrid: Device Manager/Devices/Monitor/Account/Quick Status and
Sample rate/Packets received/Packets lost/Latest packet are English. Guidance, state,
confirmation and recovery remain Vietnamese. Preserve SI units and identifiers.
Do not revive the superseded ordinary-flow “Bridge online” copy.

Acceptance requires actual app/source comparison at consistent scale,1280×720 and
1440×900 both themes,compact and effective200%, in addition to interaction, focus,
overflow, collision, reduced-motion, pending and continuing-acquisition tests.
Passing tests does not equal user visual approval or human screen-reader verification.

## Superseded geometry and verification

Stage1 replaces Device Manager's274/286px card minima and126/180.14/312.14px simulator
allocation with content-sized groups;44px/14px actions with60px/20px;44px/radius16 fields
with58px/radius30 and16px text;22px app title with20px. Rail54×62 whole-item selection
and24px icon becomes54×50 selected icon surface/30px glyph plus a visible label;
short floating rail becomes viewport-height. Compact icon/label grouping follows the
toolbar anatomy with explicit readable-label adaptation:358×62→358×68; bottom reserve
78→84px retains8px top and bottom clearance. Outer app-bar76px, rail88px,
navigation mode query and all Monitor/chart geometry remain unchanged.

Implementation and required automated Stage1 verification: **COMPLETE**.
User visual approval: **PENDING**; no wider rollout authorized.
Final production-preview6/6 targeted tests,8Device Manager states with0axe violations/
incomplete, and isolated Python/Edge preflights passed. Prior unaffected results are
reused, not represented as a new full-suite run. Exact evidence, historical rollback
gaps and remaining human/native-window/Quick Status review are in the current handoff.
