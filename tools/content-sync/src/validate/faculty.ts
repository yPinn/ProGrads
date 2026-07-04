import { readFileSync } from "node:fs";
import { FacultyYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import { parseFacultyPath } from "../faculty.js";
import { readSchoolDepts } from "../seed-refs.js";
import { type CheckResult, type ContentValidator, formatZodIssues } from "./runner.js";

// faculty/<school>/<dept>.yml — FacultyYml contract + (school, dept) slugs against the seed
// source of truth + body↔path agreement + department-scoped name uniqueness.
const schoolDepts = readSchoolDepts();

export const facultyValidator: ContentValidator = {
  label: "validate-faculty",
  match: (rel) => rel.endsWith(".yml"),
  checkFile(rel, full): CheckResult {
    let raw: unknown;
    try {
      raw = parseYaml(readFileSync(full, "utf8"));
    } catch (e) {
      return { ok: false, errors: [`${rel}: YAML parse error - ${(e as Error).message}`] };
    }

    const r = FacultyYml.safeParse(raw);
    if (!r.success) return { ok: false, errors: [`${rel}: ${formatZodIssues(r.error)}`] };

    // Path form is faculty/<school>/<dept>.yml; readdir yields it relative to <faculty-dir>,
    // so re-prefix "faculty/" to reuse the path parser + body↔path check.
    let pathRef: { school: string; dept: string };
    try {
      pathRef = parseFacultyPath(`faculty/${rel}`);
    } catch (e) {
      return { ok: false, errors: [`${rel}: ${(e as Error).message}`] };
    }
    if (r.data.school !== pathRef.school || r.data.dept !== pathRef.dept) {
      return {
        ok: false,
        errors: [
          `${rel}: body (${r.data.school}, ${r.data.dept}) != path (${pathRef.school}, ${pathRef.dept})`,
        ],
      };
    }

    const validDepts = schoolDepts.get(r.data.school);
    if (!validDepts)
      return {
        ok: false,
        errors: [`${rel}: unknown school "${r.data.school}" (not in schools.seed)`],
      };
    if (!validDepts.has(r.data.dept))
      return {
        ok: false,
        errors: [`${rel}: dept "${r.data.dept}" not seeded for school "${r.data.school}"`],
      };

    // name is the department-scoped identity key, so duplicates would silently merge on sync.
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const m of r.data.members) {
      if (seen.has(m.name))
        errors.push(`${rel}: duplicate member name "${m.name}" (name is the key)`);
      seen.add(m.name);
    }
    return { ok: true, errors };
  },
};
