import { DepartmentQuerySchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

// Query validation for GET /departments. Driven by the shared Zod contract.
export class DepartmentQueryDto extends createZodDto(DepartmentQuerySchema) {}
