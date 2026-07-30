import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RegistrationYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import { readUnits as readAdmissionUnits } from "./report-admissions.js";

// Admission-stats coverage report. Cross-references admissions/<year>/<school>/[<season>/]
// departments.yml (built = the admissions round is seeded) against admission-stats/<year>/
// <school>/[<season>/]registration.yml presence, and prints per (year, school[, season]):
// registration.yml presence + row count, flagging "admissions built, no registration.yml yet"
// as the fillable gap. Read-only planning aid; no DB, no writes. Mirrors report-admissions.ts.
// Usage: tsx src/report-admission-stats.ts <admission-stats-dir> <admissions-dir> [--gaps] [--md]
//   --gaps  list only fillable holes: (year, school[, season]) with admissions built but no
//           registration.yml
//   --md    emit a Markdown table instead of the console layout

interface RegistrationUnit {
  year: number;
  school: string;
  season: string; // "exam" default; else recommended / in_service
  rows: number;
  bad?: string; // parse/contract error
}

// Walk the admission-stats dir → one RegistrationUnit per registration.yml file.
function readRegistrationUnits(root: string): Map<string, RegistrationUnit> {
  const units = new Map<string, RegistrationUnit>();
  let entries: string[];
  try {
    entries = (readdirSync(root, { recursive: true }) as string[]).map((e) =>
      e.replace(/\\/g, "/"),
    );
  } catch {
    return units; // dir not present yet
  }

  for (const rel of entries.filter((e) => e.endsWith("registration.yml")).sort()) {
    const parts = rel.split("/").filter(Boolean);
    if (parts.length !== 3 && parts.length !== 4) continue;
    const year = Number.parseInt(parts[0]!, 10);
    if (!Number.isInteger(year)) continue;
    const school = parts[1]!;
    const season = parts.length === 4 ? parts[2]! : "exam";
    const key = `${year}/${school}/${season}`;
    try {
      const yml = RegistrationYml.parse(parseYaml(readFileSync(path.join(root, rel), "utf8")));
      units.set(key, { year, school, season, rows: yml.rows.length });
    } catch (err) {
      units.set(key, {
        year,
        school,
        season,
        rows: 0,
        bad: err instanceof Error ? err.message.split("\n")[0] : String(err),
      });
    }
  }
  return units;
}

// JSON-friendly shape for the coverage dev page (apps/web /coverage).
export interface AdmissionStatsCoverageUnit {
  year: number;
  school: string;
  season: string;
  present: boolean;
  rows: number;
  admissionsBuilt: boolean;
  bad?: string;
}
export interface AdmissionStatsCoverageResult {
  units: AdmissionStatsCoverageUnit[];
  totalUnits: number;
  withRegistration: number;
  fillable: number; // admissions built, no registration.yml yet
}

export function computeAdmissionStatsCoverage(
  statsRoot: string,
  admissionsRoot: string,
): AdmissionStatsCoverageResult {
  const registration = readRegistrationUnits(statsRoot);
  const builtKeys = new Set(
    readAdmissionUnits(admissionsRoot)
      .filter((u) => u.departments)
      .map((u) => `${u.year}/${u.school}/${u.season}`),
  );
  const allKeys = new Set([...builtKeys, ...registration.keys()]);

  const units = [...allKeys]
    .map((key): AdmissionStatsCoverageUnit => {
      const [yearStr, school, season] = key.split("/") as [string, string, string];
      const r = registration.get(key);
      return {
        year: Number.parseInt(yearStr, 10),
        school,
        season,
        present: !!r,
        rows: r?.rows ?? 0,
        admissionsBuilt: builtKeys.has(key),
        bad: r?.bad,
      };
    })
    .sort(
      (a, b) =>
        b.year - a.year || a.school.localeCompare(b.school) || a.season.localeCompare(b.season),
    );

  return {
    units,
    totalUnits: units.length,
    withRegistration: units.filter((u) => u.present).length,
    fillable: units.filter((u) => u.admissionsBuilt && !u.present).length,
  };
}

// Report output goes to stdout (so it can be piped); console.log is disallowed by lint.
const out = (s: string): void => void process.stdout.write(`${s}\n`);
const mark = (b: boolean): string => (b ? "✓" : "·");

function main(): void {
  const args = process.argv.slice(2);
  const gapsOnly = args.includes("--gaps");
  const asMd = args.includes("--md");
  const positional = args.filter((a) => !a.startsWith("--"));
  const [statsDir, admissionsDir] = positional;
  if (!statsDir || !admissionsDir) {
    console.error(
      "Usage: tsx src/report-admission-stats.ts <admission-stats-dir> <admissions-dir> [--gaps] [--md]",
    );
    process.exit(2);
  }
  const base = process.env.INIT_CWD ?? process.cwd();
  const statsRoot = path.isAbsolute(statsDir) ? statsDir : path.resolve(base, statsDir);
  const admissionsRoot = path.isAbsolute(admissionsDir)
    ? admissionsDir
    : path.resolve(base, admissionsDir);

  const { units, totalUnits, withRegistration, fillable } = computeAdmissionStatsCoverage(
    statsRoot,
    admissionsRoot,
  );

  if (gapsOnly) {
    out("# Admission-stats gaps\n");
    out("## Fillable: admissions built, no registration.yml yet");
    const holes = units.filter((u) => u.admissionsBuilt && !u.present);
    if (holes.length === 0) out("  (none)");
    for (const u of holes) {
      out(`  - ${u.year}/${u.school}${u.season === "exam" ? "" : `/${u.season}`}`);
    }
    return;
  }

  if (asMd) {
    out("# Admission-stats coverage\n");
    out("| Year | School | Admissions built | Registration | Rows |");
    out("|---|---|:-:|:-:|---:|");
    for (const u of units) {
      const sch = u.season === "exam" ? u.school : `${u.school}/${u.season}`;
      out(
        `| ${u.year} | ${sch} | ${mark(u.admissionsBuilt)} | ${mark(u.present)} | ${u.present ? u.rows : "—"} |`,
      );
    }
    return;
  }

  let lastYear = -1;
  for (const u of units) {
    if (u.year !== lastYear) {
      out(`\n══ ${u.year} ══`);
      lastYear = u.year;
    }
    const sch = u.season === "exam" ? u.school : `${u.school}/${u.season}`;
    out(
      `  ${sch.padEnd(14)} admissions ${mark(u.admissionsBuilt)}  registration ${mark(u.present)}${u.present ? `  ${u.rows} rows` : ""}`,
    );
    if (u.bad) out(`      ! registration.yml: ${u.bad}`);
  }

  out(
    `\n──\n${totalUnits} (year,school) units  ·  ${withRegistration} with registration.yml  ·  ${fillable} fillable (admissions built, no registration)`,
  );
}

// Only run the CLI when this file is the process entrypoint — see report-coverage.ts.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
