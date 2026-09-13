import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller.js";
import { ReportsRepository } from "./reports.repository.js";
import { ReportsService } from "./reports.service.js";

// Public error-report submission on questions/explanations (P0 trust-loop roadmap item).
@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
