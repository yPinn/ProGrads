<script setup lang="ts">
import { computed, onMounted, shallowRef } from "vue";
import { useQuestions } from "~/composables/useQuestions";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";

const mounted = shallowRef(false);
onMounted(() => {
  mounted.value = true;
});

const { data, isError, isFetching, refetch } = useQuestions(
  { page: 1, pageSize: 12 },
  { enabled: mounted },
);
const selected = shallowRef(0);
const pool = computed(() => data.value?.items ?? []);
const question = computed(() => pool.value[selected.value] ?? pool.value[0]);

function shuffle() {
  const alternatives = pool.value.filter((item) => item.externalId !== question.value?.externalId);
  const next = alternatives[Math.floor(Math.random() * alternatives.length)];
  if (next) selected.value = pool.value.indexOf(next);
}
</script>

<template>
  <section aria-labelledby="home-question-title">
    <AppBoard :prose="false">
      <h2 id="home-question-title" class="font-serif text-title-md">練習黑板</h2>

      <div aria-live="polite" class="mt-6 border-y border-current/25 py-5 font-sans">
        <template v-if="question">
          <p class="text-small text-(--board-accent-ink)">
            {{ question.exam.school.name }} · {{ question.exam.year }} 年考題
          </p>
          <p class="font-serif text-title-md mt-2 break-words">{{ question.examSubject.name }}</p>
          <p class="text-small mt-2">
            第 {{ question.number }} 題 · {{ QUESTION_TYPE_LABELS[question.type] }}
          </p>
        </template>
        <template v-else>
          <p class="text-small text-(--board-accent-ink)">資料結構 · 示範題</p>
          <p class="font-serif text-title-md mt-2">二分搜尋為什麼需要排序？</p>
          <details class="text-small mt-3">
            <summary class="focus-ring cursor-pointer underline underline-offset-4">
              展開示範解法
            </summary>
            <p class="mt-2 max-w-prose">
              排序讓中間值可以排除其中一半。若陣列無序，比較中間值後無法判斷目標在哪一側。
            </p>
          </details>
        </template>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans">
        <AppButton
          intent="link"
          :to="question ? `/questions/${encodeURIComponent(question.externalId)}` : '/questions'"
          class="board-action min-h-touch px-0 underline underline-offset-4"
        >
          {{ question ? "打開考題" : "瀏覽考古題" }}
        </AppButton>
        <AppButton
          v-if="pool.length > 1"
          intent="link"
          type="button"
          class="board-action min-h-touch px-0 underline-offset-4 hover:underline"
          @click="shuffle"
        >
          換一題
        </AppButton>
        <AppButton
          v-else-if="isError && !question"
          intent="link"
          type="button"
          class="board-action min-h-touch px-0 underline-offset-4 hover:underline"
          :loading="isFetching"
          @click="refetch()"
        >
          重新載入推薦
        </AppButton>
      </div>
    </AppBoard>
  </section>
</template>

<style scoped>
.board-action {
  color: var(--board-ink);
}

.board-action:hover {
  color: var(--board-accent-ink);
}

.board-action:focus-visible {
  outline-color: var(--board-accent-ink);
}
</style>
