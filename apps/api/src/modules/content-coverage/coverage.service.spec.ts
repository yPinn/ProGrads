import { NotFoundException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { Coverage } from "@prograds/shared";
import { describe, it, expect, vi } from "vitest";
import type { Env } from "../../config/env.js";
import { CoverageService } from "./coverage.service.js";
import type { CoverageRepository } from "./coverage.repository.js";

function makeConfig(contentDir: string | undefined): ConfigService<Env, true> {
  return { get: vi.fn().mockReturnValue(contentDir) } as unknown as ConfigService<Env, true>;
}

describe("CoverageService.getCoverage", () => {
  it("throws NotFoundException when CONTENT_DIR is not configured", async () => {
    const repo = { computeAll: vi.fn() };
    const service = new CoverageService(
      repo as unknown as CoverageRepository,
      makeConfig(undefined),
    );

    await expect(service.getCoverage()).rejects.toThrow(NotFoundException);
    expect(repo.computeAll).not.toHaveBeenCalled();
  });

  it("returns the repository's computed coverage for the configured CONTENT_DIR", async () => {
    const coverage = {
      faculty: { depts: [], totalDepts: 0, builtDepts: 0, totalMembers: 0, orphans: [] },
    } as unknown as Coverage;
    const computeAll = vi.fn().mockReturnValue(coverage);
    const service = new CoverageService(
      { computeAll } as unknown as CoverageRepository,
      makeConfig("/content"),
    );

    await expect(service.getCoverage()).resolves.toBe(coverage);
    expect(computeAll).toHaveBeenCalledWith("/content");
  });
});
