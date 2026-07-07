import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { type QuestionType, QuestionFrontmatter } from "@prograds/shared";
import matter from "gray-matter";
import { parseQuestionPath } from "./paths.js";

// Exam-subject trend report (offline, no DB). Reads questions/<school>/<year>/<paper>/<qNN>.md and
// pivots knowledge_points and question_type over years — the phase-0 proof of the 考科趨勢 idea,
// runnable today because knowledge_points already live in the frontmatter (persisted only in
// phase 2). Two lenses: single-school (--school) and cross-school (default, when a paper spans
// schools). Read-only planning aid — it also surfaces which (school,paper) have enough year-depth
// for a trend to mean anything. Mirrors report-questions.ts style.
// Usage: tsx src/report-trends.ts <questions-dir> [--paper=<slug>] [--school=<slug>] [--top=N] [--by-points] [--md]
//   (no --paper)   overview: every paper's schools / year span / depth, to spot trend-ready papers
//   --paper=dsa    pivot one paper: 題型×年 + 考點×年 (+ 考點×校 when multi-school)
//   --school=ntu   restrict to one school (the single-school lens)
//   --top=N        cap knowledge-point rows (default 20)
//   --by-points    weight cells by question points (default: count = 1 each)
//   --md           emit Markdown tables

const TYPE_ORDER: QuestionType[] = ["mc", "essay", "calc", "proof", "cloze", "listening"];

interface QRec {
  school: string;
  year: number;
  paper: string;
  type: QuestionType;
  kps: string[];
  weight: number;
}

function readQuestions(root: string): { recs: QRec[]; bad: string[] } {
  const recs: QRec[] = [];
  const bad: string[] = [];
  const files = (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(".md"))
    .sort();

  for (const rel of files) {
    let ref: ReturnType<typeof parseQuestionPath>;
    try {
      ref = parseQuestionPath(`questions/${rel}`);
    } catch (err) {
      bad.push(`${rel}: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
      continue;
    }
    const parsed = matter(readFileSync(path.join(root, rel), "utf8"));
    const fm = QuestionFrontmatter.safeParse(parsed.data);
    if (!fm.success) {
      bad.push(`${rel}: ${fm.error.issues[0]?.message ?? "contract error"}`);
      continue;
    }
    recs.push({
      school: ref.school,
      year: ref.year,
      paper: ref.paperSlug,
      type: fm.data.question_type,
      kps: fm.data.knowledge_points,
      weight: 0, // filled per-run (count vs points) in main
    });
    recs.at(-1)!.weight = fm.data.points ?? 1;
  }
  return { recs, bad };
}

const out = (s: string): void => void process.stdout.write(`${s}\n`);

// Build a text pivot: rows × cols → integer cells, sorted by row total desc, capped to `top`.
// Adds a Σ column and a coarse trend arrow (first vs last numeric column) when cols are years.
function pivot(
  rows: string[],
  cols: string[],
  get: (row: string, col: string) => number,
  opts: { md: boolean; top?: number; label: string; trend: boolean },
): string[] {
  const totals = new Map(rows.map((r) => [r, cols.reduce((s, c) => s + get(r, c), 0)]));
  const ordered = [...rows]
    .sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0) || a.localeCompare(b))
    .slice(0, opts.top ?? rows.length);

  const arrow = (r: string): string => {
    if (!opts.trend) return "";
    const first = get(r, cols[0]!);
    const last = get(r, cols.at(-1)!);
    return last > first ? " ↑" : last < first ? " ↓" : " →";
  };

  if (opts.md) {
    const head = `| ${opts.label} | ${cols.join(" | ")} | Σ${opts.trend ? " | 趨勢" : ""} |`;
    const sep = `|---|${cols.map(() => "--:").join("|")}|--:${opts.trend ? "|:-:" : ""}|`;
    const body = ordered.map((r) => {
      const cells = cols.map((c) => get(r, c) || "·").join(" | ");
      return `| ${r} | ${cells} | ${totals.get(r)}${opts.trend ? ` | ${arrow(r).trim() || "→"}` : ""} |`;
    });
    return [head, sep, ...body];
  }

  const rowW = Math.max(opts.label.length, ...ordered.map((r) => strWidth(r)));
  const colW = cols.map((c) => Math.max(3, c.length));
  const header = `  ${pad(opts.label, rowW)}  ${cols.map((c, i) => padNum(c, colW[i]!)).join("  ")}   Σ`;
  const lines = ordered.map((r) => {
    const cells = cols.map((c, i) => padNum(String(get(r, c) || "·"), colW[i]!)).join("  ");
    return `  ${pad(r, rowW)}  ${cells}   ${totals.get(r)}${arrow(r)}`;
  });
  return [header, ...lines];
}

// CJK-aware width: count wide chars as 2 so columns align in a monospace terminal.
function strWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += /[ᄀ-￿]/.test(ch) ? 2 : 1;
  return w;
}
const pad = (s: string, w: number): string => s + " ".repeat(Math.max(0, w - strWidth(s)));
const padNum = (s: string, w: number): string => " ".repeat(Math.max(0, w - s.length)) + s;

function main(): void {
  const args = process.argv.slice(2);
  const md = args.includes("--md");
  const byPoints = args.includes("--by-points");
  const paper = args.find((a) => a.startsWith("--paper="))?.split("=")[1];
  const school = args.find((a) => a.startsWith("--school="))?.split("=")[1];
  const top = Number.parseInt(args.find((a) => a.startsWith("--top="))?.split("=")[1] ?? "20", 10);
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error(
      "Usage: tsx src/report-trends.ts <questions-dir> [--paper=<slug>] [--school=<slug>] [--top=N] [--by-points] [--md]",
    );
    process.exit(2);
  }
  const base = process.env.INIT_CWD ?? process.cwd();
  const root = path.isAbsolute(dir) ? dir : path.resolve(base, dir);

  const { recs, bad } = readQuestions(root);
  const w = (r: QRec): number => (byPoints ? r.weight : 1);

  // Overview (no --paper): one line per paper with its schools, year span, depth. Directs which
  // (school,paper) to deepen so a trend becomes computable (needs ≥3 years to read as a trend).
  if (!paper) {
    const papers = [...new Set(recs.map((r) => r.paper))].sort();
    out(`# 考科趨勢 overview${byPoints ? " (points-weighted)" : ""}\n`);
    out("卷別         學校              年份            題數  考點數  年份數");
    for (const p of papers) {
      const rs = recs.filter((r) => r.paper === p);
      const schools = [...new Set(rs.map((r) => r.school))].sort();
      const years = [...new Set(rs.map((r) => r.year))].sort();
      const kps = new Set(rs.flatMap((r) => r.kps));
      const depth = years.length >= 3 ? "✓" : years.length === 2 ? "·" : "—";
      out(
        `  ${pad(p, 10)}  ${pad(schools.join(","), 16)}  ${pad(years.join("/"), 14)}  ${padNum(String(rs.length), 4)}  ${padNum(String(kps.size), 6)}  ${padNum(String(years.length), 4)} ${depth}`,
      );
    }
    out(
      `\n── 年份數 ✓ = ≥3 年(趨勢可讀) · = 2 年 — = 單年。共 ${papers.length} 卷、${recs.length} 題。`,
    );
    if (bad.length > 0) for (const b of bad) out(`  ! ${b}`);
    return;
  }

  // Focused pivots for one paper.
  const scope = recs.filter((r) => r.paper === paper && (!school || r.school === school));
  if (scope.length === 0) {
    out(`(no questions for paper "${paper}"${school ? ` at ${school}` : ""})`);
    return;
  }
  const schools = [...new Set(scope.map((r) => r.school))].sort();
  const years = [...new Set(scope.map((r) => r.year))].map(String).sort();

  out(
    `# 考科趨勢 — ${paper}${school ? ` @ ${school}` : ` (${schools.join(",")})`}${byPoints ? " · points-weighted" : ""}`,
  );
  out(`  學校 ${schools.join(",")}  ·  年份 ${years.join(",")}  ·  ${scope.length} 題\n`);

  // 題型 × 年
  const typesPresent = TYPE_ORDER.filter((t) => scope.some((r) => r.type === t)).map(String);
  const typeCell = (t: string, y: string): number =>
    scope.filter((r) => r.type === t && String(r.year) === y).reduce((s, r) => s + w(r), 0);
  out(md ? "## 題型 × 年\n" : "題型 × 年");
  for (const line of pivot(typesPresent, years, typeCell, { md, label: "題型", trend: true }))
    out(line);

  // 考點 × 年
  const kpSet = [...new Set(scope.flatMap((r) => r.kps))];
  const kpYearCell = (kp: string, y: string): number =>
    scope.filter((r) => String(r.year) === y && r.kps.includes(kp)).reduce((s, r) => s + w(r), 0);
  out(md ? "\n## 考點 × 年\n" : `\n考點 × 年 (top ${top})`);
  for (const line of pivot(kpSet, years, kpYearCell, { md, top, label: "考點", trend: true }))
    out(line);

  // 考點 × 校 (cross-school lens — only when the paper spans >1 school and no school filter)
  if (!school && schools.length > 1) {
    const kpSchoolCell = (kp: string, sc: string): number =>
      scope.filter((r) => r.school === sc && r.kps.includes(kp)).reduce((s, r) => s + w(r), 0);
    out(md ? "\n## 考點 × 校\n" : `\n考點 × 校 (top ${top})`);
    for (const line of pivot(kpSet, schools, kpSchoolCell, {
      md,
      top,
      label: "考點",
      trend: false,
    }))
      out(line);
  }

  if (bad.length > 0) for (const b of bad) out(`  ! ${b}`);
}

main();
