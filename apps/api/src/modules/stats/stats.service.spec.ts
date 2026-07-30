import { describe, it, expect, vi } from "vitest";
import { StatsService } from "./stats.service.js";
import type { StatsRepository } from "./stats.repository.js";

function makeService(repo: Partial<StatsRepository>) {
  return new StatsService(repo as StatsRepository);
}

describe("StatsService.getStats", () => {
  it("returns the repository's counts as-is", async () => {
    const counts = {
      schools: 12,
      departments: 34,
      subjects: 20,
      papers: 300,
      faculty: 150,
      yearRange: { min: 2018, max: 2026 },
    };
    const findCounts = vi.fn().mockResolvedValue(counts);
    const service = makeService({ findCounts });

    await expect(service.getStats()).resolves.toEqual(counts);
    expect(findCounts).toHaveBeenCalledOnce();
  });
});
