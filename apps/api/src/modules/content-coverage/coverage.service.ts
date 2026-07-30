import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Coverage } from "@prograds/shared";
import type { Env } from "../../config/env.js";
import { CoverageRepository } from "./coverage.repository.js";

@Injectable()
export class CoverageService {
  constructor(
    private readonly repo: CoverageRepository,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // 404s (not 500s) when CONTENT_DIR isn't configured — every deployment without the content
  // repo checked out, i.e. everywhere except a developer's own machine.
  async getCoverage(): Promise<Coverage> {
    const root = this.config.get("CONTENT_DIR", { infer: true });
    if (!root) {
      throw new NotFoundException("coverage is only available when CONTENT_DIR is configured");
    }
    return this.repo.computeAll(root);
  }
}
