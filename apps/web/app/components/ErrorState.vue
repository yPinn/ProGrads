<script setup lang="ts">
// Uniform error display for failed queries. Pairs with the loading/empty states
// (full set lands in Phase 1). class falls through to the root UAlert.
defineProps<{ error?: Error | null }>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    title="載入失敗"
    :description="error?.message"
    :actions="[{ label: '重試', onClick: () => emit('retry') }]"
  />
</template>
