import {
  PapersResponseSchema,
  QuestionFacetsResponseSchema,
  QuestionResponseSchema,
  QuestionsResponseSchema,
} from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Swagger response schemas, derived from the shared Zod contracts (single source of truth).
export class QuestionsResponseDto extends createZodDto(QuestionsResponseSchema) {}
export class PapersResponseDto extends createZodDto(PapersResponseSchema) {}
export class QuestionResponseDto extends createZodDto(QuestionResponseSchema) {}
export class QuestionFacetsResponseDto extends createZodDto(QuestionFacetsResponseSchema) {}
