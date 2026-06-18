import { Injectable, NotFoundException } from "@nestjs/common";
import type { Choice, Meta, QuestionDetail, QuestionSummary, Subject } from "@prograds/shared";
import { QuestionFilters, QuestionsRepository } from "./questions.repository.js";

interface ChoiceRow {
  label: string;
  contentMd: string;
  isCorrect: boolean;
}
interface SubjectRow {
  subject: { id: string; slug: string; name: string };
}
interface SchoolRow {
  id: string;
  slug: string;
  name: string;
}
interface DepartmentRow {
  id: string;
  slug: string;
  name: string;
  schoolId: string;
  trackId: string | null;
}

function mapSubjects(rows: SubjectRow[]): Subject[] {
  return rows.map((r) => ({ id: r.subject.id, slug: r.subject.slug, name: r.subject.name }));
}

function mapChoices(rows: ChoiceRow[]): Choice[] {
  return rows.map((c) => ({ label: c.label, contentMd: c.contentMd, isCorrect: c.isCorrect }));
}

function mapSchool(s: SchoolRow) {
  return { id: s.id, slug: s.slug, name: s.name };
}

function mapDepartments(rows: { department: DepartmentRow }[]) {
  return rows.map((r) => ({
    id: r.department.id,
    slug: r.department.slug,
    name: r.department.name,
    schoolId: r.department.schoolId,
    trackId: r.department.trackId,
  }));
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
        departments: mapDepartments(q.examSubject.departments),
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

  async getQuestion(externalId: string): Promise<QuestionDetail> {
    const q = await this.repo.findByExternalId(externalId);
    if (!q) {
      throw new NotFoundException(`question not found: ${externalId}`);
    }
    const meta = (q.metadata ?? null) as { sourceUrl?: unknown } | null;
    const sourceUrl = meta && typeof meta.sourceUrl === "string" ? meta.sourceUrl : null;
    const es = q.examSubject;

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
        departments: mapDepartments(es.departments),
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
    };
  }
}
