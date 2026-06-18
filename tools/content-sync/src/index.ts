import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prograds/db";
import {
  Resolver,
  reconcileExamSubjectDepartments,
  reconcileExamSubjects,
  syncFile,
} from "./sync.js";

function contentRoot(): string | null {
  if (process.env.CONTENT_DIR) return path.resolve(process.env.CONTENT_DIR);
  return null;
}

function listQuestionFiles(root: string): string[] {
  const questionsDir = path.join(root, "questions");
  let entries: string[];
  try {
    entries = readdirSync(questionsDir, { recursive: true }) as string[];
  } catch {
    return []; // no questions/ yet
  }
  return entries
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(".md"))
    .map((e) => `questions/${e}`)
    .sort();
}

async function main(): Promise<void> {
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
  const files = listQuestionFiles(root);
  // eslint-disable-next-line no-console
  console.log(`content-sync: ${files.length} question file(s) under ${root}`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const resolver = new Resolver(prisma);
  const touched: string[] = [];
  const deptsByExamSubject = new Map<string, Set<string>>();
  let synced = 0;
  let skipped = 0;
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

    const reconciled = await reconcileExamSubjects(prisma, touched);
    const deptLinks = await reconcileExamSubjectDepartments(prisma, deptsByExamSubject);
    // eslint-disable-next-line no-console
    console.log(
      `content-sync done: synced=${synced} skipped=${skipped} reconciled=${reconciled} deptLinks=${deptLinks}`,
    );

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
