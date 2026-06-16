import { Controller, Get, Param } from "@nestjs/common";
import type { Subject } from "@prograds/shared";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { SubjectResponseDto } from "./dto/taxonomy-response.dto.js";
import { TaxonomyService } from "./taxonomy.service.js";

@ApiTags("subjects")
@Controller("subjects")
export class SubjectsController {
  constructor(private readonly service: TaxonomyService) {}

  @Get(":slug")
  @ApiOkResponse({ type: SubjectResponseDto })
  async get(@Param("slug") slug: string): Promise<{ data: Subject }> {
    return { data: await this.service.getSubject(slug) };
  }
}
