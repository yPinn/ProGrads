import { admissionStatsValidator } from "./admission-stats.js";
import { admissionsValidator } from "./admissions.js";
import { facultyValidator } from "./faculty.js";
import { questionsValidator } from "./questions.js";
import type { ContentValidator } from "./runner.js";

// The content-type registry. Add a content type here (plus its module) and it is reachable
// via `validate <type> <dir>` — no new command, no new skeleton.
export const VALIDATORS: Record<string, ContentValidator> = {
  faculty: facultyValidator,
  admissions: admissionsValidator,
  "admission-stats": admissionStatsValidator,
  questions: questionsValidator,
};
