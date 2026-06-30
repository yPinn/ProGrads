import { describe, expect, it, vi } from "vitest";
import { QuestionsRepository } from "./questions.repository.js";
import type { PrismaService } from "../../prisma/prisma.service.js";

describe("QuestionsRepository.findPapers", () => {
  it("applies the requested type filter to returned question refs", async () => {
    const examSubjectFindMany = vi.fn().mockResolvedValue([]);
    const examSubjectCount = vi.fn().mockResolvedValue(0);
    const prisma = {
      examSubject: {
        findMany: examSubjectFindMany,
        count: examSubjectCount,
      },
      $transaction: (queries: Array<Promise<unknown>>) => Promise.all(queries),
    } as unknown as PrismaService;

    const repo = new QuestionsRepository(prisma);

    await repo.findPapers({ type: "mc" }, 1, 20);

    expect(examSubjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          questions: expect.objectContaining({
            where: { type: "mc" },
          }),
        }),
      }),
    );
  });
});
