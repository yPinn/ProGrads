<script setup lang="ts">
import { computed, resolveComponent } from "vue";

// A row inside <AppList>. `interactive` adds the flat row-lift hover (bg-elevated/50). Clickable
// rows (`to` → link, or `as="button"`) also get a focus ring + 44px tap height; a non-clickable
// `interactive` row still gets the hover for tracking. Content layout is the caller's (via class).
const props = withDefaults(defineProps<{ interactive?: boolean; as?: string; to?: string }>(), {
  interactive: false,
  as: "li",
  to: undefined,
});

const tag = computed(() => (props.to ? resolveComponent("NuxtLink") : props.as));
const clickable = computed(() => !!props.to || props.as === "button");
</script>

<template>
  <component
    :is="tag"
    :to="to"
    class="px-5 py-4"
    :class="[
      interactive && 'hover:bg-elevated/50 transition-colors',
      clickable && 'focus-ring min-h-touch',
    ]"
  >
    <slot />
  </component>
</template>
