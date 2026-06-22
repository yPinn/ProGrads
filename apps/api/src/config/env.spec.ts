import { describe, it, expect } from "vitest";
import { validateEnv } from "./env.js";

describe("validateEnv", () => {
  it("applies defaults when required env is provided", () => {
    const env = validateEnv({
      DATABASE_URL: "postgres://localhost:5432/app",
      WEB_BASE_URL: "http://localhost:3000",
    });
    expect(env).toEqual({
      NODE_ENV: "development",
      PORT: 8088,
      HOST: "0.0.0.0",
      DATABASE_URL: "postgres://localhost:5432/app",
      WEB_BASE_URL: "http://localhost:3000",
    });
  });

  it("coerces PORT from a string", () => {
    const env = validateEnv({
      DATABASE_URL: "postgres://x",
      WEB_BASE_URL: "https://app.example.com",
      PORT: "3000",
    });
    expect(env.PORT).toBe(3000);
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => validateEnv({})).toThrow();
  });

  it("rejects an invalid NODE_ENV", () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: "postgres://x",
        WEB_BASE_URL: "https://app.example.com",
        NODE_ENV: "staging",
      }),
    ).toThrow();
  });

  it("throws when WEB_BASE_URL is missing", () => {
    expect(() => validateEnv({ DATABASE_URL: "postgres://x" })).toThrow();
  });
});
