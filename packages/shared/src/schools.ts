import { z } from "zod";
import { dataResponse } from "./api.js";

// School axis contracts. School → Department (belongs to a school + optional track).
// See docs/02-data-model.md.

export const SchoolSchema = z.object({
  id: z.string(),
  slug: z.string().describe("學校 slug(如 ntu)"),
  name: z.string().describe("例:國立臺灣大學"),
});
export type School = z.infer<typeof SchoolSchema>;

export const DepartmentSchema = z.object({
  id: z.string(),
  slug: z.string().describe("系所 slug(如 ntu-csie)"),
  name: z.string().describe("例:資訊工程學系"),
  schoolId: z.string(),
  trackId: z.string().nullable().describe("導覽軸所別 id;未分類系所為 null（docs/02）"),
});
export type Department = z.infer<typeof DepartmentSchema>;

// School detail bundles its departments.
export const SchoolWithDepartmentsSchema = SchoolSchema.extend({
  departments: z.array(DepartmentSchema).describe("該校系所清單"),
});
export type SchoolWithDepartments = z.infer<typeof SchoolWithDepartmentsSchema>;

// A department enriched with its school (for cross-axis listing, e.g. "schools offering 資工所").
export const DepartmentWithSchoolSchema = DepartmentSchema.extend({
  school: SchoolSchema,
});
export type DepartmentWithSchool = z.infer<typeof DepartmentWithSchoolSchema>;

// GET /departments?track=<slug>&school=<slug>
export const DepartmentQuerySchema = z.object({
  track: z.string().min(1).optional().describe("以所別 slug 過濾"),
  school: z.string().min(1).optional().describe("以學校 slug 過濾"),
});
export type DepartmentQuery = z.infer<typeof DepartmentQuerySchema>;

// Response envelopes.
export const SchoolsResponseSchema = dataResponse(z.array(SchoolSchema));
export const SchoolResponseSchema = dataResponse(SchoolWithDepartmentsSchema);
export const DepartmentsResponseSchema = dataResponse(z.array(DepartmentWithSchoolSchema));
