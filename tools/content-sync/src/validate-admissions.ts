import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { DepartmentsYml, ScheduleYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import { readSchoolDepts, readSubjects } from "./seed-refs.js";

// Offline contract gate for admissions YAML. Checks shared schemas and local
// seed references without requiring Postgres.
// Checks:
//   1. ScheduleYml / DepartmentsYml Zod contracts.
//   2. Department and subject slugs against the seed source of truth.
// Usage: tsx src/validate-admissions.ts <admissions-dir>

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
