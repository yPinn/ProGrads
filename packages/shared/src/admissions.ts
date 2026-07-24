import { z } from "zod";
import { dataResponse } from "./api.js";
import { AdmissionEvent, AdmissionType, ExamMethod } from "./enums.js";
import { SubjectSchema } from "./taxonomy.js";

// Admissions contracts: department → admission_group → admission_round (year) → papers.
// The application unit is school × department × group — stable identity lives on the group,
// per-year facts on the round. School-level schedule lives at /schedules. See docs/02-data-model.md.

// A paper of the round; a combined-subject paper binds multiple subjects, plus weight + section.
export const AdmissionRoundPaperSchema = z.object({
  name: z.string().describe("卷/科目顯示名(如 計算機數學)"),
  section: z.number().int().nullable().describe("節次(接校級時間表);無則 null"),
  weight: z.number().nullable().describe("佔總分 %;無則 null"),
  note: z.string().nullable().describe("備註,如合科組成比例;無則 null"),
  subjects: z.array(SubjectSchema).describe("該卷涵蓋的考科;合科卷為多科"),
});
export type AdmissionRoundPaper = z.infer<typeof AdmissionRoundPaperSchema>;

// An admission round: one group × year × channel. Hub for year-varying facts (quota/subjects/scoring).
export const AdmissionRoundSchema = z.object({
  year: z.number().int().describe("西元學年(如 2025 = 114 學年度)"),
  admissionType: AdmissionType.describe("招生管道"),
  admissionCode: z.string().nullable().describe("官方招生代碼(如 8611);無則 null"),
  applicantType: z.string().nullable().describe("身分別(如 一般生);無則 null"),
  quota: z.number().int().nullable().describe("招生名額;無則 null"),
  applicants: z.number().int().nullable().describe("報名人數;無則 null"),
  admitted: z.number().int().nullable().describe("錄取人數;無則 null"),
  resultBatch: z.number().int().nullable().describe("放榜梯次;無則 null"),
  methods: z.array(ExamMethod).describe("採計方式:筆試/審查/口試"),
  calculator: z.boolean().nullable().describe("可否使用計算機;未知為 null"),
  writtenWeight: z.number().int().nullable().describe("筆試佔分 %;無則 null"),
  reviewWeight: z.number().int().nullable().describe("資料審查佔分 %;無則 null"),
  interviewWeight: z.number().int().nullable().describe("面試佔分 %;無則 null"),
  interviewAt: z.string().datetime({ offset: true }).nullable().describe("該組面試時間;無則 null"),
  tiebreak: z.array(z.string()).describe("同分參酌順序(科目顯示名)"),
  sourceUrl: z.string().nullable().describe("系所官網(資料來源,非簡章直連);無則 null"),
  papers: z.array(AdmissionRoundPaperSchema).describe("該梯次考卷(含合科卷組成與佔分)"),
});
export type AdmissionRound = z.infer<typeof AdmissionRoundSchema>;

// An admission group: the real unit applicants apply to (department + code).
export const AdmissionGroupSchema = z.object({
  id: z.string(),
  code: z.string().describe("組別代號 a/b/c(＝甲/乙/丙 顯示);空字串=不分組"),
  name: z.string().describe("組別名稱,可空"),
  displayOrder: z.number().int().describe("顯示排序"),
  rounds: z.array(AdmissionRoundSchema).describe("各年度梯次(年新到舊)"),
});
export type AdmissionGroup = z.infer<typeof AdmissionGroupSchema>;

// GET /admissions?school=<slug>&dept=<slug>&year=<int?>
export const AdmissionQuerySchema = z.object({
  school: z.string().min(1).describe("學校 slug(必填)"),
  dept: z.string().min(1).describe("系所 slug(必填)"),
  year: z.coerce.number().int().optional().describe("以西元學年過濾(選填;預設全部年度)"),
});
export type AdmissionQuery = z.infer<typeof AdmissionQuerySchema>;

// A flattened calendar item: one admission event (for timeline browsing + deadline reminders).
// Events are school-level (per admission season), so they carry only the school, not the
// department/group; group-level facts like interview dates live on the /admissions round.
export const AdmissionScheduleItemSchema = z.object({
  school: z.object({ slug: z.string(), name: z.string() }).describe("學校"),
  year: z.number().int().describe("西元學年"),
  admissionType: AdmissionType,
  event: AdmissionEvent,
  at: z.string().datetime({ offset: true }).describe("事件時間(ISO 8601)"),
  endAt: z.string().datetime({ offset: true }).nullable().describe("跨日/區間結束;無則 null"),
  location: z.string().nullable().describe("地點;無則 null"),
  sequence: z.number().int().nullable().describe("放榜梯次;無則 null"),
});
export type AdmissionScheduleItem = z.infer<typeof AdmissionScheduleItemSchema>;

// GET /schedules?year=<int>&school=<slug?>&event=<type?>
export const AdmissionScheduleQuerySchema = z.object({
  year: z.coerce.number().int().describe("西元學年(必填;行事曆以招生季為單位)"),
  school: z.string().min(1).optional().describe("以學校 slug 過濾(選填)"),
  event: AdmissionEvent.optional().describe("以事件類型過濾(選填)"),
});
export type AdmissionScheduleQuery = z.infer<typeof AdmissionScheduleQuerySchema>;

// Response envelopes.
export const AdmissionsResponseSchema = dataResponse(z.array(AdmissionGroupSchema));
export const AdmissionScheduleResponseSchema = dataResponse(z.array(AdmissionScheduleItemSchema));
