import { QuestionQuerySchema, TrendQuerySchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Query validation for GET /questions (filters + pagination). Driven by the shared contract.
export class QuestionQueryDto extends createZodDto(QuestionQuerySchema) {}

// Query validation for GET /questions/trends (subject required, school/top optional).
export class TrendQueryDto extends createZodDto(TrendQuerySchema) {}
