import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";

// Smoke test: proves the Nuxt/happy-dom test environment renders Vue components.
// For components that rely on the Nuxt app context (plugins, auto-imports),
// switch to `mountSuspended` from "@nuxt/test-utils/runtime".
const Hello = defineComponent({
  setup: () => () => h("p", { class: "greeting" }, "ProGrads"),
});

describe("nuxt test environment", () => {
  it("mounts a component", () => {
    const wrapper = mount(Hello);
    expect(wrapper.find(".greeting").text()).toBe("ProGrads");
  });
});
