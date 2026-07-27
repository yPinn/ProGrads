import type { Subject } from "@prograds/shared";

// Narrows a paper's subjects to the ones with actual question content (per useQuestionFacets),
// so /admissions only links to /questions for subjects that won't land on an empty results page.
export function practicableSubjects(subjects: Subject[], available: Set<string>): Subject[] {
  return subjects.filter((s) => available.has(s.slug));
}
