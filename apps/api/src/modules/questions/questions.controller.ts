import { Controller, Get, Param, Query } from "@nestjs/common";
import type { Meta, QuestionDetail, QuestionSummary } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiBadRequest, ApiNotFound } from "../../common/api-error-responses.js";
import { QuestionQueryDto } from "./dto/question-query.dto.js";
import { QuestionResponseDto, QuestionsResponseDto } from "./dto/questions-response.dto.js";
import { QuestionsService } from "./questions.service.js";

@ApiTags("questions")
@Controller("questions")
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get()
  @ApiOperation({
    summary: "列出題目（跨校練單科）",
    description:
      "核心查詢：`?subject=algorithms` 跨校練習同一考科。另支援 `?track=`、`?school=`、`?year=`、`?type=` 過濾，並以 `page` / `pageSize` 分頁（回應含 meta）。",
  })
  @ApiOkResponse({ type: QuestionsResponseDto })
  @ApiBadRequest()
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
  @ApiOperation({
    summary: "取得單一題目",
    description: "依 externalId 取得題目詳情，含題幹、選項與所屬考卷 / 考科。",
  })
  @ApiOkResponse({ type: QuestionResponseDto })
  @ApiNotFound()
  async get(@Param("externalId") externalId: string): Promise<{ data: QuestionDetail }> {
    return { data: await this.service.getQuestion(externalId) };
  }
}
