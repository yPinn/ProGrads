<script setup lang="ts">
// Shared query state machine for every data-backed page: one fade transition, one branch
// order (loading → error → empty → data), consistent a11y (aria-busy + a status live region).
// Pages supply the #loading and #empty slots and the default (data) slot; errors render
// through <ErrorState> with `retry` forwarded.
defineProps<{
  pending: boolean;
  error?: Error | null;
  empty?: boolean;
}>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <!-- Concurrent fade, not `out-in`: out-in's leave-then-enter gap can wedge open on a fast state
       flip (data → loading → data when switching school/dept), leaving the view blank until the
       component remounts. Overlapping enter/leave keeps one branch on screen at all times. -->
  <Transition name="fade">
    <div v-if="pending" key="loading" role="status" aria-live="polite" aria-busy="true">
      <span class="sr-only">載入中…</span>
      <slot name="loading" />
    </div>

    <ErrorState v-else-if="error" key="error" :error="error" @retry="emit('retry')" />

    <EmptyState v-else-if="empty" key="empty"><slot name="empty" /></EmptyState>

    <div v-else key="data"><slot /></div>
  </Transition>
</template>
