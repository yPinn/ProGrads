import { Controller, Get, Query } from "@nestjs/common";
import type { DepartmentWithSchool } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DepartmentQueryDto } from "./dto/department-query.dto.js";
import { DepartmentsResponseDto } from "./dto/schools-response.dto.js";
import { SchoolsService } from "./schools.service.js";

@ApiTags("departments")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly service: SchoolsService) {}

  @Get()
  @ApiOperation({
    summary: "列出系所（跨軸過濾）",
    description:
      "系所為 track ↔ school 的交集。跨軸查詢：`?track=cs` → 哪些學校開設資工所；`?school=ntu` → 該校有哪些系所。",
  })
  @ApiOkResponse({ type: DepartmentsResponseDto })
  async list(@Query() query: DepartmentQueryDto): Promise<{ data: DepartmentWithSchool[] }> {
    return {
      data: await this.service.getDepartments({ track: query.track, school: query.school }),
    };
  }
}
