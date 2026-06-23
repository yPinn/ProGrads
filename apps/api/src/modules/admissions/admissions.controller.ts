import { Controller, Get, Query } from "@nestjs/common";
import type { AdmissionGroup } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiBadRequest } from "../../common/api-error-responses.js";
import { AdmissionsService } from "./admissions.service.js";
import { AdmissionQueryDto } from "./dto/admission-query.dto.js";
import { AdmissionsResponseDto } from "./dto/admissions-response.dto.js";

@ApiTags("admissions")
@Controller("admissions")
export class AdmissionsController {
  constructor(private readonly service: AdmissionsService) {}

  @Get()
  @ApiOperation({
    summary: "取得系所招生情報",
    description:
      "依 `school` + `dept` 取得該系所的招生組別，每組含逐年梯次（名額 / 考科 / 日程）。`year` 可選，過濾單一西元學年。報考單位 = 校 × 系所 × 組。",
  })
  @ApiOkResponse({ type: AdmissionsResponseDto })
  @ApiBadRequest()
  async list(@Query() query: AdmissionQueryDto): Promise<{ data: AdmissionGroup[] }> {
    return {
      data: await this.service.getGroups({
        school: query.school,
        dept: query.dept,
        year: query.year,
      }),
    };
  }
}
