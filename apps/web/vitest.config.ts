import { defineVitestConfig } from "@nuxt/test-utils/config";
import { sharedTestConfig } from "../../vitest.shared";

// Web runs in the Nuxt test environment (happy-dom) so components and
// auto-imports resolve. Coverage settings are shared with the rest of the repo.
export default defineVitestConfig({
  test: {
    ...sharedTestConfig.test,
    environment: "nuxt",
    include: ["test/**/*.{test,spec}.ts", "app/**/*.{test,spec}.ts"],
    // Booting the Nuxt env (first run) is slow, especially on Windows.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    environmentOptions: {
      // Empty API base in tests so registerEndpoint() mocks intercept relative requests.
      nuxt: { overrides: { runtimeConfig: { public: { apiBaseUrl: "" } } } },
    },
    coverage: {
      // Gate the logic surface only (mirrors apps/api): composables + utils. Pages/components
      // are thin/markup-heavy and left to e2e; a broader `include` also silently drops
      // newly-added files from the v8 "all" pass (see docs), so keep this narrow.
      include: ["app/composables/**/*.ts", "app/utils/**/*.ts"],
      // Ratcheting floor — set just below current coverage so CI blocks regressions.
      // Bump these up in the same PR whenever a composable/util gets tested.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
});
