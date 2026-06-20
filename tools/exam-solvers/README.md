# @prograds/exam-solvers

Small, reusable solvers that **verify the answers** to computation-heavy exam questions
(scheduling, pipelines, numerics). They back the `confidence` field on Tier2 solutions: when an
answer is the output of a non-trivial computation, the script here is its reproducible proof.

This is _not_ a generic answer checker — each question type has different maths. The reusable
unit is a **problem-family solver**, and the per-question data lives in a thin _case_ that feeds
the solver and asserts the recorded answer.

## Structure

```text
src/
├── <technique>/        reusable solvers — organised by TECHNIQUE / problem family, NOT subject
│   └── *.ts            e.g. scheduling/chain-makespan.ts
└── cases/              one file per exam question that exercises a solver + asserts its answer
    └── {school}-{year}-{subject}-q{NN}.ts
```

Why technique, not subject: a solver clusters by the maths it does, and that crosses exam
subjects (a scheduling DP serves both OS scheduling and algorithms questions; a pipeline
simulator is pure computer-organisation). Subject lives in the **case filename**, not the tree.

Keep it flat until it earns depth: add a `<technique>/` folder only when a second solver of that
family appears.

## Conventions

- **Solvers** (`src/<technique>/*.ts`): pure, instance-in → result-out, no I/O, no hard-coded
  exam data. Export typed `Instance` / `Result` interfaces. Generalise to the natural parameter
  (e.g. K chains, not 2) when it costs little.
- **Cases** (`src/cases/*.ts`): import a solver, define the specific instance, print the working,
  and `process.exit(1)` on mismatch with the recorded answer — so a case doubles as a regression
  check. Name `{school}-{year}-{subject}-q{NN}.ts` to mirror the content repo.

## Run

```bash
# Run one case (prints the working, exits non-zero if it disagrees with the recorded answer):
pnpm --filter @prograds/exam-solvers case src/cases/ntu-2026-co-os-q14.ts

pnpm --filter @prograds/exam-solvers typecheck
pnpm --filter @prograds/exam-solvers lint
```

## Current solvers

| Technique                                                                                  | File                           | Used by            |
| ------------------------------------------------------------------------------------------ | ------------------------------ | ------------------ |
| Single-machine makespan, ordered chains, release times, sequence-dependent setup           | `scheduling/chain-makespan.ts` | ntu-2026-co-os-q14 |
| In-order pipeline timing (configurable forwarding / split-phase regfile / 2-bit predictor) | `pipeline/inorder-sim.ts`      | ntu-2026-co-os-q11 |
