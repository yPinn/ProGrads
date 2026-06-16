import { Module } from "@nestjs/common";
import { DepartmentsController } from "./departments.controller.js";
import { SchoolsController } from "./schools.controller.js";
import { SchoolsRepository } from "./schools.repository.js";
import { SchoolsService } from "./schools.service.js";

// School axis domain: schools + departments, sharing a cohesive service + repository.
@Module({
  controllers: [SchoolsController, DepartmentsController],
  providers: [SchoolsService, SchoolsRepository],
})
export class SchoolsModule {}
