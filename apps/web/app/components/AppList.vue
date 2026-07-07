<script setup lang="ts">
// Flat list container (see docs/08 + DESIGN.md): 1px border + rounded card + hairline dividers
// between rows. Transparent — rows sit on the page and own their own hover (see <AppListRow>).
// `as` picks the element; default <ul> for a semantic list (rows are <li>).
withDefaults(defineProps<{ as?: string }>(), { as: "ul" });
</script>

<template>
  <component :is="as" class="border-default divide-default divide-y rounded-card border">
    <slot />
  </component>
</template>
