// Split a question markdown body into its `## ` sections (heading -> trimmed content).

// Parse "## 選項" section into labelled choices.
// Expects lines like `- (A) option text` (half or full-width parens, case-insensitive label).
export function parseChoices(section: string): Array<{ label: string; contentMd: string }> {
  const result: Array<{ label: string; contentMd: string }> = [];
  for (const line of section.split(/\r?\n/)) {
    const m = /^\s*-\s*[（(]([A-Za-z])[）)]\s*(.+?)\s*$/.exec(line);
    if (m) result.push({ label: m[1]!.toUpperCase(), contentMd: m[2]! });
  }
  return result;
}

// Parse "## 答案" section into an array of correct labels (handles single "B" or multi "A,C").
export function parseAnswer(section: string): string[] {
  return section
    .trim()
    .split(/[,，\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]$/.test(s));
}

export function parseSections(md: string): Map<string, string> {
  const sections = new Map<string, string>();
  let current: string | null = null;
  let buf: string[] = [];

  const flush = (): void => {
    if (current !== null) sections.set(current, buf.join("\n").trim());
    buf = [];
  };

  for (const line of md.split(/\r?\n/)) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = m[1]!;
    } else if (current !== null) {
      buf.push(line);
    }
  }
  flush();
  return sections;
}
