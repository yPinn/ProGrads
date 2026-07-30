import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { computeQuestionsCoverage } from "./report-questions.js";

// ntu/csie is a stable, real seed slug — anchoring fixtures to it skips mocking the seed file.
function withTempDir(fn: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "content-sync-questions-"));
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function questionMd(): string {
  return [
    "---",
    "question_id: ntu-2025-dsa-a-q01",
    "exam_subject: 資料結構與演算法",
    "subjects: [algo]",
    "departments: [csie]",
    "question_type: mc",
    'source_url: ""',
    "license_status: school_official",
    "---",
    "",
    "## 題目",
    "",
    "test stem",
    "",
    "## 答案",
    "",
    "B",
    "",
    "## 標準解答",
    "",
    "because reasons",
    "",
  ].join("\n");
}

describe("computeQuestionsCoverage", () => {
  it("tallies a paper's question count, type mix, and solve completeness", () => {
    withTempDir((root) => {
      mkdirSync(path.join(root, "ntu", "2025", "dsa-a"), { recursive: true });
      writeFileSync(path.join(root, "ntu", "2025", "dsa-a", "q01.md"), questionMd());

      const result = computeQuestionsCoverage(root);
      const paper = result.papers.find(
        (p) => p.school === "ntu" && p.year === 2025 && p.paper === "dsa-a",
      );

      assert.ok(paper, "the ntu/2025/dsa-a paper should be present");
      assert.equal(paper?.count, 1);
      assert.equal(paper?.typeMix, "mc1");
      assert.equal(paper?.answered, 1);
      assert.equal(paper?.solved, 1);
      assert.equal(result.totalQuestions, 1);
    });
  });

  it("lists a seeded school with zero questions as missing", () => {
    withTempDir((root) => {
      mkdirSync(path.join(root, "ntu", "2025", "dsa-a"), { recursive: true });
      writeFileSync(path.join(root, "ntu", "2025", "dsa-a", "q01.md"), questionMd());

      const result = computeQuestionsCoverage(root);

      assert.equal(
        result.missingSchools.some((s) => s.slug === "nthu"),
        true,
      );
      assert.ok(result.schoolsWithQuestions < result.totalSeedSchools);
    });
  });
});
