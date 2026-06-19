import type { AdmissionEvent, AdmissionType, ExamMethod } from "@prograds/shared";

// zh-TW display labels for admission enums. Moves to i18n message files in Phase 1.
export const ADMISSION_EVENT_LABELS: Record<AdmissionEvent, string> = {
  account_open: "帳號開通",
  registration_start: "報名開始",
  registration_end: "報名截止",
  document_deadline: "文件繳交截止",
  admit_card: "准考證",
  written_exam: "筆試",
  shortlist: "初選名單",
  interview: "面試",
  result: "放榜",
  enrollment: "報到",
};

export const ADMISSION_TYPE_LABELS: Record<AdmissionType, string> = {
  exam: "考試",
  recommended: "推甄",
  in_service: "在職專班",
};

export const ADMISSION_METHOD_LABELS: Record<ExamMethod, string> = {
  written: "筆試",
  review: "審查",
  interview: "口試",
};
