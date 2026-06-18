import { Injectable } from "@nestjs/common";
import type { AdmissionEvent } from "@prograds/shared";
import { PrismaService } from "../../prisma/prisma.service.js";

// Thin data-access layer over Prisma for the admissions axis: groups/rounds
// (admission_group → admission_round → papers) and the school-level season calendar
// (admission_season → events).
@Injectable()
export class AdmissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Groups for one (school, dept), each with its rounds (optionally a single year),
  // and each round's papers (with subjects).
  findGroups(filters: { school: string; dept: string; year?: number }) {
    return this.prisma.admissionGroup.findMany({
      where: { department: { slug: filters.dept, school: { slug: filters.school } } },
      include: {
        rounds: {
          where: filters.year !== undefined ? { year: filters.year } : undefined,
          orderBy: [{ year: "desc" }, { admissionType: "asc" }],
          include: {
            papers: { include: { subjects: { include: { subject: true } } } },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });
  }

  // Flat calendar of school-level season events for a year, optionally filtered by
  // school / event type.
  findEvents(filters: { year: number; school?: string; event?: AdmissionEvent }) {
    return this.prisma.admissionSeasonEvent.findMany({
      where: {
        ...(filters.event ? { event: filters.event } : {}),
        season: {
          year: filters.year,
          ...(filters.school ? { school: { slug: filters.school } } : {}),
        },
      },
      include: { season: { include: { school: true } } },
      // id tiebreaks same-time events so the calendar order is deterministic.
      orderBy: [{ at: "asc" }, { id: "asc" }],
    });
  }
}
