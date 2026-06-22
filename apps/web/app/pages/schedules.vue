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
  <UContainer class="py-12 md:py-16">
    <PageHeader
      eyebrow="Schedule · 招生時程"
      title="招生行事曆"
      description="各校研究所招生事件時程：報名起訖、筆試、面試、放榜，依時間排序。"
    >
      <template #actions>
        <USelect v-model="year" :items="yearOptions" aria-label="學年" class="w-36" />
      </template>
    </PageHeader>

    <div
      v-if="isPending"
      class="border-default divide-default divide-y rounded-(--ui-radius) border"
    >
      <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-5 py-4">
        <USkeleton class="h-4 w-40 shrink-0" />
        <USkeleton class="h-5 w-16" />
        <USkeleton class="h-4 w-48" />
      </div>
    </div>

    <ErrorState v-else-if="isError" :error="error" @retry="refetch" />

    <EmptyState v-else-if="!data || data.length === 0">此學年尚無招生事件。</EmptyState>

    <ul v-else class="border-default divide-default divide-y rounded-(--ui-radius) border">
      <li
        v-for="item in data"
        :key="`${item.school.slug}-${item.event}-${item.at}`"
        class="hover:bg-elevated/50 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 transition-colors first:rounded-t-(--ui-radius) last:rounded-b-(--ui-radius)"
      >
        <span class="text-muted w-44 shrink-0 text-sm tabular-nums">{{
          formatDateRange(item.at, item.endAt)
        }}</span>
        <UBadge variant="subtle" size="sm">{{ ADMISSION_EVENT_LABELS[item.event] }}</UBadge>
        <span class="font-medium">{{ item.school.name }}</span>
        <span class="text-muted text-sm">{{ ADMISSION_TYPE_LABELS[item.admissionType] }}</span>
        <span v-if="item.location" class="text-muted text-sm">· {{ item.location }}</span>
      </li>
    </ul>
  </UContainer>
</template>
