import { Controller, Get, Query } from "@nestjs/common";
import type { AdmissionScheduleItem } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiBadRequest } from "../../common/api-error-responses.js";
import { AdmissionsService } from "./admissions.service.js";
import { AdmissionScheduleQueryDto, UpcomingSchedulesQueryDto } from "./dto/admission-query.dto.js";
import { AdmissionScheduleResponseDto } from "./dto/admissions-response.dto.js";

@ApiTags("schedules")
@Controller("schedules")
export class SchedulesController {
  constructor(private readonly service: AdmissionsService) {}

  @Get()
  @ApiOperation({
    summary: "招生行事曆",
    description:
      "攤平的招生事件清單（報名起訖 / 筆試 / 面試 / 放榜），供時程瀏覽與 deadline 提醒。`year` 必填（以招生季為單位）；`school` / `event` 可選過濾。依時間排序。",
  })
  @ApiOkResponse({ type: AdmissionScheduleResponseDto })
  @ApiBadRequest()
  async list(
    @Query() query: AdmissionScheduleQueryDto,
  ): Promise<{ data: AdmissionScheduleItem[] }> {
    return {
      data: await this.service.getSchedule({
        year: query.year,
        school: query.school,
        event: query.event,
      }),
    };
  }

  @Get("upcoming")
  @ApiOperation({
    summary: "近期招生事件",
    description:
      "跨學年、依絕對時間撈最近 N 筆即將到來的招生事件（報名起訖 / 筆試 / 面試 / 放榜），供首頁 deadline 提醒使用。`limit` 選填，預設 5、上限 20。",
  })
  @ApiOkResponse({ type: AdmissionScheduleResponseDto })
  @ApiBadRequest()
  async upcoming(
    @Query() query: UpcomingSchedulesQueryDto,
  ): Promise<{ data: AdmissionScheduleItem[] }> {
    return { data: await this.service.getUpcomingSchedule(query.limit) };
  }
}
