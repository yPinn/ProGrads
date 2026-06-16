import { z } from "zod";
import { dataResponse } from "./api.js";

// School axis contracts. School → Department (belongs to a school + optional track).
// See docs/02-data-model.md.

export const SchoolSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});
export type School = z.infer<typeof SchoolSchema>;

export const DepartmentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  schoolId: z.string(),
  trackId: z.string().nullable(), // 未分類系所允許 null（docs/02）
});
export type Department = z.infer<typeof DepartmentSchema>;

// School detail bundles its departments.
export const SchoolWithDepartmentsSchema = SchoolSchema.extend({
  departments: z.array(DepartmentSchema),
});
export type SchoolWithDepartments = z.infer<typeof SchoolWithDepartmentsSchema>;

// A department enriched with its school (for cross-axis listing, e.g. "schools offering 資工所").
export const DepartmentWithSchoolSchema = DepartmentSchema.extend({
  school: SchoolSchema,
});
export type DepartmentWithSchool = z.infer<typeof DepartmentWithSchoolSchema>;

// GET /departments?track=<slug>&school=<slug>
export const DepartmentQuerySchema = z.object({
  track: z.string().min(1).optional(),
  school: z.string().min(1).optional(),
});
export type DepartmentQuery = z.infer<typeof DepartmentQuerySchema>;

// Response envelopes.
export const SchoolsResponseSchema = dataResponse(z.array(SchoolSchema));
export const SchoolResponseSchema = dataResponse(SchoolWithDepartmentsSchema);
export const DepartmentsResponseSchema = dataResponse(z.array(DepartmentWithSchoolSchema));
