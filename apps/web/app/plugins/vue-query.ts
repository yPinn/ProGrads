import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { ApiError } from "~/utils/api-error";

export default defineNuxtPlugin((nuxt) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Don't retry client errors (4xx) — only transient/unknown failures.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status && error.status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });

  nuxt.vueApp.use(VueQueryPlugin, { queryClient });
});
