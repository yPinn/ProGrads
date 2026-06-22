import { useQuery } from "@tanstack/vue-query";
import { SubjectsResponseSchema } from "@prograds/shared";

// GET /subjects — full subject list (slug + name), shared across schools/tracks.
// Near-static within a session, so cached indefinitely. Powers the 考科 <select>.
export function useSubjects() {
  const { $api } = useNuxtApp();
  return useQuery({
    queryKey: ["subjects"] as const,
    queryFn: async () => SubjectsResponseSchema.parse(await $api("/subjects")).data,
    staleTime: Infinity,
  });
}
