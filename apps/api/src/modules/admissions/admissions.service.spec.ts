import { describe, it, expect, vi } from "vitest";
import { AdmissionsService } from "./admissions.service.js";
import type { AdmissionsRepository } from "./admissions.repository.js";

// The service is a pure mapper over the repository: it reshapes Prisma rows into the
// API contract and normalises Date fields to ISO strings. We stub the repo so the
// tests assert exactly that reshaping (and that filters are forwarded unchanged).
function makeService(repo: Partial<AdmissionsRepository>) {
  return new AdmissionsService(repo as AdmissionsRepository);
}

describe("AdmissionsService.getGroups", () => {
  it("maps groups → rounds → papers → subjects and serialises interviewAt", async () => {
    const findGroups = vi.fn().mockResolvedValue([
      {
        id: 1,
        code: "A",
        name: "甲組",
        displayOrder: 0,
        rounds: [
          {
            year: 2025,
            admissionType: "MASTER",
            admissionCode: "1234",
            applicantType: "GENERAL",
            quota: 30,
            applicants: 120,
            admitted: 32,
            resultBatch: "一階",
            methods: ["WRITTEN", "INTERVIEW"],
            calculator: null,
            writtenWeight: 70,
            reviewWeight: 0,
            interviewWeight: 30,
            interviewAt: new Date("2025-03-15T01:00:00.000Z"),
            tiebreak: "面試成績",
            sourceUrl: "https://example.edu/admission",
            papers: [
              {
                name: "計算機概論",
                section: "A",
                weight: 50,
                note: null,
                subjects: [{ subject: { id: 7, slug: "computer-science", name: "計算機概論" } }],
              },
            ],
          },
        ],
      },
    ]);

    const service = makeService({ findGroups });
    const result = await service.getGroups({ school: "nccu", dept: "cs", year: 2025 });

    expect(findGroups).toHaveBeenCalledWith({ school: "nccu", dept: "cs", year: 2025 });
    expect(result).toEqual([
      {
        id: 1,
        code: "A",
        name: "甲組",
        displayOrder: 0,
        rounds: [
          {
            year: 2025,
            admissionType: "MASTER",
            admissionCode: "1234",
            applicantType: "GENERAL",
            quota: 30,
            applicants: 120,
            admitted: 32,
            resultBatch: "一階",
            methods: ["WRITTEN", "INTERVIEW"],
            calculator: null,
            writtenWeight: 70,
            reviewWeight: 0,
            interviewWeight: 30,
            interviewAt: "2025-03-15T01:00:00.000Z",
            tiebreak: "面試成績",
            sourceUrl: "https://example.edu/admission",
            papers: [
              {
                name: "計算機概論",
                section: "A",
                weight: 50,
                note: null,
                subjects: [{ id: 7, slug: "computer-science", name: "計算機概論" }],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("leaves interviewAt null when the round has no interview time", async () => {
    const findGroups = vi.fn().mockResolvedValue([
      {
        id: 2,
        code: null,
        name: "不分組",
        displayOrder: 1,
        rounds: [
          {
            year: 2025,
            admissionType: "MASTER",
            admissionCode: null,
            applicantType: "GENERAL",
            quota: null,
            applicants: null,
            admitted: null,
            resultBatch: null,
            methods: [],
            calculator: null,
            writtenWeight: null,
            reviewWeight: null,
            interviewWeight: null,
            interviewAt: null,
            tiebreak: null,
            sourceUrl: null,
            papers: [],
          },
        ],
      },
    ]);

    const service = makeService({ findGroups });
    const [group] = await service.getGroups({ school: "nccu", dept: "cs" });

    expect(group?.rounds[0]?.interviewAt).toBeNull();
    expect(group?.rounds[0]?.papers).toEqual([]);
  });

  it("returns an empty array when the department has no groups", async () => {
    const findGroups = vi.fn().mockResolvedValue([]);
    const service = makeService({ findGroups });

    await expect(service.getGroups({ school: "x", dept: "y" })).resolves.toEqual([]);
  });
});

describe("AdmissionsService.getSchedule", () => {
  it("flattens season events and serialises at / endAt", async () => {
    const findEvents = vi.fn().mockResolvedValue([
      {
        event: "APPLICATION",
        at: new Date("2025-01-02T00:00:00.000Z"),
        endAt: new Date("2025-01-10T00:00:00.000Z"),
        location: null,
        sequence: 1,
        season: {
          year: 2025,
          admissionType: "MASTER",
          school: { slug: "nccu", name: "國立政治大學" },
        },
      },
    ]);

    const service = makeService({ findEvents });
    const result = await service.getSchedule({ year: 2025, school: "nccu" });

    expect(findEvents).toHaveBeenCalledWith({ year: 2025, school: "nccu" });
    expect(result).toEqual([
      {
        school: { slug: "nccu", name: "國立政治大學" },
        year: 2025,
        admissionType: "MASTER",
        event: "APPLICATION",
        at: "2025-01-02T00:00:00.000Z",
        endAt: "2025-01-10T00:00:00.000Z",
        location: null,
        sequence: 1,
      },
    ]);
  });

  it("keeps endAt null for single-moment events", async () => {
    const findEvents = vi.fn().mockResolvedValue([
      {
        event: "RESULT",
        at: new Date("2025-04-01T00:00:00.000Z"),
        endAt: null,
        location: "線上公告",
        sequence: 0,
        season: {
          year: 2025,
          admissionType: "MASTER",
          school: { slug: "ntu", name: "國立臺灣大學" },
        },
      },
    ]);

    const service = makeService({ findEvents });
    const [item] = await service.getSchedule({ year: 2025 });

    expect(item?.endAt).toBeNull();
    expect(item?.at).toBe("2025-04-01T00:00:00.000Z");
  });
});
