<script setup lang="ts">
// Styleguide colour chip that reads its OWN resolved colour from the DOM, so the shown hex is the real
// computed value for the active theme (not a hardcoded copy that could drift). A MutationObserver on the
// root re-reads on light/dark flips. `read` picks bg | text | border; `ink` adds a hidden -ink probe so
// status roles show both marker and ink hex.
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    chip: string; // utility/arbitrary class carrying the colour
    desc?: string;
    read?: "bg" | "text" | "border";
    ink?: string; // optional -ink text class (status roles)
  }>(),
  { read: "bg", desc: undefined, ink: undefined },
);

const chipEl = ref<HTMLElement>();
const inkEl = ref<HTMLElement>();
const hex = ref("");
const inkHex = ref("");

function toHex(v: string): string {
  const m = v.match(/[\d.]+/g);
  if (!m || m.length < 3) return v;
  const [r, g, b] = m.map(Number);
  return (
    "#" +
    [r, g, b]
      .map((n) =>
        Math.round(n ?? 0)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  ).toUpperCase();
}
function sample(el: HTMLElement | undefined, kind: "bg" | "text" | "border"): string {
  if (!el) return "";
  const cs = getComputedStyle(el);
  return toHex(
    kind === "text" ? cs.color : kind === "border" ? cs.borderColor : cs.backgroundColor,
  );
}
function refresh() {
  hex.value = sample(chipEl.value, props.read);
  if (props.ink) inkHex.value = sample(inkEl.value, "text");
}

let observer: MutationObserver | undefined;
onMounted(() => {
  requestAnimationFrame(refresh);
  observer = new MutationObserver(() => refresh());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <!-- Row layout: colour block left, meta (name / hex / desc) stacked to its right. Each swatch is
       self-contained, so a long desc just extends rightward and never disturbs its neighbours. -->
  <div class="flex items-start gap-3 text-left">
    <!-- colour block; for text roles the block shows an Aa glyph in that ink -->
    <div
      v-if="read === 'text'"
      ref="chipEl"
      class="bg-default border-default grid size-12 shrink-0 place-items-center rounded-card border font-serif text-title-sm"
      :class="chip"
    >
      Aa
    </div>
    <div
      v-else-if="read === 'border'"
      ref="chipEl"
      class="bg-default size-12 shrink-0 rounded-card border-2"
      :class="chip"
    />
    <div
      v-else
      ref="chipEl"
      class="border-default size-12 shrink-0 rounded-card border"
      :class="chip"
    />

    <div class="min-w-0">
      <p class="text-caption font-medium" :class="ink">{{ name }}</p>
      <p class="text-dimmed text-caption font-mono tabular-nums">{{ hex }}</p>
      <p v-if="ink" class="text-dimmed text-caption font-mono tabular-nums">ink {{ inkHex }}</p>
      <p v-if="desc" class="text-dimmed text-caption leading-tight">{{ desc }}</p>
    </div>
    <span v-if="ink" ref="inkEl" :class="ink" class="sr-only">probe</span>
  </div>
</template>
