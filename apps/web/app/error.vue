<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{ error: NuxtError }>();

// error.vue replaces app.vue when an error is thrown, so it needs its own UApp.
const handleClear = () => clearError({ redirect: "/" });
</script>

<template>
  <UApp>
    <UContainer class="flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
      <h1 class="font-serif text-title-lg tracking-tight">{{ error.status }}</h1>
      <p class="text-muted text-body">{{ error.statusText || "發生未預期的錯誤" }}</p>
      <AppButton @click="handleClear">回到首頁</AppButton>
    </UContainer>
  </UApp>
</template>
