<script setup lang="ts">
useSeoMeta({
  title: "ProGrads",
  description: "研究所備考作戰中心:報名資訊、考古題、招生日程。",
});

// Section cards for the landing — the primary navigation into the product.
// Order mirrors the application journey: where to apply → what to study → when.
const sections = [
  {
    to: "/admissions",
    label: "報名資訊",
    en: "Admissions",
    desc: "各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。",
  },
  {
    to: "/questions",
    label: "考古題",
    en: "Question Bank",
    desc: "跨校練單科,依考科、學校、年度、題型檢索研究所歷屆考題。",
  },
  {
    to: "/schedules",
    label: "招生日程",
    en: "Schedule",
    desc: "各校研究所招生事件時程:報名起訖、筆試、面試、放榜。",
  },
];
</script>

<template>
  <UContainer class="py-hero">
    <section class="max-w-2xl">
      <p class="text-muted text-caption font-medium tracking-eyebrow uppercase">
        Graduate Exam Prep · 研究所備考
      </p>
      <h1 class="font-serif text-display mt-4 tracking-tight">研究所備考作戰中心</h1>
      <p class="text-muted text-body mt-5 leading-relaxed">
        一處整合報名資訊、考古題與招生日程,讓備考的每一步都有依據。
      </p>
    </section>

    <nav
      class="border-default divide-default mt-14 grid divide-y overflow-hidden rounded-card border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      <NuxtLink
        v-for="s in sections"
        :key="s.to"
        :to="s.to"
        class="focus-ring hover:bg-elevated/50 group flex flex-col gap-2 p-6 transition-colors"
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
    </nav>
  </UContainer>
</template>
