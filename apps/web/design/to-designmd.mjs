// tokens.json (DTCG, source of truth) -> apps/web/DESIGN.md (Google DESIGN.md, alpha).
// The agent-facing view of the design system. tokens.json stays the source; this file
// and tokens.legacy.json (Figma) are both generated from it. Run: node design/to-designmd.mjs
// Validate: npx @google/design.md lint apps/web/DESIGN.md
//
// DESIGN.md is single-theme (no light/dark modes), so the LIGHT theme is canonical here
// and the dark theme is described in the Colors prose. Tailwind ramps in tokens.json are a
// reference library; only the applied brand roles + the primary ramp surface in this file.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));
const OUT = join(here, "..", "DESIGN.md");

// Resolve a {group.key} reference against the primitive set (Tokens Studio strips the set
// name from refs, so every alias points into `primitive`).
const isRef = (v) => typeof v === "string" && /^\{.+\}$/.test(v);
function resolve(ref) {
  let node = tokens.primitive;
  for (const part of ref.replace(/[{}]/g, "").split(".")) node = node?.[part];
  if (!node || node.$value === undefined) throw new Error(`unresolved ref: ${ref}`);
  return node.$value;
}
const deref = (v) => (isRef(v) ? resolve(v) : v);

// ---------- colors ----------
// Applied light roles + surfaces + board (semantic-light), plus the primary ramp steps so
// component variants can reference darker shades for hover/active.
const light = tokens["semantic-light"].color;
const colors = {};
for (const [name, tok] of Object.entries(light)) colors[name] = tok.$value;
// Only the primary ramp steps referenced by component variants (hover/active). The full
// 50–950 ramp for every role lives in tokens.json; surfacing unused steps here just adds
// orphaned-token noise.
for (const step of ["600", "700"]) {
  colors[`primary-${step}`] = tokens.primitive.color.primary[step].$value;
}

// ---------- typography ----------
// Flatten composite text styles (group.key -> "group-key"); resolve each property ref.
// textCase is dropped (not a spec property) and called out in prose instead.
const TYPO_ORDER = [
  ["heading", "display"],
  ["heading", "title-lg"],
  ["heading", "title-md"],
  ["heading", "title-sm"],
  ["body", "reading"],
  ["body", "base"],
  ["body", "small"],
  ["body", "caption"],
  ["label", "eyebrow"],
  ["code", "inline"],
];
const typography = {};
for (const [group, key] of TYPO_ORDER) {
  const v = tokens.typography[group][key].$value;
  const t = {
    fontFamily: deref(v.fontFamily),
    fontSize: deref(v.fontSize),
    fontWeight: deref(v.fontWeight),
    lineHeight: deref(v.lineHeight),
  };
  if (v.letterSpacing) t.letterSpacing = deref(v.letterSpacing);
  typography[`${group}-${key}`] = t;
}

// ---------- rounded / spacing ----------
const rounded = { card: tokens.primitive.radius.card.$value };
const spacing = {};
for (const [k, tok] of Object.entries(tokens.primitive.spacing)) {
  if (k.startsWith("$")) continue;
  spacing[k] = tok.$value;
}
spacing["container-reading"] = tokens.primitive.container.reading.$value;

// ---------- components ----------
// Real app patterns: Nuxt UI primary button, ghost nav/links, tonal card, interactive list
// row (hover via bg-elevated alpha — described in prose), input field, and the .board surface.
const components = {
  "button-primary": {
    backgroundColor: "{colors.primary}",
    textColor: "{colors.text-inverted}",
    typography: "{typography.body-base}",
    rounded: "{rounded.card}",
    padding: "0.5rem 1rem",
  },
  "button-primary-hover": { backgroundColor: "{colors.primary-600}" },
  "button-primary-active": { backgroundColor: "{colors.primary-700}" },
  // Transparent / inherited backgrounds are left unset: asserting backgroundColor:
  // transparent makes the contrast rule score text against black (false positive).
  "button-ghost": {
    textColor: "{colors.text-muted}",
    rounded: "{rounded.card}",
    padding: "0.5rem 0.75rem",
  },
  "button-ghost-hover": { textColor: "{colors.text}" },
  card: {
    // Light card fill = the deepest paper surface step (dark uses bg-muted; see Elevation prose).
    backgroundColor: "{colors.bg-accented}",
    borderColor: "{colors.border-accented}",
    textColor: "{colors.text}",
    rounded: "{rounded.card}",
    padding: "{spacing.card}",
  },
  "card-interactive-hover": { borderColor: "{colors.border-inverted}" },
  "list-item-interactive": {
    textColor: "{colors.text}",
    padding: "1rem 1.25rem",
  },
  "list-item-interactive-hover": { backgroundColor: "{colors.bg-elevated}" },
  "input-field": {
    backgroundColor: "{colors.bg}",
    textColor: "{colors.text}",
    typography: "{typography.body-base}",
    rounded: "{rounded.card}",
    height: "{spacing.touch}",
    padding: "0 0.75rem",
  },
  board: {
    backgroundColor: "{colors.board}",
    textColor: "{colors.board-ink}",
    typography: "{typography.body-reading}",
    rounded: "{rounded.card}",
    padding: "{spacing.card}",
  },
};

// ---------- YAML emit ----------
// Hex/refs must be quoted (# starts a YAML comment); dimensions and numbers stay bare.
const q = (v) => `"${v}"`;
const scalar = (v) => (typeof v === "number" ? String(v) : isRef(v) || /[#]/.test(v) ? q(v) : v);
let y = "---\n";
y += "version: alpha\n";
y += "name: ProGrads\n";
y +=
  "description: Graduate-admissions study platform. Homer «A Basket of Clams» theme — ink-blue primary on notebook-paper, serif Ming headings, calm scholarly minimalism.\n";

y += "colors:\n";
for (const [k, v] of Object.entries(colors)) y += `  ${k}: ${q(v)}\n`;

y += "typography:\n";
for (const [k, t] of Object.entries(typography)) {
  y += `  ${k}:\n`;
  for (const [prop, val] of Object.entries(t)) y += `    ${prop}: ${scalar(val)}\n`;
}

y += "rounded:\n";
for (const [k, v] of Object.entries(rounded)) y += `  ${k}: ${scalar(v)}\n`;

y += "spacing:\n";
for (const [k, v] of Object.entries(spacing)) y += `  ${k}: ${scalar(v)}\n`;

y += "components:\n";
for (const [name, props] of Object.entries(components)) {
  y += `  ${name}:\n`;
  for (const [prop, val] of Object.entries(props)) y += `    ${prop}: ${scalar(val)}\n`;
}
y += "---\n";

// ---------- prose (8 sections, fixed spec order) ----------
const body = `
# ProGrads Design System

## Overview

ProGrads is a graduate-school admissions study platform — exam archives, admission
intelligence, and schedules for Taiwanese EECS programs. The visual identity is
**Winslow Homer «A Basket of Clams»** (ColorLisa, tuned): an ink-blue primary over a
warm notebook-paper ground, with serif Ming headings.

The personality is calm, scholarly, and dense-but-legible — a quiet study desk, not a
marketing page. Light mode reads as **notebook paper under daylight**; dark mode as
**night reading under a warm lamp** (cool blue ground, cream ink). Motion is restrained:
micro-interactions 120ms, page transitions 220–320ms on a standard ease; all motion is
disabled under \`prefers-reduced-motion\`.

## Colors

Colours split into two tiers by convention.

**Brand — per-theme.** Primary is a tuned **ink-blue** (\`primary\` #566a93, darkened for WCAG AA
on cream) for actions, links, and focus; secondary a **warm gold** (#a9944a), neutral a
**stone-brown** (#725435) — used sparingly as flat accents. Only the primary ramp surfaces here
(its 600/700 steps drive button hover/active). These change with the painting theme.

**Status — fixed, theme-independent (手帳 highlighter 燈號).** \`success\` #5fa85a, \`warning\` #e0a92e,
\`error\` #e5556b, \`info\` #3fa2c4 are one highlighter set held constant across themes, so "red = error"
stays learnable. The **marker** is for fills/washes/dots/rings/icon tint; meaning is carried by icon
shape + ink text, never colour alone (WCAG 1.4.1), so on cream it is deliberately low-contrast. Coloured
status *text* uses the paired **-ink** step (\`error-ink\` #a83648 etc., ≥4.5:1; text-/bg-/border-{role}-ink).

Surfaces map onto warm paper tones — \`bg\` #f8eeda (paper), \`bg-elevated\` #ece0c2 (raised),
text \`text\` #433222 (ink) with dimmed/muted/toned/highlighted variants. The \`board\` tokens
(#243b30 ground, #edefe4 chalk) style the chalkboard surface used for worked solutions.

**Dark theme** (\`.dark\`) re-grounds everything on cool blue: \`bg\` #1c2330, \`text\` #f4debc
(cream), primary brightened to #a9b8d7, board #15231c; status markers brighten (success #86c47e,
error #ef7a86 …) and already clear text contrast on the night ground. Both themes target WCAG AA
(4.5:1) for body text on their surfaces.

## Typography

Three families: **Inter** (sans) for UI and body, **GenWanMin2 TW** (serif Ming) for
headings and long-form reading, **Fira Code** (mono) for code. CJK falls back to Noto Sans
TC. Headings are serif + tight tracking; UI/body are sans; the reading style is serif for
comfortable long passages.

The scale runs caption → small → body → reading → title-sm/md/lg → display, each carrying
its own line-height (tighter as size grows). The \`label-eyebrow\` style is uppercase with
0.2em tracking (the uppercasing is applied in CSS, not encoded as a token property).

## Layout & Spacing

Named spacing tokens express layout intent rather than a raw numeric scale: \`page\`/\`hero\`
section rhythm, \`section\`/\`header\` gaps, \`card\`/\`control\` padding, \`sidebar\` (17rem), and
a 2.75rem (44px) \`touch\` target. Reading content is capped at \`container-reading\` (52rem)
for line length.

\`page\` and \`hero\` take a **responsive bump ≥768px** (page 3→4rem, hero 5→7rem) via cascade,
and a **density** switch (\`[data-density="compact"|"reading"]\`) remaps card padding and body
leading. These cascade behaviours are runtime-only and cannot be expressed as flat tokens —
the values above are the comfortable-density, base-breakpoint defaults.

## Elevation & Depth

This system is intentionally **flat**: UI chrome (cards, rows, inputs, header) carries no drop
shadows. Hierarchy is conveyed by **tonal layers** (\`bg\` → \`bg-muted\` → \`bg-elevated\` →
\`bg-accented\`), 1px borders, and a sticky header with \`backdrop-blur\`. Hover on interactive
rows lifts the surface by compositing \`bg-elevated\` at ~50% alpha rather than adding a shadow;
interactive **cards** sharpen their edge to \`border-inverted\` on hover — still flat, no shadow.

Cards sit a step below the page via a **\`--surface-card\`** alias onto the existing surface ramp
(no new colour): light uses **\`bg-accented\`** (the deepest paper step) with a **\`border-accented\`**
edge, so a card reads as a distinct layer rather than the near-flat 1.14:1 of \`bg-elevated\`;
\`text-muted\` still holds AA (4.94:1). Dark keeps the cool night identity on \`bg-muted\` — its
\`bg-accented\`/\`bg-elevated\` are *lighter* than the page and would drop \`text-muted\` below AA, so
the card uses a different ramp step per theme. On either fill \`text-dimmed\` fails AA, so card body
text stays \`text\`/\`text-muted\`.
The lone shadow exception is the \`board\` chalkboard surface, which carries a single soft shadow
(\`0 2px 10px\` at ~0.18 alpha) so it reads as a physical board.

## Shapes

A single, uniform corner radius of **0.375rem (6px)** (\`rounded.card\`, aligned with Nuxt
UI's \`--ui-radius\`) applies to buttons, cards, inputs, and the board. The shape language is
quiet and consistent — no mixing of sharp and round within a view.

## Components

Built on **Nuxt UI v4**; app-owned classes fill the gaps. Patterns:

- **Buttons** — primary is solid ink-blue with inverted (cream) text, hover/active step to
  primary-600/700. Ghost buttons (nav, icon, inline links) are transparent with muted text
  that resolves to full ink on hover.
- **Cards** — flat panels with 6px radius and \`card\` padding; separated by fill + a
  \`border-accented\` edge, never shadow. Fill is \`--surface-card\` (an alias onto \`bg-accented\`
  light / \`bg-muted\` dark; see Elevation). The interactive variant sharpens its edge on hover.
  Use \`<AppCard>\`.
- **Interactive list rows** — transparent by default, hover composites \`bg-elevated\` at 50%.
  Use \`<AppList>\` (container) + \`<AppListRow>\` (row).
- **Inputs** — \`bg\` fill, 1px border, 44px tall for tap targets.
- **Board** — the chalkboard surface (\`board\` ground, \`board-ink\` chalk) for worked
  solutions, using the serif reading style.

Focus is a shared \`focus-ring\`: \`outline-primary\`, 2px, 2px offset — applied to all
app-owned interactive elements (Nuxt UI components ship their own).

## Do's and Don'ts

- **Do** keep \`primary\` for the single most important action, links, and focus per view.
- **Do** convey depth with tone and borders; **don't** add drop shadows to UI chrome — this
  system is flat (the \`board\` surface is the sole exception).
- **Do** treat \`success\`/\`warning\`/\`error\`/\`info\` as the **fixed status set** — the same
  highlighter markers under every theme (never re-tint them per painting scheme); reach for them
  for fills/washes/dots/rings/icon tint, and always pair with an icon + ink text (never colour
  alone). **Don't** vary status hues by theme or set status meaning by colour only.
- **Do** keep coloured *text* (badges, links, alert titles) to \`primary\`/\`neutral\`, or use the
  status **-ink** step (\`text-error-ink\` etc., ≥4.5:1) for coloured status text; **don't** set
  status **markers** as small text on cream — they are deliberately soft (1.8–3.1:1) for the
  highlighter look and fail AA as text.
- **Do** set headings in serif Ming and body in Inter; **don't** mix more than these roles.
- **Do** maintain WCAG AA (4.5:1) for body text on its surface in both themes; **don't** set
  \`text-dimmed\` on \`bg-elevated\`/card surfaces — it clears AA only on the base \`bg\` page
  (3.97:1 light / 2.36:1 dark on elevated). Use \`text\`/\`text-muted\` on cards.
- **Don't** hard-code ms or cubic-beziers — use the motion tokens (fast/base/slow, standard ease).
`;

writeFileSync(OUT, y + body);
console.log(
  `✓ tokens.json -> DESIGN.md (${Object.keys(colors).length} colors, ` +
    `${Object.keys(typography).length} type styles, ${Object.keys(components).length} components)`,
);
