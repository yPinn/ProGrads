import { readFileSync } from "node:fs";
import { RegistrationYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import { readSchoolDepts } from "../seed-refs.js";
import { type CheckResult, type ContentValidator, formatZodIssues } from "./runner.js";

// admission-stats/**/registration.yml — RegistrationYml contract, plus dept slugs (where
// present) against the seed source of truth. Rows without a resolved `dept` (joint-recruit
// codes, or depts not yet covered by departments.yml) are allowed through: sync skips them.
const schoolDepts = readSchoolDepts();

export const admissionStatsValidator: ContentValidator = {
  label: "validate-admission-stats",
  match: (rel) => rel.endsWith("registration.yml"),
  checkFile(rel, full): CheckResult {
    let raw: unknown;
    try {
      raw = parseYaml(readFileSync(full, "utf8"));
    } catch (e) {
      return { ok: false, errors: [`${rel}: YAML parse error - ${(e as Error).message}`] };
    }

    const r = RegistrationYml.safeParse(raw);
    if (!r.success) return { ok: false, errors: [`${rel}: ${formatZodIssues(r.error)}`] };

    const school = r.data.school;
    const validDepts = schoolDepts.get(school);
    if (!validDepts)
      return { ok: false, errors: [`${rel}: unknown school "${school}" (not in schools.seed)`] };

    const errors: string[] = [];
    for (const row of r.data.rows) {
      if (row.dept && !validDepts.has(row.dept)) {
        errors.push(
          `${rel}: row "${row.official_code}" (${row.name}) - dept "${row.dept}" not seeded for school "${school}"`,
        );
      }
    }
    return { ok: true, errors };
  },
};
