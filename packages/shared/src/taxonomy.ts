import { z } from "zod";
import { dataResponse } from "./api.js";

// Taxonomy request/response contracts (single source of truth). See docs/02 + docs/05.
// Navigation axis: category → program_track; subject is the global shared library.

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string().describe("大類組 slug(如 engineering)"),
  name: z.string().describe("例:理工"),
});
export type Category = z.infer<typeof CategorySchema>;

export const TrackSchema = z.object({
  id: z.string(),
  slug: z.string().describe("所別 / 類組 slug(如 cs)"),
  name: z.string().describe("例:資訊工程"),
  categoryId: z.string(),
});
export type Track = z.infer<typeof TrackSchema>;

export const SubjectSchema = z.object({
  id: z.string(),
  slug: z.string().describe("考科 slug(如 algorithms)"),
  name: z.string().describe("例:演算法"),
});
export type Subject = z.infer<typeof SubjectSchema>;

// Track detail bundles its shared subjects (via track_subject).
export const TrackWithSubjectsSchema = TrackSchema.extend({
  subjects: z.array(SubjectSchema).describe("該所別共用的考科清單"),
});
export type TrackWithSubjects = z.infer<typeof TrackWithSubjectsSchema>;

// GET /tracks?category=<slug>
export const TrackQuerySchema = z.object({
  category: z.string().min(1).optional().describe("以大類組 slug 過濾"),
});
export type TrackQuery = z.infer<typeof TrackQuerySchema>;

// Response envelopes.
export const CategoriesResponseSchema = dataResponse(z.array(CategorySchema));
export const TracksResponseSchema = dataResponse(z.array(TrackSchema));
export const TrackResponseSchema = dataResponse(TrackWithSubjectsSchema);
export const SubjectResponseSchema = dataResponse(SubjectSchema);
