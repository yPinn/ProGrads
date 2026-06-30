// @vitest-environment node
import { describe, it, expect } from "vitest";
import { ApiError, envelopeToApiError, networkToApiError } from "./api-error";

describe("envelopeToApiError", () => {
  it("preserves the backend error code, message, and status", () => {
    const e = envelopeToApiError(
      { error: { code: "NOT_FOUND", message: "question not found", details: null } },
      "Not Found",
      404,
    );
    expect(e).toBeInstanceOf(ApiError);
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toBe("question not found");
    expect(e.status).toBe(404);
  });

  it("preserves an error envelope nested under h3 error data", () => {
    const e = envelopeToApiError(
      { data: { error: { code: "NOT_FOUND", message: "查無資料", details: null } } },
      "Not Found",
      404,
    );
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toBe("查無資料");
    expect(e.status).toBe(404);
  });

  it("falls back to UNKNOWN + statusText when the body has no envelope", () => {
    const e = envelopeToApiError(undefined, "Bad Gateway", 502);
    expect(e.code).toBe("UNKNOWN");
    expect(e.message).toBe("Bad Gateway");
    expect(e.status).toBe(502);
  });

  it("uses a default message when statusText is empty", () => {
    const e = envelopeToApiError({}, "", 500);
    expect(e.code).toBe("UNKNOWN");
    expect(e.message).toBe("請求失敗");
  });
});

describe("networkToApiError", () => {
  it("maps transport failures to NETWORK, keeping the original message", () => {
    const e = networkToApiError(new Error("fetch failed"));
    expect(e.code).toBe("NETWORK");
    expect(e.message).toBe("fetch failed");
    expect(e.status).toBeUndefined();
  });

  it("uses a default message when none is provided", () => {
    const e = networkToApiError(undefined);
    expect(e.code).toBe("NETWORK");
    expect(e.message).toBe("無法連線到伺服器");
  });
});
