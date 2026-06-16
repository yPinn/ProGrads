import { Controller, Get, Param } from "@nestjs/common";
import type { School, SchoolWithDepartments } from "@prograds/shared";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { SchoolResponseDto, SchoolsResponseDto } from "./dto/schools-response.dto.js";
import { SchoolsService } from "./schools.service.js";

@ApiTags("schools")
@Controller("schools")
export class SchoolsController {
  constructor(private readonly service: SchoolsService) {}

  @Get()
  @ApiOkResponse({ type: SchoolsResponseDto })
  async list(): Promise<{ data: School[] }> {
    return { data: await this.service.getSchools() };
  }

  @Get(":slug")
  @ApiOkResponse({ type: SchoolResponseDto })
  async get(@Param("slug") slug: string): Promise<{ data: SchoolWithDepartments }> {
    return { data: await this.service.getSchool(slug) };
  }
}
