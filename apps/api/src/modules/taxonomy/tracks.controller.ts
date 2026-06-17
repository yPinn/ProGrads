import { Controller, Get, Param, Query } from "@nestjs/common";
import type { Track, TrackWithSubjects } from "@prograds/shared";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TrackQueryDto } from "./dto/track-query.dto.js";
import { TrackResponseDto, TracksResponseDto } from "./dto/taxonomy-response.dto.js";
import { TaxonomyService } from "./taxonomy.service.js";

@ApiTags("tracks")
@Controller("tracks")
export class TracksController {
  constructor(private readonly service: TaxonomyService) {}

  @Get()
  @ApiOperation({
    summary: "列出所別 / 類組",
    description: "回傳 L2 所別（導覽主軸）；可用 `?category=` slug 過濾指定大類組。",
  })
  @ApiOkResponse({ type: TracksResponseDto })
  async list(@Query() query: TrackQueryDto): Promise<{ data: Track[] }> {
    return { data: await this.service.getTracks(query.category) };
  }

  @Get(":slug")
  @ApiOperation({
    summary: "取得單一所別",
    description: "依 slug 取得所別詳情，含該所別共用的考科清單。",
  })
  @ApiOkResponse({ type: TrackResponseDto })
  async get(@Param("slug") slug: string): Promise<{ data: TrackWithSubjects }> {
    return { data: await this.service.getTrack(slug) };
  }
}
