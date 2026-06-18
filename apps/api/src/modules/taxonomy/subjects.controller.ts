import { Controller, Get, Param } from "@nestjs/common";
import type { Subject } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiNotFound } from "../../common/api-error-responses.js";
import { SubjectResponseDto } from "./dto/taxonomy-response.dto.js";
import { TaxonomyService } from "./taxonomy.service.js";

@ApiTags("subjects")
@Controller("subjects")
export class SubjectsController {
  constructor(private readonly service: TaxonomyService) {}

  @Get(":slug")
  @ApiOperation({
    summary: "取得單一考科",
    description: "依 slug 取得考科詳情。考科為全域共用題庫，可跨所別 / 學校練習。",
  })
  @ApiOkResponse({ type: SubjectResponseDto })
  @ApiNotFound()
  async get(@Param("slug") slug: string): Promise<{ data: Subject }> {
    return { data: await this.service.getSubject(slug) };
  }
}
