import { Controller, Get, Param, Query } from "@nestjs/common";
import type { Meta, QuestionDetail, QuestionSummary } from "@prograds/shared";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { QuestionQueryDto } from "./dto/question-query.dto.js";
import { QuestionResponseDto, QuestionsResponseDto } from "./dto/questions-response.dto.js";
import { QuestionsService } from "./questions.service.js";

@ApiTags("questions")
@Controller("questions")
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  // Cross-school practice of one subject: ?subject=algorithms (the killer query). Paginated.
  @Get()
  @ApiOkResponse({ type: QuestionsResponseDto })
  async list(@Query() query: QuestionQueryDto): Promise<{ data: QuestionSummary[]; meta: Meta }> {
    return this.service.getQuestions(
      {
        subject: query.subject,
        track: query.track,
        school: query.school,
        year: query.year,
        type: query.type,
      },
      query.page,
      query.pageSize,
    );
  }

  @Get(":externalId")
  @ApiOkResponse({ type: QuestionResponseDto })
  async get(@Param("externalId") externalId: string): Promise<{ data: QuestionDetail }> {
    return { data: await this.service.getQuestion(externalId) };
  }
}
