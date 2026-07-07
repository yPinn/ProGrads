<script setup lang="ts">
import { computed, resolveComponent } from "vue";

// Flat surface panel (see docs/08). `interactive` adds a hover edge + focus ring; `to` renders the
// card as a link (else the `as` tag). See template for the fill/AA rationale.
const props = withDefaults(defineProps<{ interactive?: boolean; as?: string; to?: string }>(), {
  interactive: false,
  as: "div",
  to: undefined,
});

// `to` must render a real link (keyboard/AT); else honour the semantic `as` tag.
const tag = computed(() => (props.to ? resolveComponent("NuxtLink") : props.as));
</script>

<template>
  <!-- Fill = --surface-card: light bg-accented (a step below the page), dark bg-muted (dark's
       lighter steps drop text-muted <AA); border-accented for a crisp edge. Body text stays
       text/text-muted (text-dimmed fails AA). Interactive → border-inverted on hover. -->
  <component
    :is="tag"
    :to="to"
    class="border-accented rounded-card border bg-(--surface-card) p-card"
    :class="interactive && 'focus-ring transition-colors hover:border-inverted'"
  >
    <slot />
  </component>
</template>
