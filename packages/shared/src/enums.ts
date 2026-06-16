import { z } from "zod";

// Domain enums as the single source of truth (mirror prisma/schema.prisma).

export const LicenseStatus = z.enum(["national_exam", "school_official", "unknown"]);
export type LicenseStatus = z.infer<typeof LicenseStatus>;

export const AdmissionType = z.enum(["exam", "recommended", "in_service"]);
export type AdmissionType = z.infer<typeof AdmissionType>;

export const QuestionType = z.enum(["mc", "essay", "calc", "proof", "cloze", "listening"]);
export type QuestionType = z.infer<typeof QuestionType>;

export const AnswerType = z.enum(["single_choice", "multi_choice", "numeric", "essay", "proof"]);
export type AnswerType = z.infer<typeof AnswerType>;

export const ReviewStatus = z.enum(["ai_generated", "human_verified", "flagged"]);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const Confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof Confidence>;

export const AdmissionEvent = z.enum([
  "registration_start",
  "registration_end",
  "written_exam",
  "interview",
  "result",
]);
export type AdmissionEvent = z.infer<typeof AdmissionEvent>;
