import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkPaperConsistency, type PaperQuestion } from "./questions.js";

// Build a question with sensible paper-level defaults; override per case.
function q(over: Partial<PaperQuestion> = {}): PaperQuestion {
  return {
    rel: "ntu/2026/co-os/q01.md",
    paperKey: "ntu/2026/co-os",
    exam_subject: "計算機結構與作業系統",
    admission_type: "exam",
    license_status: "school_official",
    departments: ["csie", "nm"],
    subjects: ["os"],
    ...over,
  };
}

describe("checkPaperConsistency", () => {
  it("passes a consistent paper (no errors, no warnings)", () => {
    const r = checkPaperConsistency([
      q({ subjects: ["os"] }),
      q({ subjects: ["os"] }),
      q({ subjects: ["co"] }),
      q({ subjects: ["co"] }),
    ]);
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.warnings, []);
  });

  it("flags a divergent exam_subject (last-write-wins risk)", () => {
    const r = checkPaperConsistency([q(), q({ exam_subject: "計算機結構與作業系統 " })]);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0]!, /exam_subject differs/);
  });

  it("flags a divergent admission_type (silent卷-split risk)", () => {
    const r = checkPaperConsistency([q(), q({ admission_type: "recommend" })]);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0]!, /admission_type differs/);
  });

  it("flags divergent departments regardless of order", () => {
    const ok = checkPaperConsistency([
      q({ departments: ["csie", "nm"] }),
      q({ departments: ["nm", "csie"] }),
    ]);
    assert.deepEqual(ok.errors, []); // order-insensitive
    const bad = checkPaperConsistency([
      q({ departments: ["csie", "nm"] }),
      q({ departments: ["csie"] }),
    ]);
    assert.equal(bad.errors.length, 1);
    assert.match(bad.errors[0]!, /departments differ/);
  });

  it("warns (does not error) on a singleton 考科", () => {
    const r = checkPaperConsistency([
      q({ subjects: ["os"] }),
      q({ subjects: ["os"] }),
      q({ subjects: ["db"] }),
    ]);
    assert.deepEqual(r.errors, []);
    assert.equal(r.warnings.length, 1);
    assert.match(r.warnings[0]!, /only one question.*db/);
  });

  it("passes when 配分 sums to 100", () => {
    const r = checkPaperConsistency([q({ points: 40 }), q({ points: 35 }), q({ points: 25 })]);
    assert.deepEqual(r.errors, []);
  });

  it("tolerates floating-point 配分 that sums to ~100 (thirds)", () => {
    const r = checkPaperConsistency([
      q({ points: 33.33 }),
      q({ points: 33.33 }),
      q({ points: 33.34 }),
    ]);
    assert.deepEqual(r.errors, []);
  });

  it("flags 配分 that doesn't sum to 100", () => {
    const r = checkPaperConsistency([q({ points: 40 }), q({ points: 40 })]);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0]!, /配分 sums to 80 \(expected 100\)/);
  });

  it("allows 配分 marked on only some questions, as long as it doesn't exceed 100", () => {
    // Real pattern: an explicitly-weighted essay section alongside a uniformly-weighted MC
    // section that has no per-question 配分 (e.g. 25 MC × 2分 unmarked + 3 essay marked = 100).
    const r = checkPaperConsistency([
      q({ points: 17 }),
      q({ points: 16 }),
      q({ points: 17 }),
      q({ points: undefined }),
      q({ points: undefined }),
    ]);
    assert.deepEqual(r.errors, []);
  });

  it("flags a partially-marked paper whose declared 配分 already exceeds 100", () => {
    const r = checkPaperConsistency([
      q({ points: 60 }),
      q({ points: 60 }),
      q({ points: undefined }),
    ]);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0]!, /配分 marked on 2\/3 questions already sums to 120 \(>100\)/);
  });

  it("skips the 配分 check when no question in the paper marks it", () => {
    const r = checkPaperConsistency([q(), q(), q()]);
    assert.deepEqual(r.errors, []);
  });

  it("isolates papers — one bad paper does not taint another", () => {
    const r = checkPaperConsistency([
      q({ paperKey: "ntu/2026/co-os" }),
      q({ paperKey: "ntu/2026/co-os", exam_subject: "X" }),
      q({ paperKey: "ntu/2026/dsa", exam_subject: "資料結構與演算法", subjects: ["algo"] }),
      q({ paperKey: "ntu/2026/dsa", exam_subject: "資料結構與演算法", subjects: ["algo"] }),
    ]);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0]!, /^ntu\/2026\/co-os:/);
  });
});
