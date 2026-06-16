import {
  CategoriesResponseSchema,
  SubjectResponseSchema,
  TrackResponseSchema,
  TracksResponseSchema,
} from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Swagger response schemas, derived from the shared Zod contracts (single source of truth).
export class CategoriesResponseDto extends createZodDto(CategoriesResponseSchema) {}
export class TracksResponseDto extends createZodDto(TracksResponseSchema) {}
export class TrackResponseDto extends createZodDto(TrackResponseSchema) {}
export class SubjectResponseDto extends createZodDto(SubjectResponseSchema) {}
