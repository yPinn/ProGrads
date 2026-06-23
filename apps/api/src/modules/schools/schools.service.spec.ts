import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { SchoolsService } from "./schools.service.js";
import type { SchoolsRepository } from "./schools.repository.js";

function makeService(repo: Partial<SchoolsRepository>) {
  return new SchoolsService(repo as SchoolsRepository);
}

const school = { id: "s1", slug: "nccu", name: "國立政治大學" };
const dept = { id: "d1", slug: "cs", name: "資訊科學系", schoolId: "s1", trackId: "t1" };

describe("SchoolsService.getSchools", () => {
  it("maps each school to the bare contract shape", async () => {
    const findSchools = vi.fn().mockResolvedValue([{ ...school, createdAt: new Date() }]);
    const service = makeService({ findSchools });

    await expect(service.getSchools()).resolves.toEqual([school]);
  });
});

describe("SchoolsService.getSchool", () => {
  it("throws NotFoundException for an unknown slug", async () => {
    const findSchoolBySlug = vi.fn().mockResolvedValue(null);
    const service = makeService({ findSchoolBySlug });

    await expect(service.getSchool("nope")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns the school with its mapped departments", async () => {
    const findSchoolBySlug = vi.fn().mockResolvedValue({ ...school, departments: [dept] });
    const service = makeService({ findSchoolBySlug });

    const result = await service.getSchool("nccu");

    expect(findSchoolBySlug).toHaveBeenCalledWith("nccu");
    expect(result).toEqual({
      ...school,
      departments: [{ id: "d1", slug: "cs", name: "資訊科學系", schoolId: "s1", trackId: "t1" }],
    });
  });
});

describe("SchoolsService.getDepartments", () => {
  it("maps departments and nests each one's school", async () => {
    const findDepartments = vi.fn().mockResolvedValue([{ ...dept, school }]);
    const service = makeService({ findDepartments });

    const result = await service.getDepartments({ track: "t1" });

    expect(findDepartments).toHaveBeenCalledWith({ track: "t1" });
    expect(result).toEqual([
      {
        id: "d1",
        slug: "cs",
        name: "資訊科學系",
        schoolId: "s1",
        trackId: "t1",
        school,
      },
    ]);
  });
});
