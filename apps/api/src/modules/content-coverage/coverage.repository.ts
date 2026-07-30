import path from "node:path";
import { Injectable } from "@nestjs/common";
import {
  computeAdmissionsCoverage,
  computeAdmissionStatsCoverage,
  computeFacultyCoverage,
  computeQuestionsCoverage,
} from "@prograds/content-sync";
import type { Coverage } from "@prograds/shared";

// Reads the content repo straight off disk and cross-references it against the seed (source of
// truth) — see tools/content-sync/src/coverage.ts. `root` is CONTENT_DIR, resolved by the caller
// (CoverageService) via ConfigService — not read directly here, since a raw `process.env` read
// at DI-construction time can't be guaranteed to run after dotenv has populated it.
@Injectable()
export class CoverageRepository {
  computeAll(root: string): Coverage {
    const admissionsRoot = path.join(root, "admissions");
    return {
      faculty: computeFacultyCoverage(path.join(root, "faculty")),
      admissions: computeAdmissionsCoverage(admissionsRoot),
      questions: computeQuestionsCoverage(path.join(root, "questions")),
      admissionStats: computeAdmissionStatsCoverage(
        path.join(root, "admission-stats"),
        admissionsRoot,
      ),
    };
  }
}
