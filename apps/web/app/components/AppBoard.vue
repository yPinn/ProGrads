<script setup lang="ts">
// Blackboard surface (see docs/08 + DESIGN.md): the flat system's lone shadow exception — a dark
// board on the cream page for focus/hierarchy. Question stem / explanation render on it; the
// styleguide samples it. Owns its own GLOBAL (unscoped) styles below: they must reach the
// <MDC>/Shiki-rendered internals, which scoped styles can't touch, and the `.board.prose` compound
// must sit on the SAME element as `.prose` — so in MDC mode the classes go on the MDC root itself.
withDefaults(defineProps<{ value?: string; size?: "base" | "sm"; prose?: boolean }>(), {
  value: undefined, // absent → slot mode (v-else); present → MDC mode
  size: "base",
  prose: true,
});
</script>

<template>
  <!-- MDC content (stem / explanation): board + prose on the MDC root, so `.board.prose` matches. -->
  <MDC
    v-if="value !== undefined"
    :value="value"
    :class="['board font-serif prose max-w-none rounded-card p-card', size === 'sm' && 'prose-sm']"
  />
  <!-- Slotted surface (plain panel or prose sample). -->
  <div
    v-else
    :class="[
      'board font-serif rounded-card p-card',
      prose && 'prose max-w-none',
      prose && size === 'sm' && 'prose-sm',
    ]"
  >
    <slot />
  </div>
</template>

<!-- UNSCOPED on purpose: these selectors reach <MDC>/Shiki-rendered internals (a component's scoped
     styles can't) and stay UNLAYERED so they win over Nuxt UI's layered prose/utility defaults.
     Co-located here (not components.css) so the board's rules live with the component and ship only
     on routes that use it. `--board*` vars come from semantic.css (light/dark). -->
<style>
.board {
  background: var(--board);
  color: var(--board-ink);
  border: 1px solid var(--board-line);
  box-shadow: 0 2px 10px rgb(20 30 24 / 0.18);
}

/* Code blocks render with one Shiki theme (github-dark, nuxt.config) for a single unified look
   everywhere. Only the blackboard swaps the block background to a darker board green so its dark
   code reads as an inset panel; !important overrides Shiki's inline background-color. */
.board .shiki {
  background-color: color-mix(in srgb, var(--board) 78%, #000) !important;
}

/* MDC never highlights ```text (and unlabelled) blocks — it short-circuits on language==="text"
   (rehype.js), so they render as a plain <pre>, NOT .shiki, and the rule above misses them.
   Pseudocode papers use ```text heavily, so give plain code on the board the same chalk-on-darker
   -green inset. Unlayered → wins over Nuxt UI's layered prose <pre> colour (which ignores
   --tw-prose-pre-*); :not(.shiki) keeps real Shiki blocks on their own theme. */
.board.prose :where(pre):not(.shiki) {
  background-color: color-mix(in srgb, var(--board) 78%, #000);
  color: var(--board-ink);
}
.board.prose :where(pre):not(.shiki) code {
  color: inherit;
}

/* Blackboard stem: dark green surface in BOTH themes, so its prose stays chalk regardless of
   light/dark (links chalk + underlined for affordance; code on a faint chalk tint). */
.board.prose {
  --tw-prose-body: var(--board-ink);
  --tw-prose-headings: var(--board-ink);
  --tw-prose-bold: var(--board-ink);
  --tw-prose-links: var(--board-ink);
  --tw-prose-code: var(--board-ink);
  --tw-prose-quotes: var(--board-ink);
  --tw-prose-bullets: var(--board-line);
  --tw-prose-hr: var(--board-line);
  --tw-prose-quote-borders: var(--board-line);
  --tw-prose-pre-code: var(--board-ink);
  --tw-prose-pre-bg: color-mix(in srgb, var(--board-ink) 8%, transparent);
  --tw-prose-th-borders: var(--board-line);
  --tw-prose-td-borders: var(--board-line);
}

/* Nuxt UI's prose table/code components colour with utility classes (bg-muted, border-muted),
   ignoring --tw-prose-* — so on the board they show as cream frames/chips, and the chalk thead
   text even washes out on its cream surface. Re-skin every inset to the board's own line + a faint
   chalk tint, unifying them with the board edge. Unlayered → wins over the layered utilities. */
.board.prose :where(pre, th, td) {
  border-color: var(--board-line);
}
.board.prose :where(thead) {
  background-color: color-mix(in srgb, var(--board-ink) 8%, transparent);
}
/* Inline code chips: DSA content wraps single symbols (`!`, `*`) in backticks constantly, so
   Nuxt UI's default bordered/padded ProseCode badge (colour override: it hard-codes dark
   text-highlighted) stacks into a wall of buttons. Drop border/ring, shrink tint → mono token. */
.board.prose :where(:not(pre) > code) {
  color: var(--board-ink);
  background-color: color-mix(in srgb, var(--board-ink) 8%, transparent);
  border: none;
  box-shadow: none;
  border-radius: 0.25em;
  padding: 0.05em 0.35em;
}

/* A paragraph entirely one bold run reads as a mini section header in AI explanations — give it
   accent chalk for hierarchy. :only-child excludes inline emphasis in normal sentences, so body
   text isn't blanket-recoloured. --board-accent-ink is a structural marker (not a status colour,
   hence not "info") — FIXED value, see semantic.css for why it doesn't flip with theme. */
.board.prose :where(p > strong:only-child) {
  color: var(--board-accent-ink);
}

/* GenWanMin2 TW (font-serif) ships only Regular/400 — no bold source file — so <strong> gets
   FAKED via synthetic outline-thickening, uneven on thin-stroke Latin (e.g. "Approach"). Worse on
   lower-luminance accent chalk than solid --board-ink. Disable synthesis; colour carries emphasis. */
.board.prose strong {
  font-synthesis: none;
}
</style>
