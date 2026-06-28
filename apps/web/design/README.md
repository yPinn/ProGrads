# Design tokens pipeline

`tokens.json` (DTCG) is the **source of truth** for the design system. Three artifacts are
generated from it (run together via `pnpm tokens:build`); the app's runtime CSS is mirrored
by hand against it.

```text
tokens.json  (DTCG, source of truth)
  ├─ to-legacy.mjs    → tokens.legacy.json       (Figma / Tokens Studio)
  ├─ to-designmd.mjs  → ../DESIGN.md             (agent-facing spec)
  ├─ styleguide.mjs   → design/styleguide.html   (token preview sheet)
  └─ (hand-mirrored)  → ../app/assets/css/*       (Tailwind v4 runtime)
```

- **`node design/to-legacy.mjs`** → `tokens.legacy.json` for the Figma Tokens Studio plugin.
  Validates that every `{alias}` resolves against the primitive set.
- **`node design/to-designmd.mjs`** → `../DESIGN.md` ([Google DESIGN.md](https://github.com/google-labs-code/design.md),
  alpha): the single agent-facing description of the system. Single-theme, so the **light**
  theme is canonical and dark is described in prose. Validate with:
  `npx @google/design.md lint ../DESIGN.md`.
- **`node design/styleguide.mjs`** → `design/styleguide.html`, a static token-preview sheet
  (colour ramps, semantic light/dark, type, foundations). Interactive components are previewed
  separately in the dev-only `/styleguide` route.
- **`app/assets/css/{tokens,semantic}.css`** is the live Tailwind v4 source. It is **not**
  generated from `tokens.json` yet — keep the two in sync by hand when changing values
  (a `tokens.json → CSS` generator is the proper long-term fix; see tasks/todo.md backlog).

After editing `tokens.json`, run `pnpm tokens:build` to regenerate all three outputs and
re-run the lint before committing.

## Contrast notes

The primary role is tuned to `#566a93` so the primary button (`text-inverted` cream on
`primary` ink-blue) and primary links (on the `bg` cream) clear WCAG AA at **4.70:1**.
`text-dimmed` (#96845f light) is the lowest-emphasis role at ~3.2:1 — intended for
incidental/placeholder text, not body copy; use `text-muted` (6.0:1) for anything readable.

Coloured text is limited to `primary`/`neutral` (see DESIGN.md Do/Don't): in light mode the
status roles as small text on cream are below AA — `error` 4.4, `success` 4.2, `warning` 3.2,
`secondary` 2.6:1. Use solid fills + icons, or the role's 700 ramp step, for status text. The
`ErrorState` alert follows this — its `color="error"` only tints the icon/ring; the title and
description use ink text.

### Accepted tradeoffs

The warm low-contrast palette makes a few non-text values dip below the 3:1 WCAG 1.4.11 target;
kept deliberately for the calm editorial look:

- **Form input resting borders** `border` on `bg` ≈ 1.2:1 (light) / 2.8:1 (dark) — the focus
  ring carries the interactive affordance.
- **`primary` text on `bg-elevated`** (links inside cards) ≈ 4.1:1 — just under AA; prefer ink
  text inside elevated panels.
- **Skeletons** are intentionally quiet; bumped to `border-accented` so the shape survives
  `prefers-reduced-motion`, but they remain low-contrast by design.
