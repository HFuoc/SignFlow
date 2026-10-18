# AGENTS.md

Repository instructions for coding agents working on the DATN sign-language glove,
SmartGlove Dataset Studio, and desktop data collector.

Keep this file durable. Do not use it as a session log.

Current progress belongs in `PROJECT_MILESTONE_TRACKER.md`.
Architecture and confirmed decisions belong in `PROJECT_CONTEXT.md`.
Chronological work belongs in `docs/SESSION_LOG.md`.
Portable cross-session state belongs in `docs/WORK_SESSION_HANDOFF.md`.
Protocol/data contracts belong in `docs/DATA_SCHEMA.md`.
Asset provenance and inventory belong in `docs/ASSET_INVENTORY.md`.

---

## 1. Before making changes

Before editing source, configuration, assets, tests, or documentation:

1. Read `PROJECT_CONTEXT.md`.
2. Read `PROJECT_MILESTONE_TRACKER.md` and identify:
   - the active approved milestone;
   - the current approval/cutover gate;
   - explicitly deferred work;
   - anything marked proposed or TBD.
3. Read the latest relevant entries in:
   - `docs/SESSION_LOG.md`;
   - `CHANGELOG.md`.
4. Read `docs/WORK_SESSION_HANDOFF.md`, then reconcile it with:
   - the repository;
   - Git state;
   - canonical project documents.
   The handoff is a portable snapshot, not a substitute for current Git state.
5. Inspect:
   - `git status --short`;
   - the relevant diff;
   - existing untracked files.
6. Preserve all unrelated user work, including:
   - existing deletions;
   - modified files;
   - untracked files;
   - local checkpoints and archives.
7. Before protocol/data changes, read `docs/DATA_SCHEMA.md`.
8. Before UI, visual-system, or asset changes, read:
   - `docs/ASSET_INVENTORY.md`;
   - the One UI/Figma reference section in this file;
   - `.design-reference/one-ui-figma/README.md` when present.

Treat **confirmed**, **proposed**, and **TBD** exactly as documented.
Never silently promote an assumption, proposal, or experiment into a confirmed decision.

---

## 2. Scope and repository safety

- Implement only:
  - the user's explicit request; and
  - the currently approved milestone/scope.
- Stop at explicit:
  - visual approval gates;
  - hardware gates;
  - data-integrity gates;
  - migration/cutover gates.
- Do not pre-build later milestones.
- Do not add placeholder screens or speculative features.
- Do not add firmware, Serial/BLE transport, capture, filtering, ML/inference,
  Raspberry Pi deployment, or mobile application work unless it belongs to the
  approved scope.
- Do not add ML runtimes such as:
  - PyTorch;
  - TensorFlow;
  - MediaPipe;
  - Ollama;
  - LLM runtimes;
  unless an ML/inference milestone explicitly requires them.
- Never discard, restore, overwrite, or reformat unrelated user work.
- Never use destructive Git commands merely to clean the worktree.
- Do not reset user-owned modifications to make a diff smaller.
- Avoid:
  - new top-level directories;
  - duplicate implementations;
  - unnecessary backup copies;
  - generated reports in tracked source;
  - new production dependencies;
  unless the task genuinely requires them.
- Temporary review and audit output belongs in an ignored location such as
  `.design-cache/`.
- Durable design-system reference indexes belong under `.design-reference/`.
- Never commit:
  - secrets;
  - session tokens;
  - credentials;
  - captured raw datasets;
  - dependency folders;
  - temporary build output;
  - generated screenshots;
  unless explicitly required.
- Do not claim complete sign-language translation or model accuracy without
  documented experimental evidence.

---

## 3. Supported environment and commands

Primary development environment:

- Windows PowerShell;
- Python 3.12;
- repository-local `.venv`;
- `uv`;
- Node/npm for the React frontend.

### Python

```powershell
# Create only when .venv does not already exist
uv venv --python 3.12 .venv

# Install Python project and test dependencies
uv pip install --python .\.venv\Scripts\python.exe -e ".[test]"

# Python tests
.\.venv\Scripts\python.exe -m pytest

# Smoke paths while these entry points exist
.\.venv\Scripts\python.exe -m app.desktop_collector.main --smoke-test
.\.venv\Scripts\python.exe -m app.desktop_collector.shell --smoke-test

# User-facing launcher
.\run_app.ps1
```

### React/Vite frontend

From `app/desktop_collector/web`:

```powershell
# Prefer npm ci when package-lock.json is authoritative.
# Use npm install only when intentionally changing dependencies.
npm ci
npm test
npm run build
npm run test:e2e
```

For live web review, use an exact loopback origin:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
.\.venv\Scripts\python.exe -m app.desktop_collector.shell --dev --vite-origin http://127.0.0.1:5173
```

If a documented command is stale:

1. inspect the current scripts/configuration;
2. use the real supported command;
3. update the relevant project documentation.

Do not silently invent a replacement command.

---

## 4. Architecture invariants

- `domain/`, `sources/`, `gestures.py`, and `acquisition.py` remain independent of:
  - Qt;
  - PyWebView;
  - FastAPI;
  - React.
- Every acquisition source implements `DataSource`.
- Blocking hardware/device reads run in source/acquisition workers, never:
  - the UI thread;
  - request handlers.
- Preserve independent:
  - timestamps;
  - sequence streams;
  per device.
- UI updates consume snapshots/batches rather than driving hardware reads.
- `server/app.py` owns the small REST/WebSocket bridge.
- Keep business logic in the framework-neutral core.
- Avoid unused route/module proliferation.
- `shell.py` owns:
  - loopback startup;
  - dynamic-port selection;
  - RAM-only session tokens;
  - window startup;
  - orderly shutdown;
  - port release.
- React application code belongs in:
  `app/desktop_collector/web/`.
- Technology-neutral visual tokens may live in:
  `app/frontend/shared/one-ui/`.
- `ui/qt_acquisition_adapter.py` is rollback glue.
  Do not expand it into a second full architecture.
- Do not duplicate:
  - parsing;
  - channel metadata;
  - gesture definitions;
  - protocol rules;
  across Python, React, simulator, and firmware.
- Maintain one documented contract.

---

## 5. Bridge security invariants

- Bind only to `127.0.0.1`.
- Use a dynamically selected port.
- Never bind the local bridge to `0.0.0.0`.
- Session tokens are RAM-only.
- Session tokens must never appear in:
  - files;
  - source;
  - browser storage;
  - URLs/query strings;
  - screenshots;
  - analytics;
  - logs.
- Authenticate protected REST and WebSocket connections before telemetry.
- Validate exact `Host` and `Origin`.
- Never use wildcard CORS.
- Never add a development bypass that weakens production bridge security.
- Shutdown must:
  - stop sources/workers;
  - close sockets;
  - stop Uvicorn;
  - close the shell;
  - release the port.

---

## 6. Hardware, protocol, and data integrity

- Do not change confirmed:
  - hardware;
  - pin maps;
  - power assumptions;
  - ADC assumptions;
  - I2C assumptions;
  - device roles;
  - transport;
  - Raspberry Pi responsibilities;
  without an explicit documented decision.
- Bring up one Flex channel end-to-end before scaling to all five Flex sensors.
- Use 115200 baud by default.
- Consider 460800 only after:
  - measured throughput evidence; and
  - explicit user approval.
- Never silently switch or auto-detect baud.
- Firmware and desktop parser share one versioned packet contract.
- Packet changes require synchronized updates to:
  - schema;
  - parser;
  - firmware;
  - fixtures;
  - tests;
  - migration notes.
- Preserve device timestamps and sequence values.
- Diagnose:
  - disconnects;
  - packet gaps;
  - resynchronization;
  - parse failures;
  - CRC failures;
  - sensor faults.
- Mark simulator packets `simulated=true`.
- Never mix simulated and real samples without explicit labeling.
- Treat `data/raw/<session_id>/` as:
  - append-only during capture;
  - immutable after finalization.
- Never reopen, rewrite, or silently overwrite a finalized raw session.
- Preserve one packet per raw record.
- Keep derived/calibration/export/review data separate from raw input.
- Derived data must never rewrite raw input.
- UI deletion moves data to `.trash/`.
- Do not permanently purge captured data in the MVP.
- Storage/schema changes require:
  - documentation;
  - recovery behavior;
  - tests.

---

## 7. One UI / Figma design source of truth

The Samsung One UI Figma reference is a first-class design-system source.

### 7.1 Local catalog location

The normalized local index is expected at:

```text
.design-reference/one-ui-figma/
```

Expected files may include:

```text
README.md
manifest.json
coverage.json
pages.json
variables.json
component-index.json
system-ui.json
icon-index.json
emoji-index.json
behind-the-scenes.json
recommended-smartglove-icons.json
query-map.json
```

The catalog is **read-only reference material**.

Do not edit, regenerate, normalize, or overwrite these JSON files unless the user
explicitly asks to refresh the Figma crawl.

Do not ship this entire reference catalog in the production application bundle.

### 7.2 Required discovery workflow

Before creating, redesigning, or approximating a visual component:

1. Search `.design-reference/one-ui-figma/`.
2. Start with:
   - `component-index.json`;
   - `variables.json`;
   - `system-ui.json`;
   - `icon-index.json`;
   - `behind-the-scenes.json`.
3. Identify the closest existing One UI component or asset.
4. Record the relevant Figma node ID.
5. If Figma tools are available, retrieve the exact design context for that node
   before implementation.
6. Adapt the One UI reference to the current React desktop application.
7. Reuse existing application primitives/tokens where they already match the
   reference.
8. Only create a custom component when no appropriate One UI component exists or
   when product-specific behavior genuinely requires it.

Do not invent a generic SaaS/dashboard component when a relevant One UI component
already exists in the catalog.

### 7.3 Figma context vs local JSON

Use the two sources differently:

- Local JSON catalog:
  - discovery;
  - node lookup;
  - component inventory;
  - token lookup;
  - variant lookup;
  - semantic asset selection.
- Live Figma context:
  - exact anatomy;
  - spacing;
  - geometry;
  - visual state;
  - vector/image asset export;
  - detailed implementation inspection.

The local JSON catalog is not a pixel-perfect replacement for Figma design context.

If Figma access is unavailable:

- use the local index and existing approved visual implementation;
- do not invent exact vector geometry from memory;
- do not claim an approximation is an exact Figma component.

### 7.4 Canonical One UI anchors

Prefer these indexed sources when relevant:

- Containers: `247:613`
- Card: `245:399`
- Dialog: `632:1999`
- Buttons: `1497:12222`
- Outlined/connected button: `1497:11308`
- Top App Bar: `1495:10992`
- Top App Bar variants: `1495:10623`
- Top Navigation: `1549:2831`
- Top Nav variants: `1540:31020`
- Header Container: `1549:8784`
- Header Container variants: `1549:8720`
- In-App Navigation variants: `1495:9649`
- Navigation Rail variants: `1316:9262`
- App Dock / Bottom Bar: `1491:8142`
- Floating Toolbar: `1495:11133`
- Toast: `479:8075`
- Search: `1497:12549`
- Sliders: `1493:8572`
- Action Bar: `1589:4316`
- Top slide navigation: `1491:6522`
- Now Bar: `744:3579`
- Now Bar content/live activity: `744:3582`
- Expanded live notification: `838:4032`

These IDs are lookup anchors, not instructions to blindly reproduce mobile geometry.

### 7.5 Typography and color foundation

The indexed One UI kit reports `One UI Sans APP VF` with the following hierarchy:

- Title: 36 / 700
- Heading: 24 / 600
- Subtitle: 20 / 700
- Subheading: 18 / 400
- Body: 14 / 400

Canonical indexed colors include:

- Primary: `#387AFF`
- Secondary: `#848487`
- Dark background: `#010102`
- Dark container: `#17171A`
- Dark foreground: `#2E2E30`
- Dark component: `#5F5F61`
- Light background: `#F1F1F3`
- Light container: `#FCFCFF`
- Light component: `#EAEAEA`
- White: `#FFFFFF`
- Black: `#000000`

Do not distribute or extract proprietary Samsung font binaries from the repository
or tool environment.

Use an already licensed/local application font if available.
Otherwise preserve an appropriate fallback stack while matching the Figma
typographic scale and hierarchy.

### 7.6 Icon and vector policy

- Prefer exact One UI/Figma assets over hand-drawn approximations.
- Search `icon-index.json` before introducing a new icon.
- If an exact Figma node exists:
  - use that node as the canonical source;
  - obtain the exact asset through Figma when possible.
- Do not hard-code short-lived Figma asset URLs.
- Store production-approved local assets only in the established application asset
  directories.
- Do not copy the full Figma icon library into runtime assets.
- Do not introduce generic icon libraries solely to replace available One UI icons.

Useful indexed anchors include:

- `hand_writing`: `340:8368`
- `nearby_devices`: `340:8777`
- `health tracker color`: `515:917`
- `wearable robot gray`: `515:1201`
- `equalizer`: `341:17`
- `samsung_account`: `340:8641`
- `settings_outline`: `340:8609`
- `brightness`: `341:154`
- `dark`: `340:8346`

Choose icons semantically; do not force an icon merely because it exists.

---

## 8. UI and asset rules

### 8.1 Protected reference material

Treat these as protected source/reference material unless the user explicitly
requests changes:

- `app/frontend/index.html`
- `app/frontend/desktop/`
- `app/frontend/mobile/`

Use established Vite aliases for production assets and shared tokens.

Do not:

- duplicate assets unnecessarily;
- vendor generated CSS;
- bundle `.design-cache/one-ui/*.svg`;
- import `.design-reference/one-ui-figma/*.json` into the production frontend.

`.design-cache/` is temporary reference/audit material.
`.design-reference/` is durable design-system reference material.
Neither directory is a runtime application source.

### 8.2 Approved visual direction

Preserve the currently approved SmartGlove visual direction unless the user's
approved task explicitly changes it.

The application should remain:

- tablet/desktop-first;
- recognizably Samsung/One UI inspired;
- more expressive than a generic SaaS dashboard;
- suitable for technical sensor/data collection;
- consistent across Device Manager and Live Monitor.

Design inspiration may guide composition, but Figma remains the component-system
source of truth.

Use:

- Figma / One UI kit for:
  - component anatomy;
  - geometry;
  - variants;
  - tokens;
  - icon assets;
  - state behavior.
- Samsung Health / Galaxy Store / Gaming Hub references for:
  - composition;
  - visual rhythm;
  - selective expressiveness;
  - scroll/header behavior;
  - content emphasis.
- SmartGlove product requirements for:
  - information architecture;
  - telemetry semantics;
  - sensor colors;
  - device actions;
  - data density.

Do not copy unrelated Samsung application content or branding.

### 8.3 Global component-system consistency

UI changes must consider the full system, not only the touched element.

Audit consistency across:

- typography;
- heading hierarchy;
- app bars;
- top navigation;
- Now Bar/live activity;
- bottom/in-app navigation;
- cards;
- device cards;
- buttons;
- icon buttons;
- segmented controls;
- chips;
- inputs;
- dialogs;
- menus;
- toasts/snackbars;
- Raw Signals panel;
- chart controls;
- chart legends;
- hover/focus/pressed/disabled states;
- spacing;
- radius;
- surface hierarchy;
- blur/elevation;
- responsive behavior.

Avoid isolated polish that creates a visually inconsistent neighboring component.

### 8.4 Interaction and accessibility

Maintain:

- light/dark parity;
- keyboard focus;
- keyboard navigation;
- reduced-motion behavior;
- readable contrast;
- accessible labeling;
- non-color-only distinction between left/right glove data;
- useful touch/click target sizes.

Keep one theme control unless the user explicitly requests a different scheme.

Do not introduce a square initials/lettermark logo unless explicitly requested.

Favor generous, intentional spacing over cramped text.

Tooltips, menus, and popovers must:

- remain inside the viewport when practical;
- avoid covering critical page content unnecessarily;
- not alter layout geometry simply because they appear;
- have clear trigger/focus behavior.

### 8.5 Device Manager

Preserve functional behavior while improving component fidelity.

Device cards should use a coherent One UI card hierarchy:

- clear title/status relationship;
- balanced content spacing;
- proportionate connect/disconnect actions;
- consistent icon size;
- clear selected/connected/disconnected states;
- restrained decorative effects.

Do not redesign Device Manager into a different product.

### 8.6 Live Monitor

Preserve the approved chart-first layout unless explicitly changed.

Maintain:

- two-hand readability;
- all required channels;
- left/right distinction;
- pause/follow/zoom semantics;
- legible legends;
- stable chart geometry.

Raw Signals and chart controls should remain compact and secondary to the data.

Avoid unnecessary sliders, chrome, or control density that does not support a real
interaction.

### 8.7 Responsive review

For material visual changes, review at minimum:

- 1280×720;
- 1440×900.

Also check at least one narrower/tablet/portrait layout when responsive behavior is
affected.

When practical, validate both themes.

---

## 9. Visual implementation workflow

For any material UI redesign/refinement:

### Stage A — Audit

Before editing:

1. inspect the current rendered UI;
2. identify the components being changed;
3. map each component to:
   - an existing local app component/token;
   - the closest indexed Figma node;
   - the proposed adaptation.
4. identify protected behavior that must not change.

### Stage B — Reusable foundation first

When several screens share the same issue, fix reusable primitives before
screen-specific CSS.

Prefer this order:

1. typography/tokens;
2. shared controls;
3. card/surface primitives;
4. app/navigation bars;
5. feedback/overlay primitives;
6. screen-specific composition.

Avoid one-off CSS patches when a shared primitive is the real problem.

### Stage C — Implement minimally

- Preserve behavior unless the task requires behavior changes.
- Avoid unrelated refactors.
- Keep source authoritative.
- Do not edit a generated production build as the primary implementation.
- Avoid duplicated CSS rules and screen-specific overrides that fight shared tokens.

### Stage D — Render from the real app

All visual review evidence must come from the actual implementation.

Allowed:

- Playwright screenshot of the real React/Vite app;
- screenshot of the actual PyWebView-hosted UI;
- sandbox/browser render of the actual source.

Not allowed:

- AI-generated mock screenshots;
- decorative re-creations pretending to be app output;
- manually composited images presented as implementation evidence.

### Stage E — User visual gate

If the user has requested visual approval:

- stop after producing the requested review renders;
- clearly state what changed;
- do not continue into unrelated redesigns;
- do not push/merge/release unless explicitly authorized.

---

## 10. Figma-to-code implementation rules

When implementing from a referenced Figma node:

1. Retrieve design context for the exact node when available.
2. Inspect current code before generating replacements.
3. Map Figma properties to existing application primitives/tokens.
4. Adapt mobile dimensions to desktop/tablet context where needed.
5. Preserve semantic HTML and accessibility.
6. Preserve established React state/behavior unless change is required.
7. Prefer CSS/tokens over rasterizing UI components.
8. Use SVG/image exports only for assets that genuinely need them.
9. Do not encode Figma export URLs into source.
10. Verify the actual rendered result against:
    - Figma reference;
    - current approved composition;
    - responsive constraints.

"Figma-grounded" does not mean "blind pixel copy."
It means the implementation is traceable to the correct One UI source and adapted
deliberately to this product.

---

## 11. Cutover gate

`run_app.ps1` is the user-facing launcher.

Do not switch its implementation while the milestone tracker records an unapproved
cutover gate.

Before removing any of the following:

- PySide;
- PyQtGraph;
- pytest-qt;
- Qt tests;
- rollback adapters;

list the exact files/dependencies and obtain direct user approval.

Perform approved cleanup as a dedicated change with:

- startup verification;
- test verification;
- build verification;
- clean shutdown verification.

Do not combine architecture cutover with unrelated visual/features work.

---

## 12. Verification

Run the smallest relevant checks while iterating and the full affected suite before
handoff.

Never claim a check passed unless it actually ran successfully.

### Backend/core changes

Run:

- relevant pytest tests;
- affected smoke path.

### Bridge changes

Verify:

- authentication;
- exact `Host`;
- exact `Origin`;
- lifecycle;
- disconnect behavior;
- clean shutdown;
- port release.

### React changes

Run, where applicable:

- Vitest;
- TypeScript/build;
- relevant Playwright tests;
- accessibility checks;
- visual checks.

### Acquisition changes

Verify, where applicable:

- independent sources;
- packet loss behavior;
- pause without stopping acquisition;
- sustained-rate responsiveness;
- timestamps/sequences.

### Final repository review

Before handoff inspect:

```text
git diff --check
git status --short
git diff
```

Check for:

- unintended files;
- copied assets;
- generated artifacts;
- secrets;
- dependency output;
- scope expansion;
- accidental Figma-reference edits.

---

## 13. Documentation and handoff

Record material changes in:

- `CHANGELOG.md`;
- `docs/SESSION_LOG.md`.

Update `PROJECT_MILESTONE_TRACKER.md` only when evidence shows an actual
milestone/gate status change.

After every material:

- code change;
- architecture change;
- UI change;
- dependency change;
- test change;
- milestone change;
- user decision;
- visual approval;
- gate change;

update `docs/WORK_SESSION_HANDOFF.md` in the same session.

Keep the handoff accurate about:

- current snapshot;
- tests actually run;
- unverified items;
- protected scope;
- current approval status;
- next gate.

Final handoff must list:

- changed files;
- delivered behavior;
- commands/tests and results;
- unverified items;
- remaining risks;
- next gate.

Never hide failures.
Never leave silent placeholders.
Never report an unrun test as passed.

---

## 14. Git and release discipline

- Do not push unless the user explicitly asks.
- Do not merge unless the user explicitly asks.
- Do not rewrite history unless explicitly approved.
- Do not create release tags unless explicitly requested.
- Do not commit generated sandbox screenshots unless explicitly requested.
- Preserve user-owned worktree changes.
- Keep commits scoped and reviewable.
- Do not use a cleanup commit to hide unrelated source changes.

If the user requests a push:

1. verify the intended remote and branch;
2. review `git status --short`;
3. review the complete staged diff;
4. run the required checks;
5. push only the approved scope.

---

## 15. Decision priority

When instructions conflict, use this priority:

1. explicit current user instruction;
2. safety/data-integrity/security constraints;
3. active milestone/gate in canonical project documentation;
4. architecture invariants in this file;
5. approved visual direction;
6. Figma/One UI design-system reference;
7. existing implementation conventions;
8. convenience.

If a requested action would violate a higher-priority constraint, stop and report
the conflict instead of silently choosing a lower-priority rule.
