import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FacultyYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import { parseFacultyPath } from "./faculty.js";

// Faculty coverage report. Cross-references the seed's schools/departments (source of truth)
// against the faculty YAML files, and prints what is built vs missing plus per-file field
// completeness (title / research areas / theses). Read-only planning aid to direct
// gap-filling order — no DB, no writes.
// Usage: tsx src/report-coverage.ts <faculty-dir> [--gaps] [--md]
//   --gaps  list only the not-yet-built departments (grouped by track)
//   --md    emit a Markdown table instead of the console layout

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
interface Built {
  members: number;
  withTitle: number;
  withResearch: number;
  thesesMembers: number;
  authored: number;
  withDegrees: number;
  asOf: string;
}

// Parse the seed (textually, like seed-refs) into ordered schools with dept name + track.
function readSeedSchools(): School[] {
  const src = readFileSync(SEED_FILE, "utf8");
  const schools: School[] = [];
  let current: School | null = null;
  for (const line of src.split(/\r?\n/)) {
    // Dept rows carry a track and live inside braces: { slug: "x", name: "y", track: "z" },
    const dept = /\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*track:\s*"([^"]+)"\s*\}/.exec(
      line,
    );
    if (dept && current) {
      current.depts.push({ slug: dept[1]!, name: dept[2]!, track: dept[3]! });
      continue;
    }
    // A standalone `slug: "x",` line opens a new school; its `name:` follows.
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

// Walk the faculty dir → per-file field tallies, keyed "school/dept". Orphans = files whose
// path is malformed or that fail the shared contract (surfaced separately, not counted).
function readBuilt(root: string): { built: Map<string, Built>; orphans: string[] } {
  const built = new Map<string, Built>();
  const orphans: string[] = [];
  const files = (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(".yml"))
    .sort();

  for (const rel of files) {
    let ref: { school: string; dept: string };
    try {
      ref = parseFacultyPath(`faculty/${rel}`);
    } catch {
      orphans.push(`${rel} (bad path)`);
      continue;
    }
    let data: FacultyYml;
    try {
      data = FacultyYml.parse(parseYaml(readFileSync(path.join(root, rel), "utf8")));
    } catch {
      orphans.push(`${rel} (contract error)`);
      continue;
    }
    const m = data.members;
    built.set(`${ref.school}/${ref.dept}`, {
      members: m.length,
      withTitle: m.filter((x) => !!x.title).length,
      withResearch: m.filter((x) => x.research_areas.length > 0).length,
      thesesMembers: m.filter((x) => x.theses.length > 0).length,
      authored: m.reduce((s, x) => s + x.theses.filter((t) => t.role === "authored").length, 0),
      withDegrees: m.filter((x) => x.degrees.length > 0).length,
      asOf: data.as_of ?? "-",
    });
  }
  return { built, orphans };
}

const pct = (num: number, den: number): string =>
  den === 0 ? "-" : `${Math.round((100 * num) / den)}%`;

// Report output goes to stdout (so it can be piped); console.log is disallowed by lint.
const out = (s: string): void => void process.stdout.write(`${s}\n`);

function main(): void {
  const args = process.argv.slice(2);
  const gapsOnly = args.includes("--gaps");
  const asMd = args.includes("--md");
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("Usage: tsx src/report-coverage.ts <faculty-dir> [--gaps] [--md]");
    process.exit(2);
  }
  const base = process.env.INIT_CWD ?? process.cwd();
  const root = path.isAbsolute(dir) ? dir : path.resolve(base, dir);

  const schools = readSeedSchools();
  const { built, orphans } = readBuilt(root);

  const totalDepts = schools.reduce((s, sc) => s + sc.depts.length, 0);
  const builtDepts = schools.reduce(
    (s, sc) => s + sc.depts.filter((d) => built.has(`${sc.slug}/${d.slug}`)).length,
    0,
  );

  if (gapsOnly) {
    // Missing departments grouped by track (the axis that drives exam-track value).
    const byTrack = new Map<string, string[]>();
    for (const sc of schools) {
      for (const d of sc.depts) {
        if (built.has(`${sc.slug}/${d.slug}`)) continue;
        const list = byTrack.get(d.track) ?? [];
        list.push(`${sc.slug}/${d.slug} (${d.name})`);
        byTrack.set(d.track, list);
      }
    }
    out(`# Faculty gaps — ${totalDepts - builtDepts}/${totalDepts} departments unbuilt\n`);
    for (const track of [...byTrack.keys()].sort()) {
      const list = byTrack.get(track)!;
      out(`## ${track} (${list.length})`);
      for (const item of list) out(`  - ${item}`);
      out("");
    }
    return;
  }

  if (asMd) {
    out(`# Faculty coverage — ${builtDepts}/${totalDepts} departments built\n`);
    out("| School | Dept | Track | Members | Title | Research | Theses | as_of |");
    out("|---|---|---|---:|---:|---:|---:|---|");
    for (const sc of schools) {
      for (const d of sc.depts) {
        const b = built.get(`${sc.slug}/${d.slug}`);
        const row = b
          ? `${b.members} | ${pct(b.withTitle, b.members)} | ${pct(b.withResearch, b.members)} | ${b.thesesMembers > 0 ? `${b.thesesMembers}m/${b.authored}a` : "-"} | ${b.asOf}`
          : "— | — | — | — | —";
        out(`| ${sc.slug} | ${d.slug} (${d.name}) | ${d.track} | ${row} |`);
      }
    }
    return;
  }

  // Default: grouped console layout, one line per dept.
  const totalMembers = [...built.values()].reduce((s, b) => s + b.members, 0);
  for (const sc of schools) {
    const scBuilt = sc.depts.filter((d) => built.has(`${sc.slug}/${d.slug}`)).length;
    out(`\n${sc.slug}  ${sc.name}  [${scBuilt}/${sc.depts.length}]`);
    for (const d of sc.depts) {
      const b = built.get(`${sc.slug}/${d.slug}`);
      if (b) {
        const flags = [
          `${b.members}人`,
          `職稱 ${pct(b.withTitle, b.members)}`,
          `研究 ${pct(b.withResearch, b.members)}`,
          b.thesesMembers > 0 ? `著作 ${b.thesesMembers}人/${b.authored}筆` : "著作 -",
        ].join("  ");
        out(`  ✓ ${d.slug.padEnd(12)} ${d.track.padEnd(14)} ${flags}  (${b.asOf})`);
      } else {
        out(`  · ${d.slug.padEnd(12)} ${d.track.padEnd(14)} ${d.name}`);
      }
    }
  }

  out(
    `\n──\nCoverage: ${builtDepts}/${totalDepts} departments  ·  ${totalMembers} faculty across ${built.size} files`,
  );
  if (orphans.length > 0) {
    out(`Orphan/invalid files (${orphans.length}):`);
    for (const o of orphans) out(`  ! ${o}`);
  }
}

main();
