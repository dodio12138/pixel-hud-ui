---
name: pixel-hud-ui
description: Pixel HUD UI, a complete UI framework in a retro flight-computer / game-HUD style (pixel CJK font, square 1px-ruled panels with sky title-bar strips, CRT scanlines, intent-colored solid keys, lamp switches, segmented gauges), with a design spec for every control (sizes, states, usage, accessibility) and a drop-in CSS kit. Use it to design or build a new interface in this style, or to restyle an existing web app (plain HTML, React, Next.js, Vue, Svelte, Tailwind, shadcn/ui) into it. Use it whenever the user wants a pixel-art, 8-bit, retro game HUD, cockpit, terminal or sci-fi console look, a "game UI" for a dashboard or tool, or mentions 像素风, 像素 HUD, 复古终端, 游戏 HUD 风格, 飞行计算机界面, even when they don't name the framework.
---

# Pixel HUD UI

A UI framework, not just a color theme. It has three layers, and a good result
uses all three:

1. **Foundations**: a 4px grid, a type scale tuned to a 12px pixel face, color
   *roles* (each color means one thing), 1px rules instead of shadows, step-wise motion.
2. **Controls**: panels and title bars, keys (buttons) with intents, icon keys,
   tabs, segmented controls, list rows, form fields, inputs, selects, square
   checkboxes and radios, lamp switches, gauge sliders, progress gauges, lamps,
   tags, badges, keycaps, menus, tooltips, dialogs, toasts, tables, code
   blocks, prose, loaders, empty states. Each has fixed sizes and one shared
   state model (hover, pressed, focus, selected, disabled, loading, error).
3. **Palettes**: `--hud-*` tokens, so the framework sits on any colors,
   including the app's own brand.

## Files

| File | What it is |
| --- | --- |
| `references/design-system.md` | **The spec.** Principles, foundations, and every control's anatomy, sizes, states, when to use it, and accessibility. Read it before designing. |
| `assets/pixel-hud.css` | The implementation: tokens, light globals under `[data-skin="pixel"]`, and the `hud-*` control classes |
| `assets/palettes.css` | `starward` (deep space, dark), `terminal` (grey-green, dark), `paper` (warm sand, light) |
| `assets/fonts.css` | Fusion Pixel 12px (OFL), pinned on jsDelivr; or self-host via `@fontsource` |
| `assets/pixel-caret.js` | Optional 3px block caret for text fields (`data-pixel-caret`) |
| `assets/demo.html` | Every control in every state, with a palette switcher: the visual reference |
| `references/integration.md` | Per-stack recipes: mapping an app's colors, Tailwind, shadcn/ui, React/Next, Vue, scoping, no-flash toggle, self-hosted fonts |
| `scripts/check-contrast.mjs` | WCAG check for any palette: `node scripts/check-contrast.mjs my.css` |

## Workflow

### 1. Read the spec and the demo

Read `references/design-system.md` (at least Principles, Foundations and the
controls the task needs) and look at `assets/demo.html`. The spec says *why*
each control looks the way it does; following it is what makes a screen read
as this framework rather than "a dark theme with a pixel font".

### 2. Look at the project

Before copying anything, find out:
- the stack and where global CSS loads (layout file, `main.ts`, `index.html`, Tailwind entry);
- how colors are defined today (CSS custom properties, Tailwind theme, shadcn's HSL variables, hex in components);
- whether this is a new UI or a restyle, the app's only look or a switchable theme, the whole page or one area.

These decide the color mapping (step 4) and keep you from fighting the app's styles.

### 3. Add the kit

Copy `pixel-hud.css`, `fonts.css`, `palettes.css` (if a bundled palette is used)
and `pixel-caret.js` (if the app has text inputs) into the project. Load order:
fonts → palettes → `pixel-hud.css`, after the app's own base styles.

### 4. Choose colors

- **A bundled palette**: `data-hud-palette="starward" | "terminal" | "paper"`.
- **The app's own colors**: one block maps its variables onto `--hud-*`
  (`references/integration.md` › Mapping an app's colors). Keeps the brand, adds the framework.
- **A new palette**: follow "新建一套配色" in the spec.

Then run `node scripts/check-contrast.mjs <file>` on any palette you wrote or
mapped, and fix every FAIL: the controls depend on the bar, text and green
colors being readable on every surface.

### 5. Turn it on

```html
<html data-skin="pixel" data-hud-palette="starward">
```

A switchable theme sets these before first paint (`references/integration.md`
› No-flash toggle). To style one area only, put both attributes on its container.

### 6. Build with the controls

The globals already handle type, square corners, native inputs, selects, range
sliders, checkboxes, scrollbars, focus rings, selection and scanlines. Give each
element its role with a class, following the spec for size and state:

| Need | Control (class) |
| --- | --- |
| Group related info | `.hud-panel` + `.hud-titlebar` (+ `.hud-titlebar__actions`), body `.hud-panel__body`, sections `.hud-subhead` |
| Main action | `.hud-btn.is-solid` (intent: `accent`, `go`, `warn`, `info`, `danger`) |
| Secondary action | `.hud-btn` |
| Icon-only action | `.hud-icon-btn` + `aria-label` |
| Switch views | `.hud-tabs > .hud-tab[aria-selected]` |
| Pick one of 2–5 values | `.hud-segmented > button[aria-pressed]` |
| Navigable list | `.hud-row[aria-current]` |
| A labelled input | `.hud-field > .hud-label + input/select + .hud-help / .hud-error` |
| Dropdown | `.hud-select > select` |
| Yes/no, one of many | `.hud-check`, `.hud-radio` (square marks) |
| Instant on/off | `button.hud-switch[role=switch][aria-checked] > .hud-switch__knob` |
| Level / progress | `.hud-gauge` + `--value` (`data-state` warn/alert) |
| Status | `.hud-lamp[data-state]` |
| Value, ID, parameter | `.hud-tag`; counts `.hud-badge`; keys `kbd` |
| Menus, hints, modal, feedback | `.hud-menu`, `.hud-tooltip`, `.hud-backdrop > .hud-dialog`, `.hud-toasts > .hud-toast` |
| Data, code, articles | `table.hud-table`, `.hud-code`, `.hud-prose` |
| Command / chat input | `.hud-input` + `data-pixel-caret` |
| Waiting, nothing to show | `.hud-loader`, `aria-busy` on a key, `.hud-empty` |

Put classes in the component source (JSX, templates), passing them through a
component library's `className`/`class` prop, rather than writing selectors
against framework internals: they survive refactors and read clearly.

When restyling an existing app, map each existing component to the table above
first (a short list in your reply helps the user follow), then apply it.

### 7. Check the result

- Screenshot the page (or open it) and compare with `assets/demo.html`.
- Confirm the pixel font loaded (`document.fonts`, Network tab); a CSP may block jsDelivr, then self-host.
- Tab through: every control reachable, 1px green focus rings visible.
- Walk the state model on the main controls: hover, pressed, disabled, loading, error.
- Contrast script passes for the palette in use.

## The rules that matter most

The spec has the full reasoning; these are the ones most often broken:

- **Square and flat.** No radius, no blur shadows, no gradients except scanlines. Only overlays get the hard offset shadow.
- **Colors keep their jobs.** Bar = structure and selection; green = on, emphasis, focus; yellow = values; orange = notes and warnings; red = danger. Green used as decoration stops meaning "on".
- **Selected = inverted.** Bar fill with dark text; rows add a 3px green edge. On a bar-colored background, hover inverts the other way.
- **One solid main action per area**; side-by-side actions each get their own intent color and **keep it when disabled** (fade, don't outline).
- **Title bars head panels only.** Table and code heads use the soft tint `--hud-bar-soft`.
- **Sizes come from the scale**: controls 24/28/32px, spacing on the 4px grid, text 12/14/16/24/36px.

## Pitfalls

- The framework forces `border-radius: 0 !important` in its scope. Keep something round (an avatar) by scoping the skin to a container that excludes it.
- `color-mix()` needs Chrome/Edge 111, Safari 16.2, Firefox 113; for older browsers set `--hud-bar-soft` / `--hud-bar-line` to plain colors.
- A class that sets `display` would show `hidden` elements; the framework re-hides `[hidden]` inside its scope, so prefer the `hidden` attribute for toggling.
- Frameworks that set a field's value from code don't fire `input`; call `field.__pixelCaret.update()` after such a change if the caret must move at once.
- Scanlines sit at a very high z-index with `pointer-events: none`; turn them off with `data-hud-scanlines="off"` where they get in the way (screenshots, canvas apps).
