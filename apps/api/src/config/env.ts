import { z } from "zod";

// Validated at startup (fail fast). See app.module.ts ConfigModule.
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8088),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  WEB_BASE_URL: z.string().url(),
  // Absolute path to a checked-out ProGrads-content; gates the dev-only /coverage endpoint
  // (see app.module.ts). Unset in every deployment — the content repo never ships there.
  CONTENT_DIR: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
