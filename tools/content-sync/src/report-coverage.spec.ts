import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { computeFacultyCoverage } from "./report-coverage.js";

// ntu/csie is a stable, real seed slug (packages/db/prisma/seed/schools.seed.ts) — anchoring
// fixtures to it lets these tests skip mocking the seed file entirely.
function withTempDir(fn: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "content-sync-coverage-"));
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("computeFacultyCoverage", () => {
  it("marks a dept with a faculty.yml as built and tallies its fields", () => {
    withTempDir((root) => {
      mkdirSync(path.join(root, "ntu"), { recursive: true });
      writeFileSync(
        path.join(root, "ntu", "csie.yml"),
        [
          "school: ntu",
          "dept: csie",
          "as_of: 2026-01-01",
          "members:",
          "  - name: 王小明",
          "    title: 教授",
          "    research_areas: [人工智慧]",
          "  - name: 陳小華",
        ].join("\n"),
      );

      const result = computeFacultyCoverage(root);
      const csie = result.depts.find((d) => d.school === "ntu" && d.dept === "csie");

      assert.ok(csie, "ntu/csie should be present in every seeded dept row");
      assert.equal(csie?.built, true);
      assert.equal(csie?.members, 2);
      assert.equal(csie?.withTitle, 1);
      assert.equal(csie?.withResearch, 1);
      assert.equal(csie?.asOf, "2026-01-01");
      assert.equal(result.orphans.length, 0);
    });
  });

  it("leaves an un-built seeded dept at zero, and reports orphans separately", () => {
    withTempDir((root) => {
      // A dept not seeded under any school (bad path) → orphan, not counted as built.
      writeFileSync(path.join(root, "not-a-school-dept.yml"), "school: x\n");

      const result = computeFacultyCoverage(root);
      const ee = result.depts.find((d) => d.school === "ntu" && d.dept === "ee");

      assert.ok(ee);
      assert.equal(ee?.built, false);
      assert.equal(ee?.members, 0);
      assert.equal(result.orphans.length, 1);
      assert.match(result.orphans[0]!, /bad path/);
      assert.ok(result.totalDepts > result.builtDepts);
    });
  });
});
