import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Offline readers for the seed source of truth (slugs), shared by the validators so
// contract gates don't need Postgres. Parses the current seed file shapes textually.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(HERE, "../../../packages/db/prisma/seed");

// School -> dept slugs, parsed from the current seed shape.
export function readSchoolDepts(): Map<string, Set<string>> {
  const src = readFileSync(path.join(SEED_DIR, "schools.seed.ts"), "utf8");
  const out = new Map<string, Set<string>>();
  let current: string | null = null;
  for (const line of src.split(/\r?\n/)) {
    const school = /^\s*slug:\s*"([^"]+)",\s*$/.exec(line);
    if (school) {
      current = school[1] ?? null;
      if (current) out.set(current, new Set());
      continue;
    }
    const dept = /slug:\s*"([^"]+)".*track:/.exec(line);
    if (dept && current) out.get(current)?.add(dept[1] ?? "");
  }
  return out;
}

// Subject slugs from the SUBJECTS seed array.
export function readSubjects(): Set<string> {
  const src = readFileSync(path.join(SEED_DIR, "taxonomy.seed.ts"), "utf8");
  const block = /const SUBJECTS:[^=]*=\s*\[([\s\S]*?)\];/.exec(src);
  if (!block) throw new Error("could not locate SUBJECTS array in taxonomy.seed.ts");
  const slugs = new Set<string>();
  for (const m of block[1]!.matchAll(/slug:\s*"([^"]+)"/g)) slugs.add(m[1]!);
  return slugs;
}
