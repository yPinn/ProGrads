import { z } from "zod";
import { dataResponse } from "./api.js";
import { AdmissionEvent, AdmissionType } from "./enums.js";

// 招生情報 contracts. department → admission_group → admission_round(年) → events + subjects。
// 報考單位 = 校×系所×組;穩定身分掛 group,逐年事實掛 round。See docs/02-data-model.md.

// 該梯次規定的考科(連 shared subject 庫)。
export const AdmissionRoundSubjectSchema = z.object({
  slug: z.string().describe("考科 slug(如 ds)"),
  name: z.string().describe("考科顯示名"),
  note: z.string().nullable().describe("備註,如合科/節次;無則 null"),
});
export type AdmissionRoundSubject = z.infer<typeof AdmissionRoundSubjectSchema>;

// 招生事件(報名起訖 / 筆試 / 面試 / 放榜)。
export const AdmissionEventItemSchema = z.object({
  event: AdmissionEvent.describe("事件類型"),
  at: z.string().datetime({ offset: true }).describe("事件時間(ISO 8601,+08:00)"),
  location: z.string().nullable().describe("地點;無則 null"),
});
export type AdmissionEventItem = z.infer<typeof AdmissionEventItemSchema>;

// 招生梯次:某組 × 某年 × 某管道。年度變動事實(名額/考科/日程)的中樞。
export const AdmissionRoundSchema = z.object({
  year: z.number().int().describe("西元學年(如 2025 = 114 學年度)"),
  admissionType: AdmissionType.describe("招生管道"),
  quota: z.number().int().nullable().describe("招生名額;無則 null"),
  applicants: z.number().int().nullable().describe("報名人數;無則 null"),
  admitted: z.number().int().nullable().describe("錄取人數;無則 null"),
  sourceUrl: z.string().nullable().describe("簡章連結;無則 null"),
  events: z.array(AdmissionEventItemSchema).describe("該梯次日程(依時間排序)"),
  subjects: z.array(AdmissionRoundSubjectSchema).describe("該梯次考科"),
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

// 行事曆項目:攤平的單一招生事件(供時程瀏覽與 deadline 提醒)。
export const AdmissionScheduleItemSchema = z.object({
  school: z.object({ slug: z.string(), name: z.string() }).describe("學校"),
  department: z.object({ slug: z.string(), name: z.string() }).describe("系所"),
  groupCode: z.string().describe("組別代號;不分組為空字串"),
  year: z.number().int().describe("西元學年"),
  admissionType: AdmissionType,
  event: AdmissionEvent,
  at: z.string().datetime({ offset: true }).describe("事件時間(ISO 8601)"),
  location: z.string().nullable().describe("地點;無則 null"),
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
