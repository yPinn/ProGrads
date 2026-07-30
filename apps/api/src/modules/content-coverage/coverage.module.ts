import { Module } from "@nestjs/common";
import { CoverageController } from "./coverage.controller.js";
import { CoverageRepository } from "./coverage.repository.js";
import { CoverageService } from "./coverage.service.js";

// Dev-only content-repo inventory. Always registered, but CoverageService 404s unless
// CONTENT_DIR is configured — a deployment without the content repo checked out gets a 404,
// same as if the route didn't exist.
@Module({
  controllers: [CoverageController],
  providers: [CoverageService, CoverageRepository],
})
export class CoverageModule {}
