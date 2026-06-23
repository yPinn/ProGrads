import { mergeConfig, defineConfig } from "vitest/config";
import { sharedTestConfig } from "../../vitest.shared";

export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.{test,spec}.ts"],
      coverage: {
        // Gate the logic surface only: services (business rules), common
        // (mappers/filters/contracts) and env validation. Controllers are thin
        // delegators left to integration tests; repositories are Prisma pass-throughs.
        include: ["src/modules/**/*.service.ts", "src/common/**/*.ts", "src/config/**/*.ts"],
        // Ratcheting floor — set just below current coverage so CI blocks regressions.
        // Bump these up in the same PR whenever a new service/common file gets tested.
        // Covered: all 5 services + common/mappers. Still 0%: common/api-responses,
        // common/http-exception.filter (these gate branches the lowest, ~59%).
        thresholds: {
          statements: 75,
          branches: 57,
          functions: 90,
          lines: 73,
        },
      },
    },
  }),
);
