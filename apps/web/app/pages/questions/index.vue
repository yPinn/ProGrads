<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuestionPapers } from "~/composables/useQuestionPapers";
import { useQuestionFacets } from "~/composables/useQuestionFacets";

useSeoMeta({
  title: "考古題",
  description: "跨校練單科:依考科、學校、年度、題型檢索研究所歷屆考題。",
});

// "all" sentinel: reka-ui forbids an empty-string option value, so a filter's
// "no filter" state uses an explicit "all" item, mapped back to undefined in the query.
// Subject deep-link: a clickable subject tag elsewhere lands here as ?subject=<slug> (the
// cross-school single-subject entry point), so the filters init from the URL and write back to
// keep it shareable.
const route = useRoute();
const router = useRouter();
const subject = ref<string>(typeof route.query.subject === "string" ? route.query.subject : "all");
const school = ref<string>("all");
const year = ref<number | "all">("all");
const page = ref(1);
const pageSize = 20;

// Filter options come from facets — only subjects/schools/years that actually have questions, so
// the dropdowns never offer dead options. Subjects show a paper count; schools keep server order;
// years are newest first.
const { data: facets, isLoading: facetsLoading } = useQuestionFacets();
const subjectItems = computed(() => [
  { label: "全部考科", value: "all" },
  ...(facets.value?.subjects ?? []).map((s) => ({
    label: `${s.name} · ${s.paperCount} 份`,
    value: s.slug,
  })),
]);
const schoolItems = computed(() => [
  { label: "全部學校", value: "all" },
  ...(facets.value?.schools ?? []).map((s) => ({ label: s.name, value: s.slug })),
]);
const yearOptions = computed(() => [
  { label: "全部年度", value: "all" as const },
  ...(facets.value?.years ?? []).map((y) => ({ label: `${y}`, value: y })),
]);

// Any filter change resets to the first page.
watch([subject, school, year], () => {
  page.value = 1;
});

// Keep the subject filter in the URL so it's shareable and survives reload/back.
watch(subject, (s) => {
  const query = { ...route.query };
  if (s === "all") delete query.subject;
  else query.subject = s;
  router.replace({ query });
});

const query = computed(() => ({
  subject: subject.value === "all" ? undefined : subject.value,
  school: school.value === "all" ? undefined : school.value,
  year: year.value === "all" ? undefined : year.value,
  page: page.value,
  pageSize,
}));

const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuestionPapers(query);

// Honour OS reduce-motion for the JS-driven stagger (CSS guard can't reach it).
const prefersReducedMotion = useReducedMotion();
</script>

<template>
  <AppPage
    eyebrow="Question Bank · 考古題"
    title="考古題"
    description="跨校練單科:依考科、學校、年度、題型檢索研究所歷屆考題。"
  >
    <AppCard class="mb-section flex flex-wrap items-end gap-control">
      <USelectMenu
        v-model="subject"
        :items="subjectItems"
        value-key="value"
        :loading="facetsLoading"
        aria-label="考科"
        placeholder="全部考科"
        class="w-full sm:w-56"
      />
      <USelectMenu
        v-model="school"
        :items="schoolItems"
        value-key="value"
        :loading="facetsLoading"
        aria-label="學校"
        placeholder="全部學校"
        class="w-full sm:w-44"
      />
      <USelect
        v-model="year"
        :items="yearOptions"
        :loading="facetsLoading"
        aria-label="年度"
        class="w-full sm:w-32"
      />
    </AppCard>

    <QueryState
      :pending="isPending"
      :error="isError ? error : null"
      :empty="!data || data.items.length === 0"
      @retry="refetch"
    >
      <template #loading>
        <div class="space-y-3">
          <USkeleton v-for="n in 6" :key="n" class="h-14 w-full" />
        </div>
      </template>

      <template #empty>查無符合條件的考卷。試試放寬考科、學校或年度。</template>

      <div v-if="data">
        <!-- 每張考卷一張 <PaperCard>(票券版面);列表頁只管排列與進場交錯動畫。 -->
        <ul class="space-y-4" :class="{ 'opacity-60': isPlaceholderData }">
          <PaperCard
            v-for="(p, pi) in data.items"
            :key="p.examSubject.id"
            v-motion="motionFadeUp(pi, prefersReducedMotion)"
            :paper="p"
          />
        </ul>

        <div v-if="data.meta.total > pageSize" class="mt-6 flex justify-center">
          <UPagination v-model:page="page" :total="data.meta.total" :items-per-page="pageSize" />
        </div>
      </div>
    </QueryState>
  </AppPage>
</template>
