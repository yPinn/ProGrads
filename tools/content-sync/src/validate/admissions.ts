import { readFileSync } from "node:fs";
import { DepartmentsYml, ScheduleYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import { readSchoolDepts, readSubjects } from "../seed-refs.js";
import { type CheckResult, type ContentValidator, formatZodIssues } from "./runner.js";

// admissions/**/{schedule,departments}.yml — ScheduleYml / DepartmentsYml contracts, plus
// department and subject slugs against the seed source of truth.
const schoolDepts = readSchoolDepts();
const subjects = readSubjects();

export const admissionsValidator: ContentValidator = {
  label: "validate-admissions",
  match: (rel) => rel.endsWith("schedule.yml") || rel.endsWith("departments.yml"),
  checkFile(rel, full): CheckResult {
    let raw: unknown;
    try {
      raw = parseYaml(readFileSync(full, "utf8"));
    } catch (e) {
      return { ok: false, errors: [`${rel}: YAML parse error - ${(e as Error).message}`] };
    }

    if (rel.endsWith("schedule.yml")) {
      const r = ScheduleYml.safeParse(raw);
      if (!r.success) return { ok: false, errors: [`${rel}: ${formatZodIssues(r.error)}`] };
      return { ok: true, errors: [] };
    }

    // departments.yml
    const r = DepartmentsYml.safeParse(raw);
    if (!r.success) return { ok: false, errors: [`${rel}: ${formatZodIssues(r.error)}`] };
    const school = r.data.school;
    const validDepts = schoolDepts.get(school);
    if (!validDepts)
      return { ok: false, errors: [`${rel}: unknown school "${school}" (not in schools.seed)`] };

    const errors: string[] = [];
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
    return { ok: true, errors };
  },
};
