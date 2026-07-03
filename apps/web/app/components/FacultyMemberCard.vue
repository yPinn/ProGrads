<script setup lang="ts">
import type { FacultyDegree, FacultyMemberWithDepartment, FacultyThesis } from "@prograds/shared";

// One faculty member card: name/title, note/lab, education, research areas, theses, homepage.
// Shared by both faculty views (by-school roster and by-track cross-school listing).
defineProps<{ member: FacultyMemberWithDepartment }>();

const THESIS_ROLE_LABELS: Record<string, string> = { advised: "指導論文", authored: "著作" };
const DEGREE_LEVEL_LABELS: Record<string, string> = {
  bachelor: "學士",
  master: "碩士",
  phd: "博士",
  other: "其他",
};
const isHttp = (url: string | null): url is string => !!url && /^https?:\/\//.test(url);

// Compose display strings here (not in-template) so field/year separators are explicit —
// interpolations glued to element boundaries drop their whitespace under Vue's condense mode.
// 學歷:「博士 · <校> — <領域> (<年>)」, 領域/年缺省則自然略去。
function formatDegree(d: FacultyDegree): string {
  let s = `${DEGREE_LEVEL_LABELS[d.level] ?? d.level} · ${d.institution}`;
  if (d.field) s += ` — ${d.field}`;
  if (d.year) s += ` (${d.year})`;
  return s;
}

// 論文前綴:「著作 · 2011」/ 年缺省則只留角色「指導論文」。
function thesisTag(t: FacultyThesis): string {
  const role = THESIS_ROLE_LABELS[t.role] ?? t.role;
  return t.year ? `${role} · ${t.year}` : role;
}
</script>

<template>
  <article class="border-default rounded-card border p-card">
    <div class="flex items-baseline justify-between gap-2">
      <h3 class="font-serif text-title-sm tracking-tight">
        {{ member.name }}
        <span v-if="member.nameEn" class="text-muted text-small font-sans">{{
          member.nameEn
        }}</span>
      </h3>
      <span v-if="member.title" class="text-muted text-small shrink-0">{{ member.title }}</span>
    </div>

    <p v-if="member.note || member.lab" class="text-muted text-small mt-1">
      <span v-if="member.note">{{ member.note }}</span>
      <span v-if="member.note && member.lab"> · </span>
      <span v-if="member.lab">{{ member.lab }}</span>
    </p>

    <ul v-if="member.degrees.length" class="text-muted text-small mt-2 space-y-0.5">
      <li v-for="d in member.degrees" :key="d.id">{{ formatDegree(d) }}</li>
    </ul>

    <ul v-if="member.researchAreas.length" class="mt-3 flex flex-wrap gap-1.5">
      <li
        v-for="area in member.researchAreas"
        :key="area"
        class="border-default text-muted text-caption rounded-full border px-2 py-0.5"
      >
        {{ area }}
      </li>
    </ul>

    <!-- 2-col grid: the tag column sizes to the widest label (指導論文 · YYYY), so every
         thesis title shares one left baseline. `contents` keeps the <ul><li> semantics
         while letting each row's two cells land in the parent grid. -->
    <ul
      v-if="member.theses.length"
      class="text-small mt-3 grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1"
    >
      <li v-for="t in member.theses" :key="t.id" class="contents">
        <span class="text-muted tabular-nums">{{ thesisTag(t) }}</span>
        <a
          v-if="isHttp(t.url)"
          :href="t.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary"
          >{{ t.title }}</a
        >
        <span v-else>{{ t.title }}</span>
      </li>
    </ul>

    <a
      v-if="isHttp(member.homepage)"
      :href="member.homepage"
      target="_blank"
      rel="noopener noreferrer"
      class="text-primary text-small mt-3 inline-block"
    >
      個人/實驗室頁 →
    </a>
  </article>
</template>
