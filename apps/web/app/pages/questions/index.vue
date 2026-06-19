<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuestions } from "~/composables/useQuestions";
import { QUESTION_TYPE_LABELS } from "~/utils/question-labels";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import type { QuestionType } from "@prograds/shared";

useSeoMeta({
  title: "考古題庫",
  description: "跨校練單科:依考科、學校、年度、題型檢索研究所歷屆考題。",
});

// "all" sentinel: USelect (reka-ui) forbids an empty-string option value.
const subject = ref("");
const school = ref("");
const year = ref<number | "">("");
const type = ref<QuestionType | "all">("all");
const page = ref(1);
const pageSize = 20;

// Any filter change resets to the first page.
watch([subject, school, year, type], () => {
  page.value = 1;
});

const query = computed(() => ({
  subject: subject.value || undefined,
  school: school.value || undefined,
  year: year.value === "" ? undefined : year.value,
  type: type.value === "all" ? undefined : type.value,
  page: page.value,
  pageSize,
}));

const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuestions(query);

const typeOptions = [
  { label: "全部題型", value: "all" as const },
  ...(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([value, label]) => ({
    label,
    value,
  })),
];
</script>

<template>
  <UContainer class="py-10">
    <h1 class="mb-6 text-2xl font-bold">考古題庫</h1>

    <div class="mb-6 flex flex-wrap gap-3">
      <UInput
        v-model="subject"
        aria-label="考科 slug"
        placeholder="考科 slug,如 algorithms"
        class="w-56"
      />
      <UInput v-model="school" aria-label="學校 slug" placeholder="學校 slug,如 ntu" class="w-44" />
      <UInput
        v-model.number="year"
        type="number"
        aria-label="年度"
        placeholder="年度"
        class="w-28"
      />
      <USelect v-model="type" :items="typeOptions" aria-label="題型" class="w-36" />
    </div>

    <div v-if="isPending" class="space-y-3">
      <USkeleton v-for="n in 6" :key="n" class="h-14 w-full" />
    </div>

    <ErrorState v-else-if="isError" :error="error" @retry="refetch" />

    <div v-else-if="!data || data.items.length === 0" class="text-muted py-16 text-center">
      查無符合條件的題目。
    </div>

    <template v-else>
      <ul class="divide-default divide-y" :class="{ 'opacity-60': isPlaceholderData }">
        <li v-for="q in data.items" :key="q.externalId">
          <NuxtLink
            :to="`/questions/${q.externalId}`"
            class="hover:bg-elevated flex flex-wrap items-center gap-x-4 gap-y-1 rounded px-2 py-3"
          >
            <UBadge variant="subtle">{{ QUESTION_TYPE_LABELS[q.type] }}</UBadge>
            <span class="font-medium">{{ q.exam.school.name }} {{ q.exam.year }}</span>
            <span class="text-muted text-sm">{{ q.examSubject.name }}</span>
            <span class="text-muted text-sm">· 第 {{ q.number }} 題</span>
            <span class="text-muted text-sm"
              >· {{ ADMISSION_TYPE_LABELS[q.exam.admissionType] }}</span
            >
          </NuxtLink>
        </li>
      </ul>

      <div v-if="data.meta.total > pageSize" class="mt-6 flex justify-center">
        <UPagination v-model:page="page" :total="data.meta.total" :items-per-page="pageSize" />
      </div>
    </template>
  </UContainer>
</template>
