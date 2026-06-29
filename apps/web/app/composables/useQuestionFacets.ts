import { useQuery } from "@tanstack/vue-query";
import { QuestionFacetsResponseSchema } from "@prograds/shared";

// GET /questions/facets — 考科/學校/年度 that actually have questions (考科 with counts).
// Powers the 題庫 filter dropdowns so they never offer empty options. Near-static per session.
export function useQuestionFacets() {
  const { $api } = useNuxtApp();
  return useQuery({
    queryKey: ["question-facets"] as const,
    queryFn: async () => QuestionFacetsResponseSchema.parse(await $api("/questions/facets")).data,
    staleTime: Infinity,
  });
}
