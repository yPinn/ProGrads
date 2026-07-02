import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

// Thin data-access layer over Prisma for the faculty axis.
@Injectable()
export class FacultyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFaculty(filters: { school?: string; dept?: string; track?: string }) {
    const department = {
      ...(filters.dept ? { slug: filters.dept } : {}),
      ...(filters.school ? { school: { slug: filters.school } } : {}),
      ...(filters.track ? { track: { slug: filters.track } } : {}),
    };
    return this.prisma.facultyMember.findMany({
      where: Object.keys(department).length > 0 ? { department } : {},
      include: {
        theses: { orderBy: [{ year: "desc" }, { title: "asc" }] },
        department: { include: { school: true } },
      },
      orderBy: [
        { department: { school: { slug: "asc" } } },
        { department: { slug: "asc" } },
        { displayOrder: "asc" },
      ],
    });
  }
}
