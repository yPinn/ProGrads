import { z } from "zod";
import { AdmissionType } from "./enums.js";

// 招生內容檔契約 (schedule.yml / departments.yml, 位於 admissions/<year>/<school>/[<season>/]).
// 招生內容 sync 的單一真相. snake_case = 檔案鍵. 區A schedule.yml = 季框架 + 節次時間表;
// 區B departments.yml = 系所/組明細. See docs/03-content-pipeline.md.
// 彈性: 物件皆 .strict() 抓拼錯, 但留 note + metadata 逃生口 (metadata 對映 DB metadata jsonb).
// 日期僅知到日者以午夜表示 (T00:00:00+08:00).

const note = z.string().optional();
const metadata = z.record(z.unknown()).optional();
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "want YYYY-MM-DD");
const DateTimeStr = z.string().datetime({ offset: true }); // RFC3339 + offset, e.g. 2026-02-01T09:00:00+08:00
const TimeStr = z.string().regex(/^\d{2}:\d{2}$/, "want HH:MM");
const Url = z.string().url().nullable().optional();

// 簡章新鮮度.
export const AdmissionStatus = z.enum(["not_published", "published", "superseded"]);
export type AdmissionStatus = z.infer<typeof AdmissionStatus>;

// ---------- 區A: schedule.yml ----------

// 事件詞彙, 與 DB AdmissionEvent enum 一一對應 (sync 直接映射, 同序).
export const ScheduleEvent = z.enum([
  "account_open", // 取得繳費帳號 (報名前置)
  "registration_start",
  "registration_end",
  "document_deadline", // 審查資料上傳截止
  "admit_card", // 准考證列印
  "written_exam", // 筆試 (end = 跨日結束)
  "shortlist", // 公告參加面試名單
  "interview", // 口試/面試/複試
  "result", // 放榜 (sequence = 梯次)
  "enrollment", // 報到
]);
export type ScheduleEvent = z.infer<typeof ScheduleEvent>;

export const ScheduleEventItem = z
  .object({
    event: ScheduleEvent,
    at: DateTimeStr,
    end: DateTimeStr.optional(),
    location: z.string().nullable().optional(),
    sequence: z.number().int().optional(), // 放榜梯次
    note,
    metadata,
  })
  .strict();

export const ExamPeriod = z
  .object({ period: z.number().int(), start: TimeStr, end: TimeStr, note })
  .strict();

export const ExamSlotDay = z.object({ date: DateStr, periods: z.array(ExamPeriod), note }).strict();

export const AdmissionFees = z
  .object({
    application: z.number().int().nullable(), // 報名費 (TWD)
    interview: z.number().int().nullable().optional(), // 口試費
    waiver: z.array(z.string()).optional(), // low_income / lower_middle_income
    note,
    metadata,
  })
  .strict();

export const ScheduleYml = z
  .object({
    school: z.string().min(1),
    year: z.number().int(), // 西元學年
    admission_type: AdmissionType.default("exam"),
    status: AdmissionStatus.default("published"),
    announced_at: DateStr.nullable().optional(), // 公告日 = 新鮮度錨點
    source_url: Url,
    fees: AdmissionFees.optional(),
    schedule: z.array(ScheduleEventItem).default([]),
    slots: z.array(ExamSlotDay).default([]), // 節次時間表 (校級)
    note,
    metadata,
  })
  .strict();
export type ScheduleYml = z.infer<typeof ScheduleYml>;

// ---------- 區B: departments.yml ----------

export const ExamMethod = z.enum(["written", "review", "interview"]); // 筆試/審查/口試
export type ExamMethod = z.infer<typeof ExamMethod>;

export const AdmissionPaper = z
  .object({
    name: z.string().min(1), // 卷/科目顯示名
    subjects: z.array(z.string()).optional(), // shared subject slugs
    section: z.number().int().optional(), // 節次 (接 schedule slots)
    weight: z.number().optional(), // 佔總分 %
    note,
    metadata,
  })
  .strict();

export const AdmissionGroupYml = z
  .object({
    code: z.string().default(""), // ASCII a/b/c; "" 不分組
    name: z.string().optional(),
    admission_code: z.string().optional(), // 官方招生代碼
    applicant_type: z.string().optional(), // 身分別
    quota: z.number().int().nullable().optional(),
    result_batch: z.number().int().optional(), // 放榜梯次
    methods: z.array(ExamMethod).optional(),
    calculator: z.boolean().optional(),
    exam: z
      .object({ written: z.number().optional(), interview: z.number().optional() })
      .strict()
      .optional(), // 筆試/面試 佔分 %
    interview_at: z.union([DateStr, DateTimeStr]).optional(),
    papers: z.array(AdmissionPaper).optional(),
    tiebreak: z.array(z.string()).optional(), // 同分參酌順序
    note,
    metadata,
  })
  .strict();

export const DepartmentYml = z
  .object({
    dept: z.string().min(1), // dept slug
    source_url: Url,
    groups: z.array(AdmissionGroupYml),
    papers: z.array(AdmissionPaper).optional(), // 系所層考科 union (多組共用、逐組組合待校對時)
    note,
    metadata,
  })
  .strict();

export const DepartmentsYml = z
  .object({
    school: z.string().min(1),
    year: z.number().int(),
    depts: z.array(DepartmentYml),
    note,
    metadata,
  })
  .strict();
export type DepartmentsYml = z.infer<typeof DepartmentsYml>;
