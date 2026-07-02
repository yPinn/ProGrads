import type { PrismaClient } from "@prograds/db";

interface SourceTrackedRow {
  id: string;
  sourceKey: string | null;
}

interface SourceSets {
  questionFiles: Set<string>;
  scheduleFiles: Set<string>;
  departmentFiles: Set<string>;
  facultyFiles: Set<string>;
}

interface PruneResult {
  questions: number;
  examSubjects: number;
  exams: number;
  seasons: number;
  rounds: number;
  groups: number;
  facultyMembers: number;
}

export function metadataSourcePath(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).sourcePath;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function collectStaleIds(
  rows: SourceTrackedRow[],
  currentSourceKeys: Set<string>,
): string[] {
  return rows
    .filter((row) => row.sourceKey !== null && !currentSourceKeys.has(row.sourceKey))
    .map((row) => row.id);
}

async function findStaleIds(
  rows: Promise<Array<{ id: string; metadata: unknown }>>,
  currentSourceKeys: Set<string>,
): Promise<string[]> {
  const resolved = await rows;
  return collectStaleIds(
    resolved.map((row) => ({ id: row.id, sourceKey: metadataSourcePath(row.metadata) })),
    currentSourceKeys,
  );
}

export async function pruneSyncedContent(
  prisma: PrismaClient,
  sources: SourceSets,
): Promise<PruneResult> {
  const staleQuestionIds = await findStaleIds(
    prisma.question.findMany({ select: { id: true, metadata: true } }),
    sources.questionFiles,
  );
  const questions =
    staleQuestionIds.length > 0
      ? (await prisma.question.deleteMany({ where: { id: { in: staleQuestionIds } } })).count
      : 0;

  const staleSeasonIds = await findStaleIds(
    prisma.admissionSeason.findMany({ select: { id: true, metadata: true } }),
    sources.scheduleFiles,
  );
  const seasons =
    staleSeasonIds.length > 0
      ? (await prisma.admissionSeason.deleteMany({ where: { id: { in: staleSeasonIds } } })).count
      : 0;

  const staleRoundIds = await findStaleIds(
    prisma.admissionRound.findMany({ select: { id: true, metadata: true } }),
    sources.departmentFiles,
  );
  const rounds =
    staleRoundIds.length > 0
      ? (await prisma.admissionRound.deleteMany({ where: { id: { in: staleRoundIds } } })).count
      : 0;

  const staleGroupIds = await findStaleIds(
    prisma.admissionGroup.findMany({
      where: { rounds: { none: {} } },
      select: { id: true, metadata: true },
    }),
    sources.departmentFiles,
  );
  const groups =
    staleGroupIds.length > 0
      ? (await prisma.admissionGroup.deleteMany({ where: { id: { in: staleGroupIds } } })).count
      : 0;
  const examSubjects = (await prisma.examSubject.deleteMany({ where: { questions: { none: {} } } }))
    .count;
  const exams = (await prisma.exam.deleteMany({ where: { examSubjects: { none: {} } } })).count;

  const staleFacultyIds = await findStaleIds(
    prisma.facultyMember.findMany({ select: { id: true, metadata: true } }),
    sources.facultyFiles,
  );
  const facultyMembers =
    staleFacultyIds.length > 0
      ? (await prisma.facultyMember.deleteMany({ where: { id: { in: staleFacultyIds } } })).count
      : 0;

  return { questions, examSubjects, exams, seasons, rounds, groups, facultyMembers };
}
