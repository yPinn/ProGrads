import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateErrorReport, ErrorReport } from "@prograds/shared";
import { ReportsRepository } from "./reports.repository.js";

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  async create(input: CreateErrorReport): Promise<ErrorReport> {
    const questionId = await this.repo.findQuestionIdByExternalId(input.questionExternalId);
    if (!questionId) {
      throw new NotFoundException(`question not found: ${input.questionExternalId}`);
    }

    const row = await this.repo.create(questionId, input.type, input.description);
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
