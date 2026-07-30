<script setup lang="ts">
import { useUpcomingSchedules } from "~/composables/useUpcomingSchedules";
import { ADMISSION_EVENT_LABELS } from "~/utils/admission-labels";
import { formatDateRange } from "~/utils/format";

useSeoMeta({
  title: "ProGrads",
  description: "研究所備考作戰中心:報名資訊、考古題、招生日程、師資陣容。",
});

// Section cards for the landing — the primary navigation into the product. Order matches the
// header nav by candidate usage frequency: 考古題 (daily driver) → 報名資訊 → 招生日程 →
// 師資陣容 (research/甄試-oriented, lowest frequency). Each card's `points` is a short, static
// capability list (no live data) — a text demo of what the module actually does.
const sections = [
  {
    to: "/questions",
    label: "考古題",
    en: "Question Bank",
    points: [
      "跨校練單科,同一考科比較不同學校出題",
      "依考科、學校、年度、題型四維篩選",
      "單科歷年趨勢:考點與題型分佈一次看",
    ],
  },
  {
    to: "/admissions",
    label: "報名資訊",
    en: "Admissions",
    points: [
      "各系所招生組別:名額、報名與錄取人數",
      "採計考科與佔分比例、面試方式",
      "簡章連結、報名費與減免資訊",
    ],
  },
  {
    to: "/schedules",
    label: "招生日程",
    en: "Schedule",
    points: [
      "依報名、考試、甄選、放榜四階段分組",
      "條列時程 + 月曆總覽雙視圖",
      "掌握各校報名起訖、筆試、面試時間",
    ],
  },
  {
    to: "/faculty",
    label: "師資陣容",
    en: "Faculty",
    points: [
      "依學校或所別兩種軸線瀏覽師資",
      "研究方向、實驗室與最高學歷一覽",
      "代表著作佐證,評估師資陣容",
    ],
  },
];

// Honour OS reduce-motion for the JS-driven stagger (CSS guard can't reach it).
const prefersReducedMotion = useReducedMotion();

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
    <section class="max-w-2xl">
      <p class="text-muted text-caption font-medium tracking-eyebrow uppercase">
        Graduate Exam Prep · 研究所備考
      </p>
      <h1 class="font-serif text-display mt-4 tracking-tight">研究所備考作戰中心</h1>
      <p class="text-muted text-body mt-5 leading-relaxed">
        把散落各校的備考資訊收攏於一處,讓備考的每一步都有依據。
      </p>
    </section>

    <nav aria-label="主要功能" class="border-default mt-14 overflow-hidden rounded-card border">
      <!-- Bordered card grid that stays clean at any card count: each cell draws its own top +
           left divider, and the -mt-px/-ml-px offset tucks the outermost ones under the frame's
           overflow-hidden. Unlike divide-x/divide-y (single-row only), this survives wrapping —
           adding a section just flows onto the next cell. -->
      <div class="-mt-px -ml-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="(s, i) in sections"
          :key="s.to"
          v-motion="motionFadeUp(i, prefersReducedMotion)"
          :to="s.to"
          class="border-default focus-ring hover:bg-elevated/50 group flex flex-col gap-2 border-t border-l p-6 transition-colors"
        >
          <p class="text-muted text-caption tracking-eyebrow uppercase">{{ s.en }}</p>
          <h2 class="font-serif text-title-sm tracking-tight">
            {{ s.label }}
            <span class="text-muted inline-block transition-transform group-hover:translate-x-1"
              >→</span
            >
          </h2>
          <ul class="text-muted text-small mt-1 space-y-1 leading-relaxed">
            <li v-for="point in s.points" :key="point" class="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>{{ point }}</span>
            </li>
          </ul>
        </NuxtLink>
      </div>
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
