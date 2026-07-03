import { z } from "zod";
import { dataResponse } from "./api.js";
import { DegreeLevel, ThesisRole } from "./faculty-content.js";
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

export const FacultyDegreeSchema = z.object({
  id: z.string(),
  level: DegreeLevel.describe("bachelor/master/phd/other"),
  institution: z.string().describe("授予學校"),
  field: z.string().nullable().describe("系所/領域"),
  year: z.number().int().nullable(),
});
export type FacultyDegree = z.infer<typeof FacultyDegreeSchema>;

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
  degrees: z.array(FacultyDegreeSchema).describe("學歷(依 level 由高至低)"),
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

// 職級排序權重 (數字小 = 資深)。骨幹為《大學法》四級: 教授 > 副教授 > 助理教授 > 講師;
// 講座/特聘/優聘 為疊於「教授」之上的榮譽層 (聲望 講座 > 特聘 > 優聘 > 一般教授)。
// title 為自由文字, 客座/名譽/榮譽/兼任/專案等修飾詞歸入其基礎職級。
// 比對順序敏感: 榮譽層與 副/助理教授 皆含「教授」二字, 故須先於「教授」判定。
const FACULTY_TITLE_TIERS: ReadonlyArray<readonly [RegExp, number]> = [
  [/講座教授/, 0], // 含 終身/國家/特聘講座
  [/特聘教授/, 1], // 含 終身特聘
  [/優聘教授/, 2],
  [/助理教授/, 5],
  [/副教授/, 4],
  [/教授/, 3], // 含 客座/名譽/榮譽教授
  [/講師/, 6],
];
const FACULTY_TITLE_TIER_UNKNOWN = 9; // 研究員 / 其他 / 未填

// Map a free-text faculty title to a seniority tier for roster ordering.
export function facultyTitleRank(title: string | null | undefined): number {
  if (!title) return FACULTY_TITLE_TIER_UNKNOWN;
  for (const [pattern, tier] of FACULTY_TITLE_TIERS) {
    if (pattern.test(title)) return tier;
  }
  return FACULTY_TITLE_TIER_UNKNOWN;
}
