// Parse a question file path into derived references + the canonical (path-derived) id.
// Expected: questions/<track>/<school>/<department>/<year>/<exam-subject>[/<group>]/<qNN>.md
// See docs/03-content-pipeline.md.

export interface ParsedPath {
  track: string;
  school: string;
  department: string;
  year: number;
  examSubjectSlug: string;
  group: string;
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
  if (rest.length !== 6 && rest.length !== 7) {
    throw new Error(
      `unexpected path depth (${rest.length}); want 6 (no group) or 7 (with group): ${relPath}`,
    );
  }

  const track = rest[0]!;
  const school = rest[1]!;
  const department = rest[2]!;
  const yearStr = rest[3]!;
  const examSubjectSlug = rest[4]!;
  const hasGroup = rest.length === 7;
  const group = hasGroup ? rest[5]! : "";
  const file = rest[rest.length - 1]!;

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

  const idParts = [school, department, String(year), examSubjectSlug];
  if (group) idParts.push(group);
  idParts.push(fileStem);
  const questionId = idParts.join("-");

  return {
    track,
    school,
    department,
    year,
    examSubjectSlug,
    group,
    fileStem,
    number,
    order,
    questionId,
  };
}
