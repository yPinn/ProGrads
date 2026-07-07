import { computed, onBeforeUnmount, readonly, ref } from "vue";

// Count-up stopwatch for the timed test page. Timestamp-based (not a naive per-second counter) so
// it stays accurate across background-tab throttling; ticks 4×/sec only to refresh the display.
// Caller starts it when the paper loads and stops it on 交卷.
export function useStopwatch() {
  const elapsedMs = ref(0);
  const running = ref(false);
  let startAt = 0;
  let accumulated = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  function refresh(): void {
    elapsedMs.value = accumulated + (running.value ? Date.now() - startAt : 0);
  }

  function start(): void {
    if (running.value) return;
    running.value = true;
    startAt = Date.now();
    timer = setInterval(refresh, 250);
  }

  function stop(): void {
    if (!running.value) return;
    accumulated += Date.now() - startAt;
    running.value = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    elapsedMs.value = accumulated;
  }

  function reset(): void {
    stop();
    accumulated = 0;
    elapsedMs.value = 0;
  }

  // mm:ss (rolls to hh:mm:ss past an hour) for the pinned header.
  const label = computed(() => {
    const total = Math.floor(elapsedMs.value / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  });

  onBeforeUnmount(stop);

  return { elapsedMs: readonly(elapsedMs), running: readonly(running), label, start, stop, reset };
}
