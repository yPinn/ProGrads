import { z } from "zod";

// Domain enums as the single source of truth (mirror prisma/schema.prisma).

export const LicenseStatus = z
  .enum(["national_exam", "school_official", "unknown"])
  .describe("授權狀態:國家考試 / 學校官方 / 未知");
export type LicenseStatus = z.infer<typeof LicenseStatus>;

export const AdmissionType = z
  .enum(["exam", "recommended", "in_service"])
  .describe("入學管道:考試 / 推甄 / 在職專班");
export type AdmissionType = z.infer<typeof AdmissionType>;

export const QuestionType = z
  .enum(["mc", "essay", "calc", "proof", "cloze", "listening"])
  .describe("題型:選擇 / 申論 / 計算 / 證明 / 填空 / 聽力");
export type QuestionType = z.infer<typeof QuestionType>;

export const AnswerType = z
  .enum(["single_choice", "multi_choice", "numeric", "essay", "proof"])
  .describe("答案型態:單選 / 多選 / 數值 / 申論 / 證明");
export type AnswerType = z.infer<typeof AnswerType>;

export const ReviewStatus = z
  .enum(["ai_generated", "human_verified", "flagged"])
  .describe("審閱狀態:AI 生成 / 人工驗證 / 已標記");
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const Confidence = z.enum(["high", "medium", "low"]).describe("AI 解析信心度:高 / 中 / 低");
export type Confidence = z.infer<typeof Confidence>;

export const AdmissionEvent = z.enum([
  "registration_start",
  "registration_end",
  "written_exam",
  "interview",
  "result",
]);
export type AdmissionEvent = z.infer<typeof AdmissionEvent>;
