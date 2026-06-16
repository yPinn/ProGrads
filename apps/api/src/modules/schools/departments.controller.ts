import { Controller, Get, Query } from "@nestjs/common";
import type { DepartmentWithSchool } from "@prograds/shared";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { DepartmentQueryDto } from "./dto/department-query.dto.js";
import { DepartmentsResponseDto } from "./dto/schools-response.dto.js";
import { SchoolsService } from "./schools.service.js";

@ApiTags("departments")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly service: SchoolsService) {}

  // Cross-axis query: e.g. ?track=cs → which schools offer 資工所.
  @Get()
  @ApiOkResponse({ type: DepartmentsResponseDto })
  async list(@Query() query: DepartmentQueryDto): Promise<{ data: DepartmentWithSchool[] }> {
    return {
      data: await this.service.getDepartments({ track: query.track, school: query.school }),
    };
  }
}
