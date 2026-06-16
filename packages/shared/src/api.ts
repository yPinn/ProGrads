import { z } from "zod";

// Unified API response envelopes. See docs/05-api-conventions.md.

// Pagination metadata; only paginated endpoints include it.
export const MetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type Meta = z.infer<typeof MetaSchema>;

// Success envelope: { data, meta? }.
export function dataResponse<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data });
}

// Stable, client-facing error codes.
export const ErrorCode = z.enum([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

// Error envelope: { error: { code, message, details } }.
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.unknown().nullable(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
