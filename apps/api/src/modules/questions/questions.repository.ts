import { Injectable } from "@nestjs/common";
import type { QuestionType } from "@prograds/shared";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface QuestionFilters {
  subject?: string;
  track?: string;
  school?: string;
  year?: number;
  type?: QuestionType;
}

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private where(f: QuestionFilters) {
    // School/year live on the exam; track is reached via the paper's departments (M:N).
    const examSubjectWhere = {
      ...(f.track ? { departments: { some: { department: { track: { slug: f.track } } } } } : {}),
      ...(f.school || f.year !== undefined
        ? {
            exam: {
              ...(f.school ? { school: { slug: f.school } } : {}),
              ...(f.year !== undefined ? { year: f.year } : {}),
            },
          }
        : {}),
    };
    return {
      ...(f.type ? { type: f.type } : {}),
      ...(f.subject ? { subjects: { some: { subject: { slug: f.subject } } } } : {}),
      ...(Object.keys(examSubjectWhere).length > 0 ? { examSubject: examSubjectWhere } : {}),
    };
  }

  async findMany(f: QuestionFilters, page: number, pageSize: number) {
    const where = this.where(f);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        include: {
          subjects: { include: { subject: true } },
          examSubject: {
            select: {
              id: true,
              slug: true,
              name: true,
              departments: { include: { department: true } },
              exam: {
                select: { id: true, year: true, admissionType: true, school: true },
              },
            },
          },
        },
        orderBy: [{ examSubject: { exam: { year: "desc" } } }, { order: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.question.count({ where }),
    ]);
    return { rows, total };
  }

  findByExternalId(externalId: string) {
    return this.prisma.question.findUnique({
      where: { externalId },
      include: {
        subjects: { include: { subject: true } },
        choices: { orderBy: { label: "asc" } },
        explanation: true,
        examSubject: {
          include: {
            subjects: { include: { subject: true } },
            departments: { include: { department: true } },
            exam: { include: { school: true } },
          },
        },
      },
    });
  }
}
