import { DepartmentsResponseSchema } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /departments?school=<slug> — departments of one school (cascades from the school
// <select>). Stays disabled until a school is chosen; cached per school.
export function useDepartments(school: MaybeRefOrGetter<string | undefined>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["departments", toValue(school)] as const);

  return useApiQuery({
    queryKey,
    enabled: computed(() => !!toValue(school)),
    queryFn: async () => {
      const body = await $api("/departments", { query: { school: toValue(school) } });
      return DepartmentsResponseSchema.parse(body).data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
