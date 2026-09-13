import { z } from "zod";
import { dataResponse } from "./api.js";
import { ErrorReportType } from "./enums.js";

// Public, unauthenticated error-report submission on a question/explanation — P0 trust-loop
// roadmap item. See docs/09-roadmap.md.
export const CreateErrorReportSchema = z.object({
  questionExternalId: z.string().min(1).describe("題目的 externalId(frontmatter question_id)"),
  type: ErrorReportType.describe("錯誤類型"),
  description: z.string().min(1).max(2000).describe("錯誤描述"),
});
export type CreateErrorReport = z.infer<typeof CreateErrorReportSchema>;

export const ErrorReportSchema = z.object({
  id: z.string(),
  type: ErrorReportType,
  status: z.enum(["open", "resolved", "dismissed"]),
  createdAt: z.string(),
});
export type ErrorReport = z.infer<typeof ErrorReportSchema>;

export const ErrorReportResponseSchema = dataResponse(ErrorReportSchema);
