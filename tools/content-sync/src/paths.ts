// Parse a question file path into derived references + the canonical (path-derived) id.
// Expected: questions/<school>/<year>/<paperSlug>/<qNN>.md
// The paper is decoupled from departments: the path only goes down to (school, year, paper);
// departments now come from the frontmatter `departments`. See docs/03-content-pipeline.md.

export interface ParsedPath {
  school: string;
  year: number;
  paperSlug: string; // whole-paper slug (e.g. dsa-a / co-os)
  fileStem: string; // e.g. "q03"
  number: string; // display, e.g. "3" / "3a"
  order: number; // sortable: q3 -> 30, q3a -> 31, q4 -> 40
  questionId: string; // path-derived default, validated against frontmatter
}

export function parseQuestionPath(relPath: string): ParsedPath {
  const parts = relPath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts[0] !== "questions") {
    throw new Error(`path must start with "questions/": ${relPath}`);
  }
  const rest = parts.slice(1);
  if (rest.length !== 4) {
    throw new Error(
      `unexpected path depth (${rest.length}); want 4: questions/<school>/<year>/<paperSlug>/<qNN>.md: ${relPath}`,
    );
  }

  const school = rest[0]!;
  const yearStr = rest[1]!;
  const paperSlug = rest[2]!;
  const file = rest[3]!;

  const year = Number.parseInt(yearStr, 10);
  if (!Number.isInteger(year) || String(year) !== yearStr) {
    throw new Error(`year segment must be an integer: "${yearStr}" in ${relPath}`);
  }

  const fileStem = file.replace(/\.md$/, "");
  const m = /^q(\d+)([a-z]*)$/.exec(fileStem);
  if (!m) {
    throw new Error(`filename must match q<NN>[a-z] (e.g. q03, q3a): ${file}`);
  }
  const num = Number.parseInt(m[1]!, 10);
  const suffix = m[2] ?? "";
  const number = `${num}${suffix}`;
  const order = num * 10 + (suffix ? suffix.charCodeAt(0) - 96 : 0);

  // <school>-<year>-<paperSlug>-<qNN>, e.g. ntu-2021-dsa-a-q01
  const questionId = [school, String(year), paperSlug, fileStem].join("-");

  return { school, year, paperSlug, fileStem, number, order, questionId };
}
