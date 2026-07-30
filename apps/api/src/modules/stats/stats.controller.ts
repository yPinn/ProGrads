import { Controller, Get } from "@nestjs/common";
import type { Stats } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StatsResponseDto } from "./dto/stats-response.dto.js";
import { StatsService } from "./stats.service.js";

@ApiTags("stats")
@Controller("stats")
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get()
  @ApiOperation({
    summary: "平台統計",
    description:
      "全平台總覽數字（學校 / 系所 / 考科 / 考卷 / 師資數與涵蓋年度範圍），供首頁統計列使用。",
  })
  @ApiOkResponse({ type: StatsResponseDto })
  async get(): Promise<{ data: Stats }> {
    return { data: await this.service.getStats() };
  }
}
