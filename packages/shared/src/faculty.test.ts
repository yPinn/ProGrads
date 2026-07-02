import { describe, it, expect } from "vitest";
import { facultyTitleRank } from "./faculty.js";

describe("facultyTitleRank", () => {
  it("orders the four statutory ranks by seniority", () => {
    const ranks = ["教授", "副教授", "助理教授", "講師"].map(facultyTitleRank);
    expect(ranks).toEqual([3, 4, 5, 6]);
    // strictly ascending = senior first
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("tiers honorific professorships above a plain 教授", () => {
    expect(facultyTitleRank("講座教授")).toBeLessThan(facultyTitleRank("特聘教授"));
    expect(facultyTitleRank("特聘教授")).toBeLessThan(facultyTitleRank("優聘教授"));
    expect(facultyTitleRank("優聘教授")).toBeLessThan(facultyTitleRank("教授"));
  });

  it("matches the honorific tier before the base 教授 despite the shared 教授 substring", () => {
    expect(facultyTitleRank("終身講座教授")).toBe(0);
    expect(facultyTitleRank("終身特聘教授")).toBe(1);
  });

  it("resolves modified titles to their base rank", () => {
    expect(facultyTitleRank("副教授級教學研究教師")).toBe(4);
    expect(facultyTitleRank("兼任助理教授")).toBe(5);
    expect(facultyTitleRank("客座教授")).toBe(3);
  });

  it("sends unknown or empty titles to the bottom", () => {
    expect(facultyTitleRank(null)).toBe(9);
    expect(facultyTitleRank(undefined)).toBe(9);
    expect(facultyTitleRank("")).toBe(9);
    expect(facultyTitleRank("研究員")).toBe(9);
  });
});
