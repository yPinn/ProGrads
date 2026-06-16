import { Module } from "@nestjs/common";
import { ExamsController } from "./exams.controller.js";
import { ExamsRepository } from "./exams.repository.js";
import { ExamsService } from "./exams.service.js";

// Exam axis domain: exams + their papers (exam_subjects), bridging school ↔ track.
@Module({
  controllers: [ExamsController],
  providers: [ExamsService, ExamsRepository],
})
export class ExamsModule {}
