// Split a question markdown body into its `## ` sections (heading -> trimmed content).

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
