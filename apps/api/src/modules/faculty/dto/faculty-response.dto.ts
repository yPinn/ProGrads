import { FacultyResponseSchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Swagger response schema, derived from the shared Zod contract (single source of truth).
export class FacultyResponseDto extends createZodDto(FacultyResponseSchema) {}
