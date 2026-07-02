import { Module } from "@nestjs/common";
import { FacultyController } from "./faculty.controller.js";
import { FacultyRepository } from "./faculty.repository.js";
import { FacultyService } from "./faculty.service.js";

// Faculty axis domain: department faculty rosters (research areas + thesis evidence).
@Module({
  controllers: [FacultyController],
  providers: [FacultyService, FacultyRepository],
})
export class FacultyModule {}
