<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuestionPapers } from "~/composables/useQuestionPapers";
import { useQuestionFacets } from "~/composables/useQuestionFacets";
import { icons } from "~/utils/icons";

useSeoMeta({
  title: "研究所歷屆考古題",
  description: "依考科、學校與年度查找台灣各校研究所歷屆考古題，逐題練習或進行整卷測驗。",
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
const pageSize = 10;

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
const quickSubjects = computed(() =>
  [...(facets.value?.subjects ?? [])].sort((a, b) => b.paperCount - a.paperCount).slice(0, 4),
);
const hasFilters = computed(
  () => subject.value !== "all" || school.value !== "all" || year.value !== "all",
);

function clearFilters() {
  subject.value = "all";
  school.value = "all";
  year.value = "all";
}

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

// Trends needs one subject (its schema requires it) — carry the current subject filter across
// when set, else send the user to trends' own subject picker.
const trendsHref = computed(() =>
  subject.value === "all" ? "/questions/trends" : `/questions/trends?subject=${subject.value}`,
);

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
        :filter-fields="['label', 'value']"
        :loading="facetsLoading"
        aria-label="考科"
        placeholder="全部考科"
        class="w-full sm:w-56"
      />
      <USelectMenu
        v-model="school"
        :items="schoolItems"
        value-key="value"
        :filter-fields="['label', 'value']"
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
      <AppButton :to="trendsHref" :icon="icons.trend" intent="link" class="ml-auto sm:ml-0"
        >看歷年趨勢</AppButton
      >
    </AppCard>

    <div v-if="!hasFilters && quickSubjects.length" class="mb-6 flex flex-wrap items-center gap-2">
      <span class="text-muted text-small mr-2">從有較多考卷的考科開始</span>
      <AppButton
        v-for="item in quickSubjects"
        :key="item.slug"
        intent="secondary"
        size="sm"
        class="min-h-touch"
        @click="subject = item.slug"
      >
        {{ item.name }}
      </AppButton>
    </div>

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

      <template #empty>
        <p>{{ hasFilters ? "查無符合條件的考卷。" : "目前沒有可瀏覽的考卷。" }}</p>
        <AppButton v-if="hasFilters" intent="secondary" class="mt-3" @click="clearFilters">
          清除篩選
        </AppButton>
      </template>

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
