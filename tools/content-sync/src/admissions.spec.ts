import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAdmissionsPath, validateAdmissionTypeMatchesPath } from "./admissions.js";

describe("admissions path parsing", () => {
  it("defaults flat schedule paths to exam admission type", () => {
    assert.deepEqual(parseAdmissionsPath("admissions/2026/ntu/schedule.yml"), {
      year: 2026,
      school: "ntu",
      admissionType: "exam",
    });
  });

  it("maps season path segments to admission types", () => {
    assert.equal(
      parseAdmissionsPath("admissions/2026/ntu/recruit/schedule.yml").admissionType,
      "recommended",
    );
    assert.equal(
      parseAdmissionsPath("admissions/2026/ntu/in-service/schedule.yml").admissionType,
      "in_service",
    );
  });

  it("rejects schedule body admission_type that disagrees with the path season", () => {
    const pathRef = parseAdmissionsPath("admissions/2026/ntu/recruit/schedule.yml");
    assert.throws(
      () => validateAdmissionTypeMatchesPath(pathRef, "exam", "schedule.yml"),
      /admission_type mismatch/,
    );
  });
});
