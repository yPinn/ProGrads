// @vitest-environment node
import { describe, it, expect } from "vitest";
import { brochureUrl } from "./admission-brochure";

describe("brochureUrl", () => {
  it("builds the NTU per-group brochure PDF link from the admission code", () => {
    expect(brochureUrl("ntu", "907")).toBe("https://exam.aca.ntu.edu.tw/grab/Brochure/PDF/907.pdf");
  });

  it("returns null for a school with no known brochure pattern", () => {
    expect(brochureUrl("nccu", "907")).toBeNull();
  });

  it("returns null when the admission code is missing", () => {
    expect(brochureUrl("ntu", null)).toBeNull();
  });

  it("returns null when the school is not yet selected", () => {
    expect(brochureUrl(undefined, "907")).toBeNull();
  });
});
