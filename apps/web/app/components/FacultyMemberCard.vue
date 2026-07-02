<script setup lang="ts">
import type { FacultyMemberWithDepartment } from "@prograds/shared";

// One faculty member card: name/title, note/lab, research areas, thesis evidence, homepage.
// Shared by both faculty views (by-school roster and by-track cross-school listing).
defineProps<{ member: FacultyMemberWithDepartment }>();

const THESIS_ROLE_LABELS: Record<string, string> = { advised: "指導論文", authored: "著作" };
const isHttp = (url: string | null): url is string => !!url && /^https?:\/\//.test(url);
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

    <ul v-if="member.researchAreas.length" class="mt-3 flex flex-wrap gap-1.5">
      <li
        v-for="area in member.researchAreas"
        :key="area"
        class="border-default text-muted text-caption rounded-full border px-2 py-0.5"
      >
        {{ area }}
      </li>
    </ul>

    <ul v-if="member.theses.length" class="text-small mt-3 space-y-1">
      <li v-for="t in member.theses" :key="t.id" class="flex gap-2">
        <span class="text-muted shrink-0"
          >{{ THESIS_ROLE_LABELS[t.role] ?? t.role }}<span v-if="t.year"> {{ t.year }}</span></span
        >
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
