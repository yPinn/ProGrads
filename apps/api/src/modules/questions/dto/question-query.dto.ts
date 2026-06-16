import { QuestionQuerySchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Query validation for GET /questions (filters + pagination). Driven by the shared contract.
export class QuestionQueryDto extends createZodDto(QuestionQuerySchema) {}
