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
  name: z.string(),
  sourceUrl: z.string().nullable(),
  subjects: z.array(SubjectSchema),
});
export type ExamSubject = z.infer<typeof ExamSubjectSchema>;

// Summary for list endpoints (no papers).
export const ExamSummarySchema = z.object({
  id: z.string(),
  year: z.number().int(),
  admissionType: AdmissionType,
  group: z.string(),
  licenseStatus: LicenseStatus,
  sourceUrl: z.string().nullable(),
  school: SchoolSchema,
  department: DepartmentSchema,
});
export type ExamSummary = z.infer<typeof ExamSummarySchema>;

// Detail adds the papers (exam_subjects with their subjects).
export const ExamDetailSchema = ExamSummarySchema.extend({
  examSubjects: z.array(ExamSubjectSchema),
});
export type ExamDetail = z.infer<typeof ExamDetailSchema>;

// GET /exams?school=&track=&year=&admissionType=
export const ExamQuerySchema = z.object({
  school: z.string().min(1).optional(),
  track: z.string().min(1).optional(),
  year: z.coerce.number().int().optional(),
  admissionType: AdmissionType.optional(),
});
export type ExamQuery = z.infer<typeof ExamQuerySchema>;

// Response envelopes.
export const ExamsResponseSchema = dataResponse(z.array(ExamSummarySchema));
export const ExamResponseSchema = dataResponse(ExamDetailSchema);
