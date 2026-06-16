import { withPrisma } from "./client.ts";
import { seedSchools } from "./schools.seed.ts";
import { seedTaxonomy } from "./taxonomy.seed.ts";

// Reference-data seed orchestrator: runs each domain seeder in dependency order.
// (Content data — questions/exams/schedules/stats — comes from ProGrads-content via the
// sync script, not this seed. See docs/03-content-pipeline.md. Local dev fixtures live
// in dev.ts, run via `db:seed:dev`.)
async function main(): Promise<void> {
  await withPrisma(async (prisma) => {
    const { trackIdBySlug, counts } = await seedTaxonomy(prisma);
    const schoolCounts = await seedSchools(prisma, trackIdBySlug);
    // eslint-disable-next-line no-console
    console.log("seed complete:", { ...counts, ...schoolCounts });
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
