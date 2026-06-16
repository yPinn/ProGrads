import type { PrismaClient } from "../../generated/client/client.ts";

// DEV FIXTURES ONLY — not canonical content. Real exams/questions come from ProGrads-content
// via the sync script (docs/03). These let the exams API be exercised locally without
// needing a content repo checkout.

// 台大資工 2024 考試入學 — demonstrates 合科卷 (one paper bundling multiple subjects).
const NTU_CSIE_2024 = {
  school: "ntu",
  department: "csie",
  year: 2024,
  admissionType: "exam" as const,
  group: "",
  licenseStatus: "school_official" as const,
  sourceUrl: "https://www.csie.ntu.edu.tw/",
  papers: [
    { name: "資料結構與演算法", subjects: ["ds", "algo"] },
    { name: "計算機結構與作業系統", subjects: ["co", "os"] },
    { name: "數學（線性代數、離散數學）", subjects: ["la", "dm"] },
  ],
};

export interface DevFixturesResult {
  exams: number;
  examSubjects: number;
}

export async function seedDevFixtures(prisma: PrismaClient): Promise<DevFixturesResult> {
  const f = NTU_CSIE_2024;

  const school = await prisma.school.findUniqueOrThrow({ where: { slug: f.school } });
  const department = await prisma.department.findUniqueOrThrow({
    where: { schoolId_slug: { schoolId: school.id, slug: f.department } },
  });

  const exam = await prisma.exam.upsert({
    where: {
      schoolId_departmentId_year_admissionType_group: {
        schoolId: school.id,
        departmentId: department.id,
        year: f.year,
        admissionType: f.admissionType,
        group: f.group,
      },
    },
    update: { licenseStatus: f.licenseStatus, sourceUrl: f.sourceUrl },
    create: {
      schoolId: school.id,
      departmentId: department.id,
      year: f.year,
      admissionType: f.admissionType,
      group: f.group,
      licenseStatus: f.licenseStatus,
      sourceUrl: f.sourceUrl,
    },
  });

  // Idempotent rebuild of papers (no questions reference them yet, so delete is safe).
  await prisma.examSubject.deleteMany({ where: { examId: exam.id } });
  for (const paper of f.papers) {
    const subjects = await Promise.all(
      paper.subjects.map((slug) => prisma.subject.findUniqueOrThrow({ where: { slug } })),
    );
    await prisma.examSubject.create({
      data: {
        examId: exam.id,
        name: paper.name,
        subjects: { create: subjects.map((s) => ({ subjectId: s.id })) },
      },
    });
  }

  return { exams: 1, examSubjects: f.papers.length };
}
