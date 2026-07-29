import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  Choice,
  Meta,
  PaperSummary,
  PaperTest,
  QuestionDetail,
  QuestionFacets,
  QuestionSummary,
  QuestionType,
  Subject,
  Trend,
  TrendRow,
  TrendSchool,
} from "@prograds/shared";
import { mapSchool, metaNumber, metaString, uniqueDepartments } from "../../common/mappers.js";
import { QuestionFilters, QuestionsRepository } from "./questions.repository.js";

// 題型固定順序(mc/essay/calc/proof/cloze/listening),與 CLI report-trends.ts 一致;pivot 只列出
// 該考科實際出現過的題型,此陣列只用於篩掉沒出現的型別、不影響最終排序(依 total 降冪)。
const TYPE_ORDER: QuestionType[] = ["mc", "essay", "calc", "proof", "cloze", "listening"];

// Pivot builder shared by 題型×年 / 考點×年: one row per key, cell = count(key, year), sorted by
// total desc (tie: key asc), trend = first-vs-last year comparison. Mirrors report-trends.ts's
// `pivot()`. `top` caps the row count (used for 考點, which can run to dozens); omit for 題型.
function pivotRows(
  keys: string[],
  years: number[],
  count: (key: string, year: number) => number,
  top?: number,
): TrendRow[] {
  const rows = keys.map((key) => {
    const cells = years.map((y) => count(key, y));
    const total = cells.reduce((s, c) => s + c, 0);
    const first = cells[0] ?? 0;
    const last = cells.at(-1) ?? 0;
    const trend: TrendRow["trend"] = last > first ? "up" : last < first ? "down" : "flat";
    return { key, cells, total, trend };
  });
  rows.sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
  return top ? rows.slice(0, top) : rows;
}

interface ChoiceRow {
  label: string;
  contentMd: string;
  isCorrect: boolean;
}
interface SubjectRow {
  subject: { id: string; slug: string; name: string };
}

function mapSubjects(rows: SubjectRow[]): Subject[] {
  return rows.map((r) => ({ id: r.subject.id, slug: r.subject.slug, name: r.subject.name }));
}

function mapChoices(rows: ChoiceRow[]): Choice[] {
  return rows.map((c) => ({ label: c.label, contentMd: c.contentMd, isCorrect: c.isCorrect }));
}

@Injectable()
export class QuestionsService {
  constructor(private readonly repo: QuestionsRepository) {}

  async getQuestions(
    filters: QuestionFilters,
    page: number,
    pageSize: number,
  ): Promise<{ data: QuestionSummary[]; meta: Meta }> {
    const { rows, total } = await this.repo.findMany(filters, page, pageSize);
    const data: QuestionSummary[] = rows.map((q) => ({
      externalId: q.externalId,
      number: q.number,
      type: q.type,
      subjects: mapSubjects(q.subjects),
      examSubject: {
        id: q.examSubject.id,
        slug: q.examSubject.slug,
        name: q.examSubject.name,
        departments: uniqueDepartments(q.examSubject.departments),
      },
      exam: {
        id: q.examSubject.exam.id,
        year: q.examSubject.exam.year,
        admissionType: q.examSubject.exam.admissionType,
        school: mapSchool(q.examSubject.exam.school),
      },
    }));
    return { data, meta: { page, pageSize, total } };
  }

  async getPapers(
    filters: QuestionFilters,
    page: number,
    pageSize: number,
  ): Promise<{ data: PaperSummary[]; meta: Meta }> {
    const { rows, total } = await this.repo.findPapers(filters, page, pageSize);
    const data: PaperSummary[] = rows.map((es) => ({
      examSubject: {
        id: es.id,
        slug: es.slug,
        name: es.name,
        departments: uniqueDepartments(es.departments),
      },
      exam: {
        id: es.exam.id,
        year: es.exam.year,
        admissionType: es.exam.admissionType,
        school: mapSchool(es.exam.school),
      },
      subjects: mapSubjects(es.subjects),
      questions: es.questions.map((q) => ({
        externalId: q.externalId,
        number: q.number,
        type: q.type,
        group: metaString(q.metadata, "group"),
      })),
    }));
    return { data, meta: { page, pageSize, total } };
  }

  async getFacets(): Promise<QuestionFacets> {
    const { subjects, schools, years } = await this.repo.findFacets();
    return {
      subjects: subjects.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        paperCount: s._count.examSubjects,
      })),
      schools: schools.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
      years: years.map((e) => e.year),
    };
  }

  // Whole-paper test: all questions of one paper (full content + choices + explanation), ordered.
  // The shared 題組 passage lives in the group lead's metadata.passage; since questions come in
  // order, the first question seen per group is its lead — resolve passages in one in-memory pass.
  async getPaperTest(examSubjectId: string): Promise<PaperTest> {
    const es = await this.repo.findPaperById(examSubjectId);
    if (!es) {
      throw new NotFoundException(`paper not found: ${examSubjectId}`);
    }
    const groupPassage = new Map<string, string | null>();
    for (const q of es.questions) {
      const g = metaString(q.metadata, "group");
      if (g && !groupPassage.has(g)) groupPassage.set(g, metaString(q.metadata, "passage"));
    }
    return {
      examSubject: {
        id: es.id,
        slug: es.slug,
        name: es.name,
        subjects: mapSubjects(es.subjects),
        departments: uniqueDepartments(es.departments),
      },
      exam: {
        id: es.exam.id,
        year: es.exam.year,
        admissionType: es.exam.admissionType,
        school: mapSchool(es.exam.school),
      },
      durationMinutes: metaNumber(es.metadata, "durationMinutes"),
      questions: es.questions.map((q) => {
        const group = metaString(q.metadata, "group");
        return {
          externalId: q.externalId,
          number: q.number,
          type: q.type,
          subjects: mapSubjects(q.subjects),
          contentMd: q.contentMd,
          points: q.points,
          choices: mapChoices(q.choices),
          explanation: q.explanation
            ? {
                standardAnswer: q.explanation.standardAnswer,
                answerType: q.explanation.answerType,
                confidence: q.explanation.confidence,
                reviewStatus: q.explanation.reviewStatus,
                modelUsed: q.explanation.modelUsed,
              }
            : null,
          group,
          groupPassageMd: group ? (groupPassage.get(group) ?? null) : null,
        };
      }),
    };
  }

  async getQuestion(externalId: string): Promise<QuestionDetail> {
    const q = await this.repo.findByExternalId(externalId);
    if (!q) {
      throw new NotFoundException(`question not found: ${externalId}`);
    }
    const sourceUrl = metaString(q.metadata, "sourceUrl");
    const group = metaString(q.metadata, "group");
    const es = q.examSubject;

    // The question-group shared passage (lead's metadata.passage) and the same-paper prev/next
    // are independent, so fetch them concurrently:
    // - group: surface the shared passage so every member's page renders it above its own prompt.
    // - prev/next: same-paper, by question order, for stepping through the detail page.
    const [lead, { prev, next }] = await Promise.all([
      group ? this.repo.findGroupLead(q.examSubjectId, group) : Promise.resolve(null),
      this.repo.findSiblings(q.examSubjectId, q.order, q.externalId),
    ]);
    const groupPassageMd = metaString(lead?.metadata, "passage");

    return {
      externalId: q.externalId,
      number: q.number,
      type: q.type,
      contentMd: q.contentMd,
      sourceUrl,
      licenseStatus: es.licenseStatus,
      choices: mapChoices(q.choices),
      subjects: mapSubjects(q.subjects),
      examSubject: {
        id: es.id,
        slug: es.slug,
        name: es.name,
        subjects: mapSubjects(es.subjects),
        departments: uniqueDepartments(es.departments),
      },
      exam: {
        id: es.exam.id,
        year: es.exam.year,
        admissionType: es.exam.admissionType,
        school: mapSchool(es.exam.school),
      },
      explanation: q.explanation
        ? {
            standardAnswer: q.explanation.standardAnswer,
            answerType: q.explanation.answerType,
            confidence: q.explanation.confidence,
            reviewStatus: q.explanation.reviewStatus,
            modelUsed: q.explanation.modelUsed,
          }
        : null,
      group,
      groupPassageMd,
      prev,
      next,
    };
  }

  // 歷年趨勢(單校×年 for v1): 題型×年 + 考點×年 for one subject, scoped to a school (given or the
  // deepest-history one). All questions of the subject are fetched once and pivoted in memory —
  // the dataset per subject is small (tens to low hundreds of rows), so this mirrors
  // tools/content-sync/src/report-trends.ts rather than pushing the pivot into SQL.
  async getTrends(
    subjectSlug: string,
    schoolSlug: string | undefined,
    top: number,
  ): Promise<Trend> {
    const subject = await this.repo.findSubjectBySlug(subjectSlug);
    if (!subject) {
      throw new NotFoundException(`subject not found: ${subjectSlug}`);
    }
    const rows = await this.repo.findForTrends(subjectSlug);
    if (rows.length === 0) {
      throw new NotFoundException(`no questions for subject: ${subjectSlug}`);
    }

    // Distinct schools this subject appears at, each with its year-depth (used for the school
    // picker and to pick a default: the school with the most years reads as an actual trend).
    const bySchool = new Map<
      string,
      { school: (typeof rows)[number]["examSubject"]["exam"]["school"]; years: Set<number> }
    >();
    for (const r of rows) {
      const sc = r.examSubject.exam.school;
      const entry = bySchool.get(sc.slug) ?? { school: sc, years: new Set<number>() };
      entry.years.add(r.examSubject.exam.year);
      bySchool.set(sc.slug, entry);
    }
    const schools: TrendSchool[] = [...bySchool.values()]
      .map((e) => ({ ...mapSchool(e.school), years: e.years.size }))
      .sort((a, b) => b.years - a.years || a.name.localeCompare(b.name));

    const selected = schoolSlug ? schools.find((s) => s.slug === schoolSlug) : schools[0];
    if (!selected) {
      throw new NotFoundException(
        `school "${schoolSlug}" has no questions for subject: ${subjectSlug}`,
      );
    }

    const scope = rows.filter((r) => r.examSubject.exam.school.slug === selected.slug);
    const years = [...new Set(scope.map((r) => r.examSubject.exam.year))].sort((a, b) => a - b);

    const byType = pivotRows(
      TYPE_ORDER.filter((t) => scope.some((r) => r.type === t)),
      years,
      (key, year) => scope.filter((r) => r.type === key && r.examSubject.exam.year === year).length,
    );

    const kpSet = [
      ...new Set(scope.flatMap((r) => r.knowledgePoints.map((k) => k.knowledgePoint.name))),
    ];
    const byPoint = pivotRows(
      kpSet,
      years,
      (key, year) =>
        scope.filter(
          (r) =>
            r.examSubject.exam.year === year &&
            r.knowledgePoints.some((k) => k.knowledgePoint.name === key),
        ).length,
      top,
    );

    return {
      subject,
      schools,
      selectedSchool: { id: selected.id, slug: selected.slug, name: selected.name },
      years,
      byType,
      byPoint,
    };
  }
}
