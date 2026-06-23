<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuestionPapers } from "~/composables/useQuestionPapers";
import { useSubjects } from "~/composables/useSubjects";
import { useSchools } from "~/composables/useSchools";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import { toSelectItems } from "~/utils/select";
import type { PaperQuestionRef } from "@prograds/shared";

useSeoMeta({
  title: "考古題",
  description: "跨校練單科:依考科、學校、年度、題型檢索研究所歷屆考題。",
});

// "all" sentinel: reka-ui forbids an empty-string option value, so a filter's
// "no filter" state uses an explicit "all" item, mapped back to undefined in the query.
const subject = ref<string>("all");
const school = ref<string>("all");
const year = ref<number | "all">("all");
const page = ref(1);
const pageSize = 20;

// Year dropdown: recent exam years, newest first ("all" = no filter).
const currentYear = new Date().getFullYear();
const yearOptions = [
  { label: "全部年度", value: "all" as const },
  ...Array.from({ length: 12 }, (_, i) => ({
    label: `${currentYear - i}`,
    value: currentYear - i,
  })),
];

// 考科 (subjects) + 學校 (schools, server-ordered 四大→政治→四中→…) for the filter selects.
const { data: subjects, isLoading: subjectsLoading } = useSubjects();
const { data: schools, isLoading: schoolsLoading } = useSchools();
const subjectItems = computed(() => [
  { label: "全部考科", value: "all" },
  ...toSelectItems(subjects.value),
]);
const schoolItems = computed(() => [
  { label: "全部學校", value: "all" },
  ...toSelectItems(schools.value),
]);

// Any filter change resets to the first page.
watch([subject, school, year], () => {
  page.value = 1;
});

const query = computed(() => ({
  subject: subject.value === "all" ? undefined : subject.value,
  school: school.value === "all" ? undefined : school.value,
  year: year.value === "all" ? undefined : year.value,
  page: page.value,
  pageSize,
}));

const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuestionPapers(query);

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
        :loading="subjectsLoading"
        aria-label="考科"
        placeholder="全部考科"
        class="w-full sm:w-56"
      />
      <USelectMenu
        v-model="school"
        :items="schoolItems"
        value-key="value"
        :loading="schoolsLoading"
        aria-label="學校"
        placeholder="全部學校"
        class="w-full sm:w-44"
      />
      <USelect v-model="year" :items="yearOptions" aria-label="年度" class="w-full sm:w-32" />
    </div>

    <div v-if="isPending" class="space-y-3">
      <USkeleton v-for="n in 6" :key="n" class="h-14 w-full" />
    </div>

    <ErrorState v-else-if="isError" :error="error" @retry="refetch" />

    <EmptyState v-else-if="!data || data.items.length === 0">
      查無符合條件的考卷。試試放寬考科、學校或年度。
    </EmptyState>

    <template v-else>
      <!-- 以考卷為單位:每張卷一張卡,內含題號選擇器(點題號進該題)。 -->
      <ul class="space-y-4" :class="{ 'opacity-60': isPlaceholderData }">
        <li
          v-for="p in data.items"
          :key="p.examSubject.id"
          class="border-default hover:border-default/80 rounded-card border p-card transition-colors"
        >
          <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="font-serif text-body tracking-tight"
              >{{ p.exam.school.name }} {{ p.exam.year }}</span
            >
            <span class="text-muted text-small">{{ p.examSubject.name }}</span>
            <span class="text-muted text-small"
              >· {{ ADMISSION_TYPE_LABELS[p.exam.admissionType] }}</span
            >
            <span class="text-muted text-small">· {{ p.questions.length }} 題</span>
            <UBadge v-for="s in p.subjects" :key="s.slug" color="neutral" variant="soft" size="sm">
              {{ s.name }}
            </UBadge>
          </div>

          <!-- 題號選擇器:同題組(閱讀/克漏字共用篇章)的題號以底色塊 + 「題組」標示群聚。 -->
          <div class="flex flex-wrap items-start gap-2">
            <div
              v-for="(run, i) in groupRuns(p.questions)"
              :key="i"
              class="flex flex-wrap items-center gap-1.5"
              :class="run.group ? 'bg-primary/5 rounded-md px-2 py-1.5' : ''"
            >
              <UBadge v-if="run.group" color="primary" variant="soft" size="xs" :title="run.group">
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
    </template>
  </AppPage>
</template>
