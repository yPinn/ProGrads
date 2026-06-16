import { z } from "zod";
import { dataResponse, paginatedResponse } from "./api.js";
import {
  AdmissionType,
  AnswerType,
  Confidence,
  LicenseStatus,
  QuestionType,
  ReviewStatus,
} from "./enums.js";
import { DepartmentSchema, SchoolSchema } from "./schools.js";
import { SubjectSchema } from "./taxonomy.js";

// Question (global shared bank) contracts. The killer query: practice one subject across
// all schools (?subject=algorithms). See docs/02-data-model.md.

// Compact exam context carried on each question.
export const QuestionExamRefSchema = z.object({
  id: z.string(),
  year: z.number().int(),
  admissionType: AdmissionType,
  group: z.string(),
  school: SchoolSchema,
  department: DepartmentSchema,
});
export type QuestionExamRef = z.infer<typeof QuestionExamRefSchema>;

export const QuestionSummarySchema = z.object({
  externalId: z.string(),
  number: z.string(),
  type: QuestionType,
  subjects: z.array(SubjectSchema), // granular practice tags
  examSubject: z.object({ id: z.string(), name: z.string() }),
  exam: QuestionExamRefSchema,
});
export type QuestionSummary = z.infer<typeof QuestionSummarySchema>;

// Cached standard answer (Tier2), shaped by answer_type.
export const ExplanationSchema = z.object({
  standardAnswer: z.string(),
  answerType: AnswerType,
  confidence: Confidence.nullable(),
  reviewStatus: ReviewStatus,
  modelUsed: z.string().nullable(),
});
export type Explanation = z.infer<typeof ExplanationSchema>;

export const QuestionDetailSchema = QuestionSummarySchema.extend({
  contentMd: z.string(),
  sourceUrl: z.string().nullable(),
  licenseStatus: LicenseStatus,
  // examSubject detail includes its 合科卷 composition.
  examSubject: z.object({
    id: z.string(),
    name: z.string(),
    subjects: z.array(SubjectSchema),
  }),
  explanation: ExplanationSchema.nullable(),
});
export type QuestionDetail = z.infer<typeof QuestionDetailSchema>;

// GET /questions?subject=&track=&school=&year=&type=&page=&pageSize=
export const QuestionQuerySchema = z.object({
  subject: z.string().min(1).optional(),
  track: z.string().min(1).optional(),
  school: z.string().min(1).optional(),
  year: z.coerce.number().int().optional(),
  type: QuestionType.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type QuestionQuery = z.infer<typeof QuestionQuerySchema>;

// Response envelopes.
export const QuestionsResponseSchema = paginatedResponse(QuestionSummarySchema);
export const QuestionResponseSchema = dataResponse(QuestionDetailSchema);
