import { useQuery } from "@tanstack/vue-query";
import { PaperTestResponseSchema } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /questions/papers/:examSubjectId — a whole paper's questions (full content, choices with
// correctness, explanation) for the timed 整卷測驗 page. Answers ride along and are hidden in the
// UI until the user submits.
export function usePaperTest(examSubjectId: MaybeRefOrGetter<string>) {
  const { $api } = useNuxtApp();
  const id = computed(() => toValue(examSubjectId));

  return useQuery({
    queryKey: computed(() => ["paper-test", id.value] as const),
    enabled: computed(() => !!id.value),
    queryFn: async () => {
      const body = await $api(`/questions/papers/${encodeURIComponent(id.value)}`);
      return PaperTestResponseSchema.parse(body).data;
    },
  });
}
