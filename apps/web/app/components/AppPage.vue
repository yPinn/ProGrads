<script setup lang="ts">
// Standard content-page shell: container width + py-page rhythm + PageHeader.
// Chrome (nav/footer) lives in layouts/default.vue; this owns the content column only.
defineProps<{ eyebrow?: string; title: string; description?: string }>();
</script>

<template>
  <UContainer class="py-page">
    <PageHeader :eyebrow="eyebrow" :title="title" :description="description">
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </PageHeader>
    <slot />
  </UContainer>
</template>
