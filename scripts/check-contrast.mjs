#!/usr/bin/env node
// Checks a Pixel HUD palette's contrast (WCAG 2.x) before you ship it.
//
//   node scripts/check-contrast.mjs                       every palette in assets/palettes.css
//   node scripts/check-contrast.mjs path/to/my.css        every block in that file that sets --hud-* tokens
//   node scripts/check-contrast.mjs path/to/my.css mine   only blocks whose selector mentions "mine"
//
// Each block is merged over the defaults in assets/pixel-hud.css, so a block
// may set only the tokens it changes. Text needs 4.5:1 on every surface it can
// sit on; borders and the green "on" color need 3:1 against the page (WCAG
// non-text contrast). Values must be hex colors (#rgb or #rrggbb) to be
// checked; anything else (var(), color-mix()) is reported as skipped.
// Exits 1 when a pair fails. No dependencies.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skinPath = join(here, "..", "assets", "pixel-hud.css");
const target = process.argv[2] ?? join(here, "..", "assets", "palettes.css");
const filter = process.argv[3];

/** Blocks of `selector { … }` that set --hud-* tokens, with those tokens. */
function tokenBlocks(css) {
  const blocks = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const [, selector, body] of css.matchAll(pattern)) {
    const tokens = {};
    for (const [, name, value] of body.matchAll(/--hud-([\w-]+)\s*:\s*([^;]+);/g)) tokens[name] = value.trim();
    if (Object.keys(tokens).length) blocks.push({ selector: selector.replace(/\/\*[\s\S]*?\*\//g, "").trim(), tokens });
  }
  return blocks;
}

function luminance(hex) {
  let digits = hex.slice(1);
  if (digits.length === 3) digits = [...digits].map((d) => d + d).join("");
  const [r, g, b] = digits.match(/../g).map((part) => {
    const v = parseInt(part, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const isHex = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value ?? "");

const defaults = Object.assign({}, ...tokenBlocks(readFileSync(skinPath, "utf8")).filter((b) => b.selector.includes(":root")).map((b) => b.tokens));
// The skin derives these from the accent when a palette leaves them out.
const derived = { bar: "accent", "bar-text": "accent-contrast" };

const checks = [
  ...["text", "text-muted", "text-dim", "accent"].flatMap((fg) => ["bg", "panel", "hover", "selected"].map((bg) => [fg, bg, 4.5])),
  ["yellow", "bg", 4.5], ["yellow", "panel", 4.5],
  ["bar-text", "bar", 4.5],
  ["accent-contrast", "accent", 4.5],
  ["green-contrast", "green", 4.5],
  ["green", "bg", 3], ["border", "bg", 3],
];

let failed = 0;
const blocks = tokenBlocks(readFileSync(target, "utf8")).filter((b) => !filter || b.selector.includes(filter));
if (blocks.length === 0) {
  console.error(`No blocks with --hud-* tokens${filter ? ` matching "${filter}"` : ""} in ${target}`);
  process.exit(2);
}
for (const block of blocks) {
  const tokens = { ...defaults, ...block.tokens };
  for (const [name, from] of Object.entries(derived)) if (!block.tokens[name] && !isHex(tokens[name])) tokens[name] = tokens[from];
  console.log(`\n${block.selector}`);
  for (const [fg, bg, min] of checks) {
    const a = tokens[fg];
    const b = tokens[bg];
    if (!isHex(a) || !isHex(b)) {
      console.log(`  skip  ${fg} on ${bg}: not hex (${a} / ${b})`);
      continue;
    }
    const ratio = contrast(a, b);
    const ok = ratio >= min;
    if (!ok) failed += 1;
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${fg.padEnd(15)} on ${bg.padEnd(8)} ${ratio.toFixed(2).padStart(5)}:1  (needs ${min})`);
  }
}
console.log(failed ? `\n${failed} pair(s) below the minimum.` : "\nAll pairs pass.");
process.exit(failed ? 1 : 0);
