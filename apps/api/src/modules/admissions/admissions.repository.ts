import { Injectable } from "@nestjs/common";
import type { AdmissionEvent } from "@prograds/shared";
import { PrismaService } from "../../prisma/prisma.service.js";

// Thin data-access layer over Prisma for the admissions axis
// (admission_group → admission_round → events + subjects).
@Injectable()
export class AdmissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Groups for one (school, dept), each with its rounds (optionally a single year),
  // and each round's events + subject specs.
  findGroups(filters: { school: string; dept: string; year?: number }) {
    return this.prisma.admissionGroup.findMany({
      where: { department: { slug: filters.dept, school: { slug: filters.school } } },
      include: {
        rounds: {
          where: filters.year !== undefined ? { year: filters.year } : undefined,
          orderBy: [{ year: "desc" }, { admissionType: "asc" }],
          include: {
            events: { orderBy: { at: "asc" } },
            subjects: { include: { subject: true } },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });
  }

  // Flat calendar of events for a year, optionally filtered by school / event type.
  findEvents(filters: { year: number; school?: string; event?: AdmissionEvent }) {
    return this.prisma.admissionRoundEvent.findMany({
      where: {
        ...(filters.event ? { event: filters.event } : {}),
        round: {
          year: filters.year,
          ...(filters.school
            ? { group: { department: { school: { slug: filters.school } } } }
            : {}),
        },
      },
      include: {
        round: {
          include: { group: { include: { department: { include: { school: true } } } } },
        },
      },
      orderBy: { at: "asc" },
    });
  }
}
