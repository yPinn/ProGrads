import { Controller, Get } from "@nestjs/common";
import type { Category } from "@prograds/shared";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CategoriesResponseDto } from "./dto/taxonomy-response.dto.js";
import { TaxonomyService } from "./taxonomy.service.js";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: TaxonomyService) {}

  @Get()
  @ApiOkResponse({ type: CategoriesResponseDto })
  async list(): Promise<{ data: Category[] }> {
    return { data: await this.service.getCategories() };
  }
}
