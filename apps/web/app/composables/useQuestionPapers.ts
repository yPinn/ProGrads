import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { PapersResponseSchema, type QuestionQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /questions/papers — paper-as-unit view of the question bank: each entry is one paper plus
// its question list (for question-number selection). Same { data, meta } envelope and pagination
// as useQuestions, but paginated at the paper level.
export function useQuestionPapers(query: MaybeRefOrGetter<QuestionQuery>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["question-papers", toValue(query)] as const);

  return useQuery({
    queryKey,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const body = await $api("/questions/papers", { query: toValue(query) });
      const { data, meta } = PapersResponseSchema.parse(body);
      return { items: data, meta };
    },
  });
}
