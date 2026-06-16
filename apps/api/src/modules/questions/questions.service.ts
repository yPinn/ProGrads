import { Injectable, NotFoundException } from "@nestjs/common";
import type { Meta, QuestionDetail, QuestionSummary, Subject } from "@prograds/shared";
import { QuestionFilters, QuestionsRepository } from "./questions.repository.js";

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

function mapSchool(s: SchoolRow) {
  return { id: s.id, slug: s.slug, name: s.name };
}

function mapDepartment(d: DepartmentRow) {
  return { id: d.id, slug: d.slug, name: d.name, schoolId: d.schoolId, trackId: d.trackId };
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
      examSubject: { id: q.examSubject.id, name: q.examSubject.name },
      exam: {
        id: q.examSubject.exam.id,
        year: q.examSubject.exam.year,
        admissionType: q.examSubject.exam.admissionType,
        group: q.examSubject.exam.group,
        school: mapSchool(q.examSubject.exam.school),
        department: mapDepartment(q.examSubject.exam.department),
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
    const exam = q.examSubject.exam;

    return {
      externalId: q.externalId,
      number: q.number,
      type: q.type,
      contentMd: q.contentMd,
      sourceUrl,
      licenseStatus: exam.licenseStatus,
      subjects: mapSubjects(q.subjects),
      examSubject: {
        id: q.examSubject.id,
        name: q.examSubject.name,
        subjects: mapSubjects(q.examSubject.subjects),
      },
      exam: {
        id: exam.id,
        year: exam.year,
        admissionType: exam.admissionType,
        group: exam.group,
        school: mapSchool(exam.school),
        department: mapDepartment(exam.department),
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
