<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuestionFacets } from "~/composables/useQuestionFacets";
import { useQuestionTrends } from "~/composables/useQuestionTrends";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";
import { toSelectItems } from "~/utils/select";

useSeoMeta({
  title: "歷年趨勢",
  description: "依考科檢視單一學校歷屆考題的題型、考點分佈隨年份的變化。",
});

// Subject-centric flow (mirrors /admissions's school→dept two-select shell): subject is required
// and drives everything else; school narrows to one of the subject's schools (deepest-history one
// by default). Both round-trip through the URL so the view is shareable/reload-safe.
const route = useRoute();
const router = useRouter();
const subject = ref<string | undefined>(
  typeof route.query.subject === "string" ? route.query.subject : undefined,
);
const school = ref<string | undefined>(
  typeof route.query.school === "string" ? route.query.school : undefined,
);

const { data: facets, isLoading: facetsLoading } = useQuestionFacets();
const subjectItems = computed(() => toSelectItems(facets.value?.subjects));

// Changing subject invalidates the previous subject's school pick (the slug may not exist, or
// mean something different, under the new subject) — let the server repick a default.
watch(subject, () => {
  school.value = undefined;
});

watch(
  [subject, school],
  ([s, sc]) => {
    const query = { ...route.query };
    if (s) query.subject = s;
    else delete query.subject;
    if (sc) query.school = sc;
    else delete query.school;
    router.replace({ query });
  },
  { flush: "post" },
);

const query = computed(() => ({ subject: subject.value, school: school.value, top: 30 }));
const { data: trend, isLoading, isError, error, refetch } = useQuestionTrends(query);

// As /admissions: pending until data or an error lands, covering the gap between enabling the
// query and vue-query flipping fetchStatus (would otherwise flash <EmptyState> for a frame).
const pending = computed(() => isLoading.value || (!trend.value && !isError.value));

const schoolItems = computed(() =>
  (trend.value?.schools ?? []).map((s) => ({ label: `${s.name} · ${s.years} 年`, value: s.slug })),
);

// Fewer than 3 years reads as a snapshot, not a trend (a 2-point line is misleading) — still
// render the pivot (it's real data), but say so up front instead of implying a trend exists.
const sparse = computed(() => (trend.value?.years.length ?? 0) < 3);

function typeLabel(key: string): string {
  return QUESTION_TYPE_LABELS[key as keyof typeof QUESTION_TYPE_LABELS] ?? key;
}
</script>

<template>
  <AppPage
    eyebrow="Trends · 歷年趨勢"
    title="歷年趨勢"
    description="依考科檢視單一學校歷屆考題的題型、考點分佈隨年份的變化。"
  >
    <AppCard class="mb-section flex flex-wrap items-end gap-control">
      <USelectMenu
        v-model="subject"
        :items="subjectItems"
        value-key="value"
        :loading="facetsLoading"
        aria-label="考科"
        placeholder="選擇考科"
        class="w-full sm:w-56"
      />
      <USelectMenu
        v-model="school"
        :items="schoolItems"
        value-key="value"
        :disabled="!trend"
        aria-label="學校"
        placeholder="學校(依年份深度預設)"
        class="w-full sm:w-56"
      />
    </AppCard>

    <!-- State A: no subject chosen yet. -->
    <EmptyState v-if="!subject">選擇考科,檢視歷屆考題的題型與考點趨勢。</EmptyState>

    <!-- State B: subject chosen — pivot tables for the selected/default school. -->
    <QueryState v-else :pending="pending" :error="isError ? error : null" @retry="refetch">
      <template #loading>
        <div class="space-y-3">
          <USkeleton class="h-6 w-48" />
          <USkeleton class="h-40 w-full" />
          <USkeleton class="h-56 w-full" />
        </div>
      </template>

      <div v-if="trend">
        <header class="mb-section">
          <h2 class="font-serif text-title-sm tracking-tight">
            {{ trend.subject.name }} · {{ trend.selectedSchool.name }}
          </h2>
          <p class="text-muted text-small">{{ trend.years.join(" / ") }}</p>
          <p v-if="sparse" class="text-warning-ink text-small mt-1">
            此校此考科年份不足(僅 {{ trend.years.length }} 年),尚無法呈現可靠的逐年趨勢。
          </p>
        </header>

        <AppCard class="mb-section">
          <h3 class="font-serif text-title-sm mb-3 tracking-tight">題型 × 年</h3>
          <TrendMatrix
            label="題型"
            :years="trend.years"
            :rows="trend.byType"
            :key-label="typeLabel"
          />
        </AppCard>

        <AppCard v-if="trend.byPoint.length > 0">
          <h3 class="font-serif text-title-sm mb-3 tracking-tight">考點 × 年</h3>
          <TrendMatrix label="考點" :years="trend.years" :rows="trend.byPoint" />
        </AppCard>
      </div>
    </QueryState>
  </AppPage>
</template>
