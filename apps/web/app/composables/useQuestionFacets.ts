import { QuestionFacetsResponseSchema } from "@prograds/shared";

// GET /questions/facets — subjects/schools/years that actually have questions (subjects with counts).
// Powers the question-bank filter dropdowns so they never offer empty options. Near-static per session.
export function useQuestionFacets() {
  const { $api } = useNuxtApp();
  return useApiQuery({
    queryKey: ["question-facets"] as const,
    queryFn: async () => QuestionFacetsResponseSchema.parse(await $api("/questions/facets")).data,
    staleTime: Infinity,
  });
}
