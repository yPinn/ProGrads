import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FacultyYml } from "@prograds/shared";
import { parseFacultyPath } from "./faculty.js";

describe("faculty path parsing", () => {
  it("parses faculty/<school>/<dept>.yml", () => {
    assert.deepEqual(parseFacultyPath("faculty/nchu/cse.yml"), { school: "nchu", dept: "cse" });
  });

  it("rejects paths with the wrong segment count", () => {
    assert.throws(() => parseFacultyPath("faculty/nchu.yml"), /unexpected faculty path/);
    assert.throws(() => parseFacultyPath("faculty/nchu/eecs/cse.yml"), /unexpected faculty path/);
  });

  it("rejects a non-faculty prefix or non-yml leaf", () => {
    assert.throws(() => parseFacultyPath("admissions/nchu/cse.yml"), /unexpected faculty path/);
    assert.throws(() => parseFacultyPath("faculty/nchu/cse.md"), /unexpected faculty path/);
  });
});

describe("FacultyYml contract", () => {
  const base = { school: "nchu", dept: "cse", members: [{ name: "蔡文能" }] };

  it("accepts a minimal file (name only) and applies member defaults", () => {
    const r = FacultyYml.parse(base);
    assert.equal(r.members[0]?.slug, undefined);
    assert.deepEqual(r.members[0]?.research_areas, []);
    assert.deepEqual(r.members[0]?.theses, []);
  });

  it("requires member name", () => {
    assert.equal(FacultyYml.safeParse({ ...base, members: [{ slug: "wjtsai" }] }).success, false);
  });

  it("accepts an optional slug", () => {
    const r = FacultyYml.parse({ ...base, members: [{ name: "蔡文能", slug: "wjtsai" }] });
    assert.equal(r.members[0]?.slug, "wjtsai");
  });

  it("defaults thesis role to advised", () => {
    const r = FacultyYml.parse({
      ...base,
      members: [{ slug: "wjtsai", name: "蔡文能", theses: [{ title: "即時物件偵測" }] }],
    });
    assert.equal(r.members[0]?.theses[0]?.role, "advised");
  });

  it("keeps an explicit authored role", () => {
    const r = FacultyYml.parse({
      ...base,
      members: [
        { slug: "wjtsai", name: "蔡文能", theses: [{ title: "A Survey", role: "authored" }] },
      ],
    });
    assert.equal(r.members[0]?.theses[0]?.role, "authored");
  });

  it("rejects unknown top-level keys (strict)", () => {
    assert.equal(FacultyYml.safeParse({ ...base, year: 2026 }).success, false);
  });

  it("rejects unknown member keys (strict)", () => {
    assert.equal(
      FacultyYml.safeParse({ ...base, members: [{ slug: "x", name: "y", email: "a@b" }] }).success,
      false,
    );
  });
});
