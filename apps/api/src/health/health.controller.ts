import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({
    summary: "存活探針",
    description: "回傳服務存活狀態，供健康檢查與負載平衡器探測使用。",
  })
  @ApiOkResponse({ description: "服務正常", schema: { example: { status: "ok" } } })
  check(): { status: string } {
    return { status: "ok" };
  }
}
