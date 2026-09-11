# One UI asset usage — Phase D.1

This directory records visual provenance. Phase D.1 does not copy or extract any image bytes because the two required navigation icons and DM Sans font are already available from the confirmed, read-only production asset source.

| Design/source file | Reference region or node | Production file | React use | Why asset instead of CSS |
| --- | --- | --- | --- | --- |
| `app/frontend/desktop/assets/one-ui/devices.svg` | One UI Design Kit node `515:565` | Same file, imported through Vite alias `@one-ui` | Device Manager navigation icon in `App.tsx` | A sourced icon exists; redrawing it would lose provenance. |
| `app/frontend/desktop/assets/one-ui/sound-outline.svg` | One UI Design Kit node `340:8588` | Same file, imported through Vite alias `@one-ui` | Live Monitor navigation icon in `App.tsx` | A sourced icon exists; redrawing it would lose provenance. |
| `app/frontend/desktop/assets/one-ui/settings-outline.svg` | One UI Design Kit node `340:8609` | Same file, imported through Vite alias `@one-ui` | Quick Status button in the desktop taskbar in `App.tsx` | A sourced settings icon exists; redrawing it would lose provenance. |
| `app/frontend/desktop/assets/fonts/dm-sans-latin*.woff2` | Typography used by the local One UI asset set | Same files, loaded through Vite alias `@one-ui` | UI weights 400, 500, and 700 in `styles.css` | Font files cannot be represented faithfully with CSS alone. |
| `.design-cache/one-ui/one-ui-master.svg` | System UI, Now Bar, status, slider, surfaces | None | Visual reference only | The 47 MB design canvas must not enter the runtime bundle. |
| `.design-cache/one-ui/one-ui-secondary.svg` | App Components: rails, bars, containers, cards, buttons, chips, toolbar, enlarged header | None | Visual reference only | The 19 MB design canvas must not enter the runtime bundle. |

Shell geometry, cards, chips, state surfaces, focus rings, and motion are implemented with CSS tokens because they are scalable UI primitives, not image content. No source SVG/font was modified, converted, traced, or duplicated in Phase D.1.

## 2026-09-10 bounded Figma normalization

Exact Figma exports now replace temporary derived state variants where a true counterpart exists:

- `apps-outline.svg` ← Figma `apps_outline` node `340:8389`.
- `settings.svg` ← Figma filled `settings` node `340:8610`.
- `sound.svg` ← Figma filled `sound` node `340:8594`.
- `device.svg` / `device-outline.svg` ← exact Figma `device` / `device_outline` pair `341:67` / `341:65`; used for Devices/Gloves stateful navigation instead of the former custom outline approximation.
- `contact.svg` / `contact-outline.svg` ← exact Figma `contact` / `contact_outline` pair `341:99` / `341:98`; used for Account stateful navigation/utility behavior instead of mixing `samsung_account` with a custom outline.
- `password-show.svg` / `password-hide.svg` ← exact Figma `password_show` / `password_hide` nodes `340:8737` / `340:8738`; used by auth password reveal controls instead of a hand-authored eye SVG.
- `info.svg` / `info-outline.svg` ← exact Figma `info` / `info_outline` pair `340:8902` / `340:8901`; used for Quick Status closed/open state instead of pairing `speed` with a derived outline.

No exact outline/filled pair was found for the current contextual `equalizer`, `speed` (Statistics), `list`, or `list_filter` semantics in this bounded pass, so those remaining state fallbacks stay isolated rather than being mislabeled as exact.

## 2026-09-10 Studio contextual icon enrichment

The approved Studio contextual navigation now uses exact Figma outline/filled pairs instead of text-only destinations:

- Dataset: `folder-outline.svg` / `folder.svg` ← nodes `340:8955` / `340:8960`.
- MediaPipe: `image-outline.svg` / `image.svg` ← nodes `340:8900` / `341:604`.
- Train: `labs-outline.svg` / `labs.svg` ← nodes `340:8858` / `340:8859`.
- Evaluate reuses the exact `info-outline.svg` / `info.svg` pair `340:8901` / `340:8902`.
- Translate reuses `sound-outline.svg` / `sound.svg` ← nodes `340:8588` / `340:8594`.
- Overview continues to reuse `apps-outline.svg` / `apps.svg`.
- `settings-outline.svg` is now an exact local Figma export from node `340:8609`; the shell no longer relies on the older alias copy for this state.

These icons are semantic navigation cues, not decoration. Narrow layouts keep the existing icon-only behavior while retaining accessible labels.
