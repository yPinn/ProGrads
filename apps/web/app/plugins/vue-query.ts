import { QueryCache, QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { ApiError } from "~/utils/api-error";
import { backgroundRefetchToast } from "~/utils/query-toast";

export default defineNuxtPlugin((nuxt) => {
  // Toast convention (policy in ~/utils/query-toast): initial-load failures render inline via
  // <QueryState>/<ErrorState>; a background refetch failure leaves stale data on screen, so it
  // surfaces as a toast instead. useToast needs the Nuxt app context, hence runWithContext.
  const queryCache = new QueryCache({
    onError(error, query) {
      const toast = backgroundRefetchToast(query, error);
      if (toast) nuxt.runWithContext(() => useToast().add(toast));
    },
  });

  const queryClient = new QueryClient({
    queryCache,
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
