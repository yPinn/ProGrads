import { Controller, Get, Param, Query } from "@nestjs/common";
import type { ExamDetail, ExamSummary } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiBadRequest, ApiNotFound } from "../../common/api-error-responses.js";
import { ExamQueryDto } from "./dto/exam-query.dto.js";
import { ExamResponseDto, ExamsResponseDto } from "./dto/exams-response.dto.js";
import { ExamsService } from "./exams.service.js";

@ApiTags("exams")
@Controller("exams")
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Get()
  @ApiOperation({
    summary: "列出考卷",
    description:
      "考卷為 school × dept × year（含合科卷）。可用 `?school=`、`?track=`、`?year=`、`?admissionType=` slug 過濾。",
  })
  @ApiOkResponse({ type: ExamsResponseDto })
  @ApiBadRequest()
  async list(@Query() query: ExamQueryDto): Promise<{ data: ExamSummary[] }> {
    return {
      data: await this.service.getExams({
        school: query.school,
        track: query.track,
        year: query.year,
        admissionType: query.admissionType,
      }),
    };
  }

  @Get(":id")
  @ApiOperation({
    summary: "取得單一考卷",
    description: "依 id 取得考卷詳情，含題目清單與配分。",
  })
  @ApiOkResponse({ type: ExamResponseDto })
  @ApiNotFound()
  async get(@Param("id") id: string): Promise<{ data: ExamDetail }> {
    return { data: await this.service.getExam(id) };
  }
}
