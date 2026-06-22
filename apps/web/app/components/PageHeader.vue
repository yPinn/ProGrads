<script setup lang="ts">
// Editorial page header: uppercase eyebrow + serif (Ming) title + muted description,
// with an optional right-aligned #actions slot (filters/controls). Shared across list pages.
defineProps<{ eyebrow?: string; title: string; description?: string }>();
</script>

<template>
  <header class="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-3">
      <p v-if="eyebrow" class="text-muted text-xs font-medium tracking-[0.2em] uppercase">
        {{ eyebrow }}
      </p>
      <h1 class="font-serif text-3xl tracking-tight md:text-4xl">{{ title }}</h1>
      <p v-if="description" class="text-muted max-w-prose text-sm leading-relaxed">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="shrink-0"><slot name="actions" /></div>
  </header>
</template>
