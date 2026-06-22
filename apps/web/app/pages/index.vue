<script setup lang="ts">
useSeoMeta({
  title: "ProGrads",
  description: "研究所備考作戰中心:考古題庫、報名情報、招生行事曆。",
});

// Section cards for the landing — the primary navigation into the product.
const sections = [
  {
    to: "/questions",
    label: "考古題庫",
    en: "Question Bank",
    desc: "跨校練單科,依考科、學校、年度、題型檢索研究所歷屆考題。",
  },
  {
    to: "/admissions",
    label: "報名情報",
    en: "Admissions",
    desc: "各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。",
  },
  {
    to: "/schedules",
    label: "招生行事曆",
    en: "Schedule",
    desc: "各校研究所招生事件時程:報名起訖、筆試、面試、放榜。",
  },
];
</script>

<template>
  <UContainer class="py-20 md:py-28">
    <section class="max-w-2xl">
      <p class="text-muted text-xs font-medium tracking-[0.2em] uppercase">
        Graduate Exam Prep · 研究所備考
      </p>
      <h1 class="font-serif mt-4 text-5xl tracking-tight md:text-6xl">研究所備考作戰中心</h1>
      <p class="text-muted mt-5 text-base leading-relaxed">
        一處整合考古題庫、報名情報與招生行事曆,讓備考的每一步都有依據。
      </p>
    </section>

    <nav
      class="border-default divide-default mt-14 grid divide-y overflow-hidden rounded-(--ui-radius) border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      <NuxtLink
        v-for="s in sections"
        :key="s.to"
        :to="s.to"
        class="hover:bg-elevated/50 group flex flex-col gap-2 p-6 transition-colors"
      >
        <p class="text-muted text-xs tracking-[0.15em] uppercase">{{ s.en }}</p>
        <h2 class="font-serif text-xl tracking-tight">
          {{ s.label }}
          <span class="text-muted inline-block transition-transform group-hover:translate-x-1"
            >→</span
          >
        </h2>
        <p class="text-muted text-sm leading-relaxed">{{ s.desc }}</p>
      </NuxtLink>
    </nav>
  </UContainer>
</template>
