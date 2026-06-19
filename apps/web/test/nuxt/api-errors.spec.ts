import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { defineEventHandler, setResponseStatus } from "h3";
import { defineComponent, h } from "vue";
import { useSchedules } from "~/composables/useSchedules";
import { ApiError } from "~/utils/api-error";

// Returns the backend error envelope with a 404 so the real $api plugin (onResponseError)
// and the QueryClient retry predicate are exercised end-to-end.
registerEndpoint(
  "/schedules",
  defineEventHandler((event) => {
    setResponseStatus(event, 404);
    return { error: { code: "NOT_FOUND", message: "查無資料", details: null } };
  }),
);

async function runComposable<T>(composable: () => T) {
  let result!: T;
  await mountSuspended(
    defineComponent({
      setup() {
        result = composable();
        return () => h("div");
      },
    }),
  );
  return result;
}

describe("API error handling", () => {
  it("maps a 404 error envelope to a typed ApiError on the query", async () => {
    const result = await runComposable(() => useSchedules({ year: 2025 }));
    await vi.waitFor(() => expect(result.isError.value).toBe(true));
    const err = result.error.value;
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("NOT_FOUND");
    expect((err as ApiError).status).toBe(404);
  });
});
