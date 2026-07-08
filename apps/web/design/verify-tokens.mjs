// tokens.json ↔ CSS mirror verifier. The app's Tailwind CSS is hand-mirrored against tokens.json
// (no generator yet — see README), so the two silently drift. This asserts they match and fails
// (exit 1) on any mismatch or un-mirrored key, catching manual errors. Run: node design/verify-tokens.mjs
// (also chained into `pnpm tokens:build`). Documented exceptions live in EXCEPT below.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const T = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));
const semantic = readFileSync(join(here, "../app/assets/css/semantic.css"), "utf8");
const tokensCss = readFileSync(join(here, "../app/assets/css/tokens.css"), "utf8");

// --- brace-matched block body for a selector/at-rule (first occurrence) ---
const block = (src, head) => {
  const re = new RegExp(head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{");
  const m = re.exec(src);
  if (!m) return "";
  let d = 0,
    i = m.index + m[0].length - 1;
  const start = i;
  for (; i < src.length; i++) {
    if (src[i] === "{") d++;
    else if (src[i] === "}" && --d === 0) break;
  }
  return src.slice(start, i);
};
const cssVars = (body) => {
  const m = {};
  for (const v of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) m[v[1]] = v[2].trim();
  return m;
};

const theme = cssVars(block(tokensCss, "@theme")); // foundations (base values only, not cascades)
const light = cssVars(block(semantic, ":root"));
const dark = cssVars(block(semantic, ".dark"));

// --- known, intentional exceptions (documented, not drift) ---
const EXCEPT = {
  neutral: "rendered via Nuxt UI app.config `neutral: stone` ramp, not a flat --ui-neutral",
  "letterSpacing.normal": "Tailwind's tracking-normal default",
  fontWeight: "Tailwind font-weight utilities (font-medium/semibold)",
};

const norm = (v) => (Array.isArray(v) ? `cubic-bezier(${v.join(", ")})` : String(v).trim());
const fails = [];
const check = (label, expect, actual, { family = false } = {}) => {
  if (actual === undefined) return fails.push(`MISSING  ${label} — expected ${expect}, not in CSS`);
  if (family) {
    const fam = expect.replace(/["']/g, "").split(",")[0].trim();
    if (!actual.includes(fam)) fails.push(`MISMATCH ${label}: css="${actual}" lacks "${fam}"`);
  } else if (norm(expect) !== actual) {
    fails.push(`MISMATCH ${label}: css=${actual}  tokens=${norm(expect)}`);
  }
};

// --- 1) semantic colours: every tokens.json semantic key must match its --ui-* / --board* var ---
const cssColorVar = (key, vars) =>
  key.startsWith("board") ? vars[`--${key}`] : vars[`--ui-${key}`];
for (const [set, vars, name] of [
  ["semantic-light", light, "light"],
  ["semantic-dark", dark, "dark"],
]) {
  for (const [key, def] of Object.entries(T[set].color)) {
    if (EXCEPT[key]) continue;
    const v = def.$value;
    if (typeof v !== "string" || v[0] !== "#") continue;
    check(`${name} ${key}`, v.toLowerCase(), (cssColorVar(key, vars) || "").toLowerCase());
  }
}

// --- 2) foundations: tokens.json primitive → @theme var (explicit map) ---
const P = T.primitive;
const v = (path) => path.split(".").reduce((o, k) => o?.[k], P)?.$value;
const FONT = { sans: "--font-sans", serif: "--font-serif", mono: "--font-mono" };
for (const [k, cv] of Object.entries(FONT))
  check(`fontFamily.${k}`, v(`fontFamily.${k}`), theme[cv], { family: true });
for (const k of Object.keys(P.fontSize).filter((x) => x[0] !== "$")) {
  check(`fontSize.${k}`, v(`fontSize.${k}`), theme[`--text-${k}`]);
  check(`lineHeight.${k}`, v(`lineHeight.${k}`), theme[`--text-${k}--line-height`]); // paired
}
const LEADING = { tight: "--leading-tight", body: "--leading-body", reading: "--leading-reading" };
for (const [k, cv] of Object.entries(LEADING))
  check(`lineHeight.${k}→leading`, v(`lineHeight.${k}`), theme[cv]);
const TRACK = { tight: "--tracking-tight", eyebrow: "--tracking-eyebrow" };
for (const [k, cv] of Object.entries(TRACK))
  check(`letterSpacing.${k}`, v(`letterSpacing.${k}`), theme[cv]);
for (const k of Object.keys(P.spacing).filter((x) => x[0] !== "$"))
  check(`spacing.${k}`, v(`spacing.${k}`), theme[`--spacing-${k}`]);
for (const k of Object.keys(P.radius).filter((x) => x[0] !== "$"))
  check(`radius.${k}`, v(`radius.${k}`), theme[`--radius-${k}`]);
for (const k of Object.keys(P.container).filter((x) => x[0] !== "$"))
  check(`container.${k}`, v(`container.${k}`), theme[`--container-${k}`]);
for (const k of Object.keys(P.duration).filter((x) => x[0] !== "$"))
  check(`duration.${k}`, v(`duration.${k}`), theme[`--duration-${k}`]);
for (const k of Object.keys(P.easing).filter((x) => x[0] !== "$"))
  check(`easing.${k}`, v(`easing.${k}`), theme[`--ease-${k}`]);

// --- report ---
if (fails.length) {
  console.error(`✗ tokens ↔ CSS mirror: ${fails.length} problem(s)\n  ` + fails.join("\n  "));
  console.error(`\n  (intentional exceptions: ${Object.keys(EXCEPT).join(", ")})`);
  process.exit(1);
}
const n = Object.values(T["semantic-light"].color).length;
console.log(
  `✓ tokens ↔ CSS mirror in sync — ${n} semantic colours (×2 themes) + foundations verified.`,
);
