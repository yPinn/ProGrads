// list-unreviewed: prints question files with a generated answer that has not yet passed
// Codex/human review (review_status still ai_generated). Consumed following PROMPT-review.md.

import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { contentRoot, listQuestionFiles, sectionContent } from "./files.js";

function needsReview(rawMd: string): boolean {
  const parsed = matter(rawMd);
  const status = (parsed.data as { review_status?: string }).review_status;
  if (status !== "ai_generated") return false;

  return sectionContent(parsed.content, "標準解答").length > 0;
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

  const unreviewed = files.filter((rel) => {
    const raw = readFileSync(path.join(root, rel), "utf8");
    return needsReview(raw);
  });

  // eslint-disable-next-line no-console
  console.log(
    `unreviewed: ${unreviewed.length}/${files.length} file(s) generated but not yet reviewed\n`,
  );

  for (const rel of unreviewed) {
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
