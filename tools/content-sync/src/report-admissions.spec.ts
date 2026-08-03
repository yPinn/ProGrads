import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { computeAdmissionsCoverage } from "./report-admissions.js";

// ntu is a stable, real seed school (csie/nm/ee/... all track "cs"/"ee"/"info-mgmt", in the
// default "eecs" scope) — anchoring fixtures to it skips mocking the seed file entirely.
function withTempDir(fn: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "content-sync-admissions-"));
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("computeAdmissionsCoverage", () => {
  it("marks a unit with a departments.yml as built and counts scoped dept coverage", () => {
    withTempDir((root) => {
      mkdirSync(path.join(root, "2025", "ntu"), { recursive: true });
      writeFileSync(
        path.join(root, "2025", "ntu", "departments.yml"),
        [
          "school: ntu",
          "year: 2025",
          "depts:",
          "  - dept: csie",
          "    groups:",
          "      - code: a",
          "        quota: 30",
        ].join("\n"),
      );

      const { units, withDepartments } = computeAdmissionsCoverage(root);
      const unit = units.find((u) => u.year === 2025 && u.school === "ntu");

      assert.ok(unit, "the (2025, ntu) unit should be present");
      assert.equal(unit?.departments, true);
      assert.equal(unit?.coveredDepts.includes("csie"), true);
      assert.ok(unit!.scopeDeptCovered >= 1);
      assert.equal(withDepartments, 1);
    });
  });

  it("flags a unit with only a prospectus as fillable", () => {
    withTempDir((root) => {
      mkdirSync(path.join(root, "2025", "nthu"), { recursive: true });
      writeFileSync(path.join(root, "2025", "nthu", "prospectus.pdf"), "");

      const { units, fillable } = computeAdmissionsCoverage(root);
      const unit = units.find((u) => u.year === 2025 && u.school === "nthu");

      assert.ok(unit);
      assert.equal(unit?.prospectus, true);
      assert.equal(unit?.departments, false);
      assert.equal(fillable, 1);
    });
  });

  it("does not mistake a school's own per-department raw-PDF subfolder for a season directory", () => {
    withTempDir((root) => {
      // Real-world shape: ntu/2026/departments.yml exists at the top level, plus a same-named
      // subfolder holding raw per-dept source PDFs (not a "recommended"/"in_service" season).
      mkdirSync(path.join(root, "2026", "ntu", "departments"), { recursive: true });
      writeFileSync(
        path.join(root, "2026", "ntu", "departments.yml"),
        ["school: ntu", "year: 2026", "depts:", "  - dept: csie", "    groups: []"].join("\n"),
      );
      writeFileSync(path.join(root, "2026", "ntu", "departments", "701.pdf"), "");
      writeFileSync(path.join(root, "2026", "ntu", "departments", "index.yml"), "not: a-unit-file");

      const { units } = computeAdmissionsCoverage(root);
      const seasons = units
        .filter((u) => u.year === 2026 && u.school === "ntu")
        .map((u) => u.season);

      assert.deepEqual(seasons, ["exam"]);
    });
  });
});
