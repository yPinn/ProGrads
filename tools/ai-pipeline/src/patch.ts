export interface GeneratedAnswer {
  standardAnswer: string;
  knowledgeExtension: string;
  confidence: "high" | "medium" | "low";
}

// Replace or append a ## section in a markdown body string.
function replaceOrAppendSection(body: string, heading: string, content: string): string {
  const lines = body.split("\n");
  const headingLine = `## ${heading}`;
  let start = -1;
  let end = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.trimEnd() === headingLine) {
      start = i;
    } else if (start >= 0 && i > start && lines[i]?.startsWith("## ")) {
      end = i;
      break;
    }
  }

  if (start >= 0) {
    return [...lines.slice(0, start + 1), "", content, "", ...lines.slice(end)].join("\n");
  }
  return `${body.trimEnd()}\n\n## ${heading}\n\n${content}\n`;
}

// Update specific frontmatter keys in-place (simple string replacement, preserves all other keys).
function patchFrontmatter(rawMd: string, updates: Record<string, string>): string {
  return rawMd.replace(
    /^(---\n)([\s\S]+?)(\n---)/m,
    (_match, open: string, yaml: string, close: string) => {
      let updated = yaml;
      for (const [key, value] of Object.entries(updates)) {
        const re = new RegExp(`^(${key}:.*)$`, "m");
        if (re.test(updated)) {
          updated = updated.replace(re, `${key}: ${value}`);
        } else {
          updated = `${updated}\n${key}: ${value}`;
        }
      }
      return `${open}${updated}${close}`;
    },
  );
}

// Separate frontmatter and body from a raw markdown string.
function splitMarkdown(rawMd: string): { frontmatter: string; body: string } {
  const m = /^---\n[\s\S]+?\n---\n?/.exec(rawMd);
  if (!m) return { frontmatter: "", body: rawMd };
  return { frontmatter: m[0], body: rawMd.slice(m[0].length) };
}

export function patchMarkdown(rawMd: string, answer: GeneratedAnswer, modelUsed: string): string {
  const { body } = splitMarkdown(rawMd);

  let newBody = replaceOrAppendSection(body, "標準解答", answer.standardAnswer);
  if (answer.knowledgeExtension.trim()) {
    newBody = replaceOrAppendSection(newBody, "知識點延伸", answer.knowledgeExtension);
  }

  // Rebuild: reassemble frontmatter + new body, then patch frontmatter keys.
  const bodyReplaced = rawMd.replace(
    /^(---\n[\s\S]+?\n---\n?)([\s\S]*)$/,
    (_m, fm: string, _oldBody: string) => `${fm}${newBody}`,
  );

  return patchFrontmatter(bodyReplaced, {
    model_used: modelUsed,
    confidence: answer.confidence,
    review_status: "ai_generated",
  });
}
