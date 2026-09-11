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
