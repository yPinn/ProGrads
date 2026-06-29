<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuestionPapers } from "~/composables/useQuestionPapers";
import { useQuestionFacets } from "~/composables/useQuestionFacets";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import type { PaperQuestionRef } from "@prograds/shared";

useSeoMeta({
  title: "考古題",
  description: "跨校練單科:依考科、學校、年度、題型檢索研究所歷屆考題。",
});

// "all" sentinel: reka-ui forbids an empty-string option value, so a filter's
// "no filter" state uses an explicit "all" item, mapped back to undefined in the query.
// 考科 deep-link: a clickable subject tag elsewhere lands here as ?subject=<slug>
// (跨校練單科 entry), so the filter初始化自 URL 並回寫,維持可分享狀態。
const route = useRoute();
const router = useRouter();
const subject = ref<string>(typeof route.query.subject === "string" ? route.query.subject : "all");
const school = ref<string>("all");
const year = ref<number | "all">("all");
const page = ref(1);
const pageSize = 20;

// Filter options come from facets — only 考科/學校/年度 that actually have questions, so the
// dropdowns never offer dead options. 考科 shows its题數; 學校 keeps server order; 年度 newest first.
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

// Keep the 考科 filter in the URL so it's shareable and survives reload/back.
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

// Cluster consecutive questions sharing a 題組 (passage/cloze set) so the 題號 selector can
// visually bracket them. Questions arrive in paper order, so a single linear pass suffices.
function groupRuns(
  questions: PaperQuestionRef[],
): { group: string | null; items: PaperQuestionRef[] }[] {
  const runs: { group: string | null; items: PaperQuestionRef[] }[] = [];
  for (const q of questions) {
    const g = q.group ?? null;
    const last = runs[runs.length - 1];
    if (last && last.group === g) last.items.push(q);
    else runs.push({ group: g, items: [q] });
  }
  return runs;
}
</script>

<template>
  <AppPage
    eyebrow="Question Bank · 考古題"
    title="考古題"
    description="跨校練單科:依考科、學校、年度、題型檢索研究所歷屆考題。"
  >
    <div class="border-default mb-section flex flex-wrap gap-control rounded-card border p-card">
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

      <template #empty>查無符合條件的考卷。試試放寬考科、學校或年度。</template>

      <div v-if="data">
        <!-- 以考卷為單位:每張卷一張卡,內含題號選擇器(點題號進該題)。 -->
        <ul class="space-y-4" :class="{ 'opacity-60': isPlaceholderData }">
          <li
            v-for="(p, pi) in data.items"
            :key="p.examSubject.id"
            v-motion="motionFadeUp(pi, prefersReducedMotion)"
            class="border-default hover:border-default/80 rounded-card border p-card transition-colors"
          >
            <!-- 主角是考科(卷別);學校年度為出處,降為 muted。 -->
            <div class="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="font-serif text-body tracking-tight">{{ p.examSubject.name }}</span>
              <UBadge
                v-for="s in p.subjects"
                :key="s.slug"
                color="neutral"
                variant="soft"
                size="sm"
              >
                {{ s.name }}
              </UBadge>
            </div>
            <p class="text-muted text-small mb-3">
              {{ p.exam.school.name }} {{ p.exam.year }} ·
              {{ ADMISSION_TYPE_LABELS[p.exam.admissionType] }} · {{ p.questions.length }} 題
            </p>

            <!-- 題號選擇器:同題組(閱讀/克漏字共用篇章)的題號以底色塊 + 「題組」標示群聚。 -->
            <div class="flex flex-wrap items-start gap-2">
              <div
                v-for="(run, i) in groupRuns(p.questions)"
                :key="i"
                class="flex flex-wrap items-center gap-1.5"
                :class="run.group ? 'bg-primary/5 rounded-md px-2 py-1.5' : ''"
              >
                <UBadge
                  v-if="run.group"
                  color="primary"
                  variant="soft"
                  size="xs"
                  :title="run.group"
                >
                  題組
                </UBadge>
                <UButton
                  v-for="qq in run.items"
                  :key="qq.externalId"
                  :to="`/questions/${qq.externalId}`"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  class="min-h-touch min-w-touch justify-center"
                  :aria-label="`第 ${qq.number} 題(${QUESTION_TYPE_LABELS[qq.type]})`"
                >
                  {{ qq.number }}
                </UButton>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="data.meta.total > pageSize" class="mt-6 flex justify-center">
          <UPagination v-model:page="page" :total="data.meta.total" :items-per-page="pageSize" />
        </div>
      </div>
    </QueryState>
  </AppPage>
</template>
