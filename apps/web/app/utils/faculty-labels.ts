import type { DegreeLevel, ThesisRole } from "@prograds/shared";

// zh-TW display labels for faculty enums. Moves to i18n message files in Phase 1.
export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  bachelor: "學士",
  master: "碩士",
  phd: "博士",
  other: "其他",
};

export const THESIS_ROLE_LABELS: Record<ThesisRole, string> = {
  advised: "指導論文",
  authored: "著作",
};
