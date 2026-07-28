<script setup lang="ts">
import { computed } from "vue";
import type { TrendRow } from "@prograds/shared";

// 題型×年 / 考點×年 pivot table. Cell heat = count / maxCell across the WHOLE matrix (not
// per-row), so shades are comparable between rows — a row that's uniformly busy shouldn't look as
// "hot" as a row with one spiky year. Heat uses the existing primary token via color-mix (no new
// hex, per design convention) capped at a modest alpha so the number stays legible over it.
const props = defineProps<{
  label: string;
  years: number[];
  rows: TrendRow[];
  keyLabel?: (key: string) => string;
}>();

const maxCell = computed(() => Math.max(1, ...props.rows.flatMap((r) => r.cells)));

function heat(count: number): string {
  if (count === 0) return "transparent";
  const alpha = 12 + Math.round((count / maxCell.value) * 45); // 12%–57%
  return `color-mix(in srgb, var(--color-primary-500) ${alpha}%, transparent)`;
}

const TREND_ICON = { up: "↑", down: "↓", flat: "→" } as const;
const TREND_LABEL = { up: "上升", down: "下降", flat: "持平" } as const;
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-small">
      <caption class="sr-only">
        {{
          label
        }}
      </caption>
      <thead>
        <tr class="border-default border-b text-muted">
          <th scope="col" class="min-w-24 px-2 py-1.5 text-left font-medium">{{ label }}</th>
          <th v-for="y in years" :key="y" scope="col" class="px-2 py-1.5 text-right font-medium">
            {{ y }}
          </th>
          <th scope="col" class="px-2 py-1.5 text-right font-medium">Σ</th>
          <th scope="col" class="px-2 py-1.5 text-center font-medium">
            <span class="sr-only">趨勢</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" class="border-default/60 border-b last:border-b-0">
          <th scope="row" class="px-2 py-1.5 text-left font-normal text-default">
            {{ keyLabel ? keyLabel(row.key) : row.key }}
          </th>
          <td
            v-for="(count, i) in row.cells"
            :key="years[i]"
            class="px-2 py-1.5 text-right tabular-nums"
            :style="{ backgroundColor: heat(count) }"
          >
            {{ count || "·" }}
          </td>
          <td class="px-2 py-1.5 text-right font-medium tabular-nums">{{ row.total }}</td>
          <td class="px-2 py-1.5 text-center" :aria-label="TREND_LABEL[row.trend]">
            {{ TREND_ICON[row.trend] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
