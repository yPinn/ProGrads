import { AdmissionScheduleResponseSchema, AdmissionsResponseSchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Swagger response schemas, derived from the shared Zod contracts (single source of truth).
export class AdmissionsResponseDto extends createZodDto(AdmissionsResponseSchema) {}
export class AdmissionScheduleResponseDto extends createZodDto(AdmissionScheduleResponseSchema) {}
