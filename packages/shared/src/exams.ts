import { z } from "zod";
import { dataResponse } from "./api.js";
import { AdmissionType, LicenseStatus } from "./enums.js";
import { DepartmentSchema, SchoolSchema } from "./schools.js";
import { SubjectSchema } from "./taxonomy.js";

// Exam axis contracts: where the school axis (school+department) meets the track axis
// (subject). An exam bundles papers (exam_subjects), each mapping to 1..n subjects (合科卷).
// See docs/02-data-model.md.

// A paper/section within an exam; may bundle multiple subjects (合科卷).
export const ExamSubjectSchema = z.object({
  id: z.string(),
  name: z.string().describe("卷別名稱(如 計算機概論與資料結構)"),
  sourceUrl: z.string().nullable().describe("原始來源 URL,可能為 null"),
  subjects: z.array(SubjectSchema).describe("該卷涵蓋的考科;合科卷為多科"),
});
export type ExamSubject = z.infer<typeof ExamSubjectSchema>;

// Summary for list endpoints (no papers).
export const ExamSummarySchema = z.object({
  id: z.string(),
  year: z.number().int().describe("考試年度(西元,如 2025)"),
  admissionType: AdmissionType,
  group: z.string().describe("招生組別(如 甲組)"),
  licenseStatus: LicenseStatus,
  sourceUrl: z.string().nullable().describe("原始來源 URL,可能為 null"),
  school: SchoolSchema,
  department: DepartmentSchema,
});
export type ExamSummary = z.infer<typeof ExamSummarySchema>;

// Detail adds the papers (exam_subjects with their subjects).
export const ExamDetailSchema = ExamSummarySchema.extend({
  examSubjects: z.array(ExamSubjectSchema).describe("考卷的卷別清單(含合科卷組成)"),
});
export type ExamDetail = z.infer<typeof ExamDetailSchema>;

// GET /exams?school=&track=&year=&admissionType=
export const ExamQuerySchema = z.object({
  school: z.string().min(1).optional().describe("以學校 slug 過濾"),
  track: z.string().min(1).optional().describe("以所別 slug 過濾"),
  year: z.coerce.number().int().optional().describe("以考試年度過濾"),
  admissionType: AdmissionType.optional(),
});
export type ExamQuery = z.infer<typeof ExamQuerySchema>;

// Response envelopes.
export const ExamsResponseSchema = dataResponse(z.array(ExamSummarySchema));
export const ExamResponseSchema = dataResponse(ExamDetailSchema);
