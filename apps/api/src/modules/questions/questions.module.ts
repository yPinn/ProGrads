import { Module } from "@nestjs/common";
import { QuestionsController } from "./questions.controller.js";
import { QuestionsRepository } from "./questions.repository.js";
import { QuestionsService } from "./questions.service.js";

// Question bank domain: the global shared library, queried across schools by subject.
@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository],
})
export class QuestionsModule {}
