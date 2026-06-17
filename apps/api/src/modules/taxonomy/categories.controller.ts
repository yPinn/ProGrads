import { Controller, Get } from "@nestjs/common";
import type { Category } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CategoriesResponseDto } from "./dto/taxonomy-response.dto.js";
import { TaxonomyService } from "./taxonomy.service.js";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: TaxonomyService) {}

  @Get()
  @ApiOperation({
    summary: "列出大類組",
    description: "回傳所有 L1 大類組（理工 / 商管 / 人文），作為導覽最上層入口。",
  })
  @ApiOkResponse({ type: CategoriesResponseDto })
  async list(): Promise<{ data: Category[] }> {
    return { data: await this.service.getCategories() };
  }
}
