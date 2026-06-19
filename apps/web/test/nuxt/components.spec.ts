import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { NuxtError } from "#app";
import ErrorState from "~/components/ErrorState.vue";
import ErrorPage from "~/error.vue";

describe("ErrorState", () => {
  it("renders the failure title and error message", async () => {
    const wrapper = await mountSuspended(ErrorState, { props: { error: new Error("boom") } });
    expect(wrapper.text()).toContain("載入失敗");
    expect(wrapper.text()).toContain("boom");
  });

  it("emits retry when the retry action is clicked", async () => {
    const wrapper = await mountSuspended(ErrorState, { props: { error: new Error("boom") } });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("retry")).toBeTruthy();
  });
});

describe("error page", () => {
  it("renders the status code and status text", async () => {
    const error = { status: 404, statusText: "Not Found", message: "" } as unknown as NuxtError;
    const wrapper = await mountSuspended(ErrorPage, { props: { error } });
    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Not Found");
  });
});
