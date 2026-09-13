import type { ErrorReportType } from "@prograds/shared";

// zh-TW display labels for the error-report type enum. Moves to i18n message files in Phase 1.
export const ERROR_REPORT_TYPE_LABELS: Record<ErrorReportType, string> = {
  wrong_answer: "答案錯誤",
  wrong_explanation: "解析錯誤",
  typo: "錯字/格式問題",
  other: "其他",
};
