import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller.js";
import { SubjectsController } from "./subjects.controller.js";
import { TracksController } from "./tracks.controller.js";
import { TaxonomyRepository } from "./taxonomy.repository.js";
import { TaxonomyService } from "./taxonomy.service.js";

// Taxonomy domain: one module groups the navigation resources (category → track → subject),
// each its own thin controller sharing the cohesive service + repository.
@Module({
  controllers: [CategoriesController, TracksController, SubjectsController],
  providers: [TaxonomyService, TaxonomyRepository],
})
export class TaxonomyModule {}
