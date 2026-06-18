import { Injectable, NotFoundException } from "@nestjs/common";
import type { AdmissionType, ExamDetail, ExamSummary } from "@prograds/shared";
import { mapSchool, uniqueDepartments } from "../../common/mappers.js";
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
      school: mapSchool(e.school),
      departments: uniqueDepartments(e.examSubjects.flatMap((es) => es.departments)),
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
      school: mapSchool(exam.school),
      departments: uniqueDepartments(exam.examSubjects.flatMap((es) => es.departments)),
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
        departments: uniqueDepartments(es.departments),
      })),
    };
  }
}
