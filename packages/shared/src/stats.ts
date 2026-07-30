import { z } from "zod";
import { dataResponse } from "./api.js";

// Platform-wide counts for the homepage stats strip. Cheap aggregate reads (counts, min/max),
// near-static — see docs/05-api-conventions.md for the envelope convention.
export const StatsSchema = z.object({
  schools: z.number().int().describe("學校總數"),
  departments: z.number().int().describe("系所總數"),
  subjects: z.number().int().describe("有出現在考卷中的相異考科數"),
  papers: z.number().int().describe("考卷(ExamSubject)總數"),
  faculty: z.number().int().describe("師資人數"),
  yearRange: z
    .object({ min: z.number().int(), max: z.number().int() })
    .nullable()
    .describe("涵蓋的考試年度範圍;無資料時為 null"),
});
export type Stats = z.infer<typeof StatsSchema>;

export const StatsResponseSchema = dataResponse(StatsSchema);
