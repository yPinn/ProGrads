import type { PrismaClient } from "@prograds/db";
import { type QuestionFrontmatter as Frontmatter, QuestionFrontmatter } from "@prograds/shared";
import matter from "gray-matter";
import { parseAnswer, parseChoices, parseSections } from "./body.js";
import { parseQuestionPath } from "./paths.js";

// question_type -> Explanation.answer_type for non-MC types.
const ANSWER_TYPE: Record<string, "numeric" | "essay" | "proof"> = {
  essay: "essay",
  calc: "numeric",
  proof: "proof",
  cloze: "essay",
  listening: "essay",
};

// Resolves reference entities by slug, cached. Throws if missing (must be seeded first).
export class Resolver {
  private schools = new Map<string, { id: string }>();
  private departments = new Map<string, { id: string }>();
  private subjects = new Map<string, { id: string }>();

  constructor(private readonly prisma: PrismaClient) {}

  async school(slug: string): Promise<{ id: string }> {
    const hit = this.schools.get(slug);
    if (hit) return hit;
    const row = await this.prisma.school.findUnique({ where: { slug }, select: { id: true } });
    if (!row) throw new Error(`unknown school slug "${slug}" (seed it first)`);
    this.schools.set(slug, row);
    return row;
  }

  // Resolve a department by (school, slug). Used for the question's `departments` list.
  async department(schoolId: string, slug: string): Promise<{ id: string }> {
    const key = `${schoolId}|${slug}`;
    const hit = this.departments.get(key);
    if (hit) return hit;
    const row = await this.prisma.department.findUnique({
      where: { schoolId_slug: { schoolId, slug } },
      select: { id: true },
    });
    if (!row) throw new Error(`unknown department slug "${slug}" for school (seed it first)`);
    this.departments.set(key, row);
    return row;
  }

  async subject(slug: string): Promise<{ id: string }> {
    const hit = this.subjects.get(slug);
    if (hit) return hit;
    const row = await this.prisma.subject.findUnique({ where: { slug }, select: { id: true } });
    if (!row) throw new Error(`unknown subject slug "${slug}" (seed it first)`);
    this.subjects.set(slug, row);
    return row;
  }
}

export type SyncResult = { examSubjectId: string; departmentIds: string[] } | { skipped: string };

// Parse, validate, resolve and upsert one question file. Returns the touched
// examSubjectId (for end-of-run composition reconcile) or a skip reason.
export async function syncFile(
  prisma: PrismaClient,
  resolver: Resolver,
  relPath: string,
  rawMd: string,
): Promise<SyncResult> {
  const path = parseQuestionPath(relPath);
  const parsed = matter(rawMd);
  const fm: Frontmatter = QuestionFrontmatter.parse(parsed.data);

  if (fm.question_id !== path.questionId) {
    throw new Error(
      `question_id mismatch in ${relPath}: frontmatter "${fm.question_id}" != path-derived "${path.questionId}"`,
    );
  }

  const school = await resolver.school(path.school);
  const subjects = await Promise.all(fm.subjects.map((s) => resolver.subject(s)));
  const departments = await Promise.all(
    fm.departments.map((d) => resolver.department(school.id, d)),
  );

  const sections = parseSections(parsed.content);
  const questionMd = sections.get("題目");
  const standardAnswer = sections.get("標準解答") ?? "";
  if (!questionMd) throw new Error(`missing "## 題目" section: ${relPath}`);
  const knowledgeExtension = sections.get("知識點延伸") ?? null;
  // 題組共用篇章(閱讀/克漏字): 只存於題組首題, 與該題自身題幹(## 題目)分離。
  const passage = sections.get("題組篇章") ?? null;

  // MC: parse choices + answer; derive answerType dynamically.
  let answerType: "single_choice" | "multi_choice" | "numeric" | "essay" | "proof";
  let choiceRows: Array<{ label: string; contentMd: string; isCorrect: boolean }> = [];
  if (fm.question_type === "mc") {
    const choicesSection = sections.get("選項");
    const answerSection = sections.get("答案");
    if (!choicesSection) throw new Error(`missing "## 選項" section for mc: ${relPath}`);
    if (!answerSection) throw new Error(`missing "## 答案" section for mc: ${relPath}`);
    const rawChoices = parseChoices(choicesSection);
    const correctLabels = parseAnswer(answerSection);
    if (rawChoices.length === 0) throw new Error(`no choices parsed from "## 選項": ${relPath}`);
    if (correctLabels.length === 0) throw new Error(`no answer parsed from "## 答案": ${relPath}`);
    answerType = correctLabels.length > 1 ? "multi_choice" : "single_choice";
    choiceRows = rawChoices.map((c) => ({ ...c, isCorrect: correctLabels.includes(c.label) }));
  } else {
    answerType = ANSWER_TYPE[fm.question_type] ?? "essay";
  }

  const questionMeta = {
    sourceUrl: fm.source_url,
    licenseStatus: fm.license_status,
    knowledgePoints: fm.knowledge_points,
    ...(fm.group ? { group: fm.group } : {}),
    ...(passage ? { passage } : {}),
    ...(knowledgeExtension ? { knowledgeExtension } : {}),
  };

  let examSubjectId = "";
  await prisma.$transaction(async (tx) => {
    const exam = await tx.exam.upsert({
      where: {
        schoolId_year_admissionType: {
          schoolId: school.id,
          year: path.year,
          admissionType: fm.admission_type,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        year: path.year,
        admissionType: fm.admission_type,
      },
    });

    const examSubject = await tx.examSubject.upsert({
      where: { examId_slug: { examId: exam.id, slug: path.paperSlug } },
      update: {
        name: fm.exam_subject,
        sourceUrl: fm.source_url,
        licenseStatus: fm.license_status,
      },
      create: {
        examId: exam.id,
        slug: path.paperSlug,
        name: fm.exam_subject,
        sourceUrl: fm.source_url,
        licenseStatus: fm.license_status,
      },
    });
    examSubjectId = examSubject.id;

    const questionData = {
      examSubjectId: examSubject.id,
      number: path.number,
      order: path.order,
      type: fm.question_type,
      points: fm.points ?? null,
      contentMd: questionMd,
      metadata: questionMeta,
    };
    const question = await tx.question.upsert({
      where: { externalId: fm.question_id },
      update: questionData,
      create: { externalId: fm.question_id, ...questionData },
    });

    // Replace granular question_subject mappings.
    await tx.questionSubject.deleteMany({ where: { questionId: question.id } });
    await tx.questionSubject.createMany({
      data: subjects.map((s) => ({ questionId: question.id, subjectId: s.id })),
    });

    // Replace choices (MC only; no-op for other types).
    await tx.choice.deleteMany({ where: { questionId: question.id } });
    if (choiceRows.length > 0) {
      await tx.choice.createMany({
        data: choiceRows.map((c) => ({ questionId: question.id, ...c })),
      });
    }

    const explanationData = {
      standardAnswer,
      answerType,
      confidence: fm.confidence ?? null,
      modelUsed: fm.model_used ?? null,
      reviewStatus: fm.review_status,
    };
    await tx.explanation.upsert({
      where: { questionId: question.id },
      update: explanationData,
      create: { questionId: question.id, ...explanationData },
    });
  });

  return { examSubjectId, departmentIds: departments.map((d) => d.id) };
}

// End-of-run: recompute each ExamSubject's subject composition as the union of its
// questions' granular subjects (合科卷). Stateful, so must run after all files.
export async function reconcileExamSubjects(
  prisma: PrismaClient,
  examSubjectIds: Iterable<string>,
): Promise<number> {
  let changed = 0;
  for (const examSubjectId of new Set(examSubjectIds)) {
    const links = await prisma.questionSubject.findMany({
      where: { question: { examSubjectId } },
      select: { subjectId: true },
    });
    const want = new Set(links.map((l) => l.subjectId));

    const existing = await prisma.examSubjectSubject.findMany({
      where: { examSubjectId },
      select: { subjectId: true },
    });
    const have = new Set(existing.map((e) => e.subjectId));

    const toAdd = [...want].filter((id) => !have.has(id));
    const toRemove = [...have].filter((id) => !want.has(id));

    if (toAdd.length > 0) {
      await prisma.examSubjectSubject.createMany({
        data: toAdd.map((subjectId) => ({ examSubjectId, subjectId })),
      });
      changed += toAdd.length;
    }
    if (toRemove.length > 0) {
      await prisma.examSubjectSubject.deleteMany({
        where: { examSubjectId, subjectId: { in: toRemove } },
      });
      changed += toRemove.length;
    }
  }
  return changed;
}

// End-of-run: reconcile each ExamSubject's department links to the union accumulated
// from its questions' frontmatter `departments` (a paper-level fact, not per-question).
export async function reconcileExamSubjectDepartments(
  prisma: PrismaClient,
  wantByExamSubject: Map<string, Set<string>>,
): Promise<number> {
  let changed = 0;
  for (const [examSubjectId, want] of wantByExamSubject) {
    const existing = await prisma.examSubjectDepartment.findMany({
      where: { examSubjectId },
      select: { departmentId: true },
    });
    const have = new Set(existing.map((e) => e.departmentId));

    const toAdd = [...want].filter((id) => !have.has(id));
    const toRemove = [...have].filter((id) => !want.has(id));

    if (toAdd.length > 0) {
      await prisma.examSubjectDepartment.createMany({
        data: toAdd.map((departmentId) => ({ examSubjectId, departmentId })),
      });
      changed += toAdd.length;
    }
    if (toRemove.length > 0) {
      await prisma.examSubjectDepartment.deleteMany({
        where: { examSubjectId, departmentId: { in: toRemove } },
      });
      changed += toRemove.length;
    }
  }
  return changed;
}
