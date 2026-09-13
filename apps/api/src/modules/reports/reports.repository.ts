import { Injectable } from "@nestjs/common";
import type { ErrorReportType } from "@prograds/shared";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface ErrorReportRow {
  id: string;
  type: ErrorReportType;
  status: "open" | "resolved" | "dismissed";
  createdAt: Date;
}

// Thin data-access layer for public error reports on questions/explanations.
@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findQuestionIdByExternalId(externalId: string): Promise<string | null> {
    const question = await this.prisma.question.findUnique({
      where: { externalId },
      select: { id: true },
    });
    return question?.id ?? null;
  }

  async create(
    questionId: string,
    type: ErrorReportType,
    description: string,
  ): Promise<ErrorReportRow> {
    return this.prisma.errorReport.create({
      data: { questionId, type, description },
      select: { id: true, type: true, status: true, createdAt: true },
    });
  }
}
