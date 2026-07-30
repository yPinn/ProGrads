import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { computeAdmissionStatsCoverage } from "./report-admission-stats.js";

function withTempDirs(fn: (statsRoot: string, admissionsRoot: string) => void): void {
  const statsRoot = mkdtempSync(path.join(os.tmpdir(), "content-sync-stats-"));
  const admissionsRoot = mkdtempSync(path.join(os.tmpdir(), "content-sync-admissions2-"));
  try {
    fn(statsRoot, admissionsRoot);
  } finally {
    rmSync(statsRoot, { recursive: true, force: true });
    rmSync(admissionsRoot, { recursive: true, force: true });
  }
}

function departmentsYml(): string {
  return [
    "school: ntu",
    "year: 2025",
    "depts:",
    "  - dept: csie",
    "    groups:",
    "      - code: a",
  ].join("\n");
}

function registrationYml(): string {
  return [
    "school: ntu",
    "year: 2025",
    "admission_type: exam",
    "rows:",
    "  - official_code: csie",
    "    name: 資訊工程學系",
    "    applicants: 120",
  ].join("\n");
}

describe("computeAdmissionStatsCoverage", () => {
  it("marks a unit present when both admissions and registration.yml exist", () => {
    withTempDirs((statsRoot, admissionsRoot) => {
      mkdirSync(path.join(admissionsRoot, "2025", "ntu"), { recursive: true });
      writeFileSync(path.join(admissionsRoot, "2025", "ntu", "departments.yml"), departmentsYml());

      mkdirSync(path.join(statsRoot, "2025", "ntu"), { recursive: true });
      writeFileSync(path.join(statsRoot, "2025", "ntu", "registration.yml"), registrationYml());

      const { units, fillable } = computeAdmissionStatsCoverage(statsRoot, admissionsRoot);
      const unit = units.find((u) => u.year === 2025 && u.school === "ntu");

      assert.ok(unit);
      assert.equal(unit?.present, true);
      assert.equal(unit?.admissionsBuilt, true);
      assert.equal(unit?.rows, 1);
      assert.equal(fillable, 0);
    });
  });

  it("flags a unit as fillable when admissions is built but registration.yml is missing", () => {
    withTempDirs((statsRoot, admissionsRoot) => {
      mkdirSync(path.join(admissionsRoot, "2025", "ntu"), { recursive: true });
      writeFileSync(path.join(admissionsRoot, "2025", "ntu", "departments.yml"), departmentsYml());

      const { units, fillable } = computeAdmissionStatsCoverage(statsRoot, admissionsRoot);
      const unit = units.find((u) => u.year === 2025 && u.school === "ntu");

      assert.ok(unit);
      assert.equal(unit?.present, false);
      assert.equal(unit?.admissionsBuilt, true);
      assert.equal(fillable, 1);
    });
  });
});
