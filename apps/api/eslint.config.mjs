// @ts-check
import tseslint from "typescript-eslint";
import { base } from "../../eslint.config.mjs";

export default tseslint.config({ ignores: ["dist/**", "node_modules/**"] }, ...base, {
  // NestJS DI needs runtime (value) imports for injected types.
  files: ["**/*.ts"],
  rules: {
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/no-extraneous-class": "off",
  },
});
