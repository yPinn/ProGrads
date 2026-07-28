import { TrendResponseSchema, type TrendQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /questions/trends?subject=&school=&top= — 單校×年歷年趨勢(題型×年 + 考點×年)。`enabled`
// stays false until a subject is picked (mirrors /admissions's pattern of gating on a required
// filter rather than fetching an undefined subject).
export function useQuestionTrends(query: MaybeRefOrGetter<Partial<TrendQuery>>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["question-trends", toValue(query)] as const);
  const enabled = computed(() => Boolean(toValue(query).subject));

  return useApiQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      const body = await $api("/questions/trends", { query: toValue(query) });
      return TrendResponseSchema.parse(body).data;
    },
  });
}
