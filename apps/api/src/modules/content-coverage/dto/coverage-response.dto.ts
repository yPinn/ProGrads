import { CoverageResponseSchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Swagger response schema, derived from the shared Zod contract (single source of truth).
export class CoverageResponseDto extends createZodDto(CoverageResponseSchema) {}
