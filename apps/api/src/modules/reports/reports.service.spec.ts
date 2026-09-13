import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { ReportsService } from "./reports.service.js";
import type { ReportsRepository } from "./reports.repository.js";

function makeService(repo: Partial<ReportsRepository>) {
  return new ReportsService(repo as ReportsRepository);
}

describe("ReportsService.create", () => {
  it("resolves the question, creates the report, and maps the row", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const findQuestionIdByExternalId = vi.fn().mockResolvedValue("q1");
    const create = vi
      .fn()
      .mockResolvedValue({ id: "r1", type: "wrong_answer", status: "open", createdAt });
    const service = makeService({ findQuestionIdByExternalId, create });

    await expect(
      service.create({
        questionExternalId: "ntu-2026-dsa-q1",
        type: "wrong_answer",
        description: "answer B is actually correct",
      }),
    ).resolves.toEqual({
      id: "r1",
      type: "wrong_answer",
      status: "open",
      createdAt: createdAt.toISOString(),
    });
    expect(findQuestionIdByExternalId).toHaveBeenCalledWith("ntu-2026-dsa-q1");
    expect(create).toHaveBeenCalledWith("q1", "wrong_answer", "answer B is actually correct");
  });

  it("throws NotFoundException when the question does not exist", async () => {
    const findQuestionIdByExternalId = vi.fn().mockResolvedValue(null);
    const create = vi.fn();
    const service = makeService({ findQuestionIdByExternalId, create });

    await expect(
      service.create({
        questionExternalId: "missing",
        type: "other",
        description: "n/a",
      }),
    ).rejects.toThrow(NotFoundException);
    expect(create).not.toHaveBeenCalled();
  });
});
