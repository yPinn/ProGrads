import { Module } from "@nestjs/common";
import { AdmissionsController } from "./admissions.controller.js";
import { AdmissionsRepository } from "./admissions.repository.js";
import { AdmissionsService } from "./admissions.service.js";
import { SchedulesController } from "./schedules.controller.js";

// Admissions axis domain: admission groups/rounds + flat event calendar, sharing a cohesive
// service + repository.
@Module({
  controllers: [AdmissionsController, SchedulesController],
  providers: [AdmissionsService, AdmissionsRepository],
})
export class AdmissionsModule {}
