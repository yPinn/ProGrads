import { Body, Controller, Post } from "@nestjs/common";
import type { ErrorReport } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ApiNotFound } from "../../common/api-error-responses.js";
import { CreateErrorReportDto } from "./dto/create-error-report.dto.js";
import { ErrorReportResponseDto } from "./dto/error-report-response.dto.js";
import { ReportsService } from "./reports.service.js";

@ApiTags("reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  // Public unauthenticated write endpoint — tighter than the global default (see app.module.ts).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: "回報題目/解析錯誤",
    description: "公開、免登入的錯誤回報入口——提交題目、錯誤類型與描述。",
  })
  @ApiOkResponse({ type: ErrorReportResponseDto })
  @ApiNotFound("題目不存在")
  async create(@Body() dto: CreateErrorReportDto): Promise<{ data: ErrorReport }> {
    return { data: await this.service.create(dto) };
  }
}
