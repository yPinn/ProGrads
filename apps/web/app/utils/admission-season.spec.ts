// @vitest-environment node
import { describe, it, expect } from "vitest";
import { seasonLine } from "./admission-season";

describe("seasonLine", () => {
  it("joins every populated part with the dot separator", () => {
    expect(
      seasonLine({
        announcedAt: "2025-11-12T00:00:00+08:00",
        applicationFee: 1500,
        interviewFee: 500,
        feeWaiver: ["low_income", "lower_middle_income"],
      }),
    ).toBe("報名費 1,500 · 口試費 500 · 簡章公告 2025年11月12日");
  });

  it("drops absent parts without leaving stray separators", () => {
    expect(
      seasonLine({
        announcedAt: "2023-10-16T00:00:00+08:00",
        applicationFee: null,
        interviewFee: null,
        feeWaiver: [],
      }),
    ).toBe("簡章公告 2023年10月16日");
  });

  it("does not surface fee-waiver eligibility", () => {
    expect(
      seasonLine({
        announcedAt: null,
        applicationFee: null,
        interviewFee: null,
        feeWaiver: ["disability"],
      }),
    ).toBe("");
  });

  it("returns an empty string when season is null", () => {
    expect(seasonLine(null)).toBe("");
  });

  it("returns an empty string when season has no populated fields", () => {
    expect(
      seasonLine({ announcedAt: null, applicationFee: null, interviewFee: null, feeWaiver: [] }),
    ).toBe("");
  });
});
