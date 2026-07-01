import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { QuestionFrontmatter } from "@prograds/shared";
import matter from "gray-matter";
import { parseQuestionPath } from "./paths.js";
import { readSchoolDepts, readSubjects } from "./seed-refs.js";

// Offline contract gate for question markdown. No Postgres needed.
//
// Per-file:
//   - QuestionFrontmatter Zod contract.
//   - subject / department slugs against the seed source of truth.
//   - frontmatter question_id matches the path-derived id.
//
// Per-paper (cross-file invariants that sync handles silently / wrongly):
//   - exam_subject / admission_type / license_status must agree across every question.
//     sync upserts ExamSubject.name once per question (last-write-wins), and admission_type
//     keys the Exam — a divergent value silently splits the paper into a different Exam.
//   - departments must agree across the paper (ExamSubject↔Department is the union).
//   Warning (non-fatal): a subject used by only one question — often a mistag.
//
// Usage: tsx src/validate-questions.ts <questions-dir>

export interface PaperQuestion {
  rel: string; // for messages
  paperKey: string; // school/year/paperSlug — matches how sync keys an ExamSubject
  exam_subject: string;
  admission_type: string;
  license_status: string;
  departments: string[];
  subjects: string[];
}

// Pure cross-file consistency core (no IO) so it's unit-testable.
export function checkPaperConsistency(qs: PaperQuestion[]): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const byPaper = new Map<string, PaperQuestion[]>();
  for (const q of qs) {
    const arr = byPaper.get(q.paperKey) ?? [];
    arr.push(q);
    byPaper.set(q.paperKey, arr);
  }

  for (const [paper, group] of [...byPaper].sort()) {
    for (const field of ["exam_subject", "admission_type", "license_status"] as const) {
      const vals = new Set(group.map((q) => q[field]));
      if (vals.size > 1) {
        errors.push(`${paper}: ${field} differs across questions: {${[...vals].join(" | ")}}`);
      }
    }

    const depSets = new Set(group.map((q) => [...q.departments].sort().join(",")));
    if (depSets.size > 1) {
      errors.push(
        `${paper}: departments differ across questions: ${[...depSets].map((s) => `[${s}]`).join(" ; ")}`,
      );
    }

    const dist = new Map<string, number>();
    for (const q of group) for (const s of q.subjects) dist.set(s, (dist.get(s) ?? 0) + 1);
    const singles = [...dist].filter(([, c]) => c === 1).map(([s]) => s);
    if (singles.length) {
      warnings.push(
        `${paper}: 考科 used by only one question (possible mistag): ${singles.join(", ")}`,
      );
    }
  }

  return { errors, warnings };
}

function main(): void {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: tsx src/validate-questions.ts <questions-dir>");
    process.exit(2);
  }
  // pnpm runs scripts from the package dir but exposes the invocation dir via INIT_CWD,
  // so a relative path resolves against where the user actually typed it.
  const base = process.env.INIT_CWD ?? process.cwd();
  const root = path.isAbsolute(dir) ? dir : path.resolve(base, dir);

  const subjects = readSubjects();
  const schoolDepts = readSchoolDepts();

  const files = (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(".md"))
    .sort();

  const errors: string[] = [];
  const records: PaperQuestion[] = [];
  let ok = 0;

  for (const rel of files) {
    let data: unknown;
    try {
      data = matter(readFileSync(path.join(root, rel), "utf8")).data;
    } catch (e) {
      errors.push(`${rel}: frontmatter parse error - ${(e as Error).message}`);
      continue;
    }

    const parsed = QuestionFrontmatter.safeParse(data);
    if (!parsed.success) {
      errors.push(
        `${rel}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
      );
      continue;
    }
    const fm = parsed.data;

    let path_;
    try {
      // parseQuestionPath expects the content-relative path (questions/<...>).
      path_ = parseQuestionPath(`questions/${rel}`);
    } catch (e) {
      errors.push(`${rel}: ${(e as Error).message}`);
      continue;
    }

    if (fm.question_id !== path_.questionId) {
      errors.push(`${rel}: question_id "${fm.question_id}" != path-derived "${path_.questionId}"`);
    }
    for (const s of fm.subjects) {
      if (!subjects.has(s))
        errors.push(`${rel}: unknown subject slug "${s}" (not in taxonomy.seed)`);
    }
    const validDepts = schoolDepts.get(path_.school);
    for (const d of fm.departments) {
      if (!validDepts?.has(d)) {
        errors.push(`${rel}: dept "${d}" not seeded for school "${path_.school}"`);
      }
    }

    records.push({
      rel,
      paperKey: `${path_.school}/${path_.year}/${path_.paperSlug}`,
      exam_subject: fm.exam_subject,
      admission_type: fm.admission_type,
      license_status: fm.license_status,
      departments: fm.departments,
      subjects: fm.subjects,
    });
    ok++;
  }

  const cross = checkPaperConsistency(records);
  errors.push(...cross.errors);

  console.warn(
    `validate-questions: ${files.length} file(s), ${ok} parsed ok, ${errors.length} error(s), ${cross.warnings.length} warning(s)`,
  );
  for (const w of cross.warnings) console.warn(`  ⚠ ${w}`);
  for (const e of errors) console.error(`  ${e}`);
  if (errors.length > 0) process.exit(1);
}

// Run only as a script, not when imported by the spec. pathToFileURL normalises the
// Windows drive/slash form so this matches import.meta.url on every platform.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
