import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RegistrationRow, RegistrationYml } from "@prograds/shared";
import { parseAdmissionStatsPath } from "./admission-stats.js";

describe("admission-stats path parsing", () => {
  it("defaults flat registration paths to exam admission type", () => {
    assert.deepEqual(parseAdmissionStatsPath("admission-stats/2026/nthu/registration.yml"), {
      year: 2026,
      school: "nthu",
      admissionType: "exam",
    });
  });

  it("maps season path segments to admission types", () => {
    assert.equal(
      parseAdmissionStatsPath("admission-stats/2026/nycu/recruit/registration.yml").admissionType,
      "recommended",
    );
    assert.equal(
      parseAdmissionStatsPath("admission-stats/2026/nthu/in-service/registration.yml")
        .admissionType,
      "in_service",
    );
  });

  it("rejects paths with the wrong segment count", () => {
    assert.throws(
      () => parseAdmissionStatsPath("admission-stats/2026/registration.yml"),
      /unexpected admission-stats path/,
    );
    assert.throws(
      () => parseAdmissionStatsPath("admission-stats/2026/nthu/extra/deep/registration.yml"),
      /unexpected admission-stats path/,
    );
  });

  it("rejects an unrecognised season segment", () => {
    assert.throws(
      () => parseAdmissionStatsPath("admission-stats/2026/nthu/bogus/registration.yml"),
      /unexpected admission-stats path/,
    );
  });
});

describe("RegistrationYml contract", () => {
  const base = { school: "nthu", year: 2026, rows: [] as unknown[] };

  it("defaults admission_type to exam", () => {
    assert.equal(RegistrationYml.parse(base).admission_type, "exam");
  });

  it("rejects unknown top-level keys (strict)", () => {
    assert.equal(RegistrationYml.safeParse({ ...base, season: "recruit" }).success, false);
  });

  it("accepts a minimal matched row", () => {
    const r = RegistrationRow.parse({
      official_code: "0524",
      name: "資工系",
      dept: "cs",
      code: "",
      applicants: 2011,
    });
    assert.equal(r.applicants, 2011);
    assert.equal(r.joint, undefined);
  });

  it("accepts a joint row without dept/code", () => {
    const r = RegistrationRow.parse({
      official_code: "810",
      name: "資訊聯招",
      applicants: 819,
      joint: true,
    });
    assert.equal(r.joint, true);
    assert.equal(r.dept, undefined);
  });

  it("rejects negative applicants", () => {
    assert.equal(
      RegistrationRow.safeParse({ official_code: "0524", name: "資工系", applicants: -1 }).success,
      false,
    );
  });

  it("rejects unknown row keys (strict)", () => {
    assert.equal(
      RegistrationRow.safeParse({
        official_code: "0524",
        name: "資工系",
        applicants: 1,
        quota: 5,
      }).success,
      false,
    );
  });
});
