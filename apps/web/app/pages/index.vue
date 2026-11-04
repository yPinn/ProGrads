<script setup lang="ts">
import { useUpcomingSchedules } from "~/composables/useUpcomingSchedules";
import { ADMISSION_EVENT_LABELS } from "~/utils/admission-labels";
import { formatDateRange } from "~/utils/format";
import { icons } from "~/utils/icons";

useSeoMeta({
  title: "ProGrads",
  description: "研究所備考作戰中心:報名資訊、考古題、招生日程、師資陣容。",
});

const sections = [
  {
    to: "/admissions",
    label: "報名資訊",
    description: "查各系所招生名額、採計考科與簡章，決定要報哪些組別。",
  },
  {
    to: "/schedules",
    label: "招生日程",
    description: "從報名到放榜，用月曆和清單掌握各校時程。",
  },
  {
    to: "/faculty",
    label: "師資陣容",
    description: "按學校或所別找老師，從研究方向和實驗室認識系所。",
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
        <p class="text-muted text-body mt-5 max-w-prose leading-relaxed">
          從一題考古題開始練習，再查想報的系所、考試日期與研究方向。
        </p>
        <AppButton to="/questions" class="mt-7 min-h-touch" :trailing-icon="icons.next">
          開始刷題
        </AppButton>
      </div>
      <HomeQuestionPreview />
    </div>

    <nav aria-labelledby="home-explore" class="mt-14">
      <h2 id="home-explore" class="font-serif text-title-md mb-4">規劃你的報考路線</h2>
      <ul
        class="border-default divide-default grid divide-y border-y md:grid-cols-3 md:divide-x md:divide-y-0"
      >
        <li v-for="section in sections" :key="section.to" class="min-w-0">
          <NuxtLink
            :to="section.to"
            class="focus-ring hover:bg-elevated/50 block px-3 py-5 transition-colors sm:px-5"
          >
            <h3 class="font-serif text-title-sm flex items-center gap-2">
              {{ section.label }}
              <UIcon :name="icons.next" aria-hidden="true" class="text-muted size-4" />
            </h3>
            <p class="text-muted text-small mt-2">{{ section.description }}</p>
          </NuxtLink>
        </li>
      </ul>
    </nav>

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
          <AppBadge intent="meta" size="sm">{{ ADMISSION_EVENT_LABELS[item.event] }}</AppBadge>
          <span class="font-medium">{{ item.school.name }}</span>
        </AppListRow>
      </AppList>

      <p v-else class="text-muted text-small">近期尚無公告的招生日程。</p>
    </section>
  </UContainer>
</template>
