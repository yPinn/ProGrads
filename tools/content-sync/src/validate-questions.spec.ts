import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkPaperConsistency, type PaperQuestion } from "./validate-questions.js";

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
