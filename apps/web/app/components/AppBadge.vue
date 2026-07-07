<script setup lang="ts">
// App badge = UBadge + select-none, mirroring <AppButton>: a chip label (or its link-rendered
// form) shouldn't tap-hold-select like body text. All props (color, variant, size, to, …) and
// classes fall through to UBadge. Later this is the natural home for a badge-intent map.
</script>

<template>
  <UBadge class="select-none"><slot /></UBadge>
</template>
