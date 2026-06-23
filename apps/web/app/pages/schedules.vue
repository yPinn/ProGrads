<script setup lang="ts">
import { ref, computed } from "vue";
import { useSchedules } from "~/composables/useSchedules";
import {
  ADMISSION_EVENT_LABELS,
  ADMISSION_TYPE_LABELS,
  ADMISSION_EVENT_PHASE,
  ADMISSION_PHASE_LABELS,
  ADMISSION_PHASE_ORDER,
} from "~/utils/admission-labels";
import { formatDateRange } from "~/utils/format";

useSeoMeta({
  title: "招生日程",
  description: "各校研究所招生事件時程:報名起訖、筆試、面試、放榜。",
});

const year = ref(2025);
const yearOptions = [2024, 2025, 2026].map((y) => ({ label: `${y} 學年`, value: y }));

const { data, isPending, isError, error, refetch } = useSchedules(
  computed(() => ({ year: year.value })),
);

// Group the year's events into the four lifecycle phases (fixed order); within a phase the API's
// time-sorted order is preserved. Empty phases are dropped so review-only seasons don't show a
// bare "考試" header.
const phaseGroups = computed(() =>
  ADMISSION_PHASE_ORDER.map((phase) => ({
    phase,
    label: ADMISSION_PHASE_LABELS[phase],
    items: (data.value ?? []).filter((e) => ADMISSION_EVENT_PHASE[e.event] === phase),
  })).filter((g) => g.items.length > 0),
);
</script>

<template>
  <AppPage
    eyebrow="Schedule · 招生日程"
    title="招生日程"
    description="各校研究所招生事件時程：依報名、考試、甄選、放榜四階段分組。"
  >
    <template #actions>
      <USelect v-model="year" :items="yearOptions" aria-label="學年" class="w-36" />
    </template>

    <div v-if="isPending" class="border-default divide-default divide-y rounded-card border">
      <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-5 py-4">
        <USkeleton class="h-4 w-40 shrink-0" />
        <USkeleton class="h-5 w-16" />
        <USkeleton class="h-4 w-48" />
      </div>
    </div>

    <ErrorState v-else-if="isError" :error="error" @retry="refetch" />

    <EmptyState v-else-if="!data || data.length === 0">此學年尚無招生事件。</EmptyState>

    <div v-else class="space-y-section">
      <section v-for="group in phaseGroups" :key="group.phase">
        <h2 class="text-muted text-caption mb-3 font-medium tracking-eyebrow uppercase">
          {{ group.label }}
        </h2>
        <ul class="border-default divide-default divide-y rounded-card border">
          <li
            v-for="item in group.items"
            :key="`${item.school.slug}-${item.event}-${item.at}`"
            class="hover:bg-elevated/50 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 transition-colors first:rounded-t-card last:rounded-b-card"
          >
            <span class="text-muted text-small w-44 shrink-0 tabular-nums">{{
              formatDateRange(item.at, item.endAt)
            }}</span>
            <UBadge variant="subtle" size="sm">{{ ADMISSION_EVENT_LABELS[item.event] }}</UBadge>
            <span class="font-medium">{{ item.school.name }}</span>
            <span class="text-muted text-small">{{
              ADMISSION_TYPE_LABELS[item.admissionType]
            }}</span>
            <span v-if="item.location" class="text-muted text-small">· {{ item.location }}</span>
          </li>
        </ul>
      </section>
    </div>
  </AppPage>
</template>
