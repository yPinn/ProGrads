<script setup lang="ts">
import type { PaperSummary } from "@prograds/shared";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import { icons } from "~/utils/icons";

// One exam-paper card in the 考古題 list (see docs/08). Ticket / boarding-pass layout: an OMR-style
// answer-card grid of question tiles (main) + a perforated stub (provenance, subject tags, 整卷入口).
// Renders as <AppCard as="li"> so it drops straight into the list's <ul>; list-level concerns
// (stagger motion, key) stay with the page.
defineProps<{ paper: PaperSummary }>();
</script>

<template>
  <AppCard as="li">
    <h2 class="font-serif text-title-sm mb-3 tracking-tight">{{ paper.examSubject.name }}</h2>
    <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <!-- 答題卡主體(題號)。題組脈絡留給內頁/整卷頁,列表頁只求整齊。 -->
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap gap-1.5">
          <AppButton
            v-for="qq in paper.questions"
            :key="qq.externalId"
            intent="secondary"
            size="sm"
            :to="`/questions/${qq.externalId}`"
            class="min-h-touch min-w-touch justify-center tabular-nums"
            :aria-label="`第 ${qq.number} 題(${QUESTION_TYPE_LABELS[qq.type]})`"
          >
            {{ qq.number }}
          </AppButton>
        </div>
      </div>

      <!-- 票根 stub:固定 w-56 像實體存根;按鈕置底,可再疊入口。 -->
      <div
        class="flex shrink-0 flex-col gap-3 border-t border-dashed border-default pt-4 sm:w-56 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
      >
        <div class="text-small">
          <p class="text-default">{{ paper.exam.school.name }}</p>
          <p class="text-muted">
            {{ paper.exam.year }} · {{ ADMISSION_TYPE_LABELS[paper.exam.admissionType] }} ·
            {{ paper.questions.length }} 題
          </p>
        </div>
        <div v-if="paper.subjects.length" class="flex flex-wrap gap-1.5">
          <AppBadge
            v-for="s in paper.subjects"
            :key="s.slug"
            color="neutral"
            variant="outline"
            size="sm"
          >
            {{ s.name }}
          </AppBadge>
        </div>
        <!-- 整卷計時測驗入口;卡片次級動作 → secondary。 -->
        <AppButton
          intent="secondary"
          size="sm"
          :to="`/questions/paper/${paper.examSubject.id}`"
          :icon="icons.timer"
          class="w-full justify-center sm:mt-auto"
          :aria-label="`整卷測驗:${paper.examSubject.name}`"
        >
          整卷測驗
        </AppButton>
      </div>
    </div>
  </AppCard>
</template>
