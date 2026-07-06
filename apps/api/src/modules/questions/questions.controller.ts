import { Controller, Get, Param, Query } from "@nestjs/common";
import type {
  Meta,
  PaperSummary,
  PaperTest,
  QuestionDetail,
  QuestionFacets,
  QuestionSummary,
} from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiBadRequest, ApiNotFound } from "../../common/api-error-responses.js";
import { QuestionQueryDto } from "./dto/question-query.dto.js";
import {
  PapersResponseDto,
  PaperTestResponseDto,
  QuestionFacetsResponseDto,
  QuestionResponseDto,
  QuestionsResponseDto,
} from "./dto/questions-response.dto.js";
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

  @Get("papers")
  @ApiOperation({
    summary: "以考卷為單位列出題庫",
    description:
      "考卷視圖：每筆為一張卷（ExamSubject）並附其題目清單（供題號選擇）。沿用 `subject` / `track` / `school` / `year` / `type` 過濾，並以 `page` / `pageSize` 於**卷層級**分頁。",
  })
  @ApiOkResponse({ type: PapersResponseDto })
  @ApiBadRequest()
  async papers(@Query() query: QuestionQueryDto): Promise<{ data: PaperSummary[]; meta: Meta }> {
    return this.service.getPapers(
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

  @Get("facets")
  @ApiOperation({
    summary: "題庫篩選 facets",
    description:
      "回傳**實際有題目**的考科(含考卷份數)、學校與年度,供題庫下拉收斂,避免列出空題庫的選項。",
  })
  @ApiOkResponse({ type: QuestionFacetsResponseDto })
  async facets(): Promise<{ data: QuestionFacets }> {
    return { data: await this.service.getFacets() };
  }

  // Must precede the ":externalId" catch-all — a two-segment "papers/:id" won't clash with the
  // single-segment ":externalId", but keep it grouped with the other papers routes for clarity.
  @Get("papers/:examSubjectId")
  @ApiOperation({
    summary: "取得整卷測驗題目",
    description:
      "回傳單一考卷（ExamSubject）的所有題目全文，含選項（附正解）與標準解析，供整卷計時測驗。前端於作答前隱藏正解／解析，交卷後才揭曉並批改。",
  })
  @ApiOkResponse({ type: PaperTestResponseDto })
  @ApiNotFound()
  async paperTest(@Param("examSubjectId") examSubjectId: string): Promise<{ data: PaperTest }> {
    return { data: await this.service.getPaperTest(examSubjectId) };
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
