import { describe, it, expect, vi } from "vitest";
import { FacultyService } from "./faculty.service.js";
import type { FacultyRepository } from "./faculty.repository.js";

function makeService(repo: Partial<FacultyRepository>) {
  return new FacultyService(repo as FacultyRepository);
}

const school = { id: "s1", slug: "ntu", name: "國立臺灣大學" };
const department = { id: "d1", slug: "csie", name: "資訊工程學系", schoolId: "s1", trackId: "t1" };

const row = {
  id: "f1",
  name: "林智仁",
  nameEn: "CJ Lin",
  slug: "cj-lin",
  title: "特聘教授",
  lab: null,
  homepage: null,
  sourceUrl: "https://www.csie.ntu.edu.tw/zh_tw/member/Faculty",
  note: null,
  researchAreas: ["Machine Learning", "Optimization"],
  departmentId: "d1",
  displayOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  theses: [{ id: "t1", title: "LIBSVM", year: 2011, role: "authored" as const, url: "https://x" }],
  department: { ...department, school },
};

describe("FacultyService.getFaculty", () => {
  it("passes filters through to the repository", async () => {
    const findFaculty = vi.fn().mockResolvedValue([]);
    const service = makeService({ findFaculty });

    await service.getFaculty({ school: "ntu", dept: "csie" });

    expect(findFaculty).toHaveBeenCalledWith({ school: "ntu", dept: "csie" });
  });

  it("orders a roster by seniority, keeping displayOrder within a rank (stable)", async () => {
    // Repo returns rows already ordered by (school, dept, displayOrder); the service
    // re-sorts by title rank and must preserve that source order among equal ranks.
    const mk = (id: string, title: string, displayOrder: number) => ({
      ...row,
      id,
      title,
      displayOrder,
      theses: [],
    });
    const findFaculty = vi
      .fn()
      .mockResolvedValue([
        mk("a", "助理教授", 0),
        mk("b", "教授", 1),
        mk("c", "特聘教授", 2),
        mk("d", "教授", 3),
        mk("e", "講座教授", 4),
      ]);
    const service = makeService({ findFaculty });

    const result = await service.getFaculty({ dept: "csie" });

    // 講座 > 特聘 > 教授(b before d, source order) > 助理教授
    expect(result.map((m) => m.id)).toEqual(["e", "c", "b", "d", "a"]);
  });

  it("maps rows to the contract shape (theses + nested department/school, drops extra fields)", async () => {
    const findFaculty = vi.fn().mockResolvedValue([row]);
    const service = makeService({ findFaculty });

    const result = await service.getFaculty({});

    expect(result).toEqual([
      {
        id: "f1",
        name: "林智仁",
        nameEn: "CJ Lin",
        slug: "cj-lin",
        title: "特聘教授",
        lab: null,
        homepage: null,
        sourceUrl: "https://www.csie.ntu.edu.tw/zh_tw/member/Faculty",
        note: null,
        researchAreas: ["Machine Learning", "Optimization"],
        departmentId: "d1",
        theses: [{ id: "t1", title: "LIBSVM", year: 2011, role: "authored", url: "https://x" }],
        department: { ...department, school },
      },
    ]);
  });
});
