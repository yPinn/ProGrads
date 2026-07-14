// Shared content-repo file listing + markdown section helpers for list-pending / list-unreviewed.

import { readdirSync } from "node:fs";
import path from "node:path";

export function contentRoot(): string | null {
  if (process.env.CONTENT_DIR) return path.resolve(process.env.CONTENT_DIR);
  return null;
}

export function listQuestionFiles(root: string): string[] {
  const questionsDir = path.join(root, "questions");
  let entries: string[];
  try {
    entries = readdirSync(questionsDir, { recursive: true }) as string[];
  } catch {
    return [];
  }
  return entries
    .map((e) => e.replace(/\\/g, "/"))
    .filter((e) => e.endsWith(".md"))
    .map((e) => `questions/${e}`)
    .sort();
}

// Trimmed content under a `## heading` in a markdown body, or "" if the heading is missing/empty.
export function sectionContent(body: string, heading: string): string {
  const headingMatch = new RegExp(`^##\\s+${heading}\\s*$`, "m").exec(body);
  if (!headingMatch) return "";

  const after = body.slice(headingMatch.index + headingMatch[0].length);
  const nextSection = /^##\s/m.exec(after);
  return (nextSection ? after.slice(0, nextSection.index) : after).trim();
}
