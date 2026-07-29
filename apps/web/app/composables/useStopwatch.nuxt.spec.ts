import { describe, it, expect, vi, afterEach } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h } from "vue";
import { useStopwatch } from "./useStopwatch";

// Mounted (not just called bare) so onBeforeUnmount actually registers against a real
// component instance — needed to exercise the auto-stop-on-unmount cleanup path.
async function mountStopwatch() {
  let api!: ReturnType<typeof useStopwatch>;
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        api = useStopwatch();
        return () => h("div");
      },
    }),
  );
  return { wrapper, api };
}

describe("useStopwatch", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle at zero", async () => {
    const { api } = await mountStopwatch();
    expect(api.running.value).toBe(false);
    expect(api.elapsedMs.value).toBe(0);
    expect(api.label.value).toBe("00:00");
  });

  it("counts up while running", async () => {
    vi.useFakeTimers();
    const { api } = await mountStopwatch();
    api.start();
    expect(api.running.value).toBe(true);
    await vi.advanceTimersByTimeAsync(65_000);
    expect(api.label.value).toBe("01:05");
  });

  it("rolls over to hh:mm:ss past an hour", async () => {
    vi.useFakeTimers();
    const { api } = await mountStopwatch();
    api.start();
    await vi.advanceTimersByTimeAsync(3_661_000); // 1h 1m 1s
    expect(api.label.value).toBe("1:01:01");
  });

  it("freezes elapsed time on stop", async () => {
    vi.useFakeTimers();
    const { api } = await mountStopwatch();
    api.start();
    await vi.advanceTimersByTimeAsync(3_000);
    api.stop();
    const frozen = api.elapsedMs.value;
    await vi.advanceTimersByTimeAsync(3_000);
    expect(api.elapsedMs.value).toBe(frozen);
    expect(api.running.value).toBe(false);
  });

  it("resumes accumulating from where it stopped", async () => {
    vi.useFakeTimers();
    const { api } = await mountStopwatch();
    api.start();
    await vi.advanceTimersByTimeAsync(2_000);
    api.stop();
    api.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(api.elapsedMs.value).toBeGreaterThanOrEqual(3_000);
  });

  it("reset clears elapsed time and stops running", async () => {
    vi.useFakeTimers();
    const { api } = await mountStopwatch();
    api.start();
    await vi.advanceTimersByTimeAsync(5_000);
    api.reset();
    expect(api.elapsedMs.value).toBe(0);
    expect(api.running.value).toBe(false);
  });

  it("start is a no-op while already running", async () => {
    vi.useFakeTimers();
    const { api } = await mountStopwatch();
    api.start();
    api.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(api.running.value).toBe(true);
    expect(api.elapsedMs.value).toBe(1_000);
  });

  it("stop is a no-op when not running", async () => {
    const { api } = await mountStopwatch();
    api.stop();
    expect(api.elapsedMs.value).toBe(0);
    expect(api.running.value).toBe(false);
  });

  it("stops the timer automatically on unmount", async () => {
    vi.useFakeTimers();
    const { api, wrapper } = await mountStopwatch();
    api.start();
    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.unmount();
    const atUnmount = api.elapsedMs.value;
    await vi.advanceTimersByTimeAsync(2_000);
    expect(api.elapsedMs.value).toBe(atUnmount);
    expect(api.running.value).toBe(false);
  });
});
