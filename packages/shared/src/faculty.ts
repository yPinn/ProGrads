import { z } from "zod";
import { dataResponse } from "./api.js";
import { ThesisRole } from "./faculty-content.js";
import { DepartmentWithSchoolSchema } from "./schools.js";

// Faculty axis API contracts (read models). Faculty belong to a department; the roster is
// exposed via GET /faculty (cross-axis filter by school / dept / track). See docs/02-data-model.md.
// (Content-ingest contracts for the YAML files live in faculty-content.ts.)

export const FacultyThesisSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  role: ThesisRole.describe("advised=指導學生論文(NDLTD); authored=教授著作"),
  url: z.string().nullable(),
});
export type FacultyThesis = z.infer<typeof FacultyThesisSchema>;

export const FacultyMemberSchema = z.object({
  id: z.string(),
  name: z.string().describe("中文姓名(系內身分鍵)"),
  nameEn: z.string().nullable().describe("英文名(官網有才填)"),
  slug: z.string().nullable().describe("選填 URL handle"),
  title: z.string().nullable().describe("職級, 如 教授 / 副教授 / 助理教授"),
  lab: z.string().nullable().describe("實驗室名"),
  homepage: z.string().nullable(),
  sourceUrl: z.string().nullable().describe("資料來源(系所師資頁)"),
  note: z.string().nullable().describe("備註, 如行政職(系主任/院長)或借調"),
  researchAreas: z.array(z.string()).describe("研究方向標籤"),
  departmentId: z.string(),
  theses: z.array(FacultyThesisSchema).describe("論文佐證(指導/著作)"),
});
export type FacultyMember = z.infer<typeof FacultyMemberSchema>;

// A member enriched with its department + school (for cross-axis listing).
export const FacultyMemberWithDepartmentSchema = FacultyMemberSchema.extend({
  department: DepartmentWithSchoolSchema,
});
export type FacultyMemberWithDepartment = z.infer<typeof FacultyMemberWithDepartmentSchema>;

// GET /faculty?school=<slug>&dept=<slug>&track=<slug>
export const FacultyQuerySchema = z.object({
  school: z.string().min(1).optional().describe("以學校 slug 過濾"),
  dept: z.string().min(1).optional().describe("以系所 slug 過濾"),
  track: z.string().min(1).optional().describe("以所別 slug 過濾"),
});
export type FacultyQuery = z.infer<typeof FacultyQuerySchema>;

export const FacultyResponseSchema = dataResponse(z.array(FacultyMemberWithDepartmentSchema));
