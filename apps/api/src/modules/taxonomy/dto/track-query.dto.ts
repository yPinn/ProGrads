import { TrackQuerySchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Query validation for GET /tracks. Driven by the shared Zod contract.
export class TrackQueryDto extends createZodDto(TrackQuerySchema) {}
