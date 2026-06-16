import { Controller, Get, Param, Query } from "@nestjs/common";
import type { Track, TrackWithSubjects } from "@prograds/shared";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { TrackQueryDto } from "./dto/track-query.dto.js";
import { TrackResponseDto, TracksResponseDto } from "./dto/taxonomy-response.dto.js";
import { TaxonomyService } from "./taxonomy.service.js";

@ApiTags("tracks")
@Controller("tracks")
export class TracksController {
  constructor(private readonly service: TaxonomyService) {}

  @Get()
  @ApiOkResponse({ type: TracksResponseDto })
  async list(@Query() query: TrackQueryDto): Promise<{ data: Track[] }> {
    return { data: await this.service.getTracks(query.category) };
  }

  @Get(":slug")
  @ApiOkResponse({ type: TrackResponseDto })
  async get(@Param("slug") slug: string): Promise<{ data: TrackWithSubjects }> {
    return { data: await this.service.getTrack(slug) };
  }
}
