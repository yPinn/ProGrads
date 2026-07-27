// @vitest-environment node
import { describe, it, expect } from "vitest";
import { practicableSubjects } from "./practicable-subjects";

const ds = { id: "1", slug: "ds", name: "資料結構" };
const algo = { id: "2", slug: "algo", name: "演算法" };

describe("practicableSubjects", () => {
  it("keeps every subject when all have content", () => {
    expect(practicableSubjects([ds, algo], new Set(["ds", "algo"]))).toEqual([ds, algo]);
  });

  it("keeps only the subjects with content", () => {
    expect(practicableSubjects([ds, algo], new Set(["ds"]))).toEqual([ds]);
  });

  it("returns an empty array when none have content", () => {
    expect(practicableSubjects([ds, algo], new Set())).toEqual([]);
  });

  it("returns an empty array for a paper with no subjects", () => {
    expect(practicableSubjects([], new Set(["ds"]))).toEqual([]);
  });
});
