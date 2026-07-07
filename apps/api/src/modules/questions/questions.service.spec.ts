import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { QuestionsService } from "./questions.service.js";
import type { QuestionsRepository } from "./questions.repository.js";

function makeService(repo: Partial<QuestionsRepository>) {
  return new QuestionsService(repo as QuestionsRepository);
}

const school = { id: "s1", slug: "nccu", name: "國立政治大學" };
const dept = { id: "d1", slug: "cs", name: "資訊科學系", schoolId: "s1", trackId: "t1" };
const subjectLink = { subject: { id: "subj1", slug: "calculus", name: "微積分" } };

describe("QuestionsService.getQuestions", () => {
  it("maps rows, dedups departments and builds pagination meta", async () => {
    const findMany = vi.fn().mockResolvedValue({
      total: 42,
      rows: [
        {
          externalId: "Q-1",
          number: "1",
          type: "SINGLE",
          subjects: [subjectLink],
          examSubject: {
            id: "es1",
            slug: "calc-2025",
            name: "微積分",
            // two links to the same department must collapse to one entry
            departments: [{ department: dept }, { department: dept }],
            exam: { id: "e1", year: 2025, admissionType: "MASTER", school },
          },
        },
      ],
    });

    const service = makeService({ findMany });
    const result = await service.getQuestions({ subject: "calculus" }, 2, 20);

    expect(findMany).toHaveBeenCalledWith({ subject: "calculus" }, 2, 20);
    expect(result.meta).toEqual({ page: 2, pageSize: 20, total: 42 });
    expect(result.data[0]?.examSubject.departments).toEqual([
      { id: "d1", slug: "cs", name: "資訊科學系", schoolId: "s1", trackId: "t1" },
    ]);
    expect(result.data[0]?.exam.school).toEqual(school);
    expect(result.data[0]?.subjects).toEqual([{ id: "subj1", slug: "calculus", name: "微積分" }]);
  });
});

describe("QuestionsService.getPapers", () => {
  it("normalises metadata.group to a string or null", async () => {
    const findPapers = vi.fn().mockResolvedValue({
      total: 1,
      rows: [
        {
          id: "es1",
          slug: "calc-2025",
          name: "微積分",
          departments: [{ department: dept }],
          exam: { id: "e1", year: 2025, admissionType: "MASTER", school },
          subjects: [subjectLink],
          questions: [
            { externalId: "Q-1", number: "1", type: "SINGLE", metadata: { group: "題組A" } },
            { externalId: "Q-2", number: "2", type: "SINGLE", metadata: { group: 5 } },
            { externalId: "Q-3", number: "3", type: "ESSAY", metadata: null },
          ],
        },
      ],
    });

    const service = makeService({ findPapers });
    const result = await service.getPapers({}, 1, 10);

    expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 1 });
    expect(result.data[0]?.questions.map((q) => q.group)).toEqual(["題組A", null, null]);
  });
});

describe("QuestionsService.getFacets", () => {
  it("maps facet rows to subjects(+paperCount)/schools/years", async () => {
    const findFacets = vi.fn().mockResolvedValue({
      subjects: [
        { id: "subj1", slug: "algo", name: "演算法", _count: { examSubjects: 3 } },
        { id: "subj2", slug: "os", name: "作業系統", _count: { examSubjects: 1 } },
      ],
      schools: [school],
      years: [{ year: 2026 }, { year: 2025 }],
    });

    const service = makeService({ findFacets });
    const facets = await service.getFacets();

    expect(facets.subjects).toEqual([
      { id: "subj1", slug: "algo", name: "演算法", paperCount: 3 },
      { id: "subj2", slug: "os", name: "作業系統", paperCount: 1 },
    ]);
    expect(facets.schools).toEqual([school]);
    expect(facets.years).toEqual([2026, 2025]);
  });
});

describe("QuestionsService.getPaperTest", () => {
  function paperRow() {
    return {
      id: "es1",
      slug: "dsa-2024",
      name: "資料結構與演算法",
      metadata: { durationMinutes: 100 },
      subjects: [subjectLink],
      departments: [{ department: dept }, { department: dept }],
      exam: { id: "e1", year: 2024, admissionType: "MASTER", school },
      questions: [
        {
          externalId: "Q-1",
          number: "1",
          type: "SINGLE",
          contentMd: "題幹一",
          metadata: { group: "clozeA", passage: "克漏字篇章" },
          choices: [
            { label: "A", contentMd: "甲", isCorrect: true },
            { label: "B", contentMd: "乙", isCorrect: false },
          ],
          subjects: [subjectLink],
          explanation: {
            standardAnswer: "A",
            answerType: "SINGLE",
            confidence: 0.9,
            reviewStatus: "APPROVED",
            modelUsed: "claude",
          },
        },
        {
          externalId: "Q-2",
          number: "2",
          type: "SINGLE",
          contentMd: "題幹二",
          // Same group, but only the lead carries the passage — this member inherits it.
          metadata: { group: "clozeA" },
          choices: [{ label: "A", contentMd: "甲", isCorrect: false }],
          subjects: [subjectLink],
          explanation: null,
        },
        {
          externalId: "Q-3",
          number: "3",
          type: "ESSAY",
          contentMd: "申論題",
          metadata: null,
          choices: [],
          subjects: [subjectLink],
          explanation: null,
        },
      ],
    };
  }

  it("throws NotFoundException when the paper is absent", async () => {
    const findPaperById = vi.fn().mockResolvedValue(null);
    const service = makeService({ findPaperById });
    await expect(service.getPaperTest("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("maps every question and inherits the group passage from the lead", async () => {
    const findPaperById = vi.fn().mockResolvedValue(paperRow());
    const service = makeService({ findPaperById });

    const paper = await service.getPaperTest("es1");

    expect(findPaperById).toHaveBeenCalledWith("es1");
    expect(paper.examSubject.name).toBe("資料結構與演算法");
    expect(paper.durationMinutes).toBe(100); // lifted from ExamSubject.metadata

    // duplicate department links collapse to one
    expect(paper.examSubject.departments).toHaveLength(1);
    expect(paper.exam.school).toEqual(school);
    expect(paper.questions).toHaveLength(3);

    // both members of clozeA carry the lead's passage; the essay has none
    expect(paper.questions[0]?.groupPassageMd).toBe("克漏字篇章");
    expect(paper.questions[1]?.group).toBe("clozeA");
    expect(paper.questions[1]?.groupPassageMd).toBe("克漏字篇章");
    expect(paper.questions[2]?.group).toBeNull();
    expect(paper.questions[2]?.groupPassageMd).toBeNull();

    // answers ride along (hidden client-side); explanation nullable
    expect(paper.questions[0]?.choices).toEqual([
      { label: "A", contentMd: "甲", isCorrect: true },
      { label: "B", contentMd: "乙", isCorrect: false },
    ]);
    expect(paper.questions[0]?.explanation?.standardAnswer).toBe("A");
    expect(paper.questions[1]?.explanation).toBeNull();
    expect(paper.questions[2]?.choices).toEqual([]);
  });

  it("nulls durationMinutes when the paper has no metadata limit", async () => {
    const row = paperRow();
    row.metadata = null as unknown as { durationMinutes: number };
    const findPaperById = vi.fn().mockResolvedValue(row);
    const service = makeService({ findPaperById });

    const paper = await service.getPaperTest("es1");
    expect(paper.durationMinutes).toBeNull();
  });
});

describe("QuestionsService.getQuestion", () => {
  function detailRow(overrides: Record<string, unknown> = {}) {
    return {
      externalId: "Q-1",
      number: "1",
      type: "SINGLE",
      order: 1,
      contentMd: "題目內容",
      metadata: { sourceUrl: "https://example.edu/q1", group: "題組A" },
      examSubjectId: "es1",
      choices: [{ label: "A", contentMd: "選項A", isCorrect: true }],
      subjects: [subjectLink],
      explanation: {
        standardAnswer: "A",
        answerType: "SINGLE",
        confidence: 0.9,
        reviewStatus: "APPROVED",
        modelUsed: "claude",
      },
      examSubject: {
        id: "es1",
        slug: "calc-2025",
        name: "微積分",
        licenseStatus: "LICENSED",
        subjects: [subjectLink],
        departments: [{ department: dept }],
        exam: { id: "e1", year: 2025, admissionType: "MASTER", school },
      },
      ...overrides,
    };
  }

  it("throws NotFoundException when the question is absent", async () => {
    const findByExternalId = vi.fn().mockResolvedValue(null);
    const service = makeService({ findByExternalId });

    await expect(service.getQuestion("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  const noSiblings = () => vi.fn().mockResolvedValue({ prev: null, next: null });

  it("maps full detail and surfaces the group passage from the lead", async () => {
    const findByExternalId = vi.fn().mockResolvedValue(detailRow());
    const findGroupLead = vi
      .fn()
      .mockResolvedValue({ externalId: "Q-0", metadata: { passage: "共同題幹" } });
    const findSiblings = vi.fn().mockResolvedValue({
      prev: { externalId: "Q-0", number: "0" },
      next: { externalId: "Q-2", number: "2" },
    });
    const service = makeService({ findByExternalId, findGroupLead, findSiblings });

    const detail = await service.getQuestion("Q-1");

    expect(findGroupLead).toHaveBeenCalledWith("es1", "題組A");
    expect(findSiblings).toHaveBeenCalledWith("es1", 1, "Q-1");
    expect(detail.sourceUrl).toBe("https://example.edu/q1");
    expect(detail.group).toBe("題組A");
    expect(detail.groupPassageMd).toBe("共同題幹");
    expect(detail.licenseStatus).toBe("LICENSED");
    expect(detail.choices).toEqual([{ label: "A", contentMd: "選項A", isCorrect: true }]);
    expect(detail.explanation?.standardAnswer).toBe("A");
    expect(detail.prev).toEqual({ externalId: "Q-0", number: "0" });
    expect(detail.next).toEqual({ externalId: "Q-2", number: "2" });
    expect(detail.examSubject.departments).toEqual([
      { id: "d1", slug: "cs", name: "資訊科學系", schoolId: "s1", trackId: "t1" },
    ]);
  });

  it("nulls metadata-derived fields and skips the lead lookup when metadata is empty", async () => {
    const findByExternalId = vi
      .fn()
      .mockResolvedValue(detailRow({ metadata: null, explanation: null }));
    const findGroupLead = vi.fn();
    const service = makeService({ findByExternalId, findGroupLead, findSiblings: noSiblings() });

    const detail = await service.getQuestion("Q-1");

    expect(detail.sourceUrl).toBeNull();
    expect(detail.group).toBeNull();
    expect(detail.groupPassageMd).toBeNull();
    expect(detail.explanation).toBeNull();
    expect(detail.prev).toBeNull();
    expect(detail.next).toBeNull();
    expect(findGroupLead).not.toHaveBeenCalled();
  });

  it("leaves groupPassageMd null when the lead has no string passage", async () => {
    const findByExternalId = vi.fn().mockResolvedValue(detailRow());
    const findGroupLead = vi.fn().mockResolvedValue({ externalId: "Q-0", metadata: null });
    const service = makeService({ findByExternalId, findGroupLead, findSiblings: noSiblings() });

    const detail = await service.getQuestion("Q-1");

    expect(detail.group).toBe("題組A");
    expect(detail.groupPassageMd).toBeNull();
  });
});
