import { z } from "zod";

// 師資內容檔契約 (faculty/<school>/<dept>.yml). 師資陣容 sync 的單一真相.
// snake_case = 檔案鍵. (校,系所) 級、非年度循環故無年份軸. See docs/03-content-pipeline.md.
// 彈性: 物件皆 .strict() 抓拼錯, 但留 note + metadata 逃生口 (metadata 對映 DB metadata jsonb).

const note = z.string().optional();
const metadata = z.record(z.unknown()).optional();
const Url = z.string().url().nullable().optional();
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "want YYYY-MM-DD");

// 論文佐證角色, 與 DB ThesisRole enum 一一對應 (sync 直接映射).
export const ThesisRole = z.enum(["advised", "authored"]);
export type ThesisRole = z.infer<typeof ThesisRole>;

export const FacultyThesisYml = z
  .object({
    title: z.string().min(1),
    year: z.number().int().optional(),
    role: ThesisRole.default("advised"), // advised = 指導學生論文 (NDLTD); authored = 教授自己發表
    url: Url,
    metadata,
  })
  .strict();

export const FacultyMemberYml = z
  .object({
    name: z.string().min(1), // 中文姓名 = 系內身分鍵 (department 內唯一)
    slug: z.string().min(1).optional(), // 選填 URL handle (官方英文名衍生時才填); 非身分鍵
    name_en: z.string().optional(),
    title: z.string().optional(), // 職級, e.g. 教授/副教授/助理教授
    lab: z.string().optional(),
    homepage: Url,
    source_url: Url, // 人員層資料來源 (可覆寫檔級)
    research_areas: z.array(z.string()).default([]), // 研究方向標籤 (自由文字)
    theses: z.array(FacultyThesisYml).default([]),
    note,
    metadata,
  })
  .strict();

export const FacultyYml = z
  .object({
    school: z.string().min(1),
    dept: z.string().min(1),
    as_of: DateStr.optional(), // 檔級新鮮度錨點
    source_url: Url, // 系所師資頁
    members: z.array(FacultyMemberYml),
    note,
    metadata,
  })
  .strict();
export type FacultyYml = z.infer<typeof FacultyYml>;
