import { CreateErrorReportSchema } from "@prograds/shared";
import { createZodDto } from "nestjs-zod";

export class CreateErrorReportDto extends createZodDto(CreateErrorReportSchema) {}
