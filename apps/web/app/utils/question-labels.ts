import type { QuestionType, ReviewStatus } from "@prograds/shared";

// zh-TW display labels for question enums. Moves to i18n message files in Phase 1.
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mc: "選擇",
  essay: "申論",
  calc: "計算",
  proof: "證明",
  cloze: "填空",
  listening: "聽力",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  ai_generated: "AI 生成",
  human_verified: "人工驗證",
  flagged: "已標記",
};
