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
        // Group each paper's questions together (newest year → school → paper), then by
        // in-paper order; externalId is the unique tiebreaker for stable pagination.
        orderBy: [
          { examSubject: { exam: { year: "desc" } } },
          { examSubject: { exam: { school: { slug: "asc" } } } },
          { examSubject: { slug: "asc" } },
          { order: "asc" },
          { externalId: "asc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.question.count({ where }),
    ]);
    return { rows, total };
  }

  // Paper-grouped listing (考卷為單位): ExamSubjects matching the filters, each with its
  // ordered question refs for an in-paper 題號 selector. Paginated at the paper level.
  async findPapers(f: QuestionFilters, page: number, pageSize: number) {
    const examWhere = {
      ...(f.school ? { school: { slug: f.school } } : {}),
      ...(f.year !== undefined ? { year: f.year } : {}),
    };
    const where = {
      ...(f.track ? { departments: { some: { department: { track: { slug: f.track } } } } } : {}),
      ...(f.subject ? { subjects: { some: { subject: { slug: f.subject } } } } : {}),
      ...(f.type ? { questions: { some: { type: f.type } } } : {}),
      ...(Object.keys(examWhere).length > 0 ? { exam: examWhere } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.examSubject.findMany({
        where,
        include: {
          subjects: { include: { subject: true } },
          departments: { include: { department: true } },
          exam: { select: { id: true, year: true, admissionType: true, school: true } },
          questions: {
            select: { externalId: true, number: true, type: true },
            orderBy: [{ order: "asc" }, { externalId: "asc" }],
          },
        },
        orderBy: [
          { exam: { year: "desc" } },
          { exam: { school: { slug: "asc" } } },
          { slug: "asc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.examSubject.count({ where }),
    ]);
    return { rows, total };
  }

  // The "lead" of a 題組: lowest-order question in the same paper sharing this group slug.
  // The shared passage lives in its contentMd (see content pipeline convention).
  findGroupLead(examSubjectId: string, group: string) {
    return this.prisma.question.findFirst({
      where: { examSubjectId, metadata: { path: ["group"], equals: group } },
      orderBy: [{ order: "asc" }, { externalId: "asc" }],
      select: { externalId: true, metadata: true },
    });
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
