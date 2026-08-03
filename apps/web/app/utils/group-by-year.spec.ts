// @vitest-environment node
import { describe, it, expect } from "vitest";
import { groupByYear } from "./group-by-year";

describe("groupByYear", () => {
  it("groups consecutive same-year items together, preserving order", () => {
    const items = [
      { year: 2026, school: "ntu" },
      { year: 2026, school: "nthu" },
      { year: 2025, school: "ntu" },
    ];
    expect(groupByYear(items)).toEqual([
      { year: 2026, rows: [items[0], items[1]] },
      { year: 2025, rows: [items[2]] },
    ]);
  });

  it("returns one group per item when no two are adjacent same-year", () => {
    const items = [
      { year: 2026, school: "a" },
      { year: 2025, school: "b" },
    ];
    expect(groupByYear(items)).toEqual([
      { year: 2026, rows: [items[0]] },
      { year: 2025, rows: [items[1]] },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(groupByYear([])).toEqual([]);
  });
});
