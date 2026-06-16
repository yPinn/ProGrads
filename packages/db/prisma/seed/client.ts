import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/client/client.ts";

// Connects once (pg driver adapter), runs the callback, always disconnects.
// Shared by the reference seed (index.ts) and the dev fixtures (dev.ts).
export async function withPrisma(fn: (prisma: PrismaClient) => Promise<void>): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
