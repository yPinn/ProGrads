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
  },
});
