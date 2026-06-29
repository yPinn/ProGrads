import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  Choice,
  Meta,
  PaperSummary,
  QuestionDetail,
  QuestionFacets,
  QuestionSummary,
  Subject,
} from "@prograds/shared";
import { mapSchool, uniqueDepartments } from "../../common/mappers.js";
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
      questions: es.questions.map((q) => {
        const m = (q.metadata ?? null) as { group?: unknown } | null;
        return {
          externalId: q.externalId,
          number: q.number,
          type: q.type,
          group: m && typeof m.group === "string" ? m.group : null,
        };
      }),
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

  async getQuestion(externalId: string): Promise<QuestionDetail> {
    const q = await this.repo.findByExternalId(externalId);
    if (!q) {
      throw new NotFoundException(`question not found: ${externalId}`);
    }
    const meta = (q.metadata ?? null) as { sourceUrl?: unknown; group?: unknown } | null;
    const sourceUrl = meta && typeof meta.sourceUrl === "string" ? meta.sourceUrl : null;
    const group = meta && typeof meta.group === "string" ? meta.group : null;
    const es = q.examSubject;

    // 題組: surface the shared passage (held by the group's lead in metadata.passage) so
    // every member's page can render the clean passage above its own prompt.
    let groupPassageMd: string | null = null;
    if (group) {
      const lead = await this.repo.findGroupLead(q.examSubjectId, group);
      const leadMeta = (lead?.metadata ?? null) as { passage?: unknown } | null;
      groupPassageMd = leadMeta && typeof leadMeta.passage === "string" ? leadMeta.passage : null;
    }

    // 同卷上下題(依題序),供詳情頁前後切換。
    const { prev, next } = await this.repo.findSiblings(q.examSubjectId, q.order, q.externalId);

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
