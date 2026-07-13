import { Controller, Get, Param } from "@nestjs/common";
import type { School, SchoolWithDepartments } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiNotFound } from "../../common/api-error-responses.js";
import { SchoolResponseDto, SchoolsResponseDto } from "./dto/schools-response.dto.js";
import { SchoolsService } from "./schools.service.js";

@ApiTags("schools")
@Controller("schools")
export class SchoolsController {
  constructor(private readonly service: SchoolsService) {}

  @Get()
  @ApiOperation({
    summary: "列出學校",
    description: "回傳全部學校（基本資料）；系所清單見 `GET /schools/:slug`。",
  })
  @ApiOkResponse({ type: SchoolsResponseDto })
  async list(): Promise<{ data: School[] }> {
    return { data: await this.service.getSchools() };
  }

  @Get(":slug")
  @ApiOperation({
    summary: "取得單一學校",
    description: "依 slug 取得學校詳情，含該校系所清單。",
  })
  @ApiParam({ name: "slug", description: "學校 slug", example: "ntu" })
  @ApiOkResponse({ type: SchoolResponseDto })
  @ApiNotFound()
  async get(@Param("slug") slug: string): Promise<{ data: SchoolWithDepartments }> {
    return { data: await this.service.getSchool(slug) };
  }
}
