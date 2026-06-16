import { ExamQuerySchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Query validation for GET /exams. Driven by the shared Zod contract.
export class ExamQueryDto extends createZodDto(ExamQuerySchema) {}
