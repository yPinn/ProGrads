import { describe, it, expect } from "vitest";
import { validateEnv } from "./env.js";

describe("validateEnv", () => {
  it("applies defaults when only DATABASE_URL is provided", () => {
    const env = validateEnv({ DATABASE_URL: "postgres://localhost:5432/app" });
    expect(env).toEqual({
      NODE_ENV: "development",
      PORT: 8088,
      HOST: "0.0.0.0",
      DATABASE_URL: "postgres://localhost:5432/app",
    });
  });

  it("coerces PORT from a string", () => {
    const env = validateEnv({ DATABASE_URL: "postgres://x", PORT: "3000" });
    expect(env.PORT).toBe(3000);
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => validateEnv({})).toThrow();
  });

  it("rejects an invalid NODE_ENV", () => {
    expect(() => validateEnv({ DATABASE_URL: "postgres://x", NODE_ENV: "staging" })).toThrow();
  });
});
