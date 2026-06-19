<script setup lang="ts">
import { ref, computed } from "vue";
import { useSchedules } from "~/composables/useSchedules";
import { ADMISSION_EVENT_LABELS, ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import { formatDateRange } from "~/utils/format";

useSeoMeta({
  title: "招生行事曆",
  description: "各校研究所招生事件時程:報名起訖、筆試、面試、放榜。",
});

const year = ref(2025);
const yearOptions = [2024, 2025, 2026].map((y) => ({ label: `${y} 學年`, value: y }));

const { data, isPending, isError, error, refetch } = useSchedules(
  computed(() => ({ year: year.value })),
);
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="text-2xl font-bold">招生行事曆</h1>
      <USelect v-model="year" :items="yearOptions" aria-label="學年" class="w-36" />
    </div>

    <div v-if="isPending" class="space-y-3">
      <USkeleton v-for="n in 4" :key="n" class="h-16 w-full" />
    </div>

    <ErrorState v-else-if="isError" :error="error" @retry="refetch" />

    <div v-else-if="!data || data.length === 0" class="text-muted py-16 text-center">
      此學年尚無招生事件。
    </div>

    <ul v-else class="divide-default divide-y">
      <li
        v-for="item in data"
        :key="`${item.school.slug}-${item.event}-${item.at}`"
        class="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
      >
        <span class="text-muted w-44 shrink-0 text-sm tabular-nums">{{
          formatDateRange(item.at, item.endAt)
        }}</span>
        <UBadge variant="subtle">{{ ADMISSION_EVENT_LABELS[item.event] }}</UBadge>
        <span class="font-medium">{{ item.school.name }}</span>
        <span class="text-muted text-sm">{{ ADMISSION_TYPE_LABELS[item.admissionType] }}</span>
        <span v-if="item.location" class="text-muted text-sm">· {{ item.location }}</span>
      </li>
    </ul>
  </UContainer>
</template>
