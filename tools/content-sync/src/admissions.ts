import type { PrismaClient } from "@prograds/db";
import { DepartmentsYml, ScheduleYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import type { Resolver } from "./sync.js";

type AdmissionType = "exam" | "recommended" | "in_service";

// Path season segment maps to admission_type; the segment is omitted for the default (exam).
const SEASON_ADMISSION_TYPE: Record<string, AdmissionType> = {
  exam: "exam",
  recruit: "recommended",
  "in-service": "in_service",
};

export type ScheduleResult =
  | { seasonId: string; events: number; slots: number }
  | { skipped: string };

export type DepartmentsResult =
  | { school: string; groups: number; rounds: number; papers: number }
  | { skipped: string };

// Date-only values are stored at Taipei midnight, matching the content convention
// (T00:00:00+08:00). Full datetimes already carry their offset, so use them as-is.
function dayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+08:00`);
}

// interview_at may be a date (YYYY-MM-DD) or a full datetime; the former gets Taipei midnight.
function toDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? dayStart(value) : new Date(value);
}

// admissions/<year>/<school>/[<season>/]<file>; year/school are cross-checked against the
// file body, admission_type comes from the optional season segment (default exam).
function parseAdmissionsPath(relPath: string): {
  year: number;
  school: string;
  admissionType: AdmissionType;
} {
  const parts = relPath.split("/");
  if (parts.length !== 4 && parts.length !== 5) {
    throw new Error(
      `unexpected admissions path: ${relPath} (want admissions/<year>/<school>/[<season>/]<file>)`,
    );
  }
  const year = Number.parseInt(parts[1] ?? "", 10);
  const school = parts[2] ?? "";
  const admissionType = SEASON_ADMISSION_TYPE[parts.length === 5 ? (parts[3] ?? "") : "exam"];
  if (!Number.isInteger(year) || !school || !admissionType) {
    throw new Error(
      `unexpected admissions path: ${relPath} (want admissions/<year>/<school>/[<season>/]<file>)`,
    );
  }
  return { year, school, admissionType };
}

// Parse, validate, resolve and upsert one schedule.yml: the school-level admission season
// (fees / status / announcement) plus its flat event calendar and exam-period timetable.
// Children have no natural key, so they are replaced wholesale, mirroring the question sync.
export async function syncSchedule(
  prisma: PrismaClient,
  resolver: Resolver,
  relPath: string,
  rawYml: string,
): Promise<ScheduleResult> {
  const pathRef = parseAdmissionsPath(relPath);
  const yml = ScheduleYml.parse(parseYaml(rawYml));

  if (yml.school !== pathRef.school || yml.year !== pathRef.year) {
    throw new Error(
      `schedule.yml mismatch in ${relPath}: body (${yml.school}, ${yml.year}) != path (${pathRef.school}, ${pathRef.year})`,
    );
  }

  const school = await resolver.school(yml.school);

  // Flatten the per-day period timetable into one row per (date, period).
  const slotRows = yml.slots.flatMap((day) =>
    day.periods.map((p) => ({
      date: dayStart(day.date),
      period: p.period,
      startTime: p.start,
      endTime: p.end,
      note: p.note ?? null,
    })),
  );

  let seasonId = "";
  await prisma.$transaction(async (tx) => {
    const seasonData = {
      status: yml.status,
      announcedAt: yml.announced_at ? dayStart(yml.announced_at) : null,
      applicationFee: yml.fees?.application ?? null,
      interviewFee: yml.fees?.interview ?? null,
      feeWaiver: yml.fees?.waiver ?? [],
      sourceUrl: yml.source_url ?? null,
    };
    const season = await tx.admissionSeason.upsert({
      where: {
        schoolId_year_admissionType: {
          schoolId: school.id,
          year: yml.year,
          admissionType: yml.admission_type,
        },
      },
      update: seasonData,
      create: {
        schoolId: school.id,
        year: yml.year,
        admissionType: yml.admission_type,
        ...seasonData,
      },
    });
    seasonId = season.id;

    await tx.admissionSeasonEvent.deleteMany({ where: { seasonId: season.id } });
    if (yml.schedule.length > 0) {
      await tx.admissionSeasonEvent.createMany({
        data: yml.schedule.map((e) => ({
          seasonId: season.id,
          event: e.event,
          at: new Date(e.at),
          endAt: e.end ? new Date(e.end) : null,
          location: e.location ?? null,
          sequence: e.sequence ?? null,
          note: e.note ?? null,
        })),
      });
    }

    await tx.admissionExamSlot.deleteMany({ where: { seasonId: season.id } });
    if (slotRows.length > 0) {
      await tx.admissionExamSlot.createMany({
        data: slotRows.map((s) => ({ seasonId: season.id, ...s })),
      });
    }
  });

  return { seasonId, events: yml.schedule.length, slots: slotRows.length };
}

// Parse, validate, resolve and upsert one departments.yml: the per-department admission
// groups and their year-level rounds (quota / methods / weights / papers). Groups are
// content-derived here (no longer referenced by question content), so this is their single
// source of truth. Round children (papers + derived subject list) are replaced wholesale.
export async function syncDepartments(
  prisma: PrismaClient,
  resolver: Resolver,
  relPath: string,
  rawYml: string,
): Promise<DepartmentsResult> {
  const pathRef = parseAdmissionsPath(relPath);
  const yml = DepartmentsYml.parse(parseYaml(rawYml));

  if (yml.school !== pathRef.school || yml.year !== pathRef.year) {
    throw new Error(
      `departments.yml mismatch in ${relPath}: body (${yml.school}, ${yml.year}) != path (${pathRef.school}, ${pathRef.year})`,
    );
  }

  const school = await resolver.school(yml.school);
  let groups = 0;
  let rounds = 0;
  let papers = 0;

  for (const dep of yml.depts) {
    const department = await resolver.department(school.id, dep.dept);

    for (const [index, g] of dep.groups.entries()) {
      // Resolve paper subjects before the transaction (cached reference reads).
      const paperDefs = await Promise.all(
        (g.papers ?? []).map(async (p) => ({
          name: p.name,
          section: p.section ?? null,
          weight: p.weight ?? null,
          note: p.note ?? null,
          subjectIds: await Promise.all(
            (p.subjects ?? []).map((s) => resolver.subject(s).then((r) => r.id)),
          ),
        })),
      );

      const roundData = {
        quota: g.quota ?? null,
        sourceUrl: dep.source_url ?? null,
        admissionCode: g.admission_code ?? null,
        applicantType: g.applicant_type ?? null,
        resultBatch: g.result_batch ?? null,
        methods: g.methods ?? [],
        calculator: g.calculator ?? null,
        writtenWeight: g.exam?.written ?? null,
        interviewWeight: g.exam?.interview ?? null,
        interviewAt: g.interview_at ? toDate(g.interview_at) : null,
        tiebreak: g.tiebreak ?? [],
      };

      await prisma.$transaction(async (tx) => {
        const group = await tx.admissionGroup.upsert({
          where: { departmentId_code: { departmentId: department.id, code: g.code } },
          update: { name: g.name ?? "", displayOrder: index },
          create: {
            departmentId: department.id,
            code: g.code,
            name: g.name ?? "",
            displayOrder: index,
          },
        });
        const round = await tx.admissionRound.upsert({
          where: {
            admissionGroupId_year_admissionType: {
              admissionGroupId: group.id,
              year: yml.year,
              admissionType: pathRef.admissionType,
            },
          },
          update: roundData,
          create: {
            admissionGroupId: group.id,
            year: yml.year,
            admissionType: pathRef.admissionType,
            ...roundData,
          },
        });
        rounds++;

        // Rebuild papers + their subject links.
        await tx.admissionRoundPaper.deleteMany({ where: { roundId: round.id } });
        for (const pd of paperDefs) {
          const paper = await tx.admissionRoundPaper.create({
            data: {
              roundId: round.id,
              name: pd.name,
              section: pd.section,
              weight: pd.weight,
              note: pd.note,
            },
          });
          if (pd.subjectIds.length > 0) {
            await tx.admissionRoundPaperSubject.createMany({
              data: pd.subjectIds.map((subjectId) => ({ paperId: paper.id, subjectId })),
            });
          }
          papers++;
        }

        // Rebuild the round's flat subject list (union of paper subjects, note = paper name);
        // a denormalized projection that keeps the /admissions response populated.
        await tx.admissionRoundSubject.deleteMany({ where: { roundId: round.id } });
        const noteBySubjectId = new Map<string, string>();
        for (const pd of paperDefs) {
          for (const id of pd.subjectIds)
            if (!noteBySubjectId.has(id)) noteBySubjectId.set(id, pd.name);
        }
        if (noteBySubjectId.size > 0) {
          await tx.admissionRoundSubject.createMany({
            data: [...noteBySubjectId].map(([subjectId, note]) => ({
              roundId: round.id,
              subjectId,
              note,
            })),
          });
        }
      });
      groups++;
    }
  }

  return { school: yml.school, groups, rounds, papers };
}
