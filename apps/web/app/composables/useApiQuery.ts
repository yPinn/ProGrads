import {
  useQuery,
  type DefaultError,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryReturnType,
} from "@tanstack/vue-query";
import { onServerPrefetch, toValue, type MaybeRefOrGetter } from "vue";

// Drop-in useQuery wrapper that also runs during SSR, so content pages render with real data
// instead of an empty shell (see docs/06-decisions.md D4 — SEO needs SSR, not a CSR waterfall).
// A failed prefetch is swallowed: the query hydrates client-side in its error state, and
// <QueryState>/<ErrorState> already handle that inline — SSR shouldn't 500 on a flaky API call.
export function useApiQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: MaybeRefOrGetter<UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>>,
): UseQueryReturnType<TData, TError> {
  const query = useQuery(options);

  // A disabled query (enabled:false — e.g. /admissions or /faculty before the user picks a
  // school+dept) never fetches, so suspense() would await a status change that never arrives
  // and hang the SSR render forever. Skip prefetch for it; it renders in its initial pending/
  // disabled state and fetches client-side once enabled, same as before this wrapper existed.
  // (Cast is a narrow escape from UseQueryOptions' deep MaybeRefDeep typing, which toValue
  // can't unwrap generically — we only need the one field.)
  const enabledOption = (toValue(options) as { enabled?: MaybeRefOrGetter<boolean> }).enabled;
  if (import.meta.server && toValue(enabledOption) !== false) {
    onServerPrefetch(async () => {
      await query.suspense().catch(() => {});
    });
  }

  return query;
}
