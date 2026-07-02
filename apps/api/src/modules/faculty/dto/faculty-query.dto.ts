import { FacultyQuerySchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Query validation for GET /faculty (cross-axis filter). Driven by the shared contract.
export class FacultyQueryDto extends createZodDto(FacultyQuerySchema) {}
