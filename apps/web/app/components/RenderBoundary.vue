<script setup lang="ts">
// Component-level error boundary for heavy third-party render trees (Schedule-X calendar,
// MDC/KaTeX markdown). error.vue only catches fatal/SSR errors and replaces the whole app; a
// *client* render crash inside one of these widgets would otherwise blank the page. This isolates
// the crash to its own subtree, so the rest of the page — nav, other content — survives.
// `label` names the failed region in the fallback (e.g. "行事曆", "題幹").
withDefaults(defineProps<{ label?: string }>(), { label: "此區塊" });

// Dev-only diagnostics: the user-facing fallback stays generic so raw JS/stack messages never
// leak (unlike ErrorState, which surfaces curated API-envelope messages).
function logError(error: Error) {
  if (import.meta.dev) console.error(error);
}
</script>

<template>
  <NuxtErrorBoundary @error="logError">
    <slot />
    <template #error="{ clearError }">
      <UAlert
        role="alert"
        color="error"
        variant="subtle"
        :title="`${label}無法顯示`"
        description="請稍後重試，若持續發生請回報。"
        :ui="{ title: 'text-highlighted', description: 'text-toned' }"
        :actions="[{ label: '重試', onClick: () => clearError() }]"
      />
    </template>
  </NuxtErrorBoundary>
</template>
