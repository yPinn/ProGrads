import { mergeConfig, defineConfig } from "vitest/config";
import { sharedTestConfig } from "../../vitest.shared";

export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.{test,spec}.ts"],
    },
  }),
);
