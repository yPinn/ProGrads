import { readFileSync } from "node:fs";
import { QuestionFrontmatter } from "@prograds/shared";
import matter from "gray-matter";
import { parseQuestionPath } from "../paths.js";
import { readSchoolDepts, readSubjects } from "../seed-refs.js";
import { type CheckResult, type ContentValidator, formatZodIssues } from "./runner.js";

// questions/**/*.md — QuestionFrontmatter contract + subject/department slugs against the
// seed + question_id↔path agreement (per file), and per-paper cross-file invariants that
// sync handles silently / wrongly (exam_subject / admission_type / license_status /
// departments must agree across a paper; a subject used by only one question is a warning).
const schoolDepts = readSchoolDepts();
const subjects = readSubjects();

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

export const questionsValidator: ContentValidator = {
  label: "validate-questions",
  reportWarnings: true,
  match: (rel) => rel.endsWith(".md"),
  checkFile(rel, full): CheckResult {
    let data: unknown;
    try {
      data = matter(readFileSync(full, "utf8")).data;
    } catch (e) {
      return { ok: false, errors: [`${rel}: frontmatter parse error - ${(e as Error).message}`] };
    }

    const parsed = QuestionFrontmatter.safeParse(data);
    if (!parsed.success) return { ok: false, errors: [`${rel}: ${formatZodIssues(parsed.error)}`] };
    const fm = parsed.data;

    let path_: ReturnType<typeof parseQuestionPath>;
    try {
      // parseQuestionPath expects the content-relative path (questions/<...>).
      path_ = parseQuestionPath(`questions/${rel}`);
    } catch (e) {
      return { ok: false, errors: [`${rel}: ${(e as Error).message}`] };
    }

    const errors: string[] = [];
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

    const record: PaperQuestion = {
      rel,
      paperKey: `${path_.school}/${path_.year}/${path_.paperSlug}`,
      exam_subject: fm.exam_subject,
      admission_type: fm.admission_type,
      license_status: fm.license_status,
      departments: fm.departments,
      subjects: fm.subjects,
    };
    return { ok: true, errors, record };
  },
  finalize(records) {
    const cross = checkPaperConsistency(records as PaperQuestion[]);
    return { errors: cross.errors, warnings: cross.warnings };
  },
};
