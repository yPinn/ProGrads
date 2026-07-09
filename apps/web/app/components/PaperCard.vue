<script setup lang="ts">
import type { PaperSummary } from "@prograds/shared";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";
import { icons } from "~/utils/icons";

// One exam-paper card in the 考古題 list (docs/08). Ticket / boarding-pass layout: OMR-style
// question-tile grid (main) + perforated stub (provenance, subject tags, 整卷入口).
// Tiles are natural-width <AppButton> in a flex-wrap, never grid-tracked (would deform them).
// Row count pins to 5 → 10 → 15 via a FIXED (not max-) width on the wrap container: n·44 + (n-1)·6
// (min-w-touch 44px + gap-1.5 6px). Fixed so a short paper still reserves full-row width — the
// grid/stub split stays aligned card-to-card instead of narrowing to fit.
// md/lg breakpoints for those width jumps deliberately differ from the xs switch below: UContainer's
// padding (px-4 sm:px-6 lg:px-8, 80rem cap) leaves only ~552px of content at sm — a 494px 10-wide
// row would strand the stub at ~34px there. md/lg keep the stub ≥150px instead.
// Stacked→side-by-side uses the custom `xs` (30rem, tokens.css) instead of `sm`: at 5/row (244px)
// side-by-side already has ~140px+ of stub room from 480px up, so `sm` would strand usable width.
// Renders as <AppCard as="li"> for the list's <ul>; stagger motion/key stay with the page.
defineProps<{ paper: PaperSummary }>();
</script>

<template>
  <AppCard as="li">
    <h2 class="font-serif text-title-sm mb-3 tracking-tight">{{ paper.examSubject.name }}</h2>
    <div class="flex flex-col gap-4 xs:flex-row xs:gap-6">
      <!-- 答題卡主體(題號)。按鈕維持預設大小自然排列;固定寬(非 max-w)讓題數不滿一排時照樣留白佔位。 -->
      <div class="shrink-0">
        <div class="flex w-61 flex-wrap gap-1.5 md:w-123.5 lg:w-186">
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

      <!-- 票根 stub:吃掉題號區讓出的所有剩餘寬度,內容(文字/標籤/整卷按鈕)撐寬不變形。 -->
      <div
        class="flex min-w-0 flex-1 flex-col gap-3 border-t border-dashed border-default pt-4 xs:border-t-0 xs:border-l xs:pt-0 xs:pl-6"
      >
        <div class="text-small">
          <p class="text-default">{{ paper.exam.school.name }}</p>
          <p class="text-muted">{{ paper.exam.year }} · {{ paper.questions.length }} 題</p>
        </div>
        <div v-if="paper.subjects.length" class="flex flex-wrap gap-1.5">
          <AppBadge v-for="s in paper.subjects" :key="s.slug" intent="tag" size="sm">
            {{ s.name }}
          </AppBadge>
        </div>
        <!-- 整卷計時測驗入口;卡片次級動作 → secondary。self-start 蓋掉 flex-col 預設 stretch,按鈕才不會被撐滿寬。 -->
        <AppButton
          intent="secondary"
          size="sm"
          :to="`/questions/paper/${paper.examSubject.id}`"
          :icon="icons.timer"
          class="self-start xs:mt-auto"
          :aria-label="`整卷測驗:${paper.examSubject.name}`"
        >
          整卷測驗
        </AppButton>
      </div>
    </div>
  </AppCard>
</template>
