<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { usePaperTest } from "~/composables/usePaperTest";
import { useStopwatch } from "~/composables/useStopwatch";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import { icons } from "~/utils/icons";
import type { PaperTestQuestion } from "@prograds/shared";
// KaTeX styles this route's MDC-rendered math; scoped here so it code-splits with the page.
import "katex/dist/katex.min.css";

const route = useRoute();
const examSubjectId = computed(() => String(route.params.id));
const { data: paper, isPending, isError, error, refetch } = usePaperTest(examSubjectId);

useSeoMeta({
  title: () =>
    paper.value
      ? `${paper.value.examSubject.name} ${paper.value.exam.school.name} ${paper.value.exam.year} 測驗`
      : "整卷測驗",
});

const timer = useStopwatch();
// externalId → chosen labels (array supports 複選). Local only; nothing is persisted.
const answers = ref<Record<string, string[]>>({});
const submitted = ref(false);

// Start the clock once the paper arrives (and not after a finished attempt).
watch(paper, (p) => {
  if (p && !submitted.value && !timer.running.value) timer.start();
});

function toggleChoice(qid: string, label: string): void {
  if (submitted.value) return;
  const cur = answers.value[qid] ?? [];
  const next = cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label];
  answers.value = { ...answers.value, [qid]: next };
}
const isSelected = (qid: string, label: string): boolean =>
  (answers.value[qid] ?? []).includes(label);

// Only choice-bearing questions are auto-gradable; 申論/計算/證明 are shown for self-review.
const gradable = computed(() => (paper.value?.questions ?? []).filter((q) => q.choices.length > 0));
const answeredCount = computed(
  () => gradable.value.filter((q) => (answers.value[q.externalId] ?? []).length > 0).length,
);

const correctLabels = (q: PaperTestQuestion): string[] =>
  q.choices
    .filter((c) => c.isCorrect)
    .map((c) => c.label)
    .sort();
function isQuestionCorrect(q: PaperTestQuestion): boolean {
  const picked = [...(answers.value[q.externalId] ?? [])].sort();
  const answer = correctLabels(q);
  return picked.length === answer.length && picked.every((l, i) => l === answer[i]);
}
const score = computed(() => gradable.value.filter(isQuestionCorrect).length);

// Timer display. With a paper time limit (durationMinutes) it counts DOWN (剩餘 → 超時); without a
// limit it counts up. After 交卷 it shows total time used. Source of truth stays the count-up
// stopwatch; remaining is derived, so overtime keeps ticking (never clamps) as a visible penalty.
const limitSec = computed(() =>
  paper.value?.durationMinutes ? paper.value.durationMinutes * 60 : null,
);
const elapsedSec = computed(() => Math.floor(timer.elapsedMs.value / 1000));
const remainingSec = computed(() =>
  limitSec.value === null ? null : limitSec.value - elapsedSec.value,
);
const overtime = computed(() => remainingSec.value !== null && remainingSec.value < 0);

function fmtClock(sec: number): string {
  const s = Math.abs(Math.trunc(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}
const timerText = computed(() => {
  if (submitted.value) return `用時 ${fmtClock(elapsedSec.value)}`;
  if (remainingSec.value === null) return fmtClock(elapsedSec.value); // count-up (no limit)
  return overtime.value
    ? `超時 ${fmtClock(remainingSec.value)}`
    : `剩餘 ${fmtClock(remainingSec.value)}`;
});
const timerClass = computed(() =>
  submitted.value ? "text-muted" : overtime.value ? "text-error-ink" : "text-default",
);

function submit(): void {
  if (submitted.value) return;
  submitted.value = true;
  timer.stop();
  if (import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" });
}
function restart(): void {
  answers.value = {};
  submitted.value = false;
  timer.reset();
  timer.start();
  if (import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" });
}

// Render each 題組 passage once, above its first question (paper order).
const passageAnchors = computed(() => {
  const anchors = new Set<string>();
  let prev: string | null = null;
  for (const q of paper.value?.questions ?? []) {
    if (q.group && q.group !== prev && q.groupPassageMd) anchors.add(q.externalId);
    prev = q.group ?? null;
  }
  return anchors;
});

// After submit, classify a choice for colour/marker: correct answer, the user's wrong pick, else muted.
function choiceState(
  q: PaperTestQuestion,
  label: string,
  isCorrect: boolean,
): "correct" | "wrong" | "muted" {
  if (isCorrect) return "correct";
  return isSelected(q.externalId, label) ? "wrong" : "muted";
}
</script>

<template>
  <UContainer class="py-page">
    <div class="mx-auto max-w-reading">
      <NuxtLink
        to="/questions"
        class="focus-ring text-muted hover:text-default inline-flex min-h-touch items-center text-small"
        >← 回題庫</NuxtLink
      >

      <QueryState :pending="isPending" :error="isError ? error : null" @retry="refetch">
        <template #loading>
          <div class="mt-6 space-y-3">
            <USkeleton class="h-10 w-2/3" />
            <USkeleton class="h-40 w-full" />
            <USkeleton class="h-40 w-full" />
          </div>
        </template>

        <div v-if="paper">
          <!-- Pinned control bar: timer + progress + 交卷. After submit it flips to the score summary.
               top-nav pins it directly below the global nav bar (both consume --spacing-nav). -->
          <div
            class="bg-default/80 border-default sticky top-nav z-10 mb-section border-b py-control backdrop-blur"
          >
            <div class="flex flex-wrap items-center justify-between gap-control">
              <div class="min-w-0">
                <p class="font-serif text-body tracking-tight truncate">
                  {{ paper.examSubject.name }}
                </p>
                <p class="text-muted text-caption">
                  {{ paper.exam.school.name }} {{ paper.exam.year }} ·
                  {{ ADMISSION_TYPE_LABELS[paper.exam.admissionType] }} ·
                  {{ paper.questions.length }} 題<span v-if="paper.durationMinutes">
                    · 限時 {{ paper.durationMinutes }} 分</span
                  >
                </p>
              </div>

              <div class="flex items-center gap-control">
                <span
                  class="text-body font-medium tabular-nums"
                  :class="timerClass"
                  :aria-label="limitSec === null ? '作答計時' : '剩餘作答時間'"
                >
                  <UIcon :name="icons.timer" class="mr-1 align-[-2px]" />{{ timerText }}
                </span>

                <template v-if="!submitted">
                  <span class="text-muted text-caption tabular-nums"
                    >已答 {{ answeredCount }}/{{ gradable.length }}</span
                  >
                  <AppButton intent="primary" size="sm" @click="submit">交卷</AppButton>
                </template>
                <template v-else>
                  <AppBadge color="primary" variant="soft" size="lg" class="tabular-nums">
                    得分 {{ score }}/{{ gradable.length }}
                  </AppBadge>
                  <AppButton intent="secondary" size="sm" @click="restart">再測一次</AppButton>
                </template>
              </div>
            </div>
          </div>

          <p
            v-if="!submitted && overtime"
            class="text-error-ink text-small mb-section flex items-center gap-2"
            role="status"
          >
            <UIcon :name="icons.overtime" class="shrink-0" aria-hidden="true" />
            已超過本卷限時 {{ paper.durationMinutes }} 分鐘，建議交卷。
          </p>
          <p v-else-if="!submitted" class="text-muted text-caption mb-section">
            整卷連續作答，作答時答案與解析隱藏；按「交卷」後揭曉正解、標準解析並自動批改（申論／計算題不計分，供自行對照）。
          </p>

          <ol class="space-y-section">
            <li v-for="q in paper.questions" :key="q.externalId">
              <!-- 題組共用篇章:每組僅在首題上方呈現一次。 -->
              <section
                v-if="passageAnchors.has(q.externalId) && q.groupPassageMd"
                class="border-default bg-elevated mb-3 rounded-card border p-card"
              >
                <h2 class="text-muted text-caption mb-2 font-semibold">題組共用篇章</h2>
                <RenderBoundary label="題組篇章">
                  <MDC :value="q.groupPassageMd" class="font-serif prose prose-sm max-w-none" />
                </RenderBoundary>
              </section>

              <div class="mb-2 flex items-center gap-2">
                <span class="font-serif text-title-sm tracking-tight">第 {{ q.number }} 題</span>
                <AppBadge variant="subtle" size="sm">{{ QUESTION_TYPE_LABELS[q.type] }}</AppBadge>
                <UIcon
                  v-if="submitted && q.choices.length"
                  :name="isQuestionCorrect(q) ? icons.correct : icons.wrong"
                  :class="isQuestionCorrect(q) ? 'text-primary' : 'text-error'"
                  aria-hidden="true"
                />
              </div>

              <RenderBoundary label="題幹">
                <AppBoard :value="q.contentMd" />
              </RenderBoundary>

              <!-- 選項:作答前可點選(複選以多次點擊切換);交卷後標示正解與作答對錯。 -->
              <ul v-if="q.choices.length" class="mt-4 space-y-2">
                <li v-for="c in q.choices" :key="c.label">
                  <button
                    type="button"
                    :disabled="submitted"
                    :aria-pressed="isSelected(q.externalId, c.label)"
                    class="focus-ring flex w-full items-start gap-2 rounded-card border p-control text-left transition-colors"
                    :class="[
                      !submitted && isSelected(q.externalId, c.label)
                        ? 'border-primary bg-primary/5'
                        : 'border-default',
                      !submitted ? 'hover:border-default/80 cursor-pointer' : 'cursor-default',
                      submitted && choiceState(q, c.label, c.isCorrect) === 'correct'
                        ? 'border-primary bg-primary/10'
                        : '',
                      submitted && choiceState(q, c.label, c.isCorrect) === 'wrong'
                        ? 'border-error bg-error/10'
                        : '',
                    ]"
                    @click="toggleChoice(q.externalId, c.label)"
                  >
                    <span
                      class="shrink-0 font-medium"
                      :class="[
                        submitted && c.isCorrect ? 'text-primary' : '',
                        submitted && choiceState(q, c.label, c.isCorrect) === 'wrong'
                          ? 'text-error-ink'
                          : '',
                      ]"
                      >({{ c.label }})</span
                    >
                    <MDC :value="c.contentMd" unwrap="p" class="prose prose-sm max-w-none" />
                    <UIcon
                      v-if="submitted && c.isCorrect"
                      :name="icons.correct"
                      class="text-primary ml-auto shrink-0"
                      aria-label="正解"
                    />
                    <UIcon
                      v-else-if="submitted && isSelected(q.externalId, c.label)"
                      :name="icons.wrong"
                      class="text-error ml-auto shrink-0"
                      aria-label="你的選擇(錯誤)"
                    />
                  </button>
                </li>
              </ul>

              <!-- 標準解析:交卷後才揭曉。 -->
              <section v-if="submitted && q.explanation" class="mt-4">
                <h3 class="font-serif text-body mb-2 tracking-tight">標準解析</h3>
                <RenderBoundary label="解析">
                  <AppBoard :value="q.explanation.standardAnswer" size="sm" />
                </RenderBoundary>
                <p class="text-muted text-caption mt-2">
                  AI 生成解析,僅供參考。<span v-if="!q.choices.length"
                    >申論／計算題不計分,請自行對照。</span
                  >
                </p>
              </section>
            </li>
          </ol>

          <div v-if="!submitted" class="mt-10 flex justify-center">
            <AppButton intent="primary" size="lg" @click="submit">交卷並看解析</AppButton>
          </div>
        </div>
      </QueryState>
    </div>
  </UContainer>
</template>
