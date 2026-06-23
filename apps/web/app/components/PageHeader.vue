<script setup lang="ts">
// Editorial page header: uppercase eyebrow + serif (Ming) title + muted description,
// with an optional right-aligned #actions slot (filters/controls). Shared across list pages.
defineProps<{ eyebrow?: string; title: string; description?: string }>();
</script>

<template>
  <header class="mb-header flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-control">
      <p v-if="eyebrow" class="text-muted text-caption font-medium tracking-eyebrow uppercase">
        {{ eyebrow }}
      </p>
      <h1 class="font-serif text-title-lg tracking-tight">{{ title }}</h1>
      <p v-if="description" class="text-muted text-small max-w-prose leading-relaxed">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="shrink-0"><slot name="actions" /></div>
  </header>
</template>
