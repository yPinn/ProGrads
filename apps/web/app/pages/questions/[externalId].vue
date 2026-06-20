<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuestion } from "~/composables/useQuestion";
import { ApiError } from "~/utils/api-error";
import { QUESTION_TYPE_LABELS, REVIEW_STATUS_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";

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

useSeoMeta({
  title: () =>
    q.value ? `${q.value.exam.school.name} ${q.value.exam.year} 第 ${q.value.number} 題` : "題目",
});
</script>

<template>
  <UContainer class="py-10">
    <NuxtLink to="/questions" class="text-muted hover:text-default text-sm">← 回題庫</NuxtLink>

    <div v-if="isPending" class="mt-6 space-y-3">
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-40 w-full" />
    </div>

    <ErrorState v-else-if="isError" class="mt-6" :error="error" @retry="refetch" />

    <article v-else-if="q" class="mt-4">
      <header class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="text-xl font-bold">{{ q.exam.school.name }} {{ q.exam.year }}</h1>
        <UBadge variant="subtle">{{ QUESTION_TYPE_LABELS[q.type] }}</UBadge>
        <span class="text-muted text-sm">{{ q.examSubject.name }} · 第 {{ q.number }} 題</span>
        <span class="text-muted text-sm">{{ ADMISSION_TYPE_LABELS[q.exam.admissionType] }}</span>
      </header>

      <div class="mb-3 flex flex-wrap gap-1">
        <UBadge v-for="s in q.subjects" :key="s.slug" color="neutral" variant="soft">
          {{ s.name }}
        </UBadge>
      </div>

      <!-- 題組(閱讀/克漏字)共用篇章:存於題組首題的 metadata.passage,組內每題皆呈現。 -->
      <section v-if="q.groupPassageMd" class="border-default bg-elevated mb-3 rounded border p-4">
        <h2 class="text-muted mb-2 text-xs font-semibold">題組共用篇章</h2>
        <MDC :value="q.groupPassageMd" class="prose prose-sm dark:prose-invert max-w-none" />
      </section>

      <!-- contentMd 經 MDC 渲染(粗體/引用/清單/程式碼);數學式 KaTeX 待後續。 -->
      <MDC
        :value="q.contentMd"
        class="border-default prose dark:prose-invert max-w-none rounded border p-4"
      />

      <ul v-if="q.choices.length" class="mt-4 space-y-2">
        <li
          v-for="c in q.choices"
          :key="c.label"
          class="flex gap-2"
          :class="c.isCorrect ? 'text-primary font-medium' : ''"
        >
          <span class="shrink-0">({{ c.label }})</span>
          <MDC
            :value="c.contentMd"
            unwrap="p"
            class="prose prose-sm dark:prose-invert max-w-none"
          />
        </li>
      </ul>

      <section v-if="q.explanation" class="bg-elevated mt-6 rounded p-4">
        <div class="mb-2 flex items-center gap-2">
          <h2 class="font-semibold">標準解析</h2>
          <UBadge variant="subtle">{{ REVIEW_STATUS_LABELS[q.explanation.reviewStatus] }}</UBadge>
        </div>
        <MDC
          :value="q.explanation.standardAnswer"
          class="prose prose-sm dark:prose-invert max-w-none"
        />
        <p class="text-muted mt-3 text-xs">AI 生成解析,僅供參考。</p>
      </section>
    </article>
  </UContainer>
</template>
