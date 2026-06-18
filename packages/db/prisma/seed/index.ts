import { withPrisma } from "./client.ts";
import { seedSchools } from "./schools.seed.ts";
import { seedTaxonomy } from "./taxonomy.seed.ts";

// Reference-data seed orchestrator: runs each domain seeder in dependency order.
// (Content data — questions/exams/admission groups/rounds/schedules — comes from
// ProGrads-content via the sync script, not this seed. Admission groups are derived from
// admissions/*/departments.yml; see docs/03-content-pipeline.md.)
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
