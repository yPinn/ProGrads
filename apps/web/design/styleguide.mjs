// tokens.json → styleguide.html: self-contained visual reference (colours, type, spacing,
// radius, motion). Open in a browser, or import to Figma via html.to.design. Run: node design/styleguide.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const t = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));

// Resolve {a.b.c} against the primitive set; pass through literals.
const val = (v) => {
  if (typeof v !== "string" || !/^\{.+\}$/.test(v)) return v;
  let n = t.primitive;
  for (const p of v.replace(/[{}]/g, "").split(".")) n = n?.[p];
  return n?.$value;
};
// eslint-disable-next-line no-unused-vars
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const SAMPLE = "研究所備考 ProGrads Ag";

// --- Colours ---
const ramp = (name, shades) =>
  `<div class="ramp"><div class="ramp-name">${name}</div><div class="row">${Object.entries(shades)
    .filter(([, v]) => v.$value)
    .map(
      ([k, v]) =>
        `<div class="sw"><div class="chip" style="background:${v.$value}"></div><b>${k}</b><code>${v.$value}</code></div>`,
    )
    .join("")}</div></div>`;

const colorRampEntries = Object.entries(t.primitive.color).filter(([, v]) => !v.$value);
const colorRamps = colorRampEntries.map(([name, shades]) => ramp(name, shades)).join("");

const semanticPanel = (set, dark) => {
  const rows = Object.entries(t[set].color)
    .map(
      ([k, v]) =>
        `<div class="srow"><span class="dot" style="background:${val(v.$value)}"></span><b>${k}</b><code>${val(v.$value)}</code></div>`,
    )
    .join("");
  return `<div class="sem ${dark ? "sem-dark" : ""}"><div class="sem-h">${dark ? "Dark" : "Light"}</div>${rows}</div>`;
};

// --- Typography ---
const typeStyles = [];
for (const [group, items] of Object.entries(t.typography).filter(([k]) => !k.startsWith("$")))
  for (const [name, tok] of Object.entries(items)) {
    const v = tok.$value;
    const css = `font-family:'${val(v.fontFamily)}',serif;font-weight:${val(v.fontWeight)};font-size:${val(v.fontSize)};line-height:${val(v.lineHeight)};letter-spacing:${val(v.letterSpacing)};text-transform:${v.textCase || "none"}`;
    const spec = `${val(v.fontFamily)} · ${val(v.fontSize)} · ${val(v.fontWeight)} · lh ${val(v.lineHeight)} · ls ${val(v.letterSpacing)}`;
    typeStyles.push(
      `<div class="ty"><div class="ty-meta"><b>typography/${group}/${name}</b><code>${spec}</code></div><div class="ty-sample" style="${css}">${SAMPLE}</div></div>`,
    );
  }

// --- Foundations: spacing / radius / fontWeight / container / motion ---
const bars = (group, unit = "") =>
  Object.entries(t.primitive[group])
    .filter(([, v]) => v.$value)
    .map(
      ([k, v]) =>
        `<div class="brow"><b>${k}</b><span class="bar" style="width:${v.$value}"></span><code>${v.$value}${unit}</code></div>`,
    )
    .join("");
const list = (group) =>
  Object.entries(t.primitive[group])
    .filter(([, v]) => v.$value)
    .map(
      ([k, v]) =>
        `<div class="brow"><b>${k}</b><code>${Array.isArray(v.$value) ? v.$value.join(", ") : v.$value}</code></div>`,
    )
    .join("");
const radii = Object.entries(t.primitive.radius)
  .map(
    ([k, v]) =>
      `<div class="brow"><b>${k}</b><span class="rbox" style="border-radius:${v.$value}"></span><code>${v.$value}</code></div>`,
  )
  .join("");

const html = `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ProGrads · Design Tokens</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fira+Code&display=swap" rel="stylesheet">
<style>
  :root{--ink:#18181b;--muted:#71717a;--line:#e4e4e7;--accent:#8b5cf6}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Inter','Noto Sans TC',sans-serif;color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1120px;margin:0 auto;padding:48px 32px 96px}
  h1{font-family:'GenWanMin2 TW',serif;font-weight:500;font-size:2.25rem;letter-spacing:-.01em;margin:0}
  .sub{color:var(--muted);margin:.5rem 0 0}
  h2{font-family:'GenWanMin2 TW',serif;font-weight:500;font-size:1.5rem;letter-spacing:-.01em;margin:64px 0 20px;padding-bottom:10px;border-bottom:1px solid var(--line)}
  code{font-family:'Fira Code',monospace;font-size:.75rem;color:var(--muted)}
  .ramp{margin:0 0 20px}.ramp-name{font-weight:600;font-size:.875rem;margin:0 0 8px;text-transform:capitalize}
  .row{display:flex;flex-wrap:wrap;gap:8px}
  .sw{width:80px}.chip{height:48px;border-radius:6px;border:1px solid rgba(0,0,0,.06)}
  .sw b{display:block;font-size:.75rem;margin-top:4px}.sw code{font-size:.6875rem}
  .sems{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .sem{border:1px solid var(--line);border-radius:8px;padding:16px}
  .sem-dark{background:#18181b;border-color:#27272a;color:#fff}
  .sem-h{font-weight:600;font-size:.875rem;margin:0 0 12px}
  .srow{display:flex;align-items:center;gap:10px;padding:3px 0;font-size:.8125rem}
  .srow b{flex:1}.dot{width:16px;height:16px;border-radius:4px;border:1px solid rgba(128,128,128,.3)}
  .sem-dark code{color:#a1a1aa}
  .ty{border-bottom:1px solid var(--line);padding:18px 0}
  .ty-meta{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}.ty-meta b{font-size:.8125rem}
  .ty-sample{color:var(--ink)}
  .found{display:grid;grid-template-columns:1fr 1fr;gap:40px}
  .brow{display:flex;align-items:center;gap:12px;padding:5px 0;font-size:.8125rem}
  .brow b{width:88px;flex-shrink:0}
  .bar{height:14px;background:var(--accent);border-radius:3px;max-width:60%}
  .rbox{width:48px;height:32px;background:#ede9fe;border:1px solid var(--accent)}
  .col-h{font-weight:600;font-size:.875rem;margin:0 0 8px}
</style></head><body><div class="wrap">
  <h1>ProGrads · Design Tokens</h1>
  <p class="sub">系統設定值總覽 — 由 apps/web/design/tokens.json 自動產生</p>

  <h2>Colours · Ramps</h2>${colorRamps}
  <h2>Colours · Semantic (Light / Dark)</h2><div class="sems">${semanticPanel("semantic-light", false)}${semanticPanel("semantic-dark", true)}</div>

  <h2>Typography</h2>${typeStyles.join("")}

  <h2>Foundations</h2><div class="found">
    <div><p class="col-h">Spacing</p>${bars("spacing")}<p class="col-h" style="margin-top:24px">Container</p>${bars("container")}</div>
    <div>
      <p class="col-h">Radius</p>${radii}
      <p class="col-h" style="margin-top:24px">Font weight</p>${list("fontWeight")}
      <p class="col-h" style="margin-top:24px">Motion · duration</p>${list("duration")}
      <p class="col-h" style="margin-top:24px">Motion · easing</p>${list("easing")}
    </div>
  </div>
</div></body></html>`;

writeFileSync(join(here, "styleguide.html"), html);
console.log(
  `✓ styleguide.html (${colorRampEntries.length} ramps, ${typeStyles.length} type styles)`,
);
