import { defineConfig } from "vitest/config";

// Shared Vitest defaults for the monorepo. Each package extends this via
// mergeConfig in its own vitest.config.ts (turbo runs `test` per package).
export const sharedTestConfig = defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      // `all` reports every included source file, not just the ones a test happened to
      // import — otherwise the % silently measures only the tested files and reads ~100%.
      all: true,
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "./coverage",
      // Each package narrows `include` to its own logic dirs. Here we drop boilerplate
      // that carries no assertable behaviour, so the % reflects code worth testing:
      // framework wiring / bootstrap, barrels, type & config files, and specs.
      exclude: [
        "**/dist/**",
        "**/.nuxt/**",
        "**/.output/**",
        "**/*.config.*",
        "**/*.d.ts",
        "**/*.module.ts", // Nest DI wiring
        "**/main.ts", // bootstrap
        "**/index.ts", // barrels
        "**/*.{spec,test}.ts",
      ],
    },
  },
});

export default sharedTestConfig;
