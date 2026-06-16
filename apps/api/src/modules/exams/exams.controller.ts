import { Controller, Get, Param, Query } from "@nestjs/common";
import type { ExamDetail, ExamSummary } from "@prograds/shared";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ExamQueryDto } from "./dto/exam-query.dto.js";
import { ExamResponseDto, ExamsResponseDto } from "./dto/exams-response.dto.js";
import { ExamsService } from "./exams.service.js";

@ApiTags("exams")
@Controller("exams")
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Get()
  @ApiOkResponse({ type: ExamsResponseDto })
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
  @ApiOkResponse({ type: ExamResponseDto })
  async get(@Param("id") id: string): Promise<{ data: ExamDetail }> {
    return { data: await this.service.getExam(id) };
  }
}
