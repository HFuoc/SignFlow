# Figma implementation inventory — 2026-09-10

Status: read-only scan complete enough to drive the next implementation passes. This is an implementation inventory, not a claim that every decorative layer in the community file is required by SmartGlove.

## Scan coverage

Top-level pages in `wzEFGRLl9MU1nB1JxUSyhD`:

- `0:1` — Welcome
- `13:32` — App Components
- `744:3363` — System UI
- `320:2` — Icons
- `1326:8985` — Emojis
- `478:695` — Behind the scenes

Deep implementation review is focused on App Components, System UI, and the icon catalog. Welcome, Emojis, and Behind the scenes are reference/support pages rather than current runtime targets.

## Component inventory

| SmartGlove area | Figma source | Node | Use |
| --- | --- | --- | --- |
| Shared card / settings rows | Card | `245:399` | Keep 28 px card language and leading/trailing shape anatomy. |
| Primary CTA | Buttons | `1497:12222` | Keep accent CTA pill; Figma accent is `#387AFF`, radius 28 px. |
| Checkbox/radio shape | Shapes | `1549:8493`, checkbox `1549:8505` | Use circular blue checked state for auth-specific remember control. |
| Selection surface | Selection Menu | `1497:12842` | Source for selection-menu radius, blur, spacing and typography. |
| Compact menus | Drop Down Menu | `1497:11901` | Source for utility menus / grouped commands. |
| Search | Search Bars | `1497:12546`, content `1497:12549` | Use where discovery/filtering is primary, not as generic text input. |
| Compact search | Collapsed Search | `1589:7648` | Candidate for narrow/tablet toolbar search. |
| Dialog | Dialog | `632:1999` | Confirmation / blocking modal source. |
| Toast / snackbar | Toast | `1316:10542`, content `479:8075` | Transient feedback source. |
| Action groups | Action Bar | `1589:4316` | Candidate for context-sensitive multi-command groups. |
| Floating utility group | Floating Toolbar | `1495:11206`, content `1495:11133` | Use only when the actions genuinely float over content. |
| Header | Headers | `1316:10528` | Large-page title hierarchy reference. |
| Top app controls | Top App Bar | `1495:10799`, content `1495:10992` | Reference for compact top actions; avoid duplicating identity. |
| In-app navigation | In-App Navigation | `1495:10175` | Mobile/compact navigation reference. |
| Slide navigation | Slide Navigation | `631:2757` | Existing compact multi-destination reference. |
| Large-screen nav | Navigation Rail | `1589:7438` / `1589:7437` | Reference only; prior project review rejected forcing a rail into the current layout. |
| Switch | Switches | `1493:8885` | Boolean settings state. |
| FAB | Floating Button | `1549:8621` | Only for one high-priority creation action if a screen later needs it. |
| Lower bar | Simple Lower Bar | `1549:8371` | Candidate for compact contextual actions. |
| App dock | App Dock | `1491:8129` | Not a current SmartGlove target. |
| System status | Status Bar | `1491:6323` | System-like status treatment reference only. |
| Live compact activity | Live Activity | `1491:6362` | Useful reference for small recording/runtime status capsules. |

## Auth V2 decision

No generic underline text-field component was found in the App Components inventory. The SmartGlove login underline field is therefore a product adaptation based on the user-approved Samsung Account desktop/mobile sign-in pattern, while the surrounding pieces remain grounded in the Figma kit:

- Card: `245:399`
- Accent CTA: `1497:12222`
- Checkbox shape: `1549:8505`
- Password visibility glyphs: `password_show` `340:8737`, `password_hide` `340:8738`
- Theme glyphs: existing Figma-derived `brightness.svg` / `dark.svg`

The underline variant is intentionally scoped to the login screen. First-run administrator setup and password-management forms keep the shared pill text field until separately reviewed.

## Resolved icon pairs already available in runtime

| Purpose | Outline / inactive | Filled / active | Status |
| --- | --- | --- | --- |
| App/grid | `apps_outline` `340:8389` | `apps` `340:8390` | Exact pair |
| Devices | `device_outline` `341:65` | `device` `341:67` | Exact pair |
| Account | `contact_outline` `341:98` | `contact` `341:99` | Exact pair |
| Quick status/info | `info_outline` `340:8901` | `info` `340:8902` | Exact pair |
| Settings | `settings_outline` `340:8609` | `settings` `340:8610` | Exact pair available; runtime currently retains filled where appropriate |
| Sound | `sound_outline` `340:8588` | `sound` `340:8594` | Exact pair available |
| Password visibility | `password_hide` `340:8738` | `password_show` `340:8737` | Exact functional pair |

## Icon-enrichment rules for next passes

Do not add icons merely to increase icon count. Add them where they improve recognition or state scanning:

1. **Device Manager:** device state, connect/disconnect, refresh/sync, settings/configure.
2. **Live Monitor:** pause/resume, reset/follow-live, channel/filter, recording state.
3. **Studio:** record/session, label/gesture, save/export, validation/warning.
4. **User Management:** account/role, edit, password/reset, enable/disable, delete where supported.
5. **Quick Status:** keep one clear info/status glyph rather than a decorative icon cluster.
6. **Auth:** stay restrained: theme, password visibility, remember control only. No fake social-provider or registration actions because the local backend does not support them.

## Next implementation order

1. Auth V2 underline sign-in + remember username.
2. Review Selection Menu / Drop Down against live Figma context.
3. Main-shell icon audit and meaningful icon enrichment, screen by screen.
4. Dark/light and responsive screenshot review before freezing the visual system.
### Auth V2 centered-title refinement

User preference confirmed for a centered login title/copy. The implementation now locks `Sign in`, eyebrow, description, form column and CTA to the same horizontal center. Credential labels remain left-aligned inside the form. This centered Auth V2 was visually approved by the user on 2026-09-10 and is now the accepted login baseline.



## Implemented continuation after Auth V2 approval

- **Selection Menu / Drop Down:** implemented the live-Figma geometry/surface refinement from `1497:12842` and `1497:11901`; plain selection rows now use the lighter Figma-like density while rich search-result rows preserve their existing metadata layout.
- **Studio contextual navigation:** implemented exact outline/filled Figma pairs for Overview (`apps`), Dataset (`folder`), MediaPipe (`image`), Train (`labs`), Evaluate (`info`), and Translate (`sound`). Icons are injected through the shared shell without changing routes or caller data.
- **Shell edge treatment:** implemented a gentle bottom fade paired with the existing top fade so the floating app dock has a softer content boundary.
- **Still unresolved by design:** derived outline fallbacks for equalizer/speed/list/list-filter remain isolated until a semantically correct exact Figma pair is found; do not replace them with merely similar symbols.
