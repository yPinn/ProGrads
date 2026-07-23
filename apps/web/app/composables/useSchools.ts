import { SchoolsResponseSchema } from "@prograds/shared";

// GET /schools — full school list (slug + name). Near-static within a session, so
// cached indefinitely; validated at the boundary (docs/05). Powers the school <select>.
export function useSchools() {
  const { $api } = useNuxtApp();
  return useApiQuery({
    queryKey: ["schools"] as const,
    queryFn: async () => SchoolsResponseSchema.parse(await $api("/schools")).data,
    staleTime: Infinity,
  });
}
