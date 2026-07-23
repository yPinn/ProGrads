import { FacultyResponseSchema, type FacultyQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /faculty?school=&dept=&track= — a faculty roster, filterable on two axes:
// school+dept (one department) or track (該所別各校師資). The query stays disabled until
// one axis is complete. Response is validated at the boundary (docs/05).
export function useFaculty(query: MaybeRefOrGetter<FacultyQuery>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["faculty", toValue(query)] as const);

  return useApiQuery({
    queryKey,
    enabled: computed(() => {
      const q = toValue(query);
      return (!!q.school && !!q.dept) || !!q.track;
    }),
    queryFn: async () => {
      const body = await $api("/faculty", { query: toValue(query) });
      return FacultyResponseSchema.parse(body).data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
