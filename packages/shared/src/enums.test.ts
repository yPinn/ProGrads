import { describe, it, expect } from "vitest";
import { QuestionType, Confidence } from "./enums.js";

describe("domain enums", () => {
  it("accepts a valid QuestionType value", () => {
    expect(QuestionType.parse("essay")).toBe("essay");
  });

  it("rejects an unknown QuestionType value", () => {
    expect(() => QuestionType.parse("multiple_choice")).toThrow();
  });

  it("exposes the full Confidence option set", () => {
    expect(Confidence.options).toEqual(["high", "medium", "low"]);
  });
});
