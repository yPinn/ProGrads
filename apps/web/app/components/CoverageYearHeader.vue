<script setup lang="ts">
// Year-group heading row for /coverage's grouped tables. colspan must match the caller's
// column count — this component has no way to derive it from the table's own <thead>.
defineProps<{ year: number; colspan: number }>();
</script>

<template>
  <tr class="bg-elevated/50">
    <th
      :colspan="colspan"
      scope="colgroup"
      class="text-muted p-2 text-left text-caption tracking-eyebrow uppercase"
    >
      {{ year }} 年度
    </th>
  </tr>
</template>
