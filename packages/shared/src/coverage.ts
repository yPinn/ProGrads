import { z } from "zod";
import { dataResponse } from "./api.js";

// Content-repo build-out inventory (apps/api's dev-only /coverage endpoint, powering the
// apps/web /coverage dev page). Mirrors the shapes computed by tools/content-sync's
// compute*Coverage() functions — see tools/content-sync/src/coverage.ts.

export const FacultyCoverageDeptSchema = z.object({
  school: z.string(),
  schoolName: z.string(),
  dept: z.string(),
  deptName: z.string(),
  track: z.string(),
  built: z.boolean(),
  members: z.number().int(),
  withTitle: z.number().int(),
  withResearch: z.number().int(),
  thesesMembers: z.number().int(),
  authored: z.number().int(),
  withDegrees: z.number().int(),
  asOf: z.string(),
});
export const FacultyCoverageSchema = z.object({
  depts: z.array(FacultyCoverageDeptSchema),
  totalDepts: z.number().int(),
  builtDepts: z.number().int(),
  totalMembers: z.number().int(),
  orphans: z.array(z.string()),
});
export type FacultyCoverage = z.infer<typeof FacultyCoverageSchema>;

export const AdmissionsCoverageUnitSchema = z.object({
  year: z.number().int(),
  school: z.string(),
  schoolName: z.string(),
  season: z.string(),
  prospectus: z.boolean(),
  schedule: z.boolean(),
  departments: z.boolean(),
  coveredDepts: z.array(z.string()),
  groups: z.number().int(),
  bad: z.string().optional(),
  scopeDeptTotal: z.number().int(),
  scopeDeptCovered: z.number().int(),
  scopeLabel: z.string(),
});
export const AdmissionsCoverageSchema = z.object({
  units: z.array(AdmissionsCoverageUnitSchema),
  totalUnits: z.number().int(),
  withDepartments: z.number().int(),
  fillable: z.number().int(),
});
export type AdmissionsCoverage = z.infer<typeof AdmissionsCoverageSchema>;

export const QuestionsCoveragePaperSchema = z.object({
  school: z.string(),
  schoolName: z.string(),
  year: z.number().int(),
  paper: z.string(),
  count: z.number().int(),
  typeMix: z.string(),
  subjectNames: z.string(),
  answered: z.number().int(),
  solved: z.number().int(),
  withKp: z.number().int(),
  verified: z.number().int(),
  flagged: z.number().int(),
  bad: z.array(z.string()),
});
export const QuestionsCoverageSchema = z.object({
  papers: z.array(QuestionsCoveragePaperSchema),
  totalQuestions: z.number().int(),
  totalPapers: z.number().int(),
  schoolsWithQuestions: z.number().int(),
  totalSeedSchools: z.number().int(),
  missingSchools: z.array(z.object({ slug: z.string(), name: z.string() })),
  orphans: z.array(z.string()),
});
export type QuestionsCoverage = z.infer<typeof QuestionsCoverageSchema>;

export const AdmissionStatsCoverageUnitSchema = z.object({
  year: z.number().int(),
  school: z.string(),
  schoolName: z.string(),
  season: z.string(),
  present: z.boolean(),
  rows: z.number().int(),
  admissionsBuilt: z.boolean(),
  bad: z.string().optional(),
});
export const AdmissionStatsCoverageSchema = z.object({
  units: z.array(AdmissionStatsCoverageUnitSchema),
  totalUnits: z.number().int(),
  withRegistration: z.number().int(),
  fillable: z.number().int(),
});
export type AdmissionStatsCoverage = z.infer<typeof AdmissionStatsCoverageSchema>;

export const CoverageSchema = z.object({
  faculty: FacultyCoverageSchema,
  admissions: AdmissionsCoverageSchema,
  questions: QuestionsCoverageSchema,
  admissionStats: AdmissionStatsCoverageSchema,
});
export type Coverage = z.infer<typeof CoverageSchema>;

export const CoverageResponseSchema = dataResponse(CoverageSchema);
