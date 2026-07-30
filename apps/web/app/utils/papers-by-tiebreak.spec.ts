// @vitest-environment node
import { describe, it, expect } from "vitest";
import { papersByTiebreak } from "./papers-by-tiebreak";

const paper = (name: string) => ({ name, section: null, weight: null, note: null, subjects: [] });

describe("papersByTiebreak", () => {
  it("reorders papers to match the tiebreak sequence", () => {
    const ds = paper("資料結構與演算法");
    const co = paper("計算機結構與作業系統");
    const math = paper("數學(A)");
    const result = papersByTiebreak(
      [ds, co, math],
      ["數學(A)", "計算機結構與作業系統", "資料結構與演算法"],
    );
    expect(result).toEqual([math, co, ds]);
  });

  it("keeps unmatched papers after matched ones, in original order", () => {
    const ds = paper("資料結構與演算法");
    const english = paper("英文(A)");
    const math = paper("數學(A)");
    const result = papersByTiebreak([ds, english, math], ["數學(A)"]);
    expect(result).toEqual([math, ds, english]);
  });

  it("returns papers unchanged when tiebreak is empty", () => {
    const ds = paper("資料結構與演算法");
    const co = paper("計算機結構與作業系統");
    expect(papersByTiebreak([ds, co], [])).toEqual([ds, co]);
  });

  it("returns an empty array for a round with no papers", () => {
    expect(papersByTiebreak([], ["數學(A)"])).toEqual([]);
  });
});
