// @vitest-environment node
import { describe, it, expect } from "vitest";
import { admitRate } from "./admit-rate";

describe("admitRate", () => {
  it("uses the actual rate once results are out", () => {
    expect(admitRate({ quota: 30, applicants: 120, admitted: 35 })).toEqual({
      percent: "29.2%",
      estimated: false,
    });
  });

  it("falls back to the quota-based estimate before results are out", () => {
    expect(admitRate({ quota: 30, applicants: 120, admitted: null })).toEqual({
      percent: "25.0%",
      estimated: true,
    });
  });

  it("returns null when applicants is null", () => {
    expect(admitRate({ quota: 30, applicants: null, admitted: null })).toBeNull();
  });

  it("returns null when applicants is zero", () => {
    expect(admitRate({ quota: 30, applicants: 0, admitted: null })).toBeNull();
  });

  it("returns null when neither admitted nor quota is known", () => {
    expect(admitRate({ quota: null, applicants: 120, admitted: null })).toBeNull();
  });
});
