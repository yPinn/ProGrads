import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { QuestionsResponseSchema, type QuestionQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /questions — paginated cross-school question bank. Validates the { data, meta }
// envelope at the boundary and returns items + pagination meta. keepPreviousData keeps
// the current page visible while the next page loads.
export function useQuestions(query: MaybeRefOrGetter<QuestionQuery>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["questions", toValue(query)] as const);

  return useQuery({
    queryKey,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const body = await $api("/questions", { query: toValue(query) });
      const { data, meta } = QuestionsResponseSchema.parse(body);
      return { items: data, meta };
    },
  });
}
