import { z } from "zod";
import { AdmissionType } from "./enums.js";

// 報名人數內容檔契約 (admission-stats/<year>/<school>/[<season>/]registration.yml).
// 回填 AdmissionRound.applicants 的單一真相. season 段對齊 admission_type, 與 admissions/ 同一套慣例
// (exam 預設省略). See ProGrads-content/README.md §admission-stats/.
// 彈性: 物件皆 .strict() 抓拼錯, 但留 note + metadata 逃生口 (metadata 對映 DB metadata jsonb).

const note = z.string().optional();
const metadata = z.record(z.unknown()).optional();
const Url = z.string().url().nullable().optional();
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "want YYYY-MM-DD");

// 統計表原始一列. official_code/name 忠實記錄原文供稽核; dept/code 是解析後、與
// departments.yml 同一套身份 (seed slug + 組 code) 供 sync 對映既有 AdmissionRound.
// 聯招/無對應系所 (一碼多系, 無法拆到單一系所) 留 dept 空 + joint: true, 不臆造.
export const RegistrationRow = z
  .object({
    official_code: z.string().min(1), // 原始所組代碼 (如 "0524" / "810")
    name: z.string().min(1), // 原始所組名稱
    dept: z.string().optional(), // 解析後 dept seed slug; 聯招/無對應留空
    code: z.string().optional(), // 組別 code (a/b/c 或 ""); 對映 AdmissionGroup.code
    applicant_type: z.string().optional(), // 原文身分別, e.g. 一般生/在職生
    applicants: z.number().int().nonnegative(),
    joint: z.boolean().optional(), // true = 聯招/一碼多系, sync 不對映
    note,
    metadata,
  })
  .strict();
export type RegistrationRow = z.infer<typeof RegistrationRow>;

export const RegistrationYml = z
  .object({
    school: z.string().min(1),
    year: z.number().int(), // 西元學年
    admission_type: AdmissionType.default("exam"),
    announced_at: DateStr.optional(), // 統計表公告日 (民國年 +1911 轉換後)
    source_url: Url,
    rows: z.array(RegistrationRow),
    note,
    metadata,
  })
  .strict();
export type RegistrationYml = z.infer<typeof RegistrationYml>;
