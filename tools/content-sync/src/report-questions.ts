import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type QuestionType, QuestionFrontmatter } from "@prograds/shared";
import matter from "gray-matter";
import { parseSections } from "./body.js";
import { parseQuestionPath } from "./paths.js";

// Questions coverage report. Walks questions/<school>/<year>/<paper>/<qNN>.md and prints, per
// (school, year, paper): question count, type mix, and how much of the AI-solve deliverable is
// filled — answer key (## 答案), standard solution (## 標準解答), knowledge points. Also flags
// which seeded schools have zero questions yet (breadth gap). Read-only planning aid to direct
// gap-filling order — no DB, no writes. Mirrors report-coverage.ts (faculty) / report-admissions.ts.
// Usage: tsx src/report-questions.ts <questions-dir> [--gaps] [--md]
//   --gaps  list only holes: seeded schools with no questions, and papers < 100% solved
//   --md    emit a Markdown table instead of the console layout

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(HERE, "../../../packages/db/prisma/seed/schools.seed.ts");

// Fixed display order for the type mix (only non-zero types are printed).
const TYPE_ORDER: QuestionType[] = ["mc", "essay", "calc", "proof", "cloze", "listening"];

interface Paper {
  school: string;
  year: number;
  paper: string;
  count: number;
  types: Map<QuestionType, number>;
  answered: number; // non-empty ## 答案
  solved: number; // non-empty ## 標準解答 (the AI deliverable / moat)
  withKp: number; // knowledge_points present
  verified: number; // review_status === human_verified
  flagged: number; // review_status === flagged
  subjects: Set<string>;
  departments: Set<string>;
  bad: string[]; // per-file parse/contract errors
}

// School slug -> display name, parsed textually from the seed (source of truth for the roster).
function readSeedSchoolNames(): Map<string, string> {
  const src = readFileSync(SEED_FILE, "utf8");
  const names = new Map<string, string>();
  let current: string | null = null;
  for (const line of src.split(/\r?\n/)) {
    const slug = /^\s*slug:\s*"([^"]+)",\s*$/.exec(line);
    if (slug) {
      current = slug[1]!;
      if (!names.has(current)) names.set(current, "");
      continue;
    }
    const name = /^\s*name:\s*"([^"]+)",\s*$/.exec(line);
    if (name && current && names.get(current) === "") names.set(current, name[1]!);
  }
  return names;
}

// Walk the questions dir → one Paper per (school, year, paper) directory.
function readPapers(root: string): Paper[] {
  const papers = new Map<string, Paper>();
  const files = (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(".md"))
    .sort();

  for (const rel of files) {
    let ref: ReturnType<typeof parseQuestionPath>;
    try {
      ref = parseQuestionPath(`questions/${rel}`);
    } catch (err) {
      const key = "_orphans";
      const p = papers.get(key) ?? blankPaper("", 0, "");
      p.bad.push(`${rel}: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
      papers.set(key, p);
      continue;
    }
    const key = `${ref.school}/${ref.year}/${ref.paperSlug}`;
    const p = papers.get(key) ?? blankPaper(ref.school, ref.year, ref.paperSlug);
    p.count += 1;

    const raw = readFileSync(path.join(root, rel), "utf8");
    const parsed = matter(raw);
    const fm = QuestionFrontmatter.safeParse(parsed.data);
    if (!fm.success) {
      p.bad.push(`${rel}: ${fm.error.issues[0]?.message ?? "contract error"}`);
      papers.set(key, p);
      continue;
    }
    const data = fm.data;
    p.types.set(data.question_type, (p.types.get(data.question_type) ?? 0) + 1);
    for (const s of data.subjects) p.subjects.add(s);
    for (const d of data.departments) p.departments.add(d);
    if (data.knowledge_points.length > 0) p.withKp += 1;
    if (data.review_status === "human_verified") p.verified += 1;
    if (data.review_status === "flagged") p.flagged += 1;

    const sections = parseSections(parsed.content);
    if ((sections.get("答案") ?? "").length > 0) p.answered += 1;
    if ((sections.get("標準解答") ?? "").length > 0) p.solved += 1;

    papers.set(key, p);
  }
  return [...papers.values()];
}

function blankPaper(school: string, year: number, paper: string): Paper {
  return {
    school,
    year,
    paper,
    count: 0,
    types: new Map(),
    answered: 0,
    solved: 0,
    withKp: 0,
    verified: 0,
    flagged: 0,
    subjects: new Set(),
    departments: new Set(),
    bad: [],
  };
}

const pct = (num: number, den: number): string =>
  den === 0 ? "-" : `${Math.round((100 * num) / den)}%`;
const typeMix = (types: Map<QuestionType, number>): string =>
  TYPE_ORDER.filter((t) => types.has(t))
    .map((t) => `${t}${types.get(t)}`)
    .join("/");

// Report output goes to stdout (so it can be piped); console.log is disallowed by lint.
const out = (s: string): void => void process.stdout.write(`${s}\n`);

function main(): void {
  const args = process.argv.slice(2);
  const gapsOnly = args.includes("--gaps");
  const asMd = args.includes("--md");
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("Usage: tsx src/report-questions.ts <questions-dir> [--gaps] [--md]");
    process.exit(2);
  }
  const base = process.env.INIT_CWD ?? process.cwd();
  const root = path.isAbsolute(dir) ? dir : path.resolve(base, dir);

  const schoolNames = readSeedSchoolNames();
  const all = readPapers(root);
  const orphanBad = all.find((p) => p.school === "" && p.year === 0)?.bad ?? [];
  const papers = all
    .filter((p) => p.school !== "" || p.year !== 0)
    .sort(
      (a, b) =>
        a.school.localeCompare(b.school) || a.year - b.year || a.paper.localeCompare(b.paper),
    );

  const schoolsWithQ = new Set(papers.map((p) => p.school));
  const totalQ = papers.reduce((s, p) => s + p.count, 0);
  const totalSolved = papers.reduce((s, p) => s + p.solved, 0);

  if (gapsOnly) {
    out("# Questions gaps\n");
    out("## Breadth: seeded schools with no questions yet");
    const missing = [...schoolNames.keys()].filter((s) => !schoolsWithQ.has(s));
    if (missing.length === 0) out("  (none)");
    for (const s of missing) out(`  - ${s} (${schoolNames.get(s)})`);
    out("\n## Depth: papers below 100% solved (## 標準解答)");
    const holes = papers.filter((p) => p.solved < p.count);
    if (holes.length === 0) out("  (none)");
    for (const p of holes) {
      out(`  - ${p.school}/${p.year}/${p.paper}: solved ${p.solved}/${p.count}`);
    }
    return;
  }

  if (asMd) {
    out(`# Questions coverage — ${totalQ} questions, ${papers.length} papers\n`);
    out("| School | Year | Paper | Q | Types | Answered | Solved | Knowledge | Reviewed |");
    out("|---|---:|---|---:|---|:-:|:-:|:-:|---|");
    for (const p of papers) {
      const reviewed = p.verified > 0 || p.flagged > 0 ? `${p.verified}✓ ${p.flagged}⚑` : "—";
      out(
        `| ${p.school} | ${p.year} | ${p.paper} | ${p.count} | ${typeMix(p.types)} | ${pct(p.answered, p.count)} | ${pct(p.solved, p.count)} | ${pct(p.withKp, p.count)} | ${reviewed} |`,
      );
    }
    return;
  }

  // Default: grouped console layout, school → year → one line per paper.
  let lastSchool = "";
  let lastYear = -1;
  for (const p of papers) {
    if (p.school !== lastSchool) {
      const scQ = papers.filter((x) => x.school === p.school).reduce((s, x) => s + x.count, 0);
      const scPapers = papers.filter((x) => x.school === p.school).length;
      out(
        `\n${p.school}  ${schoolNames.get(p.school) ?? "(非 seed)"}  [${scPapers} 卷 · ${scQ} 題]`,
      );
      lastSchool = p.school;
      lastYear = -1;
    }
    if (p.year !== lastYear) {
      out(`  ${p.year}`);
      lastYear = p.year;
    }
    const flags = [
      `${p.count}題`,
      typeMix(p.types),
      `答案 ${pct(p.answered, p.count)}`,
      `解析 ${pct(p.solved, p.count)}`,
      `知識點 ${pct(p.withKp, p.count)}`,
    ].join("  ");
    const review =
      p.verified > 0 || p.flagged > 0
        ? `  審閱 ${p.verified}✓${p.flagged > 0 ? ` ${p.flagged}⚑` : ""}`
        : "";
    out(`    ${p.paper.padEnd(12)} ${flags}${review}`);
    for (const b of p.bad) out(`      ! ${b}`);
  }

  out(
    `\n──\nCoverage: ${schoolsWithQ.size}/${schoolNames.size} seeded schools  ·  ${totalQ} questions across ${papers.length} papers  ·  解析 ${pct(totalSolved, totalQ)}`,
  );
  if (orphanBad.length > 0) {
    out(`Orphan/invalid files (${orphanBad.length}):`);
    for (const b of orphanBad) out(`  ! ${b}`);
  }
}

main();
