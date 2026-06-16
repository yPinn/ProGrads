import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

// Thin data-access layer over Prisma for the school axis.
@Injectable()
export class SchoolsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSchools() {
    return this.prisma.school.findMany({ orderBy: { slug: "asc" } });
  }

  findSchoolBySlug(slug: string) {
    return this.prisma.school.findUnique({
      where: { slug },
      include: { departments: { orderBy: { slug: "asc" } } },
    });
  }

  findDepartments(filters: { track?: string; school?: string }) {
    return this.prisma.department.findMany({
      where: {
        ...(filters.track ? { track: { slug: filters.track } } : {}),
        ...(filters.school ? { school: { slug: filters.school } } : {}),
      },
      include: { school: true },
      orderBy: [{ school: { slug: "asc" } }, { slug: "asc" }],
    });
  }
}
