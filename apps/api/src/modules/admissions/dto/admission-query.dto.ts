import { AdmissionQuerySchema, AdmissionScheduleQuerySchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Query validation, driven by the shared Zod contracts.
export class AdmissionQueryDto extends createZodDto(AdmissionQuerySchema) {}
export class AdmissionScheduleQueryDto extends createZodDto(AdmissionScheduleQuerySchema) {}
