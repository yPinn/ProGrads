---
version: alpha
name: ProGrads
description: Graduate-admissions study platform. Homer «A Basket of Clams» theme — ink-blue primary on notebook-paper, serif Ming headings, calm scholarly minimalism.
colors:
  primary: "#566a93"
  secondary: "#a9944a"
  success: "#5a7a4e"
  info: "#566a93"
  warning: "#b5781c"
  error: "#bd483c"
  neutral: "#725435"
  bg: "#f8eeda"
  bg-muted: "#fbf2e1"
  bg-elevated: "#ece0c2"
  bg-accented: "#e7d9b8"
  bg-inverted: "#433222"
  text: "#433222"
  text-dimmed: "#96845f"
  text-muted: "#725435"
  text-toned: "#58412b"
  text-highlighted: "#2f2318"
  text-inverted: "#f8eeda"
  border: "#e3d4b2"
  border-muted: "#ece0c2"
  border-accented: "#c6b798"
  border-inverted: "#433222"
  board: "#243b30"
  board-ink: "#edefe4"
  board-line: "#3a5446"
  primary-600: "#4d5f86"
  primary-700: "#3c4e74"
typography:
  heading-display:
    fontFamily: GenWanMin2 TW
    fontSize: 3.75rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.01em
  heading-title-lg:
    fontFamily: GenWanMin2 TW
    fontSize: 2.25rem
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.01em
  heading-title-md:
    fontFamily: GenWanMin2 TW
    fontSize: 1.5rem
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: -0.01em
  heading-title-sm:
    fontFamily: GenWanMin2 TW
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-reading:
    fontFamily: GenWanMin2 TW
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0
  body-base:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-small:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-caption:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  label-eyebrow:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.2em
  code-inline:
    fontFamily: Fira Code
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
rounded:
  card: 0.375rem
spacing:
  page: 3rem
  hero: 5rem
  section: 2.5rem
  header: 2.5rem
  card: 1.25rem
  control: 0.75rem
  sidebar: 17rem
  touch: 2.75rem
  container-reading: 52rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverted}"
    typography: "{typography.body-base}"
    rounded: "{rounded.card}"
    padding: 0.5rem 1rem
  button-primary-hover:
    backgroundColor: "{colors.primary-600}"
  button-primary-active:
    backgroundColor: "{colors.primary-700}"
  button-ghost:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.card}"
    padding: 0.5rem 0.75rem
  button-ghost-hover:
    textColor: "{colors.text}"
  card:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  list-item-interactive:
    textColor: "{colors.text}"
    padding: 1rem 1.25rem
  list-item-interactive-hover:
    backgroundColor: "{colors.bg-elevated}"
  input-field:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.body-base}"
    rounded: "{rounded.card}"
    height: "{spacing.touch}"
    padding: 0 0.75rem
  board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    typography: "{typography.body-reading}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
---

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
disabled under `prefers-reduced-motion`.

## Colors

Primary is a tuned **ink-blue** (`primary` #566a93, darkened for WCAG AA on cream) used for
actions, links, and focus.
Secondary is a **warm gold** (#a9944a) and neutral a **stone-brown** (#725435), both used
sparingly as flat accents rather than full interactive ramps. `success`, `warning`,
`error`, and `info` are single applied roles; a tuned 50–950 ramp for every role lives in
`design/tokens.json` for future use, but only the primary ramp surfaces here (its 600/700
steps drive button hover/active).

Surfaces map onto warm paper tones — `bg` #f8eeda (paper), `bg-elevated` #ece0c2 (raised),
text `text` #433222 (ink) with dimmed/muted/toned/highlighted variants. The `board` tokens
(#243b30 ground, #edefe4 chalk) style the chalkboard surface used for worked solutions.

**Dark theme** (`.dark`) re-grounds everything on cool blue: `bg` #1c2330, `text` #f4debc
(cream), primary brightened to #a9b8d7, board #15231c. Both themes target WCAG AA (4.5:1)
for body text on their surfaces.

## Typography

Three families: **Inter** (sans) for UI and body, **GenWanMin2 TW** (serif Ming) for
headings and long-form reading, **Fira Code** (mono) for code. CJK falls back to Noto Sans
TC. Headings are serif + tight tracking; UI/body are sans; the reading style is serif for
comfortable long passages.

The scale runs caption → small → body → reading → title-sm/md/lg → display, each carrying
its own line-height (tighter as size grows). The `label-eyebrow` style is uppercase with
0.2em tracking (the uppercasing is applied in CSS, not encoded as a token property).

## Layout & Spacing

Named spacing tokens express layout intent rather than a raw numeric scale: `page`/`hero`
section rhythm, `section`/`header` gaps, `card`/`control` padding, `sidebar` (17rem), and
a 2.75rem (44px) `touch` target. Reading content is capped at `container-reading` (52rem)
for line length.

`page` and `hero` take a **responsive bump ≥768px** (page 3→4rem, hero 5→7rem) via cascade,
and a **density** switch (`[data-density="compact"|"reading"]`) remaps card padding and body
leading. These cascade behaviours are runtime-only and cannot be expressed as flat tokens —
the values above are the comfortable-density, base-breakpoint defaults.

## Elevation & Depth

This system is intentionally **flat**: UI chrome (cards, rows, inputs, header) carries no drop
shadows. Hierarchy is conveyed by **tonal layers** (`bg` → `bg-muted` → `bg-elevated` →
`bg-accented`), 1px borders, and a sticky header with `backdrop-blur`. Hover on interactive
rows lifts the surface by compositing `bg-elevated` at ~50% alpha rather than adding a shadow.
The lone exception is the `board` chalkboard surface, which carries a single soft shadow
(`0 2px 10px` at ~0.18 alpha) so it reads as a physical board.

## Shapes

A single, uniform corner radius of **0.375rem (6px)** (`rounded.card`, aligned with Nuxt
UI's `--ui-radius`) applies to buttons, cards, inputs, and the board. The shape language is
quiet and consistent — no mixing of sharp and round within a view.

## Components

Built on **Nuxt UI v4**; app-owned classes fill the gaps. Patterns:

- **Buttons** — primary is solid ink-blue with inverted (cream) text, hover/active step to
  primary-600/700. Ghost buttons (nav, icon, inline links) are transparent with muted text
  that resolves to full ink on hover.
- **Cards** — flat `bg-elevated` panels with 6px radius and `card` padding; separated by
  tone and border, never shadow.
- **Interactive list rows** — transparent by default, hover composites `bg-elevated` at 50%.
- **Inputs** — `bg` fill, 1px border, 44px tall for tap targets.
- **Board** — the chalkboard surface (`board` ground, `board-ink` chalk) for worked
  solutions, using the serif reading style.

Focus is a shared `focus-ring`: `outline-primary`, 2px, 2px offset — applied to all
app-owned interactive elements (Nuxt UI components ship their own).

## Do's and Don'ts

- **Do** keep `primary` for the single most important action, links, and focus per view.
- **Do** convey depth with tone and borders; **don't** add drop shadows to UI chrome — this
  system is flat (the `board` surface is the sole exception).
- **Do** use `secondary`/`success`/`warning`/`error` as sparse flat accents; **don't** build
  multi-step interactive ramps from them in UI without pulling the tuned ramp from tokens.json.
- **Do** keep coloured _text_ (badges, links, alert titles) to `primary`/`neutral` — the only
  roles that clear WCAG AA on the cream surface in light mode. For `secondary`/`success`/
  `warning`/`error` semantics at text size, convey them with solid fills + icons or the role's
  **700** ramp step; **don't** set small text in their base (500) tones on light surfaces
  (2.6–4.4:1, below AA).
- **Do** set headings in serif Ming and body in Inter; **don't** mix more than these roles.
- **Do** maintain WCAG AA (4.5:1) for body text on its surface in both themes.
- **Don't** hard-code ms or cubic-beziers — use the motion tokens (fast/base/slow, standard ease).
