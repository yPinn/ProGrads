/* eslint-disable no-console */
import { solveChainMakespan } from "../scheduling/chain-makespan.js";

// NTU 2026 計算機結構與作業系統 (co-os) Q14.
// Two ordered task queues (a, b) on one CPU; setup W = 1 within a queue, W* = 3 across queues;
// minimise makespan. The answer is reported as 100X + 10Y + Z, so the makespan's digits are
// X, Y, Z. Recorded answer: makespan 164 -> options A, B (see questions/ntu/2026/co-os/q14.md).

const queueA: [number, number][] = [
  [0, 16],
  [25, 8],
  [50, 24],
  [100, 8],
  [107, 10],
  [108, 5],
  [141, 4],
];
const queueB: [number, number][] = [
  [0, 8],
  [25, 16],
  [50, 4],
  [75, 4],
  [101, 6],
  [108, 4],
  [142, 16],
];

const toChain = (rows: [number, number][]): { release: number; exec: number }[] =>
  rows.map(([release, exec]) => ({ release, exec }));

const chainNames = ["a", "b"];
const { makespan, schedule } = solveChainMakespan({
  chains: [toChain(queueA), toChain(queueB)],
  setupSame: 1,
  setupDiff: 3,
});

console.log("schedule (execution order):");
for (const s of schedule) {
  const name = `${chainNames[s.chain] ?? s.chain}${s.index + 1}`;
  console.log(
    `  ${name.padEnd(3)} start=${String(s.start).padStart(3)} end=${String(s.end).padStart(3)}`,
  );
}

const x = Math.floor(makespan / 100);
const y = Math.floor(makespan / 10) % 10;
const z = makespan % 10;
console.log(`makespan = ${makespan}  ->  X,Y,Z = ${x},${y},${z}`);

const expected = 164;
if (makespan !== expected) {
  console.error(`MISMATCH: expected ${expected}, got ${makespan}`);
  process.exit(1);
}
console.log("OK: matches recorded answer (164).");
