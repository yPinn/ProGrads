import { AdmissionScheduleResponseSchema, type AdmissionScheduleQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /schedules — typed against the shared contract; validates the response at the
// boundary (docs/05) and returns the unwrapped, sorted-by-time event list.
export function useSchedules(query: MaybeRefOrGetter<AdmissionScheduleQuery>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["schedules", toValue(query)] as const);

  return useApiQuery({
    queryKey,
    queryFn: async () => {
      const body = await $api("/schedules", { query: toValue(query) });
      return AdmissionScheduleResponseSchema.parse(body).data;
    },
  });
}
