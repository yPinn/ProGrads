import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { h } from "vue";
import type { NuxtError } from "#app";
import ErrorState from "~/components/ErrorState.vue";
import QueryState from "~/components/QueryState.vue";
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

describe("QueryState", () => {
  it("renders the loading slot while pending (with a status live region)", async () => {
    const wrapper = await mountSuspended(QueryState, {
      props: { pending: true },
      slots: { loading: () => h("div", "骨架"), default: () => h("div", "資料") },
    });
    expect(wrapper.text()).toContain("骨架");
    expect(wrapper.text()).not.toContain("資料");
    expect(wrapper.get('[role="status"]').attributes("aria-busy")).toBe("true");
  });

  it("renders ErrorState and forwards retry when errored", async () => {
    const wrapper = await mountSuspended(QueryState, {
      props: { pending: false, error: new Error("boom") },
      slots: { default: () => h("div", "資料") },
    });
    expect(wrapper.text()).toContain("載入失敗");
    expect(wrapper.text()).toContain("boom");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("retry")).toBeTruthy();
  });

  it("renders the empty slot when empty and not pending/errored", async () => {
    const wrapper = await mountSuspended(QueryState, {
      props: { pending: false, empty: true },
      slots: { empty: () => "尚無項目", default: () => h("div", "DATA_SLOT") },
    });
    expect(wrapper.text()).toContain("尚無項目");
    expect(wrapper.text()).not.toContain("DATA_SLOT");
  });

  it("renders the default (data) slot once loaded", async () => {
    const wrapper = await mountSuspended(QueryState, {
      props: { pending: false, empty: false },
      slots: { default: () => h("div", "DATA_SLOT") },
    });
    expect(wrapper.text()).toContain("DATA_SLOT");
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
