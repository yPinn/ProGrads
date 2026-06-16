import { Injectable } from "@nestjs/common";
import type { AdmissionType } from "@prograds/shared";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class ExamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findExams(filters: {
    school?: string;
    track?: string;
    year?: number;
    admissionType?: AdmissionType;
  }) {
    return this.prisma.exam.findMany({
      where: {
        ...(filters.school ? { school: { slug: filters.school } } : {}),
        ...(filters.track ? { department: { track: { slug: filters.track } } } : {}),
        ...(filters.year ? { year: filters.year } : {}),
        ...(filters.admissionType ? { admissionType: filters.admissionType } : {}),
      },
      include: { school: true, department: true },
      orderBy: [{ year: "desc" }, { school: { slug: "asc" } }],
    });
  }

  findExamById(id: string) {
    return this.prisma.exam.findUnique({
      where: { id },
      include: {
        school: true,
        department: true,
        examSubjects: {
          include: { subjects: { include: { subject: true } } },
          orderBy: { name: "asc" },
        },
      },
    });
  }
}
