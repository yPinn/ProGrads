import { z } from "zod";
import { dataResponse } from "./api.js";
import { AdmissionType, LicenseStatus } from "./enums.js";
import { DepartmentSchema, SchoolSchema } from "./schools.js";
import { SubjectSchema } from "./taxonomy.js";

// Exam axis contracts: an exam is a school's session (school × year × admissionType) that
// bundles physical papers (exam_subjects). A paper maps to 1..n subjects (combined-subject
// paper) and is taken by 1..n departments (shared paper). See docs/02-data-model.md.

// A physical paper within an exam; bundles subjects (combined-subject) + departments that sat it.
export const ExamSubjectSchema = z.object({
  id: z.string(),
  slug: z.string().describe("卷 slug(含卷別,如 dsa-a)"),
  name: z.string().describe("卷別名稱(如 計算機概論與資料結構)"),
  licenseStatus: LicenseStatus,
  sourceUrl: z.string().nullable().describe("原始來源 URL,可能為 null"),
  subjects: z.array(SubjectSchema).describe("該卷涵蓋的考科;合科卷為多科"),
  departments: z.array(DepartmentSchema).describe("考此卷的系所;共用卷為多系所"),
});
export type ExamSubject = z.infer<typeof ExamSubjectSchema>;

// Summary for list endpoints (no papers).
export const ExamSummarySchema = z.object({
  id: z.string(),
  year: z.number().int().describe("考試年度(西元,如 2025)"),
  admissionType: AdmissionType,
  school: SchoolSchema,
  departments: z.array(DepartmentSchema).describe("此場考試各卷涵蓋的系所(跨卷聚合)"),
});
export type ExamSummary = z.infer<typeof ExamSummarySchema>;

// Detail adds the papers (exam_subjects with their subjects + departments).
export const ExamDetailSchema = ExamSummarySchema.extend({
  examSubjects: z.array(ExamSubjectSchema).describe("考卷的卷別清單(含合科卷組成與採用系所)"),
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
