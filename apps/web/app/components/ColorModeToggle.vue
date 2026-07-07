<script setup lang="ts">
import { computed } from "vue";
import { icons } from "~/utils/icons";

// Light/dark toggle, routed through <IconButton> so the theme switch inherits the design system
// (44px touch box, ghost intent, icons registry) instead of the raw <UColorModeButton>, which
// bypasses all of it. Colour mode is client-only — callers wrap this in <ClientOnly> to avoid a
// hydration mismatch (the server can't know the preference).
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// Show the target mode's icon (moon in light → "go dark", sun in dark → "go light") and toggle
// `preference`, which drives @nuxtjs/color-mode and persists the choice.
function toggle(): void {
  colorMode.preference = isDark.value ? "light" : "dark";
}
</script>

<template>
  <IconButton
    :icon="isDark ? icons.light : icons.dark"
    :label="isDark ? '切換至淺色主題' : '切換至深色主題'"
    @click="toggle"
  />
</template>
