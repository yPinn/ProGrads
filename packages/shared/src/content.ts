import { z } from "zod";
import { AdmissionType, Confidence, QuestionType, ReviewStatus } from "./enums.js";

// Question file frontmatter contract (single source of truth for the content sync).
// Classification fields (track/school/department/year) are NOT here — they are derived
// from the file path. See docs/03-content-pipeline.md.

// Compliance gate: only officially-public licenses may enter the DB; `unknown` is rejected
// at the boundary (stricter than the LicenseStatus enum).
export const ContentLicenseStatus = z.enum(["national_exam", "school_official"]);
export type ContentLicenseStatus = z.infer<typeof ContentLicenseStatus>;

export const QuestionFrontmatter = z.object({
  question_id: z.string().min(1), // pinned upsert key; validated against the path-derived default
  exam_subject: z.string().min(1), // paper display name (ExamSubject.name)
  subjects: z.array(z.string().min(1)).min(1), // granular practice tags (question_subject), by slug
  question_type: QuestionType,
  source_url: z.union([z.string().url(), z.literal("")]),
  license_status: ContentLicenseStatus,
  group: z.string().default(""), // 組別 (甲/乙/丙); empty = none
  knowledge_points: z.array(z.string().min(1)).default([]), // parsed; not yet persisted (phase 2)
  // --- answer (Tier2) metadata ---
  model_used: z.string().optional(),
  confidence: Confidence.optional(),
  review_status: ReviewStatus.default("ai_generated"),
  admission_type: AdmissionType.default("exam"), // content is almost always 考試入學
});
export type QuestionFrontmatter = z.infer<typeof QuestionFrontmatter>;
