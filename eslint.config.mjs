// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

// Shared base, imported by each package's local eslint.config.mjs.
// Packages own their linting (turbo run lint fans out); this is the single
// source of rules so configs stay symmetric across the workspace.
export const base = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  prettier,
);

// Root invocation only lints repo-root files (configs, scripts). Every package
// is linted by its own config via `turbo run lint`, so they are ignored here to
// avoid double-linting.
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.output/**",
      "**/.nuxt/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.gen.ts",
      "apps/**",
      "packages/**",
      "tools/**",
    ],
  },
  ...base,
);
