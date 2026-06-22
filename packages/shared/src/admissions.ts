import { z } from "zod";
import { dataResponse } from "./api.js";
import { AdmissionEvent, AdmissionType, ExamMethod } from "./enums.js";
import { SubjectSchema } from "./taxonomy.js";

// 招生情報 contracts. department → admission_group → admission_round(年) → papers。
// 報考單位 = 校×系所×組;穩定身分掛 group,逐年事實掛 round。校級日程見 /schedules。
// See docs/02-data-model.md.

// 該梯次的一張卷(合科卷綁多 subject;含佔分/節次)。
export const AdmissionRoundPaperSchema = z.object({
  name: z.string().describe("卷/科目顯示名(如 計算機數學)"),
  section: z.number().int().nullable().describe("節次(接校級時間表);無則 null"),
  weight: z.number().nullable().describe("佔總分 %;無則 null"),
  note: z.string().nullable().describe("備註,如合科組成比例;無則 null"),
  subjects: z.array(SubjectSchema).describe("該卷涵蓋的考科;合科卷為多科"),
});
export type AdmissionRoundPaper = z.infer<typeof AdmissionRoundPaperSchema>;

// 招生梯次:某組 × 某年 × 某管道。年度變動事實(名額/考科/採計)的中樞。
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
  sourceUrl: z.string().nullable().describe("簡章連結;無則 null"),
  papers: z.array(AdmissionRoundPaperSchema).describe("該梯次考卷(含合科卷組成與佔分)"),
});
export type AdmissionRound = z.infer<typeof AdmissionRoundSchema>;

// 招生組別:報考的真正單位(department + code)。
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

// 行事曆項目:攤平的單一招生事件(供時程瀏覽與 deadline 提醒)。事件為校級(招生季),
// 故只到校,不含系所/組;各組面試日期等組級事實見 /admissions 的 round。
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
