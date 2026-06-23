import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { TaxonomyService } from "./taxonomy.service.js";
import type { TaxonomyRepository } from "./taxonomy.repository.js";

function makeService(repo: Partial<TaxonomyRepository>) {
  return new TaxonomyService(repo as TaxonomyRepository);
}

describe("TaxonomyService.getCategories", () => {
  it("projects categories to {id, slug, name}", async () => {
    const findCategories = vi
      .fn()
      .mockResolvedValue([{ id: "c1", slug: "science", name: "理工", extra: "drop" }]);
    const service = makeService({ findCategories });

    await expect(service.getCategories()).resolves.toEqual([
      { id: "c1", slug: "science", name: "理工" },
    ]);
  });
});

describe("TaxonomyService.getTracks", () => {
  it("forwards the optional categorySlug filter and maps rows", async () => {
    const findTracks = vi
      .fn()
      .mockResolvedValue([{ id: "t1", slug: "cs", name: "資訊", categoryId: "c1" }]);
    const service = makeService({ findTracks });

    const result = await service.getTracks("science");

    expect(findTracks).toHaveBeenCalledWith("science");
    expect(result).toEqual([{ id: "t1", slug: "cs", name: "資訊", categoryId: "c1" }]);
  });

  it("passes undefined when no category filter is given", async () => {
    const findTracks = vi.fn().mockResolvedValue([]);
    const service = makeService({ findTracks });

    await service.getTracks();

    expect(findTracks).toHaveBeenCalledWith(undefined);
  });
});

describe("TaxonomyService.getTrack", () => {
  it("throws NotFoundException for an unknown slug", async () => {
    const findTrackBySlug = vi.fn().mockResolvedValue(null);
    const service = makeService({ findTrackBySlug });

    await expect(service.getTrack("nope")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns the track with its flattened subjects", async () => {
    const findTrackBySlug = vi.fn().mockResolvedValue({
      id: "t1",
      slug: "cs",
      name: "資訊",
      categoryId: "c1",
      subjects: [{ subject: { id: "s1", slug: "calculus", name: "微積分" } }],
    });
    const service = makeService({ findTrackBySlug });

    const result = await service.getTrack("cs");

    expect(findTrackBySlug).toHaveBeenCalledWith("cs");
    expect(result).toEqual({
      id: "t1",
      slug: "cs",
      name: "資訊",
      categoryId: "c1",
      subjects: [{ id: "s1", slug: "calculus", name: "微積分" }],
    });
  });
});

describe("TaxonomyService.getSubjects / getSubject", () => {
  it("maps the subject list", async () => {
    const findSubjects = vi
      .fn()
      .mockResolvedValue([{ id: "s1", slug: "calculus", name: "微積分", extra: "drop" }]);
    const service = makeService({ findSubjects });

    await expect(service.getSubjects()).resolves.toEqual([
      { id: "s1", slug: "calculus", name: "微積分" },
    ]);
  });

  it("throws NotFoundException when a subject slug is unknown", async () => {
    const findSubjectBySlug = vi.fn().mockResolvedValue(null);
    const service = makeService({ findSubjectBySlug });

    await expect(service.getSubject("nope")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns a single mapped subject", async () => {
    const findSubjectBySlug = vi
      .fn()
      .mockResolvedValue({ id: "s1", slug: "calculus", name: "微積分" });
    const service = makeService({ findSubjectBySlug });

    await expect(service.getSubject("calculus")).resolves.toEqual({
      id: "s1",
      slug: "calculus",
      name: "微積分",
    });
  });
});
