import {
  DepartmentsResponseSchema,
  SchoolResponseSchema,
  SchoolsResponseSchema,
} from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Swagger response schemas, derived from the shared Zod contracts (single source of truth).
export class SchoolsResponseDto extends createZodDto(SchoolsResponseSchema) {}
export class SchoolResponseDto extends createZodDto(SchoolResponseSchema) {}
export class DepartmentsResponseDto extends createZodDto(DepartmentsResponseSchema) {}
