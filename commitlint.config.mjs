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
  },
};
