import { ErrorResponseSchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Unified error envelope DTO, derived from the shared Zod contract. See docs/05-api-conventions.md.
export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
