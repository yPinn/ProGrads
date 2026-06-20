// In-order scalar pipeline timing simulator with configurable forwarding, a split-phase
// register file, and a pluggable branch predictor.
//
// Problem family: count the cycles of a loop body on an in-order pipeline, where the only
// timing effects are (1) data-hazard stalls (governed by forwarding vs regfile read timing)
// and (2) branch misprediction bubbles (governed by the resolve stage + a 2-bit predictor).
// It reports each iteration's IF→IF distance, which is exactly the metric such questions use.
//
// Assumptions are explicit config so a disputed answer (e.g. NTU 2026 co-os Q11's
// no-forwarding count) becomes reproducible rather than hand-waved. See src/cases/.

export type InstrType = "alu" | "load" | "store" | "branch";

export interface Instr {
  label: string;
  type: InstrType;
  /** Destination register written back (alu/load); omit for store/branch. */
  dst?: string;
  /** Source registers read by the instruction. */
  srcs: string[];
}

export interface PipelineConfig {
  /** Ordered stage names, first = fetch, last = write-back. e.g. IF ID EX MEM1 MEM2 WB. */
  stages: string[];
  forwarding: boolean;
  /** WB writes in the first half and ID reads in the second half → same-cycle WB→read is OK. */
  splitPhaseRegfile: boolean;
  /** Stage where regfile operands are read when there is no forwarding (typically ID). */
  regReadStage: string;
  /** Stage where a forwarded operand is consumed (typically EX). */
  fwdUseStage: string;
  /** Stage that produces each type's destination value (null = produces no register value). */
  resultStage: Record<InstrType, string | null>;
  /** Stage where a branch's direction is resolved (typically EX). */
  branchResolveStage: string;
}

export interface Predictor<S> {
  init: S;
  /** true = predict taken. */
  predict: (state: S) => boolean;
  next: (state: S, actualTaken: boolean) => S;
}

export interface IterationTiming {
  firstIssue: number;
  /** Distance from this iteration's first IF to the next iteration's first IF. */
  cycles: number;
  issues: { label: string; issue: number }[];
  predictedTaken: boolean;
  actualTaken: boolean;
  mispredict: boolean;
}

export interface SimResult {
  iterations: IterationTiming[];
  /** Fraction of branches predicted correctly. */
  predictionAccuracy: number;
}

interface Producer {
  issue: number;
  resultIdx: number;
}

export function simulateLoop<S>(
  config: PipelineConfig,
  body: Instr[],
  iterations: { actualTaken: boolean }[],
  predictor: Predictor<S>,
): SimResult {
  const stageIdx = (stage: string): number => {
    const i = config.stages.indexOf(stage);
    if (i < 0) throw new Error(`unknown stage "${stage}"`);
    return i;
  };
  const ifIdx = 0;
  const wbIdx = config.stages.length - 1;
  const regReadIdx = stageIdx(config.regReadStage);
  const fwdIdx = stageIdx(config.fwdUseStage);
  const resolveIdx = stageIdx(config.branchResolveStage);

  // Earliest issue (IF) cycle for a consumer reading a register from this producer.
  const constraintFor = (p: Producer): number =>
    config.forwarding
      ? p.issue + p.resultIdx - fwdIdx + 1
      : p.issue + wbIdx - regReadIdx + (config.splitPhaseRegfile ? 0 : 1);

  const regReady = new Map<string, Producer>(); // latest producer per register, across iterations
  let state = predictor.init;
  let firstIssue = 0;
  let correct = 0;
  const results: IterationTiming[] = [];

  for (let it = 0; it < iterations.length; it++) {
    const iter = iterations[it];
    if (!iter) break;
    const issues: { label: string; issue: number }[] = [];
    let prevIssue = -1;
    let branchIssue = 0;

    for (let k = 0; k < body.length; k++) {
      const instr = body[k];
      if (!instr) continue;
      let issue = prevIssue < 0 ? firstIssue : prevIssue + 1;
      for (const reg of instr.srcs) {
        const producer = regReady.get(reg);
        if (producer) issue = Math.max(issue, constraintFor(producer));
      }
      issues.push({ label: instr.label, issue });
      prevIssue = issue;

      const rStage = config.resultStage[instr.type];
      if (instr.dst && rStage) regReady.set(instr.dst, { issue, resultIdx: stageIdx(rStage) });
      if (instr.type === "branch") branchIssue = issue;
    }

    const predictedTaken = predictor.predict(state);
    const mispredict = predictedTaken !== iter.actualTaken;
    if (!mispredict) correct++;
    const penalty = mispredict ? resolveIdx - ifIdx : 0;
    const nextFirstIssue = branchIssue + 1 + penalty;

    results.push({
      firstIssue,
      cycles: nextFirstIssue - firstIssue,
      issues,
      predictedTaken,
      actualTaken: iter.actualTaken,
      mispredict,
    });

    state = predictor.next(state, iter.actualTaken);
    firstIssue = nextFirstIssue;
  }

  return {
    iterations: results,
    predictionAccuracy: results.length > 0 ? correct / results.length : 1,
  };
}

/**
 * Classic 2-bit saturating-counter predictor as specified in NTU 2026 co-os Q11.
 * States 0=Strong-Taken(00), 1=Predict-taken(01), 2=Predict-not-taken(10), 3=Strong-NT(11).
 */
export const twoBitPredictor = (init = 3): Predictor<number> => ({
  init,
  predict: (s) => s <= 1, // 00/01 → taken, 10/11 → not taken
  next: (s, taken) => {
    // [stateOnTaken, stateOnNotTaken]
    const table: [number, number][] = [
      [0, 1], // 00
      [0, 2], // 01
      [1, 3], // 10
      [2, 3], // 11
    ];
    const row = table[s];
    if (!row) throw new Error(`bad predictor state ${s}`);
    return taken ? row[0] : row[1];
  },
});
