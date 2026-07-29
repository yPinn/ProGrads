// @vitest-environment node
import { describe, it, expect } from "vitest";
import { toSelectItems } from "./select";

describe("toSelectItems", () => {
  it("maps slug+name rows to label/value items", () => {
    expect(toSelectItems([{ slug: "ntu", name: "臺灣大學" }])).toEqual([
      { label: "臺灣大學", value: "ntu" },
    ]);
  });

  it("preserves row order", () => {
    expect(
      toSelectItems([
        { slug: "ntu", name: "臺灣大學" },
        { slug: "nthu", name: "清華大學" },
      ]),
    ).toEqual([
      { label: "臺灣大學", value: "ntu" },
      { label: "清華大學", value: "nthu" },
    ]);
  });

  it("returns an empty array for undefined input", () => {
    expect(toSelectItems(undefined)).toEqual([]);
  });

  it("returns an empty array for an empty list", () => {
    expect(toSelectItems([])).toEqual([]);
  });
});
