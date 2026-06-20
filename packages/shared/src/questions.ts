import { z } from "zod";
import { dataResponse, paginatedResponse } from "./api.js";
import {
  AdmissionType,
  AnswerType,
  Confidence,
  LicenseStatus,
  QuestionType,
  ReviewStatus,
} from "./enums.js";
import { DepartmentSchema, SchoolSchema } from "./schools.js";
import { SubjectSchema } from "./taxonomy.js";

// Question (global shared bank) contracts. The killer query: practice one subject across
// all schools (?subject=algorithms). See docs/02-data-model.md.

// Compact exam context carried on each question (school × year × admissionType).
export const QuestionExamRefSchema = z.object({
  id: z.string(),
  year: z.number().int().describe("考試年度(西元,如 2025)"),
  admissionType: AdmissionType,
  school: SchoolSchema,
});
export type QuestionExamRef = z.infer<typeof QuestionExamRefSchema>;

export const QuestionSummarySchema = z.object({
  externalId: z.string().describe("題目對外唯一代碼"),
  number: z.string().describe("題號(如 1、2-(1))"),
  type: QuestionType,
  subjects: z.array(SubjectSchema).describe("細粒度練習標籤(供跨校單科練習)"),
  examSubject: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      departments: z.array(DepartmentSchema).describe("考此卷的系所;共用卷為多系所"),
    })
    .describe("題目所屬卷別"),
  exam: QuestionExamRefSchema.describe("題目所屬考卷的精簡資訊"),
});
export type QuestionSummary = z.infer<typeof QuestionSummarySchema>;

// Paper-grouped view (考卷為單位): one entry per ExamSubject with its question list,
// so the 題庫 can list papers and offer an in-paper 題號 selector.
export const PaperQuestionRefSchema = z.object({
  externalId: z.string().describe("題目對外唯一代碼"),
  number: z.string().describe("題號"),
  type: QuestionType,
});
export type PaperQuestionRef = z.infer<typeof PaperQuestionRefSchema>;

export const PaperSummarySchema = z.object({
  examSubject: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    departments: z.array(DepartmentSchema).describe("考此卷的系所;共用卷為多系所"),
  }),
  exam: QuestionExamRefSchema.describe("考卷的精簡資訊(校×年×入學管道)"),
  subjects: z.array(SubjectSchema).describe("該卷涵蓋考科(合科卷為多科)"),
  questions: z.array(PaperQuestionRefSchema).describe("該卷題目(依題序);供題號選擇"),
});
export type PaperSummary = z.infer<typeof PaperSummarySchema>;

// Cached standard answer (Tier2), shaped by answer_type.
export const ExplanationSchema = z.object({
  standardAnswer: z.string().describe("標準答案(依 answerType 呈現)"),
  answerType: AnswerType,
  confidence: Confidence.nullable().describe("AI 解析信心度;人工驗證可能為 null"),
  reviewStatus: ReviewStatus,
  modelUsed: z.string().nullable().describe("產生此解析的模型;非 AI 生成為 null"),
});
export type Explanation = z.infer<typeof ExplanationSchema>;

export const ChoiceSchema = z.object({
  label: z.string().describe("選項標籤(如 A、B、C)"),
  contentMd: z.string().describe("選項內容(Markdown)"),
  isCorrect: z.boolean(),
});
export type Choice = z.infer<typeof ChoiceSchema>;

export const QuestionDetailSchema = QuestionSummarySchema.extend({
  contentMd: z.string().describe("題目內容(Markdown)"),
  sourceUrl: z.string().nullable().describe("原始來源 URL,可能為 null"),
  licenseStatus: LicenseStatus,
  choices: z.array(ChoiceSchema).describe("選項清單;非選擇題為空陣列"),
  // examSubject detail includes its 合科卷 composition + departments that sat it.
  examSubject: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      subjects: z.array(SubjectSchema).describe("該卷涵蓋的考科;合科卷為多科"),
      departments: z.array(DepartmentSchema).describe("考此卷的系所;共用卷為多系所"),
    })
    .describe("題目所屬卷別(含合科卷組成與採用系所)"),
  explanation: ExplanationSchema.nullable().describe("快取的標準解析;尚未產生為 null"),
  // 題組(閱讀/克漏字): 同篇 passage 的題目共用一個 group slug; 篇章存於題組首題。
  group: z.string().nullable().describe("題組 slug;非題組為 null"),
  groupPassageMd: z
    .string()
    .nullable()
    .describe("題組共用篇章(Markdown,取自題組首題);非題組為 null"),
});
export type QuestionDetail = z.infer<typeof QuestionDetailSchema>;

// GET /questions?subject=&track=&school=&year=&type=&page=&pageSize=
export const QuestionQuerySchema = z.object({
  subject: z.string().min(1).optional().describe("以考科 slug 過濾(跨校單科練習)"),
  track: z.string().min(1).optional().describe("以所別 slug 過濾"),
  school: z.string().min(1).optional().describe("以學校 slug 過濾"),
  year: z.coerce.number().int().optional().describe("以考試年度過濾"),
  type: QuestionType.optional(),
  page: z.coerce.number().int().positive().default(1).describe("頁碼(自 1 起,預設 1)"),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe("每頁筆數(上限 100,預設 20)"),
});
export type QuestionQuery = z.infer<typeof QuestionQuerySchema>;

// Response envelopes.
export const QuestionsResponseSchema = paginatedResponse(QuestionSummarySchema);
export const PapersResponseSchema = paginatedResponse(PaperSummarySchema);
export const QuestionResponseSchema = dataResponse(QuestionDetailSchema);
