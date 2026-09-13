import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { defineComponent, h } from "vue";
import { useSubmitErrorReport } from "./useSubmitErrorReport";

async function runComposable<T>(composable: () => T) {
  let result!: T;
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        result = composable();
        return () => h("div");
      },
    }),
  );
  return { wrapper, result };
}

describe("useSubmitErrorReport", () => {
  it("posts the report and returns the created row", async () => {
    const report = { id: "r1", type: "wrong_answer", status: "open", createdAt: "2026-01-01" };
    registerEndpoint("/reports", { method: "POST", handler: () => ({ data: report }) });

    const { result } = await runComposable(() => useSubmitErrorReport());
    result.mutate({
      questionExternalId: "q-1",
      type: "wrong_answer",
      description: "answer B is actually correct",
    });

    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual(report);
  });
});
