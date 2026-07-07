<script setup lang="ts">
import { computed } from "vue";
import { BUTTON_INTENT, type ButtonIntent } from "~/utils/button-intents";

// Icon-only button (see docs/08). `label` → aria-label (required; an icon has no accessible name).
// Default ghost; fixed 44px touch box, no `size` prop. Pass `icon` from the registry; other attrs
// (to, loading, disabled, @click, …) fall through to UButton.
const props = withDefaults(defineProps<{ icon: string; label: string; intent?: ButtonIntent }>(), {
  intent: "ghost",
});

const style = computed(() => BUTTON_INTENT[props.intent]);
</script>

<template>
  <!-- min-h/w-touch guarantees a ≥44px hit area regardless of visual size (an icon-only button is
       small and easy to miss); icon stays centred. Matches the app's other compact controls. -->
  <UButton
    :color="style.color"
    :variant="style.variant"
    :icon="icon"
    square
    :aria-label="label"
    class="min-h-touch min-w-touch justify-center select-none"
  />
</template>
