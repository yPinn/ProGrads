import { useQuery } from "@tanstack/vue-query";
import { AdmissionsResponseSchema, type AdmissionQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /admissions?school=&dept=&year= — admission groups with per-year rounds (quota,
// applicants/admitted, papers, methods). school+dept are required, so the query stays
// disabled until both are present. Response is validated at the boundary (docs/05).
export function useAdmissions(query: MaybeRefOrGetter<AdmissionQuery>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["admissions", toValue(query)] as const);

  return useQuery({
    queryKey,
    enabled: computed(() => {
      const q = toValue(query);
      return !!q.school && !!q.dept;
    }),
    queryFn: async () => {
      const body = await $api("/admissions", { query: toValue(query) });
      return AdmissionsResponseSchema.parse(body).data;
    },
  });
}
