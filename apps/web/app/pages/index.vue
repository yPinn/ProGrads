<script setup lang="ts">
useSeoMeta({
  title: "ProGrads",
  description: "研究所備考作戰中心:報名資訊、考古題、招生日程、師資陣容。",
});

// Section cards for the landing — the primary navigation into the product. Order matches the
// header nav by candidate usage frequency: 考古題 (daily driver) → 報名資訊 → 招生日程 →
// 師資陣容 (research/甄試-oriented, lowest frequency). Rendered as a responsive bordered
// grid that wraps as entries are added (see the nav below).
const sections = [
  {
    to: "/questions",
    label: "考古題",
    en: "Question Bank",
    desc: "跨校練單科,依考科、學校、年度、題型檢索研究所歷屆考題。",
  },
  {
    to: "/admissions",
    label: "報名資訊",
    en: "Admissions",
    desc: "各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。",
  },
  {
    to: "/schedules",
    label: "招生日程",
    en: "Schedule",
    desc: "各校招生時程:報名起訖、筆試、面試與放榜。",
  },
  {
    to: "/faculty",
    label: "師資陣容",
    en: "Faculty",
    desc: "各校系所師資:研究方向、實驗室、最高學歷與代表著作。",
  },
];

// Honour OS reduce-motion for the JS-driven stagger (CSS guard can't reach it).
const prefersReducedMotion = useReducedMotion();
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
          <p class="text-muted text-small leading-relaxed">{{ s.desc }}</p>
        </NuxtLink>
      </div>
    </nav>
  </UContainer>
</template>
