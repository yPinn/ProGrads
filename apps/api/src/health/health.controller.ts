import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  // Uptime monitors/load balancers poll this frequently — must not be rate-limited.
  @SkipThrottle()
  @ApiOperation({
    summary: "存活探針",
    description: "回傳服務存活狀態，供健康檢查與負載平衡器探測使用。",
  })
  @ApiOkResponse({ description: "服務正常", schema: { example: { status: "ok" } } })
  check(): { status: string } {
    return { status: "ok" };
  }
}
