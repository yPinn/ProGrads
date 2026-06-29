<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useQuestion } from "~/composables/useQuestion";
import { ApiError } from "~/utils/api-error";
import { QUESTION_TYPE_LABELS, REVIEW_STATUS_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
// KaTeX styles only this page's MDC-rendered math; scoped here so it code-splits with the route.
import "katex/dist/katex.min.css";

const route = useRoute();
const externalId = computed(() => String(route.params.externalId));

const { data: q, isPending, isError, error, refetch } = useQuestion(externalId);

// A missing question is a real 404 page (SEO/UX), not an inline retry banner;
// other failures (network/5xx) keep the retryable ErrorState below.
watch(error, (e) => {
  if (e instanceof ApiError && e.code === "NOT_FOUND") {
    showError({ status: 404, statusText: "找不到題目" });
  }
});

// 主角是考科:title 以卷別領頭,學校年度為出處,提升搜尋性。
useSeoMeta({
  title: () =>
    q.value
      ? `${q.value.examSubject.name} ${q.value.exam.school.name} ${q.value.exam.year} 第 ${q.value.number} 題`
      : "題目",
});

// 同卷上下題:左右方向鍵切換(prev/next 由 detail API 帶入)。忽略修飾鍵 / 已處理事件。
function onArrowNav(e: KeyboardEvent) {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "ArrowLeft" && q.value?.prev) navigateTo(`/questions/${q.value.prev.externalId}`);
  else if (e.key === "ArrowRight" && q.value?.next)
    navigateTo(`/questions/${q.value.next.externalId}`);
}
onMounted(() => window.addEventListener("keydown", onArrowNav));
onBeforeUnmount(() => window.removeEventListener("keydown", onArrowNav));
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
            <USkeleton class="h-8 w-2/3" />
            <USkeleton class="h-40 w-full" />
          </div>
        </template>

        <article v-if="q" class="mt-4">
          <!-- 卷別(考科)為主角;學校×年度×管道×題號為出處,降為 muted。 -->
          <header class="mb-4">
            <p class="text-muted text-caption mb-1 tracking-eyebrow uppercase">卷別</p>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 class="font-serif text-title-md tracking-tight">{{ q.examSubject.name }}</h1>
              <UBadge variant="subtle">{{ QUESTION_TYPE_LABELS[q.type] }}</UBadge>
            </div>
            <p class="text-muted text-small mt-1">
              {{ q.exam.school.name }} {{ q.exam.year }} ·
              {{ ADMISSION_TYPE_LABELS[q.exam.admissionType] }} · 第 {{ q.number }} 題
            </p>
          </header>

          <!-- 考科練習標籤:點擊跳到該考科的跨校題庫(跨校練單科入口)。 -->
          <div v-if="q.subjects.length" class="mb-3 flex flex-wrap items-center gap-1.5">
            <span class="text-muted text-caption">考科</span>
            <UBadge
              v-for="s in q.subjects"
              :key="s.slug"
              :to="`/questions?subject=${s.slug}`"
              color="neutral"
              variant="soft"
              class="focus-ring hover:bg-elevated transition-colors"
              :aria-label="`練習考科:${s.name}(跨校)`"
            >
              {{ s.name }}
            </UBadge>
          </div>

          <!-- 題組(閱讀/克漏字)共用篇章:存於題組首題的 metadata.passage,組內每題皆呈現。 -->
          <section
            v-if="q.groupPassageMd"
            class="border-default bg-elevated mb-3 rounded-card border p-card"
          >
            <h2 class="text-muted text-caption mb-2 font-semibold">題組共用篇章</h2>
            <!-- Reading surface → Ming serif. prose colours come from --ui-* (components.css),
                 which flip with the theme, so no prose-invert is needed. -->
            <MDC :value="q.groupPassageMd" class="font-serif prose prose-sm max-w-none" />
          </section>

          <!-- 題幹呈現為「黑板」:深色面在奶油頁上製造焦點與層次。.board.prose 把 MDC 內文映成粉筆色
               (components.css),兩主題皆然,故不需 prose-invert。 -->
          <MDC :value="q.contentMd" class="board font-serif prose max-w-none rounded-card p-card" />

          <ul v-if="q.choices.length" class="mt-4 space-y-2">
            <li
              v-for="c in q.choices"
              :key="c.label"
              class="flex gap-2"
              :class="c.isCorrect ? 'text-primary font-medium' : ''"
            >
              <span class="shrink-0">({{ c.label }})</span>
              <MDC :value="c.contentMd" unwrap="p" class="prose prose-sm max-w-none" />
            </li>
          </ul>

          <section v-if="q.explanation" class="mt-6">
            <div class="mb-2 flex items-center gap-2">
              <h2 class="font-serif text-title-sm tracking-tight">標準解析</h2>
              <UBadge variant="subtle">{{
                REVIEW_STATUS_LABELS[q.explanation.reviewStatus]
              }}</UBadge>
            </div>
            <!-- Explanation renders on the blackboard too (chalk prose + dark-green code),
                 matching the stem; .board.prose and .board .shiki apply automatically. -->
            <MDC
              :value="q.explanation.standardAnswer"
              class="board font-serif prose prose-sm max-w-none rounded-card p-card"
            />
            <p class="text-muted text-caption mt-3">AI 生成解析,僅供參考。</p>
          </section>

          <!-- 同卷上下題切換(依題序);頭/尾題對應端 disable。亦支援左右方向鍵。 -->
          <nav
            class="border-default mt-8 flex items-center justify-between gap-3 border-t pt-4"
            aria-label="同卷題目切換"
          >
            <UButton
              :to="q.prev ? `/questions/${q.prev.externalId}` : undefined"
              :disabled="!q.prev"
              color="neutral"
              variant="ghost"
              icon="i-lucide-arrow-left"
              :aria-label="q.prev ? `上一題:第 ${q.prev.number} 題` : '已是本卷首題'"
            >
              上一題<span v-if="q.prev" class="text-muted ml-1">第 {{ q.prev.number }} 題</span>
            </UButton>
            <UButton
              :to="q.next ? `/questions/${q.next.externalId}` : undefined"
              :disabled="!q.next"
              color="neutral"
              variant="ghost"
              trailing-icon="i-lucide-arrow-right"
              :aria-label="q.next ? `下一題:第 ${q.next.number} 題` : '已是本卷末題'"
            >
              <span v-if="q.next" class="text-muted mr-1">第 {{ q.next.number }} 題</span>下一題
            </UButton>
          </nav>
        </article>
      </QueryState>
    </div>
  </UContainer>
</template>
