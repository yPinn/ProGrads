// list-pending: prints question files that are missing a ## 標準解答 section.
// Output is consumed by a human + Claude Code session following PROMPT.md guidelines.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

function contentRoot(): string | null {
  if (process.env.CONTENT_DIR) return path.resolve(process.env.CONTENT_DIR);
  return null;
}

function listQuestionFiles(root: string): string[] {
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

function hasMissingAnswer(rawMd: string): boolean {
  const parsed = matter(rawMd);
  const status = (parsed.data as { review_status?: string }).review_status;
  if (status === "human_verified" || status === "flagged") return false;

  const body = parsed.content;
  const headingMatch = /^##\s+標準解答\s*$/m.exec(body);
  if (!headingMatch) return true;

  const after = body.slice(headingMatch.index + headingMatch[0].length);
  const nextSection = /^##\s/m.exec(after);
  const content = (nextSection ? after.slice(0, nextSection.index) : after).trim();
  return content.length === 0;
}

function main(): void {
  const root = contentRoot();
  if (!root) {
    // eslint-disable-next-line no-console
    console.log(
      "ai-pipeline: CONTENT_DIR not set — nothing to list. Clone ProGrads-content and set CONTENT_DIR in .env.",
    );
    return;
  }
  const files = listQuestionFiles(root);

  const pending = files.filter((rel) => {
    const raw = readFileSync(path.join(root, rel), "utf8");
    return hasMissingAnswer(raw);
  });

  // eslint-disable-next-line no-console
  console.log(`pending: ${pending.length}/${files.length} file(s) need ## 標準解答\n`);

  for (const rel of pending) {
    const raw = readFileSync(path.join(root, rel), "utf8");
    const parsed = matter(raw);
    const fm = parsed.data as { question_type?: string; subjects?: string[]; question_id?: string };
    // eslint-disable-next-line no-console
    console.log(`  ${rel}`);
    // eslint-disable-next-line no-console
    console.log(
      `    id: ${fm.question_id ?? "?"}, type: ${fm.question_type ?? "?"}, subjects: [${(fm.subjects ?? []).join(", ")}]`,
    );
  }
}

main();
