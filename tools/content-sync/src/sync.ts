import type { PrismaClient } from "@prograds/db";
import { type QuestionFrontmatter as Frontmatter, QuestionFrontmatter } from "@prograds/shared";
import matter from "gray-matter";
import { parseSections } from "./body.js";
import { parseQuestionPath } from "./paths.js";

// question_type -> Explanation.answer_type (drives AI pipeline + rendering; docs/02 lever #4).
const ANSWER_TYPE: Record<
  string,
  "single_choice" | "multi_choice" | "numeric" | "essay" | "proof"
> = {
  essay: "essay",
  calc: "numeric",
  proof: "proof",
  cloze: "essay",
  listening: "essay",
  mc: "single_choice",
};

// Resolves reference entities by slug, cached. Throws if missing (must be seeded first).
export class Resolver {
  private tracks = new Map<string, { id: string }>();
  private schools = new Map<string, { id: string }>();
  private departments = new Map<string, { id: string; trackId: string | null }>();
  private subjects = new Map<string, { id: string }>();

  constructor(private readonly prisma: PrismaClient) {}

  async track(slug: string): Promise<{ id: string }> {
    const hit = this.tracks.get(slug);
    if (hit) return hit;
    const row = await this.prisma.programTrack.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!row) throw new Error(`unknown track slug "${slug}" (seed it first)`);
    this.tracks.set(slug, row);
    return row;
  }

  async school(slug: string): Promise<{ id: string }> {
    const hit = this.schools.get(slug);
    if (hit) return hit;
    const row = await this.prisma.school.findUnique({ where: { slug }, select: { id: true } });
    if (!row) throw new Error(`unknown school slug "${slug}" (seed it first)`);
    this.schools.set(slug, row);
    return row;
  }

  async department(
    schoolId: string,
    slug: string,
  ): Promise<{ id: string; trackId: string | null }> {
    const key = `${schoolId}|${slug}`;
    const hit = this.departments.get(key);
    if (hit) return hit;
    const row = await this.prisma.department.findUnique({
      where: { schoolId_slug: { schoolId, slug } },
      select: { id: true, trackId: true },
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

export type SyncResult = { examSubjectId: string } | { skipped: string };

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

  // First slice: MC choices/answer format deferred.
  if (fm.question_type === "mc") {
    return { skipped: `mc not supported yet: ${relPath}` };
  }

  const track = await resolver.track(path.track);
  const school = await resolver.school(path.school);
  const department = await resolver.department(school.id, path.department);
  if (department.trackId !== track.id) {
    throw new Error(
      `misfiled: ${relPath} is under track "${path.track}" but its department belongs to another track`,
    );
  }
  const subjects = await Promise.all(fm.subjects.map((s) => resolver.subject(s)));

  const sections = parseSections(parsed.content);
  const questionMd = sections.get("題目");
  const standardAnswer = sections.get("標準解答");
  if (!questionMd) throw new Error(`missing "## 題目" section: ${relPath}`);
  if (!standardAnswer) throw new Error(`missing "## 標準解答" section: ${relPath}`);
  const knowledgeExtension = sections.get("知識點延伸") ?? null;

  const questionMeta = {
    sourceUrl: fm.source_url,
    licenseStatus: fm.license_status,
    knowledgePoints: fm.knowledge_points,
    ...(knowledgeExtension ? { knowledgeExtension } : {}),
  };

  let examSubjectId = "";
  await prisma.$transaction(async (tx) => {
    const exam = await tx.exam.upsert({
      where: {
        schoolId_departmentId_year_admissionType_group: {
          schoolId: school.id,
          departmentId: department.id,
          year: path.year,
          admissionType: fm.admission_type,
          group: fm.group,
        },
      },
      update: { licenseStatus: fm.license_status },
      create: {
        schoolId: school.id,
        departmentId: department.id,
        year: path.year,
        admissionType: fm.admission_type,
        group: fm.group,
        licenseStatus: fm.license_status,
      },
    });

    const examSubject = await tx.examSubject.upsert({
      where: { examId_name: { examId: exam.id, name: fm.exam_subject } },
      update: { sourceUrl: fm.source_url },
      create: { examId: exam.id, name: fm.exam_subject, sourceUrl: fm.source_url },
    });
    examSubjectId = examSubject.id;

    const questionData = {
      examSubjectId: examSubject.id,
      number: path.number,
      order: path.order,
      type: fm.question_type,
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

    const explanationData = {
      standardAnswer,
      answerType: ANSWER_TYPE[fm.question_type] ?? "essay",
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

  return { examSubjectId };
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
