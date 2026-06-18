import { Injectable, NotFoundException } from "@nestjs/common";
import type { AdmissionType, ExamDetail, ExamSummary } from "@prograds/shared";
import { ExamsRepository } from "./exams.repository.js";

interface DeptRow {
  id: string;
  slug: string;
  name: string;
  schoolId: string;
  trackId: string | null;
}

function mapDept(d: DeptRow) {
  return { id: d.id, slug: d.slug, name: d.name, schoolId: d.schoolId, trackId: d.trackId };
}

// Unique departments across a set of {department} link rows (preserves first-seen order).
function uniqueDepts(links: { department: DeptRow }[]): ReturnType<typeof mapDept>[] {
  const seen = new Map<string, ReturnType<typeof mapDept>>();
  for (const { department } of links) {
    if (!seen.has(department.id)) seen.set(department.id, mapDept(department));
  }
  return [...seen.values()];
}

@Injectable()
export class ExamsService {
  constructor(private readonly repo: ExamsRepository) {}

  async getExams(filters: {
    school?: string;
    track?: string;
    year?: number;
    admissionType?: AdmissionType;
  }): Promise<ExamSummary[]> {
    const rows = await this.repo.findExams(filters);
    return rows.map((e) => ({
      id: e.id,
      year: e.year,
      admissionType: e.admissionType,
      school: { id: e.school.id, slug: e.school.slug, name: e.school.name },
      departments: uniqueDepts(e.examSubjects.flatMap((es) => es.departments)),
    }));
  }

  async getExam(id: string): Promise<ExamDetail> {
    const exam = await this.repo.findExamById(id);
    if (!exam) {
      throw new NotFoundException(`exam not found: ${id}`);
    }
    return {
      id: exam.id,
      year: exam.year,
      admissionType: exam.admissionType,
      school: { id: exam.school.id, slug: exam.school.slug, name: exam.school.name },
      departments: uniqueDepts(exam.examSubjects.flatMap((es) => es.departments)),
      examSubjects: exam.examSubjects.map((es) => ({
        id: es.id,
        slug: es.slug,
        name: es.name,
        licenseStatus: es.licenseStatus,
        sourceUrl: es.sourceUrl,
        subjects: es.subjects.map((link) => ({
          id: link.subject.id,
          slug: link.subject.slug,
          name: link.subject.name,
        })),
        departments: uniqueDepts(es.departments),
      })),
    };
  }
}
