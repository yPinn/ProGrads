import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { patchMarkdown } from "./patch.js";

const baseMarkdown = `---
question_id: ntu-2025-dsa-q01
exam_subject: 資料結構與演算法
subjects: [algo]
departments: [csie]
question_type: essay
source_url: https://example.edu/paper.pdf
license_status: school_official
knowledge_points: []
---

## 題目

Explain merge sort.
`;

describe("patchMarkdown", () => {
  it("appends generated answer sections and frontmatter metadata", () => {
    const patched = patchMarkdown(
      baseMarkdown,
      {
        standardAnswer: "Use divide and conquer.",
        knowledgeExtension: "Related to recurrence analysis.",
        confidence: "high",
      },
      "claude-test",
    );

    assert.match(patched, /model_used: claude-test/);
    assert.match(patched, /confidence: high/);
    assert.match(patched, /review_status: ai_generated/);
    assert.match(patched, /## 標準解答\n\nUse divide and conquer\./);
    assert.match(patched, /## 知識點延伸\n\nRelated to recurrence analysis\./);
    assert.match(patched, /## 題目\n\nExplain merge sort\./);
  });

  it("replaces existing answer sections without changing unrelated sections", () => {
    const raw = `${baseMarkdown}
## 標準解答

Old answer.

## 知識點延伸

Old extension.

## 備註

Keep this note.
`;

    const patched = patchMarkdown(
      raw,
      {
        standardAnswer: "New answer.",
        knowledgeExtension: "New extension.",
        confidence: "medium",
      },
      "claude-test",
    );

    assert.doesNotMatch(patched, /Old answer/);
    assert.doesNotMatch(patched, /Old extension/);
    assert.match(patched, /## 標準解答\n\nNew answer\./);
    assert.match(patched, /## 知識點延伸\n\nNew extension\./);
    assert.match(patched, /## 備註\n\nKeep this note\./);
  });

  it("updates existing metadata instead of duplicating keys", () => {
    const raw = baseMarkdown.replace(
      "knowledge_points: []",
      `knowledge_points: []
model_used: old-model
confidence: low
review_status: flagged`,
    );

    const patched = patchMarkdown(
      raw,
      {
        standardAnswer: "Checked answer.",
        knowledgeExtension: "",
        confidence: "high",
      },
      "claude-test",
    );

    assert.equal((patched.match(/^model_used:/gm) ?? []).length, 1);
    assert.equal((patched.match(/^confidence:/gm) ?? []).length, 1);
    assert.equal((patched.match(/^review_status:/gm) ?? []).length, 1);
    assert.match(patched, /model_used: claude-test/);
    assert.match(patched, /confidence: high/);
    assert.match(patched, /review_status: ai_generated/);
    assert.doesNotMatch(patched, /## 知識點延伸/);
  });
});
