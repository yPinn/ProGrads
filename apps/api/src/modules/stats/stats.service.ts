import { Injectable } from "@nestjs/common";
import type { Stats } from "@prograds/shared";
import { StatsRepository } from "./stats.repository.js";

@Injectable()
export class StatsService {
  constructor(private readonly repo: StatsRepository) {}

  async getStats(): Promise<Stats> {
    return this.repo.findCounts();
  }
}
