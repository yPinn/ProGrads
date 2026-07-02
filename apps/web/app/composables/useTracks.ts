import { useQuery } from "@tanstack/vue-query";
import { TracksResponseSchema } from "@prograds/shared";

// GET /tracks — the L2 所別 list (slug + name), the navigation axis shared across schools.
// Near-static within a session, so cached indefinitely; validated at the boundary (docs/05).
// Powers the 所別 <select> for cross-school faculty browsing.
export function useTracks() {
  const { $api } = useNuxtApp();
  return useQuery({
    queryKey: ["tracks"] as const,
    queryFn: async () => TracksResponseSchema.parse(await $api("/tracks")).data,
    staleTime: Infinity,
  });
}
