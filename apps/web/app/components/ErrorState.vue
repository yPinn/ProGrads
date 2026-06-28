<script setup lang="ts">
// Uniform error display for failed queries. Pairs with QueryState's loading/empty states.
// color="error" carries the semantic via the icon/ring/tint; title + description use ink text
// (text-highlighted/text-toned) because the base error tone on cream is only ~4.4:1 — below AA
// for small text (see DESIGN.md: coloured text stays primary/neutral). class falls through.
defineProps<{ error?: Error | null }>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <UAlert
    role="alert"
    color="error"
    variant="subtle"
    title="載入失敗"
    :description="error?.message"
    :ui="{ title: 'text-highlighted', description: 'text-toned' }"
    :actions="[{ label: '重試', onClick: () => emit('retry') }]"
  />
</template>
