// Conventional Commits: <type>(<scope>): <subject>
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      1,
      "always",
      ["web", "api", "db", "shared", "content", "ai", "ci", "docs", "deps", "repo"],
    ],
    "subject-case": [0],
    // Bodies may include long lines (URLs, paths); don't enforce wrapping.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
