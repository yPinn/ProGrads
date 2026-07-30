import { Controller, Get } from "@nestjs/common";
import type { Coverage } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiNotFound } from "../../common/api-error-responses.js";
import { CoverageResponseDto } from "./dto/coverage-response.dto.js";
import { CoverageService } from "./coverage.service.js";

@ApiTags("coverage")
@Controller("coverage")
export class CoverageController {
  constructor(private readonly service: CoverageService) {}

  @Get()
  @ApiOperation({
    summary: "內容清點",
    description:
      "content repo 各領域(師資 / 報名資訊 / 考古題 / 招生統計)建置狀況,對照 packages/db seed 基準即時計算。僅本機開發、`CONTENT_DIR` 有設定時才可用,否則回 404。",
  })
  @ApiOkResponse({ type: CoverageResponseDto })
  @ApiNotFound("CONTENT_DIR 未設定")
  async get(): Promise<{ data: Coverage }> {
    return { data: await this.service.getCoverage() };
  }
}
