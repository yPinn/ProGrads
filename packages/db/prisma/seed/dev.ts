import { withPrisma } from "./client.ts";
import { seedDevFixtures } from "./dev-fixtures.seed.ts";

// Local dev fixtures entry (`db:seed:dev`). Assumes reference data (`db:seed`) ran first.
// NOT for staging/prod — real content comes from the sync script (docs/03).
async function main(): Promise<void> {
  await withPrisma(async (prisma) => {
    const counts = await seedDevFixtures(prisma);
    // eslint-disable-next-line no-console
    console.log("dev fixtures seeded:", counts);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
