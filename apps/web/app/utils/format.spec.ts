// @vitest-environment node
import { describe, it, expect } from "vitest";
import { formatDate, formatDateRange, formatDateTime } from "./format";

// Assertions check structure (calendar day, separator, time presence) rather than exact
// locale strings, so they stay green across ICU/Node versions while still guarding behavior.
describe("date formatting (zh-TW / Asia/Taipei)", () => {
  const at = "2025-01-02T09:00:00+08:00";

  it("zero-pads month and day to a constant width", () => {
    expect(formatDate(at)).toContain("2025");
    expect(formatDate(at)).toContain("01月02日");
  });

  it("renders the Taipei day regardless of the source offset", () => {
    // 2025-01-01T16:30Z is already Jan 2 in Taipei (+08:00).
    expect(formatDate("2025-01-01T16:30:00Z")).toContain("01月02日");
  });

  it("includes a padded date and a 24-hour time in a datetime", () => {
    const out = formatDateTime(at);
    expect(out).toContain("01月02日");
    expect(out).toContain("09:00");
    expect(out).not.toMatch(/上午|下午|凌晨/); // 24-hour clock, no day period
  });

  it("returns a single datetime when the range has no end", () => {
    expect(formatDateRange(at, null)).toBe(formatDateTime(at));
  });

  it("collapses a same-day range to one date with a time span", () => {
    const out = formatDateRange(at, "2025-01-02T11:00:00+08:00");
    expect(out).toContain(" – ");
    expect(out.match(/01月02日/g)).toHaveLength(1); // date shown once, end is time-only
    expect(out).toContain("11:00");
  });

  it("keeps both dates for a multi-day range", () => {
    const out = formatDateRange(at, "2025-01-05T11:00:00+08:00");
    expect(out).toContain("01月02日");
    expect(out).toContain("01月05日");
    expect(out).toContain(" – ");
  });
});
