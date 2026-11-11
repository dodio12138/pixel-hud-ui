# Integrating Pixel HUD UI

Recipes for getting the kit into a project. Pick the section for the stack;
the token list at the end is the contract every recipe maps onto.

## Contents

- [Plain HTML](#plain-html)
- [Mapping an app's colors](#mapping-an-apps-colors)
- [Tailwind CSS](#tailwind-css)
- [shadcn/ui](#shadcnui)
- [React and Next.js](#react-and-nextjs)
- [Vue and Svelte](#vue-and-svelte)
- [Scoping to one area](#scoping-to-one-area)
- [No-flash toggle](#no-flash-toggle)
- [Self-hosted fonts](#self-hosted-fonts)
- [Token contract](#token-contract)

## Plain HTML

```html
<html data-skin="pixel" data-hud-palette="starward">
<head>
  <link rel="stylesheet" href="hud/fonts.css">
  <link rel="stylesheet" href="hud/palettes.css">
  <link rel="stylesheet" href="hud/pixel-hud.css">
</head>
<body>
  <section class="hud-panel">
    <div class="hud-titlebar"><h2>Status</h2></div>
    <div class="hud-panel__body">…</div>
  </section>
  <script src="hud/pixel-caret.js"></script>
</body>
</html>
```

## Mapping an app's colors

Keep the app's brand and add the framework: map its variables onto the
`--hud-*` tokens in one block, scoped to the skin so nothing changes while it
is off. Leave out `palettes.css` (or don't set `data-hud-palette`).

```css
[data-skin="pixel"] {
  --hud-bg: var(--app-background);
  --hud-panel: var(--app-surface);
  --hud-hover: var(--app-surface-hover);
  --hud-selected: var(--app-surface-active);
  --hud-border: var(--app-border);
  --hud-text: var(--app-foreground);
  --hud-text-muted: var(--app-foreground-secondary);
  --hud-text-dim: var(--app-foreground-tertiary);
  --hud-accent: var(--app-primary);
  --hud-accent-contrast: var(--app-primary-foreground);
  /* Optional: a brighter title bar than the accent, and the status colors. */
  --hud-bar: var(--app-primary);
  --hud-bar-text: var(--app-primary-foreground);
  --hud-green: var(--app-success);
  --hud-red: var(--app-destructive);
}
```

Then check it: copy the resolved hex values into a small CSS block (the script
only reads hex) and run `node scripts/check-contrast.mjs that.css`.

If the app's colors fail (a typical light theme's border is too faint for 1px
rules), override just those tokens under the skin rather than changing the app.

## Tailwind CSS

The framework is plain CSS and works next to Tailwind utilities. Two things to know:

- Load `pixel-hud.css` after Tailwind's base layer (in v4: after `@import "tailwindcss";`
  in the main stylesheet; in v3: after `@tailwind base`), so its globals apply.
- `rounded-*` utilities are overridden inside the skin by design.

To use the tokens from utilities, expose them as theme colors:

```css
/* Tailwind v4 */
@theme {
  --color-hud-bg: var(--hud-bg);
  --color-hud-panel: var(--hud-panel);
  --color-hud-border: var(--hud-border);
  --color-hud-text: var(--hud-text);
  --color-hud-accent: var(--hud-accent);
  --color-hud-bar: var(--hud-bar);
  --color-hud-green: var(--hud-green);
}
```

```js
// Tailwind v3: tailwind.config.js
theme: { extend: { colors: {
  hud: { bg: "var(--hud-bg)", panel: "var(--hud-panel)", border: "var(--hud-border)",
         text: "var(--hud-text)", accent: "var(--hud-accent)", bar: "var(--hud-bar)", green: "var(--hud-green)" },
} } }
```

Layout stays in utilities (`flex gap-2 p-3`); roles go in `hud-*` classes.

## shadcn/ui

shadcn stores HSL channels without `hsl()`. Map them like this:

```css
[data-skin="pixel"] {
  --hud-bg: hsl(var(--background));
  --hud-panel: hsl(var(--card));
  --hud-hover: hsl(var(--accent));
  --hud-selected: hsl(var(--muted));
  --hud-border: hsl(var(--border));
  --hud-text: hsl(var(--foreground));
  --hud-text-muted: hsl(var(--muted-foreground));
  --hud-text-dim: hsl(var(--muted-foreground));
  --hud-accent: hsl(var(--primary));
  --hud-accent-contrast: hsl(var(--primary-foreground));
  --hud-red: hsl(var(--destructive));
}
```

Newer shadcn themes use `oklch(...)` values directly: then `var(--background)` without `hsl()`.

Add the classes through `className` on shadcn components:
`<Button className="hud-btn is-solid" data-intent="go">`,
`<Card className="hud-panel">` with `<CardHeader className="hud-titlebar">`,
`<Switch className="hud-switch">` needs the knob span, so for switches prefer
the framework's own markup or keep shadcn's and style its thumb with
`[data-skin="pixel"] [role=switch] > span { … }` following the spec.

## React and Next.js

Import the CSS once in the root layout:

```tsx
// app/layout.tsx (Next.js App Router)
import "./hud/fonts.css";
import "./hud/palettes.css";
import "./hud/pixel-hud.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-skin="pixel" data-hud-palette="starward" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

Next.js can't `@import` remote URLs from bundled CSS in every setup; if the
fonts don't load, self-host them (below).

The caret: either keep `data-pixel-caret` on the field and load
`pixel-caret.js` once (it watches for new fields), or attach per component:

```tsx
import { useEffect, useRef } from "react";

export function CommandInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const detach = (window as any).PixelCaret?.attach(ref.current);
    return () => detach?.();
  }, []);
  // A value set from code fires no input event: re-place the caret.
  useEffect(() => { (ref.current as any)?.__pixelCaret?.update(); }, [value]);
  return (
    <div className="hud-input">
      <textarea ref={ref} data-pixel-caret value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
```

## Vue and Svelte

Same CSS imports in `main.ts` (Vue) or the root `+layout.svelte` (SvelteKit).
For the caret, call `PixelCaret.attach(el)` in `onMounted` / `onMount` and the
returned function in `onUnmounted` / the cleanup.

## Scoping to one area

Put `data-skin="pixel"` (and `data-hud-palette`) on a container instead of
`<html>`: only its descendants change. Full-screen scanlines are only drawn for
the `<html>` case; in a container add `.hud-scanlines` to the element that
should carry them.

## No-flash toggle

For a switchable look, set the attributes before the page paints, from the
saved choice:

```html
<script>
  try {
    var s = localStorage.getItem("hud-skin");      // "pixel" or null
    var p = localStorage.getItem("hud-palette");   // "starward" | "terminal" | "paper"
    if (s === "pixel") document.documentElement.dataset.skin = "pixel";
    if (p) document.documentElement.dataset.hudPalette = p;
  } catch (e) {}
</script>
```

Put it inline in `<head>`, before the stylesheets. Turning the skin off is
removing the attribute: `delete document.documentElement.dataset.skin`. With
React hydration, add `suppressHydrationWarning` to `<html>`.

## Self-hosted fonts

```bash
npm i @fontsource/fusion-pixel-12px-proportional-sc@5.3.0 @fontsource/fusion-pixel-12px-monospaced-sc@5.3.0
```

```ts
import "@fontsource/fusion-pixel-12px-proportional-sc/400.css";
import "@fontsource/fusion-pixel-12px-monospaced-sc/400.css";
```

and drop `fonts.css`. Each font is about 600 KB (woff2), downloaded only once
text uses it.

## Token contract

| Token | Role |
| --- | --- |
| `--hud-bg`, `--hud-panel`, `--hud-hover`, `--hud-selected` | Surfaces, darkest to most raised (dark palettes) |
| `--hud-border` | 1px rules |
| `--hud-text`, `--hud-text-muted`, `--hud-text-dim` | Text levels |
| `--hud-accent`, `--hud-accent-contrast` | Interactive emphasis and text on it |
| `--hud-bar`, `--hud-bar-text` | Title bars, selection, lit keys (default: the accent) |
| `--hud-bar-soft`, `--hud-bar-line` | Table / code head tint and its rule (derived) |
| `--hud-green`, `--hud-green-contrast` | On / emphasis / focus, and text on a green key |
| `--hud-yellow`, `--hud-orange`, `--hud-red`, `--hud-info` | Values, notes, danger, second action color |
| `--hud-scanline` | Scanline darkness (`transparent` to hide) |
| `--hud-font`, `--hud-font-mono` | Pixel faces with CJK fallbacks |
| `--hud-space-1…7`, `--hud-text-xs…xl`, `--hud-control-sm/md/lg`, `--hud-shadow` | Scale (rarely changed) |
