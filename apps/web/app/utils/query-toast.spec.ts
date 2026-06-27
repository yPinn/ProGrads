import { describe, it, expect } from "vitest";
import { backgroundRefetchToast } from "./query-toast";

// Structural stand-in for a TanStack Query — only `state.data` drives the policy.
const query = (data: unknown) => ({ state: { data } });

describe("backgroundRefetchToast", () => {
  it("stays silent on initial-load failure (no cached data) — inline error handles it", () => {
    expect(backgroundRefetchToast(query(undefined), new Error("boom"))).toBeNull();
  });

  it("returns an error toast carrying the error message when stale data is on screen", () => {
    const toast = backgroundRefetchToast(query([1, 2]), new Error("連線逾時"));
    expect(toast).toMatchObject({
      color: "error",
      description: "連線逾時",
      icon: "i-lucide-triangle-alert",
    });
  });

  it("falls back to a generic description for non-Error throwables", () => {
    expect(backgroundRefetchToast(query([1]), "boom")?.description).toBe("請稍後再試。");
  });
});
