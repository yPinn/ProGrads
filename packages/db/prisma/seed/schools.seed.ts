import type { PrismaClient } from "../../generated/client/client.ts";

// Schools + 研究所 (graduate institutes)：四大(台清交成)+政大+四中(中央中山中興中正)。
// 以研究所/碩士班為單位（大學部不計）；同學院考科相近的所一併歸入對應 track
// （資工群→cs、電機群→ee、資管→info-mgmt）。名稱/縮寫 2026-06 逐校官網查證。
// dept slug 同校內唯一、反映各校官方英文名（故資工系 csie/cs/cse 因校而異）。
// 政大無工學院故無 ee 群；清大無資管系（isa 歸 cs 群）。

type DeptSeed = { slug: string; name: string; track: string };

const SCHOOLS: { slug: string; name: string; departments: DeptSeed[] }[] = [
  // ── 四大（台清交成）──────────────────────────────────────────
  {
    slug: "ntu",
    name: "國立臺灣大學",
    departments: [
      { slug: "csie", name: "資訊工程學系", track: "cs" },
      { slug: "nm", name: "資訊網路與多媒體研究所", track: "cs" },
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "elec", name: "電子工程學研究所", track: "ee" },
      { slug: "comm", name: "電信工程學研究所", track: "ee" },
      { slug: "photonics", name: "光電工程學研究所", track: "ee" },
      { slug: "im", name: "資訊管理學系", track: "info-mgmt" },
    ],
  },
  {
    slug: "nthu",
    name: "國立清華大學",
    departments: [
      { slug: "cs", name: "資訊工程學系", track: "cs" }, // 官方英文 Department of Computer Science
      { slug: "isa", name: "資訊系統與應用研究所", track: "cs" },
      { slug: "isec", name: "資訊安全研究所", track: "cs" },
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "elec", name: "電子工程研究所", track: "ee" },
      { slug: "comm", name: "通訊工程研究所", track: "ee" },
      { slug: "photonics", name: "光電工程研究所", track: "ee" },
    ],
  },
  {
    slug: "nycu",
    name: "國立陽明交通大學",
    departments: [
      // 資訊學院（資工系為大學部，研究所分五所）
      { slug: "cse", name: "資訊科學與工程研究所", track: "cs" },
      { slug: "net", name: "網路工程研究所", track: "cs" },
      { slug: "mm", name: "多媒體工程研究所", track: "cs" },
      { slug: "dsci", name: "資料科學與工程研究所", track: "cs" },
      { slug: "isec", name: "資訊安全研究所", track: "cs" },
      // 電機學院
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "elec", name: "電子研究所", track: "ee" },
      { slug: "comm", name: "電信工程研究所", track: "ee" },
      { slug: "ctrl", name: "電控工程研究所", track: "ee" },
      { slug: "photonics", name: "光電工程學系", track: "ee" },
      { slug: "semi", name: "半導體工程學系", track: "ee" },
      // 管理學院
      { slug: "iim", name: "資訊管理研究所", track: "info-mgmt" },
    ],
  },
  {
    slug: "ncku",
    name: "國立成功大學",
    departments: [
      { slug: "csie", name: "資訊工程學系", track: "cs" },
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "micro", name: "微電子工程研究所", track: "ee" },
      { slug: "cce", name: "電腦與通信工程研究所", track: "ee" }, // 電機學院；含通訊/計算機考科
      { slug: "iim", name: "資訊管理研究所", track: "info-mgmt" },
    ],
  },
  // ── 政大（無工學院 → 無 ee 群）──────────────────────────────
  {
    slug: "nccu",
    name: "國立政治大學",
    departments: [
      { slug: "cs", name: "資訊科學系", track: "cs" }, // 資科系，官方英文 Computer Science
      { slug: "mis", name: "資訊管理學系", track: "info-mgmt" },
      // 商學院 + 數理（招生情報涵蓋；track 取最近的既有分類）。
      { slug: "math", name: "應用數學系", track: "math" },
      { slug: "ib", name: "國際經營與貿易學系", track: "intl-business" },
      { slug: "banking", name: "金融學系", track: "finance" },
      { slug: "finance", name: "財務管理學系", track: "finance" },
      { slug: "accounting", name: "會計學系", track: "business-admin" },
      { slug: "stat", name: "統計學系", track: "stat" },
      { slug: "mba", name: "企業管理研究所", track: "business-admin" },
      { slug: "rmi", name: "風險管理與保險學系", track: "finance" },
      { slug: "tiipm", name: "科技管理與智慧財產研究所", track: "ind-mgmt" },
    ],
  },
  // ── 四中（中央／中山／中興／中正）──────────────────────────
  {
    slug: "ncu",
    name: "國立中央大學",
    departments: [
      { slug: "csie", name: "資訊工程學系", track: "cs" },
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "comm", name: "通訊工程學系", track: "ee" },
      { slug: "im", name: "資訊管理學系", track: "info-mgmt" },
    ],
  },
  {
    slug: "nsysu",
    name: "國立中山大學",
    departments: [
      { slug: "cse", name: "資訊工程學系", track: "cs" }, // 官方英文 Computer Science and Engineering
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "comm", name: "通訊工程研究所", track: "ee" },
      { slug: "photonics", name: "光電工程學系", track: "ee" },
      { slug: "im", name: "資訊管理學系", track: "info-mgmt" },
      { slug: "bm", name: "企業管理學系", track: "business-admin" }, // 官方英文 Business Management
    ],
  },
  {
    slug: "nchu",
    name: "國立中興大學",
    departments: [
      { slug: "cse", name: "資訊工程學系", track: "cs" }, // 官方英文 Computer Science and Engineering
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "comm", name: "通訊工程研究所", track: "ee" },
      { slug: "photonics", name: "光電工程研究所", track: "ee" },
      { slug: "im", name: "資訊管理學系", track: "info-mgmt" },
    ],
  },
  {
    slug: "ccu",
    name: "國立中正大學",
    departments: [
      { slug: "csie", name: "資訊工程學系", track: "cs" },
      { slug: "ee", name: "電機工程學系", track: "ee" },
      { slug: "comm", name: "通訊工程學系", track: "ee" },
      { slug: "im", name: "資訊管理學系", track: "info-mgmt" },
    ],
  },
  // ── 既有（保留，待後續比照擴充）────────────────────────────
  {
    slug: "ntust",
    name: "國立臺灣科技大學",
    departments: [{ slug: "csie", name: "資訊工程系", track: "cs" }],
  },
  {
    slug: "ntnu",
    name: "國立臺灣師範大學",
    departments: [{ slug: "csie", name: "資訊工程學系", track: "cs" }],
  },
];

export interface SchoolsSeedResult {
  schools: number;
  departments: number;
}

// Idempotent upsert of schools → departments. Each department links to its track
// via the trackIdBySlug map produced by seedTaxonomy (run taxonomy first).
export async function seedSchools(
  prisma: PrismaClient,
  trackIdBySlug: Map<string, string>,
): Promise<SchoolsSeedResult> {
  let departmentCount = 0;

  // Array index is the curated display rank (四大 → 政大 → 四中 → 二科 → 其他).
  for (const [index, school] of SCHOOLS.entries()) {
    const row = await prisma.school.upsert({
      where: { slug: school.slug },
      update: { name: school.name, displayOrder: index },
      create: { slug: school.slug, name: school.name, displayOrder: index },
    });
    for (const dept of school.departments) {
      const trackId = trackIdBySlug.get(dept.track);
      if (!trackId) throw new Error(`unknown track slug: ${dept.track}`);
      await prisma.department.upsert({
        where: { schoolId_slug: { schoolId: row.id, slug: dept.slug } },
        update: { name: dept.name, trackId },
        create: { schoolId: row.id, slug: dept.slug, name: dept.name, trackId },
      });
      departmentCount++;
    }
  }

  return { schools: SCHOOLS.length, departments: departmentCount };
}
