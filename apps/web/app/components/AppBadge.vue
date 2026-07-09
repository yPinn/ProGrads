<script setup lang="ts">
import { computed, resolveComponent } from "vue";
import { BADGE_INTENT, type BadgeIntent, type BadgeSize } from "~/utils/badge-intents";

// App badge = UBadge + select-none, mirroring <AppButton>: pick `intent`+`size`, color/variant
// come from the intent map (docs/08). UBadge's `as` defaults to <span> and silently swallows a
// bare `to` attr, so `to` is declared here and routed through NuxtLink; linked badges also get a
// focus ring + hover fill.
const props = withDefaults(defineProps<{ to?: string; intent?: BadgeIntent; size?: BadgeSize }>(), {
  to: undefined,
  intent: "tag",
  size: "md",
});
const linkComponent = computed(() => (props.to ? resolveComponent("NuxtLink") : undefined));
const style = computed(() => BADGE_INTENT[props.intent]);
</script>

<template>
  <UBadge
    :as="linkComponent"
    :to="to"
    :color="style.color"
    :variant="style.variant"
    :size="size"
    class="select-none"
    :class="to && 'focus-ring hover:bg-elevated transition-colors'"
    ><slot
  /></UBadge>
</template>
