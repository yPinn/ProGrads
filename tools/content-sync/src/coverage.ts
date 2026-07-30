// Library entrypoint (package.json "main"/"exports") — the compute*Coverage functions only,
// for apps/api's dev-only coverage module. Deliberately narrow: does NOT re-export index.ts /
// validate.ts / sync.ts, which touch the DB and are CLI-only entrypoints, not importable library
// surface.
export { computeFacultyCoverage } from "./report-coverage.js";
export type { FacultyCoverageResult, FacultyCoverageDept } from "./report-coverage.js";

export { computeAdmissionsCoverage } from "./report-admissions.js";
export type { AdmissionsCoverageResult, AdmissionsCoverageUnit } from "./report-admissions.js";

export { computeQuestionsCoverage } from "./report-questions.js";
export type { QuestionsCoverageResult, QuestionsCoveragePaper } from "./report-questions.js";

export { computeAdmissionStatsCoverage } from "./report-admission-stats.js";
export type {
  AdmissionStatsCoverageResult,
  AdmissionStatsCoverageUnit,
} from "./report-admission-stats.js";
