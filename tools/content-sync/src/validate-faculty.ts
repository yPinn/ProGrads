import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { FacultyYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import { parseFacultyPath } from "./faculty.js";
import { readSchoolDepts } from "./seed-refs.js";

// Offline contract gate for faculty YAML. Checks the shared schema and local seed
// references without requiring Postgres.
// Checks:
//   1. FacultyYml Zod contract.
//   2. (school, dept) slugs against the seed source of truth + body↔path agreement.
// Usage: tsx src/validate-faculty.ts <faculty-dir>

function main(): void {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: tsx src/validate-faculty.ts <faculty-dir>");
    process.exit(2);
  }
  // pnpm runs scripts from the package dir but exposes the invocation dir via INIT_CWD,
  // so a relative path is resolved against where the user actually typed it.
  const base = process.env.INIT_CWD ?? process.cwd();
  const root = path.isAbsolute(dir) ? dir : path.resolve(base, dir);

  const schoolDepts = readSchoolDepts();

  const files = (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(".yml"))
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

    const r = FacultyYml.safeParse(raw);
    if (!r.success) {
      errors.push(
        `${rel}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
      );
      continue;
    }

    // Path form is faculty/<school>/<dept>.yml; readdir yields it relative to <faculty-dir>,
    // so re-prefix "faculty/" to reuse the walker's path parser + body↔path check.
    let pathRef: { school: string; dept: string };
    try {
      pathRef = parseFacultyPath(`faculty/${rel}`);
    } catch (e) {
      errors.push(`${rel}: ${(e as Error).message}`);
      continue;
    }
    if (r.data.school !== pathRef.school || r.data.dept !== pathRef.dept) {
      errors.push(
        `${rel}: body (${r.data.school}, ${r.data.dept}) != path (${pathRef.school}, ${pathRef.dept})`,
      );
      continue;
    }

    const validDepts = schoolDepts.get(r.data.school);
    if (!validDepts) {
      errors.push(`${rel}: unknown school "${r.data.school}" (not in schools.seed)`);
      continue;
    }
    if (!validDepts.has(r.data.dept)) {
      errors.push(`${rel}: dept "${r.data.dept}" not seeded for school "${r.data.school}"`);
      continue;
    }
    ok++;
  }

  console.warn(
    `validate-faculty: ${files.length} file(s), ${ok} parsed ok, ${errors.length} error(s)`,
  );
  for (const e of errors) console.error(`  ${e}`);
  if (errors.length > 0) process.exit(1);
}

main();
