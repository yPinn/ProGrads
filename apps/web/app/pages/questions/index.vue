<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuestionPapers } from "~/composables/useQuestionPapers";
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

const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuestionPapers(query);

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
      查無符合條件的考卷。
    </div>

    <template v-else>
      <!-- 以考卷為單位:每張卷一張卡,內含題號選擇器(點題號進該題)。 -->
      <ul class="space-y-4" :class="{ 'opacity-60': isPlaceholderData }">
        <li
          v-for="p in data.items"
          :key="p.examSubject.id"
          class="border-default rounded-lg border p-4"
        >
          <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="font-semibold">{{ p.exam.school.name }} {{ p.exam.year }}</span>
            <span class="text-muted text-sm">{{ p.examSubject.name }}</span>
            <span class="text-muted text-sm"
              >· {{ ADMISSION_TYPE_LABELS[p.exam.admissionType] }}</span
            >
            <span class="text-muted text-sm">· {{ p.questions.length }} 題</span>
            <UBadge v-for="s in p.subjects" :key="s.slug" color="neutral" variant="soft" size="sm">
              {{ s.name }}
            </UBadge>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="qq in p.questions"
              :key="qq.externalId"
              :to="`/questions/${qq.externalId}`"
              color="neutral"
              variant="soft"
              size="xs"
              :aria-label="`第 ${qq.number} 題(${QUESTION_TYPE_LABELS[qq.type]})`"
            >
              {{ qq.number }}
            </UButton>
          </div>
        </li>
      </ul>

      <div v-if="data.meta.total > pageSize" class="mt-6 flex justify-center">
        <UPagination v-model:page="page" :total="data.meta.total" :items-per-page="pageSize" />
      </div>
    </template>
  </UContainer>
</template>
