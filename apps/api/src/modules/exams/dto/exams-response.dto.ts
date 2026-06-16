import { ExamResponseSchema, ExamsResponseSchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Swagger response schemas, derived from the shared Zod contracts (single source of truth).
export class ExamsResponseDto extends createZodDto(ExamsResponseSchema) {}
export class ExamResponseDto extends createZodDto(ExamResponseSchema) {}
