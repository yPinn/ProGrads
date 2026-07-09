<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useQuestion } from "~/composables/useQuestion";
import { ApiError } from "~/utils/api-error";
import { QUESTION_TYPE_LABELS, REVIEW_STATUS_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import { icons } from "~/utils/icons";
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

// The paper leads the title (school + year as source) for searchability.
useSeoMeta({
  title: () =>
    q.value
      ? `${q.value.examSubject.name} ${q.value.exam.school.name} ${q.value.exam.year} 第 ${q.value.number} 題`
      : "題目",
});

// Same-paper prev/next via arrow keys (prev/next come from the detail API). Ignore modifier
// keys / already-handled events.
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
              <AppBadge intent="meta">{{ QUESTION_TYPE_LABELS[q.type] }}</AppBadge>
            </div>
            <p class="text-muted text-small mt-1">
              {{ q.exam.school.name }} {{ q.exam.year }} ·
              {{ ADMISSION_TYPE_LABELS[q.exam.admissionType] }} · 第 {{ q.number }} 題
            </p>
          </header>

          <!-- 考科練習標籤:點擊跳到該考科的跨校題庫(跨校練單科入口)。 -->
          <div v-if="q.subjects.length" class="mb-3 flex flex-wrap items-center gap-1.5">
            <span class="text-muted text-caption">考科</span>
            <AppBadge
              v-for="s in q.subjects"
              :key="s.slug"
              :to="`/questions?subject=${s.slug}`"
              intent="tag"
              :aria-label="`練習考科:${s.name}(跨校)`"
            >
              {{ s.name }}
            </AppBadge>
          </div>

          <!-- 題組(閱讀/克漏字)共用篇章:存於題組首題的 metadata.passage,組內每題皆呈現。 -->
          <section
            v-if="q.groupPassageMd"
            class="border-default bg-elevated mb-3 rounded-card border p-card"
          >
            <h2 class="text-muted text-caption mb-2 font-semibold">題組共用篇章</h2>
            <!-- Reading surface → Ming serif. prose colours come from --ui-* (components.css),
                 which flip with the theme, so no prose-invert is needed. -->
            <RenderBoundary label="題組篇章">
              <MDC :value="q.groupPassageMd" class="font-serif prose prose-sm max-w-none" />
            </RenderBoundary>
          </section>

          <!-- 題幹呈現為「黑板」:深色面在奶油頁上製造焦點與層次。<AppBoard> 把 MDC 內文映成粉筆色,
               兩主題皆然,故不需 prose-invert。 -->
          <RenderBoundary label="題幹">
            <AppBoard :value="q.contentMd" />
          </RenderBoundary>

          <RenderBoundary v-if="q.choices.length" label="選項">
            <ul class="mt-4 space-y-2">
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
          </RenderBoundary>

          <section v-if="q.explanation" class="mt-6">
            <div class="mb-2 flex items-center gap-2">
              <h2 class="font-serif text-title-sm tracking-tight">標準解析</h2>
              <AppBadge intent="meta">{{
                REVIEW_STATUS_LABELS[q.explanation.reviewStatus]
              }}</AppBadge>
            </div>
            <!-- Explanation renders on the blackboard too (chalk prose + dark-green code),
                 matching the stem; <AppBoard> applies the same treatment. -->
            <RenderBoundary label="解析">
              <AppBoard :value="q.explanation.standardAnswer" size="sm" />
            </RenderBoundary>
            <p class="text-muted text-caption mt-3">AI 生成解析,僅供參考。</p>
          </section>

          <!-- 同卷上下題切換(依題序);頭/尾題對應端 disable。亦支援左右方向鍵。 -->
          <nav
            class="border-default mt-8 flex items-center justify-between gap-3 border-t pt-4"
            aria-label="同卷題目切換"
          >
            <AppButton
              intent="ghost"
              :to="q.prev ? `/questions/${q.prev.externalId}` : undefined"
              :disabled="!q.prev"
              :icon="icons.prev"
              :aria-label="q.prev ? `上一題:第 ${q.prev.number} 題` : '已是本卷首題'"
            >
              上一題<span v-if="q.prev" class="text-muted ml-1">第 {{ q.prev.number }} 題</span>
            </AppButton>
            <AppButton
              intent="ghost"
              :to="q.next ? `/questions/${q.next.externalId}` : undefined"
              :disabled="!q.next"
              :trailing-icon="icons.next"
              :aria-label="q.next ? `下一題:第 ${q.next.number} 題` : '已是本卷末題'"
            >
              <span v-if="q.next" class="text-muted mr-1">第 {{ q.next.number }} 題</span>下一題
            </AppButton>
          </nav>
        </article>
      </QueryState>
    </div>
  </UContainer>
</template>
