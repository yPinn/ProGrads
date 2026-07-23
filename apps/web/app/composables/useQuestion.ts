import { QuestionResponseSchema } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /questions/:externalId — single question detail (content, choices, explanation).
export function useQuestion(externalId: MaybeRefOrGetter<string>) {
  const { $api } = useNuxtApp();
  const id = computed(() => toValue(externalId));

  return useApiQuery({
    queryKey: computed(() => ["question", id.value] as const),
    enabled: computed(() => !!id.value),
    queryFn: async () => {
      const body = await $api(`/questions/${encodeURIComponent(id.value)}`);
      return QuestionResponseSchema.parse(body).data;
    },
  });
}
