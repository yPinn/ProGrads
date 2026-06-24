import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DepartmentsYml, ScheduleYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";

// Offline contract gate for admissions YAML. Checks shared schemas and local
// seed references without requiring Postgres.
// Checks:
//   1. ScheduleYml / DepartmentsYml Zod contracts.
//   2. Department and subject slugs against the seed source of truth.
// Usage: tsx src/validate-admissions.ts <admissions-dir>

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(HERE, "../../../packages/db/prisma/seed");

// School -> dept slugs, parsed from the current seed shape.
function readSchoolDepts(): Map<string, Set<string>> {
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
function readSubjects(): Set<string> {
  const src = readFileSync(path.join(SEED_DIR, "taxonomy.seed.ts"), "utf8");
  const block = /const SUBJECTS:[^=]*=\s*\[([\s\S]*?)\];/.exec(src);
  if (!block) throw new Error("could not locate SUBJECTS array in taxonomy.seed.ts");
  const slugs = new Set<string>();
  for (const m of block[1]!.matchAll(/slug:\s*"([^"]+)"/g)) slugs.add(m[1]!);
  return slugs;
}

function main(): void {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: tsx src/validate-admissions.ts <admissions-dir>");
    process.exit(2);
  }
  // pnpm runs scripts from the package dir but exposes the invocation dir via INIT_CWD,
  // so a relative path is resolved against where the user actually typed it.
  const base = process.env.INIT_CWD ?? process.cwd();
  const root = path.isAbsolute(dir) ? dir : path.resolve(base, dir);

  const schoolDepts = readSchoolDepts();
  const subjects = readSubjects();

  const files = (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith("schedule.yml") || e.endsWith("departments.yml"))
    .sort();

  const errors: string[] = [];
  let ok = 0;

  for (const rel of files) {
    const full = path.join(root, rel);
    let raw: unknown;
    try {
      raw = parseYaml(readFileSync(full, "utf8"));
    } catch (e) {
      errors.push(`${rel}: YAML parse error - ${(e as Error).message}`);
      continue;
    }

    if (rel.endsWith("schedule.yml")) {
      const r = ScheduleYml.safeParse(raw);
      if (!r.success) {
        errors.push(
          `${rel}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
        );
        continue;
      }
      ok++;
      continue;
    }

    // departments.yml
    const r = DepartmentsYml.safeParse(raw);
    if (!r.success) {
      errors.push(
        `${rel}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
      );
      continue;
    }
    const school = r.data.school;
    const validDepts = schoolDepts.get(school);
    if (!validDepts) {
      errors.push(`${rel}: unknown school "${school}" (not in schools.seed)`);
      continue;
    }
    for (const dep of r.data.depts) {
      if (!validDepts.has(dep.dept)) {
        errors.push(`${rel}: dept "${dep.dept}" not seeded for school "${school}"`);
      }
      for (const g of dep.groups) {
        for (const p of g.papers ?? []) {
          for (const s of p.subjects ?? []) {
            if (!subjects.has(s))
              errors.push(
                `${rel}: ${dep.dept}/${g.code || "-"} paper "${p.name}" - unknown subject "${s}"`,
              );
          }
        }
      }
    }
    ok++;
  }

  console.warn(
    `validate-admissions: ${files.length} file(s), ${ok} parsed ok, ${errors.length} error(s)`,
  );
  for (const e of errors) console.error(`  ${e}`);
  if (errors.length > 0) process.exit(1);
}

main();
