import { useQuery } from "@tanstack/vue-query";
import { FacultyResponseSchema, type FacultyQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /faculty?school=&dept= — a department's faculty roster (research areas, thesis
// evidence, note). school+dept are required for the roster view, so the query stays
// disabled until both are present. Response is validated at the boundary (docs/05).
export function useFaculty(query: MaybeRefOrGetter<FacultyQuery>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["faculty", toValue(query)] as const);

  return useQuery({
    queryKey,
    enabled: computed(() => {
      const q = toValue(query);
      return !!q.school && !!q.dept;
    }),
    queryFn: async () => {
      const body = await $api("/faculty", { query: toValue(query) });
      return FacultyResponseSchema.parse(body).data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
