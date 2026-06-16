import { Injectable, NotFoundException } from "@nestjs/common";
import type { AdmissionType, ExamDetail, ExamSummary } from "@prograds/shared";
import { ExamsRepository } from "./exams.repository.js";

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
      group: e.group,
      licenseStatus: e.licenseStatus,
      sourceUrl: e.sourceUrl,
      school: { id: e.school.id, slug: e.school.slug, name: e.school.name },
      department: {
        id: e.department.id,
        slug: e.department.slug,
        name: e.department.name,
        schoolId: e.department.schoolId,
        trackId: e.department.trackId,
      },
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
      group: exam.group,
      licenseStatus: exam.licenseStatus,
      sourceUrl: exam.sourceUrl,
      school: { id: exam.school.id, slug: exam.school.slug, name: exam.school.name },
      department: {
        id: exam.department.id,
        slug: exam.department.slug,
        name: exam.department.name,
        schoolId: exam.department.schoolId,
        trackId: exam.department.trackId,
      },
      examSubjects: exam.examSubjects.map((es) => ({
        id: es.id,
        name: es.name,
        sourceUrl: es.sourceUrl,
        subjects: es.subjects.map((link) => ({
          id: link.subject.id,
          slug: link.subject.slug,
          name: link.subject.name,
        })),
      })),
    };
  }
}
