import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prograds/db";
import { syncRegistration } from "./admission-stats.js";
import { syncDepartments, syncSchedule } from "./admissions.js";
import { syncFaculty } from "./faculty.js";
import { pruneSyncedContent } from "./prune.js";
import {
  Resolver,
  reconcileExamSubjectDepartments,
  reconcileExamSubjects,
  syncFile,
} from "./sync.js";
import { admissionStatsValidator } from "./validate/admission-stats.js";
import { admissionsValidator } from "./validate/admissions.js";
import { facultyValidator } from "./validate/faculty.js";
import { questionsValidator } from "./validate/questions.js";
import { runValidator } from "./validate/runner.js";

function contentRoot(): string | null {
  if (process.env.CONTENT_DIR) return path.resolve(process.env.CONTENT_DIR);
  return null;
}

// List files under `subdir` matching `ext`, returned as repo-relative POSIX paths.
function listFiles(root: string, subdir: string, ext: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(path.join(root, subdir), { recursive: true }) as string[];
  } catch {
    return []; // subdir not present yet
  }
  return entries
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(ext))
    .map((e) => `${subdir}/${e}`)
    .sort();
}

async function main(): Promise<void> {
  const prune = process.argv.includes("--prune");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const root = contentRoot();
  if (!root) {
    // eslint-disable-next-line no-console
    console.log(
      "content-sync: CONTENT_DIR not set — nothing to sync. Clone ProGrads-content and set CONTENT_DIR in .env.",
    );
    return;
  }
  // Validate before touching the DB at all: structural/cross-file problems (e.g. 配分 not
  // summing to 100, a divergent exam_subject across a paper) must never partially sync.
  // runValidator prints its own report and exit(1)s on any error.
  runValidator(questionsValidator, path.join(root, "questions"));
  runValidator(admissionsValidator, path.join(root, "admissions"));
  runValidator(admissionStatsValidator, path.join(root, "admission-stats"));
  runValidator(facultyValidator, path.join(root, "faculty"));

  const files = listFiles(root, "questions", ".md");
  const scheduleFiles = listFiles(root, "admissions", "schedule.yml");
  const departmentFiles = listFiles(root, "admissions", "departments.yml");
  const registrationFiles = listFiles(root, "admission-stats", "registration.yml");
  const facultyFiles = listFiles(root, "faculty", ".yml");
  // eslint-disable-next-line no-console
  console.log(
    `content-sync: ${files.length} question file(s), ${scheduleFiles.length} schedule.yml, ${departmentFiles.length} departments.yml, ${registrationFiles.length} registration.yml, ${facultyFiles.length} faculty.yml under ${root}`,
  );

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const resolver = new Resolver(prisma);
  const touched: string[] = [];
  const deptsByExamSubject = new Map<string, Set<string>>();
  let synced = 0;
  let skipped = 0;
  let seasons = 0;
  let admissionGroups = 0;
  let facultyMembers = 0;
  let applicantsMatched = 0;
  let applicantsUnmatched = 0;
  const errors: string[] = [];

  try {
    for (const rel of files) {
      try {
        const raw = readFileSync(path.join(root, rel), "utf8");
        const result = await syncFile(prisma, resolver, rel, raw);
        if ("skipped" in result) {
          skipped++;
          // eslint-disable-next-line no-console
          console.log(`  skip: ${result.skipped}`);
        } else {
          synced++;
          touched.push(result.examSubjectId);
          const set = deptsByExamSubject.get(result.examSubjectId) ?? new Set<string>();
          for (const id of result.departmentIds) set.add(id);
          deptsByExamSubject.set(result.examSubjectId, set);
        }
      } catch (err) {
        errors.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    for (const rel of scheduleFiles) {
      try {
        const raw = readFileSync(path.join(root, rel), "utf8");
        const result = await syncSchedule(prisma, resolver, rel, raw);
        if (!("skipped" in result)) seasons++;
      } catch (err) {
        errors.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    for (const rel of departmentFiles) {
      try {
        const raw = readFileSync(path.join(root, rel), "utf8");
        const result = await syncDepartments(prisma, resolver, rel, raw);
        if (!("skipped" in result)) admissionGroups += result.groups;
      } catch (err) {
        errors.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    for (const rel of registrationFiles) {
      try {
        const raw = readFileSync(path.join(root, rel), "utf8");
        const result = await syncRegistration(prisma, resolver, rel, raw);
        if (!("skipped" in result)) {
          applicantsMatched += result.matched;
          applicantsUnmatched += result.unmatched;
        }
      } catch (err) {
        errors.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    for (const rel of facultyFiles) {
      try {
        const raw = readFileSync(path.join(root, rel), "utf8");
        const result = await syncFaculty(prisma, resolver, rel, raw);
        if (!("skipped" in result)) facultyMembers += result.members;
      } catch (err) {
        errors.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const reconciled = await reconcileExamSubjects(prisma, touched);
    const deptLinks = await reconcileExamSubjectDepartments(prisma, deptsByExamSubject);
    const pruned = prune
      ? await pruneSyncedContent(prisma, {
          questionFiles: new Set(files),
          scheduleFiles: new Set(scheduleFiles),
          departmentFiles: new Set(departmentFiles),
          facultyFiles: new Set(facultyFiles),
        })
      : null;
    // eslint-disable-next-line no-console
    console.log(
      `content-sync done: synced=${synced} skipped=${skipped} reconciled=${reconciled} deptLinks=${deptLinks} seasons=${seasons} admissionGroups=${admissionGroups} facultyMembers=${facultyMembers} applicantsMatched=${applicantsMatched} applicantsUnmatched=${applicantsUnmatched}`,
    );
    if (pruned) {
      // eslint-disable-next-line no-console
      console.log(
        `content-sync prune: questions=${pruned.questions} examSubjects=${pruned.examSubjects} exams=${pruned.exams} seasons=${pruned.seasons} rounds=${pruned.rounds} groups=${pruned.groups} facultyMembers=${pruned.facultyMembers}`,
      );
    }

    if (errors.length > 0) {
      console.error(`content-sync errors (${errors.length}):`);
      for (const e of errors) {
        console.error(`  ${e}`);
      }
      throw new Error(`content-sync failed with ${errors.length} error(s)`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
