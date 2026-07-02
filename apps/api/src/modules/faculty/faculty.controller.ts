import { Controller, Get, Query } from "@nestjs/common";
import type { FacultyMemberWithDepartment } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiBadRequest } from "../../common/api-error-responses.js";
import { FacultyQueryDto } from "./dto/faculty-query.dto.js";
import { FacultyResponseDto } from "./dto/faculty-response.dto.js";
import { FacultyService } from "./faculty.service.js";

@ApiTags("faculty")
@Controller("faculty")
export class FacultyController {
  constructor(private readonly service: FacultyService) {}

  @Get()
  @ApiOperation({
    summary: "列出師資（跨軸過濾）",
    description:
      "系所師資陣容。跨軸查詢：`?school=ntu&dept=csie` → 該系師資；`?track=cs` → 各校資工師資。每筆含研究方向、論文佐證與所屬系所。",
  })
  @ApiOkResponse({ type: FacultyResponseDto })
  @ApiBadRequest()
  async list(@Query() query: FacultyQueryDto): Promise<{ data: FacultyMemberWithDepartment[] }> {
    return {
      data: await this.service.getFaculty({
        school: query.school,
        dept: query.dept,
        track: query.track,
      }),
    };
  }
}
