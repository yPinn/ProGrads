# Design tokens pipeline

`tokens.json` (DTCG) is the **source of truth** for the design system. Two artifacts are
generated from it (run together via `pnpm tokens:build`); the app's runtime CSS is mirrored
by hand against it.

```text
tokens.json  (DTCG, source of truth)
  ├─ to-legacy.mjs      → tokens.legacy.json       (Figma / Tokens Studio)
  ├─ to-designmd.mjs    → ../DESIGN.md             (agent-facing spec)
  ├─ (hand-mirrored)    → ../app/assets/css/*       (Tailwind v4 runtime)
  └─ verify-tokens.mjs  ← asserts the hand mirror matches (fails on drift)
```

- **`node design/to-legacy.mjs`** → `tokens.legacy.json` for the Figma Tokens Studio plugin.
  Validates that every `{alias}` resolves against the primitive set.
- **`node design/to-designmd.mjs`** → `../DESIGN.md` ([Google DESIGN.md](https://github.com/google-labs-code/design.md),
  alpha): the single agent-facing description of the system. Single-theme, so the **light**
  theme is canonical and dark is described in prose. Validate with:
  `npx @google/design.md lint ../DESIGN.md`.
- Tokens and interactive components are previewed together in the dev-only `/styleguide` route
  (real CSS, follows the light/dark theme switch).
- **`app/assets/css/{tokens,semantic}.css`** is the live Tailwind v4 source, **hand-mirrored** from
  `tokens.json` (no `tokens.json → CSS` generator yet). `tokens.css` `@theme` mirrors the `primitive`
  foundations; `semantic.css` `:root`/`.dark` mirror the `semantic-light`/`semantic-dark` colour sets
  (`--ui-*`, plus `--board*`). Edit both sides together.
- **`node design/verify-tokens.mjs`** (`pnpm tokens:verify`) asserts the mirror is in sync and **fails
  on any drift** — every semantic colour (both themes) and foundation value must match. It runs at the
  end of `tokens:build` and in lint-staged when `tokens.json` or the mirrored CSS is committed.
  Intentional exceptions (not mirrored to `--ui-*`) are documented in the script: `neutral` (Nuxt UI
  `app.config` `stone` ramp), `fontWeight` (Tailwind utilities), `letterSpacing.normal`.

After editing `tokens.json` **and its CSS mirror**, run `pnpm tokens:build` (regenerates both outputs
and verifies the mirror) and re-run the lint before committing.

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
