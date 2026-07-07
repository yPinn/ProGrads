// Toast policy for query failures. Initial-load failures (no cached data) render inline via
// <QueryState>/<ErrorState>; a background refetch failure leaves stale data on screen, so it
// surfaces as a toast instead. Returns the toast to show, or null to stay silent. Kept pure
// (no Nuxt context) so the convention is unit-testable; the plugin owns the runWithContext glue.
import { icons } from "~/utils/icons";

export interface RefetchToast {
  title: string;
  description: string;
  color: "error";
  icon: string;
}

export function backgroundRefetchToast(
  query: { state: { data: unknown } },
  error: unknown,
): RefetchToast | null {
  if (query.state.data === undefined) return null;
  return {
    title: "資料更新失敗",
    description: error instanceof Error ? error.message : "請稍後再試。",
    color: "error",
    icon: icons.warning,
  };
}
