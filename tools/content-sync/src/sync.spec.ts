import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@prograds/db";
import { Resolver, syncFile } from "./sync.js";

function questionMarkdown(extraFrontmatter = "", extraSections = ""): string {
  return `---
question_id: ntu-2026-co-os-q01
exam_subject: 計算機結構與作業系統
subjects:
  - os
departments:
  - csie
question_type: essay
source_url: ""
license_status: school_official
knowledge_points: []
${extraFrontmatter}---

## 題目

Explain scheduling.
${extraSections}`;
}

function makePrisma(
  calls: Array<{ method: string; args: unknown }>,
  kpCalls: Array<{ method: string; args: unknown }> = [],
): PrismaClient {
  const tx = {
    exam: { upsert: async () => ({ id: "exam-1" }) },
    examSubject: { upsert: async () => ({ id: "exam-subject-1" }) },
    question: { upsert: async () => ({ id: "question-1" }) },
    questionSubject: {
      deleteMany: async () => ({ count: 1 }),
      createMany: async () => ({ count: 1 }),
    },
    questionKnowledgePoint: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async (args: unknown) => {
        kpCalls.push({ method: "createMany", args });
        return { count: 1 };
      },
    },
    choice: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async () => ({ count: 0 }),
    },
    explanation: {
      upsert: async (args: unknown) => {
        calls.push({ method: "upsert", args });
        return { id: "explanation-1" };
      },
      deleteMany: async (args: unknown) => {
        calls.push({ method: "deleteMany", args });
        return { count: 1 };
      },
    },
  };

  return {
    school: { findUnique: async () => ({ id: "school-1" }) },
    department: { findUnique: async () => ({ id: "department-1" }) },
    subject: { findUnique: async () => ({ id: "subject-1" }) },
    knowledgePoint: { findFirst: async () => ({ id: "kp-1" }) },
    $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
  } as unknown as PrismaClient;
}

describe("syncFile explanation handling", () => {
  it("deletes a stale explanation when the standard answer section is absent", async () => {
    const calls: Array<{ method: string; args: unknown }> = [];
    const prisma = makePrisma(calls);
    const resolver = new Resolver(prisma);

    await syncFile(prisma, resolver, "questions/ntu/2026/co-os/q01.md", questionMarkdown());

    assert.deepEqual(
      calls.map((call) => call.method),
      ["deleteMany"],
    );
    assert.deepEqual(calls[0]?.args, { where: { questionId: "question-1" } });
  });

  it("upserts an explanation when the standard answer section has content", async () => {
    const calls: Array<{ method: string; args: unknown }> = [];
    const prisma = makePrisma(calls);
    const resolver = new Resolver(prisma);

    await syncFile(
      prisma,
      resolver,
      "questions/ntu/2026/co-os/q01.md",
      questionMarkdown(
        "",
        `
## 標準解答

Use round-robin scheduling.
`,
      ),
    );

    assert.deepEqual(
      calls.map((call) => call.method),
      ["upsert"],
    );
    assert.match(JSON.stringify(calls[0]?.args), /Use round-robin scheduling/);
  });
});

describe("syncFile knowledge point handling", () => {
  it("writes a QuestionKnowledgePoint row resolved from knowledge_point_slugs", async () => {
    const calls: Array<{ method: string; args: unknown }> = [];
    const kpCalls: Array<{ method: string; args: unknown }> = [];
    const prisma = makePrisma(calls, kpCalls);
    const resolver = new Resolver(prisma);

    await syncFile(
      prisma,
      resolver,
      "questions/ntu/2026/co-os/q01.md",
      questionMarkdown("knowledge_point_slugs:\n  - master-theorem\n"),
    );

    assert.equal(kpCalls.length, 1);
    assert.deepEqual(kpCalls[0]?.args, {
      data: [{ questionId: "question-1", knowledgePointId: "kp-1" }],
    });
  });

  it("skips QuestionKnowledgePoint createMany when knowledge_point_slugs is empty", async () => {
    const calls: Array<{ method: string; args: unknown }> = [];
    const kpCalls: Array<{ method: string; args: unknown }> = [];
    const prisma = makePrisma(calls, kpCalls);
    const resolver = new Resolver(prisma);

    await syncFile(prisma, resolver, "questions/ntu/2026/co-os/q01.md", questionMarkdown());

    assert.deepEqual(kpCalls, []);
  });
});
