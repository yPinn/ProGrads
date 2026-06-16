import "dotenv/config";
import { defineConfig } from "prisma/config";

// Tolerate a missing URL so `prisma generate` works without .env (e.g. in CI);
// migrate/push still need a real DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
