// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  AdmissionEvent,
  AdmissionType,
  DegreeLevel,
  QuestionType,
  ReviewStatus,
  ThesisRole,
} from "@prograds/shared";
import { ADMISSION_EVENT_LABELS, ADMISSION_TYPE_LABELS } from "./admission-labels";
import { DEGREE_LEVEL_LABELS, THESIS_ROLE_LABELS } from "./faculty-labels";
import { QUESTION_TYPE_LABELS, REVIEW_STATUS_LABELS } from "./question-labels";

// Guards against enum drift: if a shared enum gains a value, the label map must cover it.
describe("enum label maps stay in sync with shared enums", () => {
  const cases = [
    ["AdmissionEvent", AdmissionEvent.options, ADMISSION_EVENT_LABELS],
    ["AdmissionType", AdmissionType.options, ADMISSION_TYPE_LABELS],
    ["QuestionType", QuestionType.options, QUESTION_TYPE_LABELS],
    ["ReviewStatus", ReviewStatus.options, REVIEW_STATUS_LABELS],
    ["DegreeLevel", DegreeLevel.options, DEGREE_LEVEL_LABELS],
    ["ThesisRole", ThesisRole.options, THESIS_ROLE_LABELS],
  ] as const;

  it.each(cases)("%s has a non-empty label for every value", (_name, options, labels) => {
    for (const value of options) {
      expect(labels[value as keyof typeof labels]).toBeTruthy();
    }
  });
});
