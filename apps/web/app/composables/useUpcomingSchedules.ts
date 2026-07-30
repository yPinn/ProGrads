import { AdmissionScheduleResponseSchema } from "@prograds/shared";

// GET /schedules/upcoming?limit= — next N admission events across all schools/years, ordered by
// absolute time. Unlike useSchedules (which requires a 西元學年 the caller has to guess), this
// powers the homepage deadline-reminder widget without any year-guessing.
export function useUpcomingSchedules(limit = 5) {
  const { $api } = useNuxtApp();
  return useApiQuery({
    queryKey: ["schedules-upcoming", limit] as const,
    queryFn: async () =>
      AdmissionScheduleResponseSchema.parse(await $api("/schedules/upcoming", { query: { limit } }))
        .data,
    staleTime: 1000 * 60 * 10,
  });
}
