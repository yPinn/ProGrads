// Single-machine makespan minimisation with ordered task chains, release times, and
// sequence-dependent setup times.
//
// Problem family: one machine processes tasks non-preemptively. Tasks are partitioned into
// K chains; within a chain they must run in index order. Each task has a release time
// (earliest start). Between two consecutive tasks there is a setup delay: `setupSame` if they
// belong to the same chain, `setupDiff` otherwise. Goal: order the tasks (respecting chain
// order + releases) to minimise the completion time of the last task.
//
// Exact DP over (progress-per-chain, last-chain-used). With K fixed the state space is
// O(∏|chainᵢ| · K), i.e. polynomial — NP-hardness only appears when K is part of the input.
// This is the generic solver behind NTU 2026 co-os Q14 (K = 2); see src/cases/.

export interface ChainTask {
  /** Earliest time the task may start (arrival/release time). */
  release: number;
  /** Processing time on the machine (start → completion). */
  exec: number;
}

export interface ChainMakespanInstance {
  /** chains[c] = tasks of chain c, which must execute in this index order. */
  chains: ChainTask[][];
  /** Setup delay between two consecutive tasks of the same chain (e.g. W). */
  setupSame: number;
  /** Setup delay between two consecutive tasks of different chains (e.g. W*). */
  setupDiff: number;
}

export interface ScheduledTask {
  /** Index of the chain this task belongs to. */
  chain: number;
  /** Position of the task within its chain (0-based). */
  index: number;
  start: number;
  end: number;
}

export interface ChainMakespanResult {
  makespan: number;
  /** One optimal schedule, in execution order. */
  schedule: ScheduledTask[];
}

interface DpEntry {
  time: number;
  parentKey: string | null;
  task: ScheduledTask | null;
}

const keyOf = (progress: number[], last: number): string => `${progress.join(",")}|${last}`;

export function solveChainMakespan(instance: ChainMakespanInstance): ChainMakespanResult {
  const { chains, setupSame, setupDiff } = instance;
  const k = chains.length;
  const total = chains.reduce((sum, chain) => sum + chain.length, 0);

  const dp = new Map<string, DpEntry>();
  const startKey = keyOf(new Array<number>(k).fill(0), -1);
  dp.set(startKey, { time: 0, parentKey: null, task: null });

  // Each transition advances exactly one chain, so process states by increasing number of
  // scheduled tasks ("step"): every predecessor of a step-(s+1) state is finalised at step s.
  let layer: string[] = [startKey];
  for (let step = 0; step < total; step++) {
    const nextLayer = new Set<string>();
    for (const key of layer) {
      const entry = dp.get(key);
      if (!entry) continue;
      const [progressStr, lastStr] = key.split("|");
      const progress = (progressStr ?? "").split(",").map(Number);
      const last = Number(lastStr);

      for (let c = 0; c < k; c++) {
        const chain = chains[c];
        const done = progress[c] ?? 0;
        if (!chain || done >= chain.length) continue;
        const task = chain[done];
        if (!task) continue;

        const setup = last === -1 ? 0 : c === last ? setupSame : setupDiff;
        const start = Math.max(entry.time + setup, task.release);
        const end = start + task.exec;

        const nextProgress = progress.slice();
        nextProgress[c] = done + 1;
        const nextKey = keyOf(nextProgress, c);

        const existing = dp.get(nextKey);
        if (!existing || end < existing.time) {
          dp.set(nextKey, {
            time: end,
            parentKey: key,
            task: { chain: c, index: done, start, end },
          });
        }
        nextLayer.add(nextKey);
      }
    }
    layer = [...nextLayer];
  }

  // Best terminal state = all chains fully scheduled, over every possible last chain.
  const fullProgress = chains.map((chain) => chain.length);
  let bestKey: string | null = null;
  let bestTime = Infinity;
  for (let last = 0; last < k; last++) {
    const entry = dp.get(keyOf(fullProgress, last));
    if (entry && entry.time < bestTime) {
      bestTime = entry.time;
      bestKey = keyOf(fullProgress, last);
    }
  }
  if (bestKey === null) return { makespan: 0, schedule: [] }; // no tasks

  const schedule: ScheduledTask[] = [];
  let cursor: string | null = bestKey;
  while (cursor) {
    const entry = dp.get(cursor);
    if (!entry) break;
    if (entry.task) schedule.push(entry.task);
    cursor = entry.parentKey;
  }
  schedule.reverse();

  return { makespan: bestTime, schedule };
}
