import { SUBJECTS } from "@prograds/db/seed/taxonomy";
import { toNameMap } from "./seed-schools.js";

// Single source of truth for taxonomy.seed.ts's SUBJECTS roster (same pattern as seed-schools.ts).

export interface SeedSubject {
  slug: string;
  name: string;
}

export function readSeedSubjects(): SeedSubject[] {
  return SUBJECTS;
}

export function subjectNameMap(subjects: SeedSubject[]): Map<string, string> {
  return toNameMap(subjects);
}
