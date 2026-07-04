import { VALIDATORS } from "./validate/registry.js";
import { runValidator } from "./validate/runner.js";

// Single entry for the offline content validators. `validate <type> <dir>` dispatches to the
// registered ContentValidator. The old per-type scripts are thin package.json aliases of this.
// Usage: tsx src/validate.ts <faculty|admissions|questions> <dir>

const [type, dir] = process.argv.slice(2);
const types = Object.keys(VALIDATORS).join(" | ");

const validator = type ? VALIDATORS[type] : undefined;
if (!validator) {
  console.error(`Usage: tsx src/validate.ts <${types}> <dir>`);
  process.exit(2);
}
if (!dir) {
  console.error(`Usage: tsx src/validate.ts ${type} <dir>`);
  process.exit(2);
}

runValidator(validator, dir);
