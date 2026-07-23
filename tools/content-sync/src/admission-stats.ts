import type { PrismaClient } from "@prograds/db";
import { RegistrationYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import type { Resolver } from "./sync.js";

type AdmissionType = "exam" | "recommended" | "in_service";

// Path season segment maps to admission_type; the segment is omitted for the default (exam).
// Mirrors admissions.ts's SEASON_ADMISSION_TYPE (same vocabulary, same convention).
const SEASON_ADMISSION_TYPE: Record<string, AdmissionType> = {
  exam: "exam",
  recruit: "recommended",
  "in-service": "in_service",
};

export type RegistrationResult =
  | { school: string; matched: number; unmatched: number }
  | { skipped: string };

// admission-stats/<year>/<school>/[<season>/]registration.yml; year/school are cross-checked
// against the file body, admission_type comes from the optional season segment (default exam).
export function parseAdmissionStatsPath(relPath: string): {
  year: number;
  school: string;
  admissionType: AdmissionType;
} {
  const parts = relPath.split("/");
  if (parts.length !== 4 && parts.length !== 5) {
    throw new Error(
      `unexpected admission-stats path: ${relPath} (want admission-stats/<year>/<school>/[<season>/]registration.yml)`,
    );
  }
  const year = Number.parseInt(parts[1] ?? "", 10);
  const school = parts[2] ?? "";
  const admissionType = SEASON_ADMISSION_TYPE[parts.length === 5 ? (parts[3] ?? "") : "exam"];
  if (!Number.isInteger(year) || !school || !admissionType) {
    throw new Error(
      `unexpected admission-stats path: ${relPath} (want admission-stats/<year>/<school>/[<season>/]registration.yml)`,
    );
  }
  return { year, school, admissionType };
}

// Parse, validate and backfill AdmissionRound.applicants from one registration.yml. Rows are
// resolved against existing AdmissionGroup/AdmissionRound rows (created by departments.yml
// sync) by (dept slug, group code) — this content type never creates a round, only enriches
// one already produced by the admissions pipeline. Joint-recruit codes (one number spanning
// several depts) and rows without a resolved `dept` are skipped, not guessed; a dept/round
// that isn't seeded/synced yet is likewise skipped (report only) rather than an error, since
// registration.yml legitimately outruns departments.yml coverage.
export async function syncRegistration(
  prisma: PrismaClient,
  resolver: Resolver,
  relPath: string,
  rawYml: string,
): Promise<RegistrationResult> {
  const pathRef = parseAdmissionStatsPath(relPath);
  const yml = RegistrationYml.parse(parseYaml(rawYml));

  if (yml.school !== pathRef.school || yml.year !== pathRef.year) {
    throw new Error(
      `registration.yml mismatch in ${relPath}: body (${yml.school}, ${yml.year}) != path (${pathRef.school}, ${pathRef.year})`,
    );
  }
  if (yml.admission_type !== pathRef.admissionType) {
    throw new Error(
      `admission_type mismatch in ${relPath}: body "${yml.admission_type}" != path-derived "${pathRef.admissionType}"`,
    );
  }

  const school = await resolver.school(yml.school);
  let matched = 0;
  let unmatched = 0;

  for (const row of yml.rows) {
    if (row.joint || !row.dept) {
      unmatched++;
      continue;
    }

    const department = await resolver.department(school.id, row.dept);
    const group = await prisma.admissionGroup.findUnique({
      where: { departmentId_code: { departmentId: department.id, code: row.code ?? "" } },
      select: { id: true },
    });
    if (!group) {
      unmatched++;
      continue;
    }

    const round = await prisma.admissionRound.findUnique({
      where: {
        admissionGroupId_year_admissionType: {
          admissionGroupId: group.id,
          year: yml.year,
          admissionType: pathRef.admissionType,
        },
      },
      select: { id: true, metadata: true },
    });
    if (!round) {
      unmatched++;
      continue;
    }

    // In-service rows share the round with their general-track sibling (no separate
    // AdmissionRound per applicant_type); stash them in metadata instead of overwriting
    // the round's primary applicants figure.
    if (row.applicant_type?.includes("在職")) {
      const existing = (round.metadata as Record<string, unknown> | null) ?? {};
      await prisma.admissionRound.update({
        where: { id: round.id },
        data: { metadata: { ...existing, applicantsInService: row.applicants } },
      });
    } else {
      await prisma.admissionRound.update({
        where: { id: round.id },
        data: { applicants: row.applicants },
      });
    }
    matched++;
  }

  return { school: yml.school, matched, unmatched };
}
