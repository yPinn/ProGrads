import { readdirSync } from "node:fs";
import path from "node:path";

// Shared skeleton for the offline content validators. Each content type supplies a
// ContentValidator (file filter + per-file checks + optional cross-file finalize) and this
// runner owns the CLI boilerplate they all duplicated: arg/root resolution, the recursive
// file walk, the summary line, and exit codes. No Postgres. Adding a content type = one
// ContentValidator module + one registry entry — no new command, no re-copied skeleton.

export interface CheckResult {
  // Did the file clear the parse/schema/path gates? Mirrors the old `ok++`: a file can be
  // ok yet still carry late semantic errors (e.g. duplicate name / slug checks).
  ok: boolean;
  errors: string[];
  warnings?: string[];
  record?: unknown; // per-file datum handed to finalize() for cross-file invariants
}

export interface ContentValidator {
  label: string; // summary prefix, e.g. "validate-faculty"
  reportWarnings?: boolean; // append ", N warning(s)" to the summary (questions only)
  match(rel: string): boolean;
  checkFile(rel: string, full: string): CheckResult;
  finalize?(records: unknown[]): { errors: string[]; warnings?: string[] };
}

// pnpm runs scripts from the package dir but exposes the invocation dir via INIT_CWD,
// so a relative path is resolved against where the user actually typed it.
export function resolveRoot(dir: string): string {
  const base = process.env.INIT_CWD ?? process.cwd();
  return path.isAbsolute(dir) ? dir : path.resolve(base, dir);
}

// Recursive file list, forward-slash normalised and sorted (stable messages).
export function walkFiles(root: string): string[] {
  return (readdirSync(root, { recursive: true }) as string[])
    .map((e) => e.replace(/\\/g, "/"))
    .sort();
}

// Structural shape of a Zod error's issues, so this package need not depend on zod directly
// (the schemas come via @prograds/shared).
type ZodIssueLike = { path: ReadonlyArray<PropertyKey>; message: string };

export function formatZodIssues(err: { issues: ReadonlyArray<ZodIssueLike> }): string {
  return err.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ");
}

// Walk, filter, per-file check, cross-file finalize, then print the summary + issues and
// exit(1) on any error. Exit code / message format match the pre-refactor per-type scripts.
export function runValidator(v: ContentValidator, dir: string): void {
  const root = resolveRoot(dir);
  const files = walkFiles(root).filter((rel) => v.match(rel));

  const errors: string[] = [];
  const warnings: string[] = [];
  const records: unknown[] = [];
  let ok = 0;

  for (const rel of files) {
    const res = v.checkFile(rel, path.join(root, rel));
    if (res.ok) ok++;
    errors.push(...res.errors);
    if (res.warnings) warnings.push(...res.warnings);
    if (res.record !== undefined) records.push(res.record);
  }

  if (v.finalize) {
    const fin = v.finalize(records);
    errors.push(...fin.errors);
    if (fin.warnings) warnings.push(...fin.warnings);
  }

  let summary = `${v.label}: ${files.length} file(s), ${ok} parsed ok, ${errors.length} error(s)`;
  if (v.reportWarnings) summary += `, ${warnings.length} warning(s)`;

  console.warn(summary);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  for (const e of errors) console.error(`  ${e}`);
  if (errors.length > 0) process.exit(1);
}
