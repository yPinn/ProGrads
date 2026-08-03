import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Single source of truth for parsing packages/db/prisma/seed/schools.seed.ts — the report-*.ts
// coverage modules previously each reimplemented this parse independently and had started to
// drift (see schoolNameMap below). Import from here instead of writing another parser.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(HERE, "../../../packages/db/prisma/seed/schools.seed.ts");

export interface SeedDept {
  slug: string;
  name: string;
  track: string;
}
export interface SeedSchool {
  slug: string;
  name: string;
  depts: SeedDept[];
}

// Parsed in SCHOOLS array order (四大 → 政大 → 四中 → 其他); schoolDisplayRank below relies on
// this order and does not re-sort.
export function readSeedSchools(): SeedSchool[] {
  const src = readFileSync(SEED_FILE, "utf8");
  const schools: SeedSchool[] = [];
  let current: SeedSchool | null = null;
  for (const line of src.split(/\r?\n/)) {
    // Dept rows carry a track and live inside braces: { slug: "x", name: "y", track: "z" },
    const dept = /\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*track:\s*"([^"]+)"\s*\}/.exec(
      line,
    );
    if (dept && current) {
      current.depts.push({ slug: dept[1]!, name: dept[2]!, track: dept[3]! });
      continue;
    }
    // A standalone `slug: "x",` line opens a new school; its `name:` follows.
    const schoolSlug = /^\s*slug:\s*"([^"]+)",\s*$/.exec(line);
    if (schoolSlug) {
      current = { slug: schoolSlug[1]!, name: "", depts: [] };
      schools.push(current);
      continue;
    }
    const schoolName = /^\s*name:\s*"([^"]+)",\s*$/.exec(line);
    if (schoolName && current && current.name === "") current.name = schoolName[1]!;
  }
  return schools;
}

// Curated display rank (四大 → 政大 → 四中 → 其他 = schools.seed.ts's SCHOOLS array position,
// same as School.displayOrder in the DB), not alphabetical. Non-seed slugs sort last.
export function schoolDisplayRank(schools: SeedSchool[]): (slug: string) => number {
  const rank = new Map(schools.map((s, i) => [s.slug, i]));
  return (slug: string) => rank.get(slug) ?? Number.MAX_SAFE_INTEGER;
}

// Display names for non-seed pseudo-schools that still show up as a `school` value in
// admissions/admission-stats units — "ust" (台灣聯合大學系統) is deliberately not in schools.seed
// since its programs are distributed into member schools' own departments.yml (see
// PROMPT-admissions.md). Not exported: fold into schoolNameMap() below instead of consulting
// this directly, so no caller can forget the merge.
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  ust: "台灣聯合大學系統",
};

// slug -> display name, seed roster merged with DISPLAY_NAME_OVERRIDES. The one function every
// caller should use for name lookups — calling seedBySlug.get(slug)?.name directly forgets
// non-seed pseudo-schools (this is the exact drift the module-level comment above warns about:
// report-questions.ts did this and silently rendered "" for ust before this helper existed).
export function schoolNameMap(schools: SeedSchool[]): Map<string, string> {
  const names = new Map(schools.map((s) => [s.slug, s.name]));
  for (const [slug, name] of Object.entries(DISPLAY_NAME_OVERRIDES)) {
    if (!names.has(slug)) names.set(slug, name);
  }
  return names;
}
