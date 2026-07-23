import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  Choice,
  Meta,
  PaperSummary,
  PaperTest,
  QuestionDetail,
  QuestionFacets,
  QuestionSummary,
  Subject,
} from "@prograds/shared";
import { mapSchool, metaNumber, metaString, uniqueDepartments } from "../../common/mappers.js";
import { QuestionFilters, QuestionsRepository } from "./questions.repository.js";

interface ChoiceRow {
  label: string;
  contentMd: string;
  isCorrect: boolean;
}
interface SubjectRow {
  subject: { id: string; slug: string; name: string };
}

function mapSubjects(rows: SubjectRow[]): Subject[] {
  return rows.map((r) => ({ id: r.subject.id, slug: r.subject.slug, name: r.subject.name }));
}

function mapChoices(rows: ChoiceRow[]): Choice[] {
  return rows.map((c) => ({ label: c.label, contentMd: c.contentMd, isCorrect: c.isCorrect }));
}

@Injectable()
export class QuestionsService {
  constructor(private readonly repo: QuestionsRepository) {}

  async getQuestions(
    filters: QuestionFilters,
    page: number,
    pageSize: number,
  ): Promise<{ data: QuestionSummary[]; meta: Meta }> {
    const { rows, total } = await this.repo.findMany(filters, page, pageSize);
    const data: QuestionSummary[] = rows.map((q) => ({
      externalId: q.externalId,
      number: q.number,
      type: q.type,
      subjects: mapSubjects(q.subjects),
      examSubject: {
        id: q.examSubject.id,
        slug: q.examSubject.slug,
        name: q.examSubject.name,
        departments: uniqueDepartments(q.examSubject.departments),
      },
      exam: {
        id: q.examSubject.exam.id,
        year: q.examSubject.exam.year,
        admissionType: q.examSubject.exam.admissionType,
        school: mapSchool(q.examSubject.exam.school),
      },
    }));
    return { data, meta: { page, pageSize, total } };
  }

  async getPapers(
    filters: QuestionFilters,
    page: number,
    pageSize: number,
  ): Promise<{ data: PaperSummary[]; meta: Meta }> {
    const { rows, total } = await this.repo.findPapers(filters, page, pageSize);
    const data: PaperSummary[] = rows.map((es) => ({
      examSubject: {
        id: es.id,
        slug: es.slug,
        name: es.name,
        departments: uniqueDepartments(es.departments),
      },
      exam: {
        id: es.exam.id,
        year: es.exam.year,
        admissionType: es.exam.admissionType,
        school: mapSchool(es.exam.school),
      },
      subjects: mapSubjects(es.subjects),
      questions: es.questions.map((q) => ({
        externalId: q.externalId,
        number: q.number,
        type: q.type,
        group: metaString(q.metadata, "group"),
      })),
    }));
    return { data, meta: { page, pageSize, total } };
  }

  async getFacets(): Promise<QuestionFacets> {
    const { subjects, schools, years } = await this.repo.findFacets();
    return {
      subjects: subjects.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        paperCount: s._count.examSubjects,
      })),
      schools: schools.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
      years: years.map((e) => e.year),
    };
  }

  // Whole-paper test: all questions of one paper (full content + choices + explanation), ordered.
  // The shared 題組 passage lives in the group lead's metadata.passage; since questions come in
  // order, the first question seen per group is its lead — resolve passages in one in-memory pass.
  async getPaperTest(examSubjectId: string): Promise<PaperTest> {
    const es = await this.repo.findPaperById(examSubjectId);
    if (!es) {
      throw new NotFoundException(`paper not found: ${examSubjectId}`);
    }
    const groupPassage = new Map<string, string | null>();
    for (const q of es.questions) {
      const g = metaString(q.metadata, "group");
      if (g && !groupPassage.has(g)) groupPassage.set(g, metaString(q.metadata, "passage"));
    }
    return {
      examSubject: {
        id: es.id,
        slug: es.slug,
        name: es.name,
        subjects: mapSubjects(es.subjects),
        departments: uniqueDepartments(es.departments),
      },
      exam: {
        id: es.exam.id,
        year: es.exam.year,
        admissionType: es.exam.admissionType,
        school: mapSchool(es.exam.school),
      },
      durationMinutes: metaNumber(es.metadata, "durationMinutes"),
      questions: es.questions.map((q) => {
        const group = metaString(q.metadata, "group");
        return {
          externalId: q.externalId,
          number: q.number,
          type: q.type,
          subjects: mapSubjects(q.subjects),
          contentMd: q.contentMd,
          points: q.points,
          choices: mapChoices(q.choices),
          explanation: q.explanation
            ? {
                standardAnswer: q.explanation.standardAnswer,
                answerType: q.explanation.answerType,
                confidence: q.explanation.confidence,
                reviewStatus: q.explanation.reviewStatus,
                modelUsed: q.explanation.modelUsed,
              }
            : null,
          group,
          groupPassageMd: group ? (groupPassage.get(group) ?? null) : null,
        };
      }),
    };
  }

  async getQuestion(externalId: string): Promise<QuestionDetail> {
    const q = await this.repo.findByExternalId(externalId);
    if (!q) {
      throw new NotFoundException(`question not found: ${externalId}`);
    }
    const sourceUrl = metaString(q.metadata, "sourceUrl");
    const group = metaString(q.metadata, "group");
    const es = q.examSubject;

    // The question-group shared passage (lead's metadata.passage) and the same-paper prev/next
    // are independent, so fetch them concurrently:
    // - group: surface the shared passage so every member's page renders it above its own prompt.
    // - prev/next: same-paper, by question order, for stepping through the detail page.
    const [lead, { prev, next }] = await Promise.all([
      group ? this.repo.findGroupLead(q.examSubjectId, group) : Promise.resolve(null),
      this.repo.findSiblings(q.examSubjectId, q.order, q.externalId),
    ]);
    const groupPassageMd = metaString(lead?.metadata, "passage");

    return {
      externalId: q.externalId,
      number: q.number,
      type: q.type,
      contentMd: q.contentMd,
      sourceUrl,
      licenseStatus: es.licenseStatus,
      choices: mapChoices(q.choices),
      subjects: mapSubjects(q.subjects),
      examSubject: {
        id: es.id,
        slug: es.slug,
        name: es.name,
        subjects: mapSubjects(es.subjects),
        departments: uniqueDepartments(es.departments),
      },
      exam: {
        id: es.exam.id,
        year: es.exam.year,
        admissionType: es.exam.admissionType,
        school: mapSchool(es.exam.school),
      },
      explanation: q.explanation
        ? {
            standardAnswer: q.explanation.standardAnswer,
            answerType: q.explanation.answerType,
            confidence: q.explanation.confidence,
            reviewStatus: q.explanation.reviewStatus,
            modelUsed: q.explanation.modelUsed,
          }
        : null,
      group,
      groupPassageMd,
      prev,
      next,
    };
  }
}
