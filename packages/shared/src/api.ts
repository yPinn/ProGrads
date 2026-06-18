import { z } from "zod";

// Unified API response envelopes. See docs/05-api-conventions.md.

// Pagination metadata; only paginated endpoints include it.
export const MetaSchema = z.object({
  page: z.number().int().positive().describe("目前頁碼(自 1 起)"),
  pageSize: z.number().int().positive().describe("每頁筆數"),
  total: z.number().int().nonnegative().describe("符合條件的總筆數"),
});
export type Meta = z.infer<typeof MetaSchema>;

// Success envelope: { data }.
export function dataResponse<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data });
}

// Paginated success envelope: { data: item[], meta }.
export function paginatedResponse<T extends z.ZodTypeAny>(item: T) {
  return z.object({ data: z.array(item), meta: MetaSchema });
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
    code: ErrorCode.describe("穩定錯誤碼(供前端判斷)"),
    message: z.string().describe("人類可讀的錯誤訊息"),
    details: z.unknown().nullable().describe("額外細節(如欄位驗證錯誤);無則為 null"),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
