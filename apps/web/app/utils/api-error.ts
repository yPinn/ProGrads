import type { ErrorCode, ErrorResponse } from "@prograds/shared";

// Normalized API failure. Carries the backend's stable error.code (docs/05-api-conventions.md)
// so callers can branch on it; falls back to NETWORK/UNKNOWN for non-envelope failures.
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | "NETWORK" | "UNKNOWN",
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// HTTP error response → ApiError, preserving the backend error envelope's stable code.
export function envelopeToApiError(body: unknown, statusText?: string, status?: number): ApiError {
  const err = (body as Partial<ErrorResponse> | undefined)?.error;
  return new ApiError(err?.code ?? "UNKNOWN", err?.message ?? (statusText || "請求失敗"), status);
}

// Transport-level failure (no HTTP response: refused/DNS/timeout/offline) → ApiError.
export function networkToApiError(error: { message?: string } | undefined): ApiError {
  return new ApiError("NETWORK", error?.message || "無法連線到伺服器");
}
