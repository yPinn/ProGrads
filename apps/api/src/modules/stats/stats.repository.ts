import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface StatsCounts {
  schools: number;
  departments: number;
  subjects: number;
  papers: number;
  faculty: number;
  yearRange: { min: number; max: number } | null;
}

// Thin data-access layer for the homepage stats strip: a handful of platform-wide counts,
// read in parallel (no N+1 — every field is one indexed aggregate query).
@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCounts(): Promise<StatsCounts> {
    const [schools, departments, subjects, papers, faculty, yearAgg] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.department.count(),
      // Mirrors the /questions/facets definition: subjects that actually appear on a paper.
      this.prisma.subject.count({ where: { examSubjects: { some: {} } } }),
      this.prisma.examSubject.count(),
      this.prisma.facultyMember.count(),
      this.prisma.exam.aggregate({ _min: { year: true }, _max: { year: true } }),
    ]);

    const yearRange =
      yearAgg._min.year !== null && yearAgg._max.year !== null
        ? { min: yearAgg._min.year, max: yearAgg._max.year }
        : null;

    return { schools, departments, subjects, papers, faculty, yearRange };
  }
}
