import {
  dehydrate,
  hydrate,
  QueryCache,
  QueryClient,
  VueQueryPlugin,
  type DehydratedState,
} from "@tanstack/vue-query";
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

  // SSR hand-off: queries prefetched server-side (via useApiQuery's onServerPrefetch) live in
  // this QueryClient's cache after render. Serialize that cache into the Nuxt payload so the
  // client rehydrates with data already present instead of refetching on mount.
  const vueQueryState = useState<DehydratedState | null>("vue-query", () => null);

  if (import.meta.server) {
    nuxt.hooks.hook("app:rendered", () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (import.meta.client && vueQueryState.value) {
    hydrate(queryClient, vueQueryState.value);
  }
});
