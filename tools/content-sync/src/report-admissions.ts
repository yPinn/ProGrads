import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DepartmentsYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";

// Admissions coverage report. Cross-references the seed's schools/EECS departments (source of
// truth) against admissions/<year>/<school>/[<season>/]{schedule.yml,departments.yml}, and prints
// per (year, school): file presence (prospectus / schedule / departments) plus which EECS seed
// departments have admission groups vs are still missing. Read-only planning aid to direct
// gap-filling order — no DB, no writes. Mirrors report-coverage.ts (faculty).
// Usage: tsx src/report-admissions.ts <admissions-dir> [--gaps] [--md]
//   --gaps  list only fillable holes: (year, school) with a prospectus but no departments.yml,
//           and per built file the missing EECS departments
//   --md    emit a Markdown table instead of the console layout

// EECS exam tracks — the axis admissions content actually covers. Business/humanities
// departments exist in the seed for the faculty axis but are out of admissions scope, so they
// are not counted as coverage gaps here.
const EECS_TRACKS = new Set(["cs", "ee", "info-mgmt"]);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(HERE, "../../../packages/db/prisma/seed/schools.seed.ts");

interface Dept {
  slug: string;
  name: string;
  track: string;
}
interface School {
  slug: string;
  name: string;
  depts: Dept[];
}
interface Unit {
  year: number;
  school: string;
  season: string; // "exam" default; else recruit / in-service
  prospectus: boolean;
  schedule: boolean;
  departments: boolean;
  coveredDepts: string[]; // dept slugs with at least one group
  groups: number;
  bad?: string; // path/contract error
}

// Parse the seed (textually, like report-coverage) into ordered schools with dept name + track.
function readSeedSchools(): School[] {
  const src = readFileSync(SEED_FILE, "utf8");
  const schools: School[] = [];
  let current: School | null = null;
  for (const line of src.split(/\r?\n/)) {
    const dept = /\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*track:\s*"([^"]+)"\s*\}/.exec(
      line,
    );
    if (dept && current) {
      current.depts.push({ slug: dept[1]!, name: dept[2]!, track: dept[3]! });
      continue;
    }
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

// Walk the admissions dir → one Unit per (year, school, season) directory.
function readUnits(root: string): Unit[] {
  const units = new Map<string, Unit>();
  const entries = (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .sort();

  for (const rel of entries) {
    const parts = rel.split("/").filter(Boolean);
    // <year>/<school>/<file> or <year>/<school>/<season>/<file>
    if (parts.length !== 3 && parts.length !== 4) continue;
    const file = parts.at(-1)!;
    if (!/\.(ya?ml|pdf)$/.test(file)) continue;
    const year = Number.parseInt(parts[0]!, 10);
    if (!Number.isInteger(year)) continue;
    const school = parts[1]!;
    const season = parts.length === 4 ? parts[2]! : "exam";
    const key = `${year}/${school}/${season}`;
    const unit: Unit = units.get(key) ?? {
      year,
      school,
      season,
      prospectus: false,
      schedule: false,
      departments: false,
      coveredDepts: [],
      groups: 0,
    };
    if (file === "prospectus.pdf") unit.prospectus = true;
    else if (file === "schedule.yml") unit.schedule = true;
    else if (file === "departments.yml") {
      unit.departments = true;
      try {
        const yml = DepartmentsYml.parse(parseYaml(readFileSync(path.join(root, rel), "utf8")));
        unit.coveredDepts = yml.depts.map((d) => d.dept);
        unit.groups = yml.depts.reduce((s, d) => s + d.groups.length, 0);
      } catch (err) {
        unit.bad = err instanceof Error ? err.message.split("\n")[0] : String(err);
      }
    }
    units.set(key, unit);
  }
  return [...units.values()].sort(
    (a, b) =>
      b.year - a.year || a.school.localeCompare(b.school) || a.season.localeCompare(b.season),
  );
}

// Report output goes to stdout (so it can be piped); console.log is disallowed by lint.
const out = (s: string): void => void process.stdout.write(`${s}\n`);
const mark = (b: boolean): string => (b ? "✓" : "·");

function main(): void {
  const args = process.argv.slice(2);
  const gapsOnly = args.includes("--gaps");
  const asMd = args.includes("--md");
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("Usage: tsx src/report-admissions.ts <admissions-dir> [--gaps] [--md]");
    process.exit(2);
  }
  const base = process.env.INIT_CWD ?? process.cwd();
  const root = path.isAbsolute(dir) ? dir : path.resolve(base, dir);

  const schools = readSeedSchools();
  const seedBySlug = new Map(schools.map((s) => [s.slug, s]));
  const units = readUnits(root);

  // EECS seed depts for a school (empty for non-seed schools like ust).
  const eecsDepts = (slug: string): Dept[] =>
    (seedBySlug.get(slug)?.depts ?? []).filter((d) => EECS_TRACKS.has(d.track));

  if (gapsOnly) {
    out("# Admissions gaps\n");
    out("## Fillable: prospectus present but no departments.yml");
    const fillable = units.filter((u) => u.prospectus && !u.departments);
    if (fillable.length === 0) out("  (none)");
    for (const u of fillable) {
      const tag = seedBySlug.has(u.school) ? "" : " [non-seed school]";
      out(`  - ${u.year}/${u.school}${u.season === "exam" ? "" : `/${u.season}`}${tag}`);
    }
    out("\n## Incomplete: EECS seed departments missing from an existing departments.yml");
    for (const u of units.filter((x) => x.departments && !x.bad)) {
      const eecs = eecsDepts(u.school);
      if (eecs.length === 0) continue;
      const missing = eecs.filter((d) => !u.coveredDepts.includes(d.slug));
      if (missing.length === 0) continue;
      out(
        `  - ${u.year}/${u.school}: missing ${missing.map((d) => `${d.slug}(${d.name})`).join(", ")}`,
      );
    }
    return;
  }

  if (asMd) {
    out("# Admissions coverage\n");
    out("| Year | School | Prospectus | Schedule | Departments | Groups | EECS depts |");
    out("|---|---|:-:|:-:|:-:|---:|---|");
    for (const u of units) {
      const eecs = eecsDepts(u.school);
      const covered = eecs.filter((d) => u.coveredDepts.includes(d.slug)).length;
      const eecsCol = eecs.length > 0 ? `${covered}/${eecs.length}` : "—";
      const sch = u.season === "exam" ? u.school : `${u.school}/${u.season}`;
      out(
        `| ${u.year} | ${sch} | ${mark(u.prospectus)} | ${mark(u.schedule)} | ${mark(u.departments)} | ${u.groups || "—"} | ${eecsCol} |`,
      );
    }
    return;
  }

  // Default: grouped console layout, one line per unit, grouped by year.
  let lastYear = -1;
  for (const u of units) {
    if (u.year !== lastYear) {
      out(`\n══ ${u.year} ══`);
      lastYear = u.year;
    }
    const eecs = eecsDepts(u.school);
    const missing = eecs.filter((d) => !u.coveredDepts.includes(d.slug));
    const eecsCol =
      eecs.length > 0
        ? `EECS ${eecs.length - missing.length}/${eecs.length}${missing.length > 0 ? ` (缺 ${missing.map((d) => d.slug).join(",")})` : ""}`
        : seedBySlug.has(u.school)
          ? "無 EECS 系所"
          : "非 seed 學校";
    const sch = u.season === "exam" ? u.school : `${u.school}/${u.season}`;
    const files = `prospectus ${mark(u.prospectus)}  schedule ${mark(u.schedule)}  departments ${mark(u.departments)}`;
    out(`  ${sch.padEnd(14)} ${files}  ${u.groups ? `${u.groups} groups  ` : ""}${eecsCol}`);
    if (u.bad) out(`      ! departments.yml: ${u.bad}`);
  }

  const withDepts = units.filter((u) => u.departments).length;
  const fillable = units.filter((u) => u.prospectus && !u.departments).length;
  out(
    `\n──\n${units.length} (year,school) units  ·  ${withDepts} with departments.yml  ·  ${fillable} fillable (prospectus, no departments)`,
  );
}

main();
