import { defineConfig } from "vitest/config";

// Shared Vitest defaults for the monorepo. Each package extends this via
// mergeConfig in its own vitest.config.ts (turbo runs `test` per package).
export const sharedTestConfig = defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      exclude: ["**/dist/**", "**/.nuxt/**", "**/.output/**", "**/*.config.*", "**/*.d.ts"],
    },
  },
});

export default sharedTestConfig;
