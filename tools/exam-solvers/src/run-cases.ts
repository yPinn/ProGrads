import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Runs every case in src/cases/ (sorted). Each case is a self-asserting script that prints
// its computation and process.exit(1) on mismatch, so importing them here IS the regression
// suite — new cases are picked up automatically, with no manual test list to maintain.
// Usage: tsx src/run-cases.ts

const casesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "cases");
const files = readdirSync(casesDir)
  .filter((f) => f.endsWith(".ts"))
  .sort();

for (const f of files) {
  process.stdout.write(`\n=== ${f} ===\n`);
  try {
    await import(pathToFileURL(path.join(casesDir, f)).href);
  } catch (e) {
    // A case may fail by throwing (rather than process.exit(1)); surface it and fail the run.
    console.error(e);
    process.exit(1);
  }
}

process.stdout.write(`\n${files.length} case(s) passed.\n`);
