<script setup lang="ts">
import { computed } from "vue";
import { BUTTON_INTENT, type ButtonIntent, type ButtonSize } from "~/utils/button-intents";

// App-level button (see docs/08). Pick `intent` + `size`; color/variant come from the intent map.
// Everything else (to, icon, loading, disabled, @click, …) falls through to UButton.
const props = withDefaults(defineProps<{ intent?: ButtonIntent; size?: ButtonSize }>(), {
  intent: "primary",
  size: "md",
});

const style = computed(() => BUTTON_INTENT[props.intent]);
</script>

<template>
  <!-- select-none also covers the link-rendered case (to → <a>), which the base button rule misses. -->
  <UButton :color="style.color" :variant="style.variant" :size="size" class="select-none">
    <slot />
  </UButton>
</template>
