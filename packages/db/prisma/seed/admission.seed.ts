import type { PrismaClient } from "../../generated/client/client.ts";

// 招生組別 (admission groups) — 雛形/樣本。報考單位 = 校×系所×組；組掛勾招生方式/名額、決定考科。
// 只存穩定身分 (code+name)；逐年事實 (考科/名額/日程) 另存於 (組,年) 記錄、不在此 seed。
// 不分組系所不列 (缺列=單一招生)。樣本僅含已查證者，全校逐組考究待後續。
// code 用 ASCII 代號 a/b/c/d（＝甲/乙/丙/丁，中文僅顯示用）；與 content 路徑/question_id 的 group 段一致。

type GroupSeed = { code: string; name: string };

const ADMISSION_GROUPS: { school: string; dept: string; groups: GroupSeed[] }[] = [
  {
    school: "nchu",
    dept: "cse", // 中興資工 — 114學年度簡章查證 (a=甲組 891 / b=乙組 892)
    groups: [
      { code: "a", name: "資訊工程" },
      { code: "b", name: "AI 資安" },
    ],
  },
  {
    school: "nycu",
    dept: "isec", // 資訊安全研究所 (Inst. of Computer & Communications Security)
    groups: [
      { code: "a", name: "資訊學院師資" }, // 偏資工考科
      { code: "b", name: "電機學院師資" }, // 偏電機考科
    ],
  },
  {
    school: "ntu",
    dept: "elec", // 國立臺灣大學 電子工程學研究所 (GIEE)
    groups: [
      { code: "a", name: "數位積體電路與系統" },
      { code: "b", name: "類比積體電路與系統" },
      { code: "c", name: "電子設計自動化" },
      { code: "d", name: "奈米電子（含光電半導體）" },
    ],
  },
];

export interface AdmissionSeedResult {
  groups: number;
}

// Resolve a department's id by (school slug, dept slug); both must already be seeded.
async function resolveDeptId(prisma: PrismaClient, school: string, dept: string): Promise<string> {
  const s = await prisma.school.findUniqueOrThrow({ where: { slug: school } });
  const d = await prisma.department.findUniqueOrThrow({
    where: { schoolId_slug: { schoolId: s.id, slug: dept } },
  });
  return d.id;
}

// Idempotent upsert of admission groups, keyed by (departmentId, code).
export async function seedAdmissionGroups(prisma: PrismaClient): Promise<AdmissionSeedResult> {
  let groupCount = 0;

  for (const entry of ADMISSION_GROUPS) {
    const deptId = await resolveDeptId(prisma, entry.school, entry.dept);
    for (const [index, group] of entry.groups.entries()) {
      await prisma.admissionGroup.upsert({
        where: { departmentId_code: { departmentId: deptId, code: group.code } },
        update: { name: group.name, displayOrder: index },
        create: { departmentId: deptId, code: group.code, name: group.name, displayOrder: index },
      });
      groupCount++;
    }
  }

  return { groups: groupCount };
}

// 招生梯次。nchu/cse = 中興資工 114學年度(2025) 簡章查證 (端到端範例);
// 合科考科以 note 記「考試科目（節次）」—— 真正的合科卷/節次/時間/計算機(※) 待 AdmissionRoundPaper(後續)。
// nycu/isec 為未查證示意，留作結構參考。
type RoundSeed = {
  school: string;
  dept: string;
  group: string;
  year: number;
  admissionType: "exam" | "recommended" | "in_service";
  quota?: number;
  sourceUrl?: string;
  subjects: { slug: string; note?: string }[];
  events: {
    event: "registration_start" | "registration_end" | "written_exam" | "interview" | "result";
    at: string; // ISO 8601, +08:00
    location?: string;
  }[];
};

const ROUNDS: RoundSeed[] = [
  {
    school: "nchu",
    dept: "cse",
    group: "a", // 資訊工程組 (891), 一般生 28
    year: 2025,
    admissionType: "exam",
    quota: 28,
    sourceUrl: "https://recruit.nchu.edu.tw/",
    subjects: [
      { slug: "ds", note: "資料結構與演算法（第1節）" },
      { slug: "algo", note: "資料結構與演算法（第1節）" },
      { slug: "co", note: "計算機組織與作業系統（第2節）" },
      { slug: "os", note: "計算機組織與作業系統（第2節）" },
      { slug: "dm", note: "離散數學與線性代數（第3節）" },
      { slug: "la", note: "離散數學與線性代數（第3節）" },
    ],
    events: [
      { event: "registration_start", at: "2024-11-27T09:00:00+08:00" },
      { event: "registration_end", at: "2024-12-13T17:00:00+08:00" },
      { event: "written_exam", at: "2025-02-07T08:10:00+08:00", location: "國立中興大學（臺中）" },
      { event: "result", at: "2025-02-27T00:00:00+08:00" }, // 第一梯次放榜
    ],
  },
  {
    school: "nchu",
    dept: "cse",
    group: "b", // AI 資安組 (892), 一般生 4
    year: 2025,
    admissionType: "exam",
    quota: 4,
    sourceUrl: "https://recruit.nchu.edu.tw/",
    subjects: [
      { slug: "dm", note: "基礎數學（第1節）" },
      { slug: "la", note: "基礎數學（第1節）" },
      { slug: "os", note: "資訊系統（第2節）" },
      { slug: "algo", note: "資訊系統（第2節）" },
      { slug: "ds", note: "資訊系統（第2節）" },
      { slug: "infosec-intro", note: "資訊系統（第2節）" },
    ],
    events: [
      { event: "registration_start", at: "2024-11-27T09:00:00+08:00" },
      { event: "registration_end", at: "2024-12-13T17:00:00+08:00" },
      { event: "written_exam", at: "2025-02-07T08:10:00+08:00", location: "國立中興大學（臺中）" },
      { event: "result", at: "2025-02-27T00:00:00+08:00" }, // 第一梯次放榜
    ],
  },
  {
    school: "nycu",
    dept: "isec",
    group: "a",
    year: 2026,
    admissionType: "exam",
    quota: 20,
    sourceUrl: "https://exam.nycu.edu.tw/",
    subjects: [{ slug: "ds" }, { slug: "algo" }, { slug: "networking" }],
    events: [
      { event: "registration_end", at: "2025-12-15T17:00:00+08:00" },
      {
        event: "written_exam",
        at: "2026-02-07T09:00:00+08:00",
        location: "陽明交大光復校區（新竹）",
      },
      { event: "result", at: "2026-03-10T00:00:00+08:00" },
    ],
  },
];

export interface AdmissionRoundSeedResult {
  rounds: number;
  roundEvents: number;
  roundSubjects: number;
}

// Idempotent: upsert round by (group, year, type); child events/subjects rebuilt each run.
export async function seedAdmissionRounds(prisma: PrismaClient): Promise<AdmissionRoundSeedResult> {
  let rounds = 0;
  let events = 0;
  let subjects = 0;

  for (const r of ROUNDS) {
    const deptId = await resolveDeptId(prisma, r.school, r.dept);
    const group = await prisma.admissionGroup.findUniqueOrThrow({
      where: { departmentId_code: { departmentId: deptId, code: r.group } },
    });

    const round = await prisma.admissionRound.upsert({
      where: {
        admissionGroupId_year_admissionType: {
          admissionGroupId: group.id,
          year: r.year,
          admissionType: r.admissionType,
        },
      },
      update: { quota: r.quota ?? null, sourceUrl: r.sourceUrl ?? null },
      create: {
        admissionGroupId: group.id,
        year: r.year,
        admissionType: r.admissionType,
        quota: r.quota ?? null,
        sourceUrl: r.sourceUrl ?? null,
      },
    });
    rounds++;

    // Rebuild children (idempotent).
    await prisma.admissionRoundEvent.deleteMany({ where: { roundId: round.id } });
    for (const e of r.events) {
      await prisma.admissionRoundEvent.create({
        data: {
          roundId: round.id,
          event: e.event,
          at: new Date(e.at),
          location: e.location ?? null,
        },
      });
      events++;
    }

    await prisma.admissionRoundSubject.deleteMany({ where: { roundId: round.id } });
    for (const s of r.subjects) {
      const subject = await prisma.subject.findUniqueOrThrow({ where: { slug: s.slug } });
      await prisma.admissionRoundSubject.create({
        data: { roundId: round.id, subjectId: subject.id, note: s.note ?? null },
      });
      subjects++;
    }
  }

  return { rounds, roundEvents: events, roundSubjects: subjects };
}
