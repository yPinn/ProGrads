import { SCHOOLS } from "@prograds/db/seed/schools";

// Single source of truth for schools.seed.ts's SCHOOLS roster, so report-*.ts modules don't
// each reimplement slug→name lookups (see schoolNameMap below).

// slug/name pair → lookup map. Shared by schoolNameMap and seed-subjects.ts's subjectNameMap.
export function toNameMap<T extends { slug: string; name: string }>(
  items: T[],
): Map<string, string> {
  return new Map(items.map((s) => [s.slug, s.name]));
}

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

// SCHOOLS array order (四大 → 政大 → 四中 → 其他); schoolDisplayRank below relies on this order
// and does not re-sort.
export function readSeedSchools(): SeedSchool[] {
  return SCHOOLS.map((s) => ({ slug: s.slug, name: s.name, depts: s.departments }));
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
  const names = toNameMap(schools);
  for (const [slug, name] of Object.entries(DISPLAY_NAME_OVERRIDES)) {
    if (!names.has(slug)) names.set(slug, name);
  }
  return names;
}
