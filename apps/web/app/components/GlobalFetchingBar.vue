<script setup lang="ts">
import { useIsFetching } from "@tanstack/vue-query";
import { computed } from "vue";

// Global in-flight indicator: any TanStack Query fetch surfaces as a thin top bar, so a pending
// request is never invisible even when a view's own skeleton is subtle or not yet mounted.
// Decorative (aria-hidden) — per-view <QueryState> owns the a11y live region and skeleton.
const fetching = useIsFetching();
const active = computed(() => fetching.value > 0);
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
  >
    <Transition name="fade">
      <!-- The faint full-width track stays visible on its own, so the signal survives when the
           reduced-motion guard freezes the head animation. -->
      <div v-if="active" class="bg-primary/25 relative h-full w-full">
        <div class="fetching-head bg-primary absolute inset-y-0 left-0 w-1/3" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Indeterminate loop: a fixed cycle length (not an enter/leave token) on the standard easing.
   The global reduced-motion guard (base.css) neutralises this to a static head; the faint track
   below keeps the signal visible in that mode. */
.fetching-head {
  animation: fetching-slide 1.1s var(--ease-standard) infinite;
}
@keyframes fetching-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
</style>
