<script setup lang="ts">
import { useUpcomingSchedules } from "~/composables/useUpcomingSchedules";
import { ADMISSION_EVENT_LABELS } from "~/utils/admission-labels";
import { formatDateRange } from "~/utils/format";
import { icons } from "~/utils/icons";

useSeoMeta({
  title: "研究所考古題與招生資訊",
  description:
    "練習台灣各校研究所歷屆考古題，查詢系所招生名額、採計考科、報名與考試日期，以及師資研究方向。",
});

const sections = [
  {
    to: "/admissions",
    label: "報名資訊",
    icon: icons.document,
  },
  {
    to: "/schedules",
    label: "招生日程",
    icon: icons.calendar,
  },
  {
    to: "/faculty",
    label: "師資陣容",
    icon: icons.faculty,
  },
];

// 近期招生日程提醒:跨學年、依絕對時間撈最近幾筆,時效性內容鼓勵回訪。 Fails silently
// (hidden, no error UI) — the homepage is an entry point and shouldn't surface a broken widget.
const {
  data: upcoming,
  isPending: upcomingPending,
  isError: upcomingError,
} = useUpcomingSchedules(5);
</script>

<template>
  <UContainer class="py-hero">
    <div class="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
      <div>
        <h1 class="font-serif text-title-lg sm:text-display max-w-2xl text-balance tracking-tight">
          研究所備考作戰中心
        </h1>
        <AppButton to="/questions" class="mt-7 min-h-touch" :trailing-icon="icons.next">
          開始刷題
        </AppButton>
      </div>
      <HomeQuestionPreview />
    </div>

    <AppCard as="nav" aria-labelledby="home-explore" class="mt-section">
      <h2 id="home-explore" class="font-serif text-title-md mb-3">報考指南</h2>
      <ul
        class="border-default divide-default grid divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <li v-for="section in sections" :key="section.to" class="min-w-0 py-1 sm:px-2">
          <AppButton
            :to="section.to"
            intent="ghost"
            :leading-icon="section.icon"
            :trailing-icon="icons.next"
            class="font-serif text-title-sm text-default min-h-touch w-full justify-start gap-3"
            :ui="{ leadingIcon: 'size-5 text-primary', trailingIcon: 'ml-auto size-4' }"
          >
            {{ section.label }}
          </AppButton>
        </li>
      </ul>
    </AppCard>

    <section v-if="!upcomingError" aria-label="近期招生日程" class="mt-section">
      <div class="mb-4 flex items-baseline justify-between">
        <h2 class="font-serif text-title-sm tracking-tight">近期招生日程</h2>
        <NuxtLink to="/schedules" class="text-muted text-small hover:text-default"
          >查看完整日程 →</NuxtLink
        >
      </div>

      <AppList v-if="upcomingPending" as="div">
        <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-5 py-4">
          <USkeleton class="h-4 w-40 shrink-0" />
          <USkeleton class="h-5 w-16" />
          <USkeleton class="h-4 w-32" />
        </div>
      </AppList>

      <AppList v-else-if="upcoming && upcoming.length">
        <AppListRow
          v-for="item in upcoming"
          :key="`${item.school.slug}-${item.event}-${item.at}`"
          class="flex flex-wrap items-center gap-x-4 gap-y-1.5"
        >
          <span class="text-muted text-small w-44 shrink-0 tabular-nums">{{
            formatDateRange(item.at, item.endAt)
          }}</span>
          <span class="font-medium">{{ item.school.name }}</span>
          <AppBadge intent="meta" size="sm">{{ ADMISSION_EVENT_LABELS[item.event] }}</AppBadge>
        </AppListRow>
      </AppList>

      <p v-else class="text-muted text-small">近期尚無公告的招生日程。</p>
    </section>
  </UContainer>
</template>
