/* eslint-disable no-console */
import {
  type Instr,
  type PipelineConfig,
  simulateLoop,
  twoBitPredictor,
} from "../pipeline/inorder-sim.js";

// NTU 2026 計算機結構與作業系統 (co-os) Q11.
// 6-stage pipeline IF ID EX MEM1 MEM2 WB; load value ready after MEM2; ALU result after EX;
// split-phase regfile (WB→ID same cycle OK); branch resolved in EX (2-cycle mispredict bubble);
// 2-bit predictor init "Strong Not-taken (11)". Loop runs 10 iterations (taken ×9, exit on 10).
// This case pins the assumptions so options A–E are reproducible. Recorded answer: A.

const body: Instr[] = [
  { label: "lw x3", type: "load", dst: "x3", srcs: ["x11"] },
  { label: "lw x4", type: "load", dst: "x4", srcs: ["x12"] },
  { label: "add x5", type: "alu", dst: "x5", srcs: ["x3", "x4"] },
  { label: "sw x5", type: "store", srcs: ["x5", "x11"] },
  { label: "addi x11", type: "alu", dst: "x11", srcs: ["x11"] },
  { label: "addi x12", type: "alu", dst: "x12", srcs: ["x12"] },
  { label: "bne", type: "branch", srcs: ["x11", "x13"] },
];

// Branch taken on iterations 1–9, not taken (loop exit) on iteration 10.
const iterations = Array.from({ length: 10 }, (_, i) => ({ actualTaken: i < 9 }));

const baseConfig: Omit<PipelineConfig, "forwarding"> = {
  stages: ["IF", "ID", "EX", "MEM1", "MEM2", "WB"],
  splitPhaseRegfile: true,
  regReadStage: "ID",
  fwdUseStage: "EX",
  resultStage: { alu: "EX", load: "MEM2", store: null, branch: null },
  branchResolveStage: "EX",
};

const withFwd = simulateLoop(
  { ...baseConfig, forwarding: true },
  body,
  iterations,
  twoBitPredictor(3),
);
const noFwd = simulateLoop(
  { ...baseConfig, forwarding: false },
  body,
  iterations,
  twoBitPredictor(3),
);

const fwdIter2 = withFwd.iterations[1]?.cycles ?? NaN; // 2nd iteration
const noFwdLast = noFwd.iterations[9]?.cycles ?? NaN; // last (10th) iteration
const accuracy = withFwd.predictionAccuracy;

console.log(
  "with forwarding    — per-iteration cycles:",
  withFwd.iterations.map((i) => i.cycles).join(", "),
);
console.log(
  "without forwarding — per-iteration cycles:",
  noFwd.iterations.map((i) => i.cycles).join(", "),
);
console.log(`2nd iteration (forwarding)        = ${fwdIter2} cycles`);
console.log(`last iteration (no forwarding)    = ${noFwdLast} cycles`);
console.log(`bne prediction accuracy           = ${(accuracy * 100).toFixed(1)}%`);

const verdict = {
  A: fwdIter2 === 11,
  B: fwdIter2 === 9,
  C: noFwdLast === 6,
  D: noFwdLast === 12,
  E: Math.abs(accuracy - 0.9) < 1e-9,
};
console.log("option verdicts:", verdict);

const derived = Object.entries(verdict)
  .filter(([, ok]) => ok)
  .map(([k]) => k)
  .join(",");
const recorded = "A";
console.log(`derived answer = ${derived || "(none)"}  | recorded = ${recorded}`);

if (derived !== recorded) {
  console.error(`MISMATCH: simulator derives "${derived}" but recorded answer is "${recorded}"`);
  process.exit(1);
}
console.log("OK: matches recorded answer (A). Note C/D are false under the standard model;");
console.log("    a non-standard store-data timing would be needed to make D (12) hold.");
