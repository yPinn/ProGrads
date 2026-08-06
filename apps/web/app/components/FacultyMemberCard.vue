<script setup lang="ts">
import type { FacultyDegree, FacultyMemberWithDepartment, FacultyThesis } from "@prograds/shared";
import { DEGREE_LEVEL_LABELS, THESIS_ROLE_LABELS } from "~/utils/faculty-labels";

// One faculty member card: name/title, note/lab, education, research areas, theses, homepage.
// Shared by both faculty views (by-school roster and by-track cross-school listing).
defineProps<{ member: FacultyMemberWithDepartment }>();

const isHttp = (url: string | null): url is string => !!url && /^https?:\/\//.test(url);

// Compose display strings here (not in-template) so field/year separators are explicit —
// interpolations glued to element boundaries drop their whitespace under Vue's condense mode.
// 學歷:「博士 · <校> — <領域> (<年>)」, 領域/年缺省則自然略去。
function formatDegree(d: FacultyDegree): string {
  let s = `${DEGREE_LEVEL_LABELS[d.level]} · ${d.institution}`;
  if (d.field) s += ` — ${d.field}`;
  if (d.year) s += ` (${d.year})`;
  return s;
}

// 論文前綴:「著作 · 2011」/ 年缺省則只留角色「指導論文」。
function thesisTag(t: FacultyThesis): string {
  const role = THESIS_ROLE_LABELS[t.role];
  return t.year ? `${role} · ${t.year}` : role;
}
</script>

<template>
  <!-- Left/right header keeps its original split (name+lab left, title+note right) — but the two
       sides run to different line counts (note/lab optional), so a plain vertical stack afterward
       reads as a stray gap under the shorter side. A rule (border-default — the same internal-divider
       token PaperCard's ticket stub reuses, not a new one) closes that block off before credentials. -->
  <AppCard as="article">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-serif text-title-sm tracking-tight">
          {{ member.name }}
          <span v-if="member.nameEn" class="text-muted text-small font-sans">{{
            member.nameEn
          }}</span>
        </h3>
        <p v-if="member.lab" class="text-muted text-small mt-1">{{ member.lab }}</p>
      </div>
      <div v-if="member.title || member.note" class="shrink-0 text-right">
        <span v-if="member.title" class="text-small text-toned">{{ member.title }}</span>
        <p v-if="member.note" class="text-muted text-small mt-1">{{ member.note }}</p>
      </div>
    </div>

    <div
      v-if="
        member.degrees.length ||
        member.researchAreas.length ||
        member.theses.length ||
        isHttp(member.homepage)
      "
      class="border-default mt-3 border-t pt-3"
    >
      <ul v-if="member.degrees.length" class="text-muted text-small space-y-0.5">
        <li v-for="d in member.degrees" :key="d.id">{{ formatDegree(d) }}</li>
      </ul>

      <div v-if="member.researchAreas.length" class="mt-3 flex flex-wrap gap-1.5">
        <AppBadge v-for="area in member.researchAreas" :key="area" intent="tag" size="sm">
          {{ area }}
        </AppBadge>
      </div>

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
    </div>
  </AppCard>
</template>
