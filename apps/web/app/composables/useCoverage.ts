import { CoverageResponseSchema } from "@prograds/shared";

// GET /coverage — content-repo build-out inventory (dev-only; 404s on any deployment without
// CONTENT_DIR configured). Powers the /coverage dev page. Not cached across reloads — the
// underlying content repo changes as you work, so a fresh page load should reflect it.
export function useCoverage() {
  const { $api } = useNuxtApp();
  return useApiQuery({
    queryKey: ["coverage"] as const,
    queryFn: async () => CoverageResponseSchema.parse(await $api("/coverage")).data,
  });
}
