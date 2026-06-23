import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { ExamsService } from "./exams.service.js";
import type { ExamsRepository } from "./exams.repository.js";

function makeService(repo: Partial<ExamsRepository>) {
  return new ExamsService(repo as ExamsRepository);
}

const school = { id: "s1", slug: "nccu", name: "國立政治大學" };
const deptA = { id: "d1", slug: "cs", name: "資訊科學系", schoolId: "s1", trackId: "t1" };
const deptB = { id: "d2", slug: "math", name: "應用數學系", schoolId: "s1", trackId: "t2" };

describe("ExamsService.getExams", () => {
  it("maps exams and dedups departments flattened across exam subjects", async () => {
    const findExams = vi.fn().mockResolvedValue([
      {
        id: "e1",
        year: 2025,
        admissionType: "MASTER",
        school,
        examSubjects: [
          { departments: [{ department: deptA }, { department: deptB }] },
          { departments: [{ department: deptA }] }, // duplicate dept across papers
        ],
      },
    ]);

    const service = makeService({ findExams });
    const result = await service.getExams({ school: "nccu" });

    expect(findExams).toHaveBeenCalledWith({ school: "nccu" });
    expect(result[0]?.school).toEqual(school);
    expect(result[0]?.departments.map((d) => d.slug)).toEqual(["cs", "math"]);
  });
});

describe("ExamsService.getExam", () => {
  it("throws NotFoundException when the exam is absent", async () => {
    const findExamById = vi.fn().mockResolvedValue(null);
    const service = makeService({ findExamById });

    await expect(service.getExam("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("maps full detail with per-paper subjects and departments", async () => {
    const findExamById = vi.fn().mockResolvedValue({
      id: "e1",
      year: 2025,
      admissionType: "MASTER",
      school,
      examSubjects: [
        {
          id: "es1",
          slug: "calc-2025",
          name: "微積分",
          licenseStatus: "LICENSED",
          sourceUrl: "https://example.edu/es1",
          subjects: [{ subject: { id: "subj1", slug: "calculus", name: "微積分" } }],
          departments: [{ department: deptA }],
        },
      ],
    });

    const service = makeService({ findExamById });
    const detail = await service.getExam("e1");

    expect(detail.departments.map((d) => d.slug)).toEqual(["cs"]);
    expect(detail.examSubjects[0]).toEqual({
      id: "es1",
      slug: "calc-2025",
      name: "微積分",
      licenseStatus: "LICENSED",
      sourceUrl: "https://example.edu/es1",
      subjects: [{ id: "subj1", slug: "calculus", name: "微積分" }],
      departments: [{ id: "d1", slug: "cs", name: "資訊科學系", schoolId: "s1", trackId: "t1" }],
    });
  });
});
