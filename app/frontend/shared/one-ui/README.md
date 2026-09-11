# Shared One UI visual contract

This directory is the minimal technology-neutral design contract for SmartGlove desktop and future mobile surfaces. It is intentionally not a component library, package, reset, or asset store.

## Files

- `tokens.css`: semantic light/dark colors, typography, spacing, radius, control size, elevation and frosted-surface parameters.
- `motion.css`: durations and easing with reduced-motion overrides.

## Source priority

1. Accessibility and working application behavior.
2. Approved local One UI 7 references:
   - `.design-cache/one-ui/one-ui-master.svg`
   - `.design-cache/one-ui/one-ui-secondary.svg`
3. Desktop data-collector requirements.
4. Desktop/DeX preview hierarchy as layout inspiration only.
5. Adaptive behavior references.
6. Select implementation ideas from OneUI-Web.

The two giant SVGs are design references only. They must never be imported into an application or production bundle.

## Theme contract

Load `tokens.css` before application CSS. Light is the default. Set `data-theme="dark"` on the document root for dark mode:

```js
document.documentElement.dataset.theme = "dark";
```

Consumers must load their own licensed font files. `--ou-font-family` prefers the repository's existing DM Sans and falls back to Segoe UI; this directory contains no font or icon copy.

## Accessibility invariants

- Use `--ou-color-accent-filled` with `--ou-color-on-accent` for text-bearing filled controls. The reference `--ou-color-accent` is not assumed to support white text.
- Normal text must meet at least 4.5:1 contrast; large text and UI boundaries must meet at least 3:1.
- State must never rely on color alone.
- Interactive targets should use `--ou-control-height` or an equivalent minimum target.
- Consumers must preserve visible `:focus-visible` treatment.
- Motion must use the shared duration tokens so `prefers-reduced-motion` is effective.
- Frosted surfaces must remain legible when blur/transparency is unavailable or reduced.

## Adoption boundary

The React collector is the D.2 pilot. The desktop and mobile prototypes remain user-owned references and do not import this contract until separately approved. Application components, layout breakpoints, business state and platform-specific behavior stay local to each app.

## External implementation reference

The `--ou-ease-standard` value is the `easeOutCubic` curve selectively inspected from [SamsungInternet/OneUI-Web](https://github.com/SamsungInternet/OneUI-Web/tree/b20b1dd7b4094e2c501a6d9712d1c8f2fc77a52f), pinned at commit `b20b1dd7b4094e2c501a6d9712d1c8f2fc77a52f`.

OneUI-Web is MIT licensed:

> Copyright (c) 2019 Diego. Permission is granted under the MIT License; the software is provided without warranty.

No `oui.css`, reset, `.container`, component class, CDN resource, icon, or Samsung font is imported. OneUIX (AGPL-3.0) and Android-Dex (closed-source application with no published application-code license in its repository) contribute no code, asset, dependency, or theme.
