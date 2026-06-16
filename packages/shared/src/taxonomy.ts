import { z } from "zod";
import { dataResponse } from "./api.js";

// Taxonomy request/response contracts (single source of truth). See docs/02 + docs/05.
// Navigation axis: category → program_track; subject is the global shared library.

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const TrackSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  categoryId: z.string(),
});
export type Track = z.infer<typeof TrackSchema>;

export const SubjectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});
export type Subject = z.infer<typeof SubjectSchema>;

// Track detail bundles its shared subjects (via track_subject).
export const TrackWithSubjectsSchema = TrackSchema.extend({
  subjects: z.array(SubjectSchema),
});
export type TrackWithSubjects = z.infer<typeof TrackWithSubjectsSchema>;

// GET /tracks?category=<slug>
export const TrackQuerySchema = z.object({
  category: z.string().min(1).optional(),
});
export type TrackQuery = z.infer<typeof TrackQuerySchema>;

// Response envelopes.
export const CategoriesResponseSchema = dataResponse(z.array(CategorySchema));
export const TracksResponseSchema = dataResponse(z.array(TrackSchema));
export const TrackResponseSchema = dataResponse(TrackWithSubjectsSchema);
export const SubjectResponseSchema = dataResponse(SubjectSchema);
