<script setup lang="ts">
import type { MDCNode, MDCRoot } from "@nuxtjs/mdc";
import { computed, onMounted, shallowRef } from "vue";
import { useQuestion } from "~/composables/useQuestion";
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
const { data: questionDetail, isPending: detailPending } = useQuestion(
  () => question.value?.externalId ?? "",
);

const previewParserOptions = {
  highlight: false,
  rehype: { plugins: { "rehype-katex": false } },
} as const;
const blockTags = new Set(["br", "h1", "h2", "h3", "li", "p", "pre", "td", "th"]);

function nodeText(node: MDCNode | MDCRoot): string {
  if (node.type === "text") return node.value;
  if (node.type === "comment") return "";
  const text = node.children.map(nodeText).join("");
  if (node.type === "element" && node.tag === "img") {
    return typeof node.props?.alt === "string" ? node.props.alt : "";
  }
  return node.type === "element" && blockTags.has(node.tag) ? text + " " : text;
}

function previewText(body: MDCRoot): string {
  const characters = Array.from(nodeText(body).replace(/\s+/g, " ").trim());
  return characters.length > 240
    ? characters.slice(0, 240).join("").trimEnd() + "…"
    : characters.join("");
}

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
            {{ question.exam.school.name }} · {{ question.exam.year }} 年 ·
            {{ question.examSubject.name }}
          </p>
          <p class="text-caption mt-1">
            第 {{ question.number }} 題 · {{ QUESTION_TYPE_LABELS[question.type] }}
          </p>
          <MDC
            v-if="questionDetail?.contentMd"
            :key="question.externalId"
            v-slot="{ body }"
            :value="questionDetail.contentMd"
            :parser-options="previewParserOptions"
            partial
          >
            <p v-if="body" class="font-serif text-reading mt-3 line-clamp-4 wrap-anywhere">
              {{ previewText(body) }}
            </p>
          </MDC>
          <div v-else-if="detailPending" aria-hidden="true" class="mt-4 space-y-2">
            <USkeleton class="h-3 w-full bg-current/15" />
            <USkeleton class="h-3 w-2/3 bg-current/15" />
          </div>
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
