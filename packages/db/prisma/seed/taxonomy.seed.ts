import type { PrismaClient } from "../../generated/client/client.ts";

// Taxonomy reference data. Authoritative L1/L2 from 大碩 (TKB). See docs/02-data-model.md.
// Subjects + track_subject links cover cs / ee / info-mgmt tracks.
// Subject slug 命名: 小寫精簡 token, 公認縮寫優先 (ds/os/la/dm/co/em/db/mis),
// 多字串接, 僅可讀性需要時加 hyphen (cs-intro/infosec-intro). 此處為 slug 唯一登記; 引用前查, 勿造變體.

type TrackSeed = { slug: string; name: string };

const TAXONOMY: { slug: string; name: string; tracks: TrackSeed[] }[] = [
  {
    slug: "business-management",
    name: "商管類",
    tracks: [
      { slug: "business-admin", name: "企管所" },
      { slug: "intl-business", name: "國企所" },
      { slug: "econ", name: "經濟所" },
      { slug: "finance", name: "財金所" },
      { slug: "stat", name: "統計所" },
      { slug: "math", name: "數學所" },
      { slug: "info-mgmt", name: "資管所" },
      { slug: "ind-mgmt", name: "工管所" },
      { slug: "tourism", name: "觀光所" },
      { slug: "leisure", name: "休閒所" },
    ],
  },
  {
    slug: "science-engineering",
    name: "理工類",
    tracks: [
      { slug: "ee", name: "電機所" },
      { slug: "cs", name: "資工所" },
      { slug: "me", name: "機械所" },
      { slug: "ce", name: "土木所" },
      { slug: "env-eng", name: "環工所" },
      { slug: "materials", name: "材料所" },
      { slug: "chem-eng", name: "化工所" },
      { slug: "chem", name: "化學所" },
      { slug: "life-sci", name: "生科所" },
      { slug: "biomedical", name: "生醫所" },
    ],
  },
  {
    slug: "humanities",
    name: "人文類",
    tracks: [
      { slug: "eng-teach", name: "英教所" },
      { slug: "afl", name: "應外所" },
      { slug: "zh-lit", name: "中文所" },
      { slug: "zh-lang", name: "華文所" },
      { slug: "arts", name: "藝術所" },
      { slug: "comm", name: "傳播所" },
      { slug: "counseling", name: "心輔所" },
      { slug: "edu", name: "教育所" },
      { slug: "poli-sci", name: "政治所" },
      { slug: "diplomacy", name: "外交所" },
    ],
  },
];

const SUBJECTS: TrackSeed[] = [
  { slug: "ds", name: "資料結構" },
  { slug: "algo", name: "演算法" },
  { slug: "co", name: "計算機組織與結構" },
  { slug: "os", name: "作業系統" },
  { slug: "la", name: "線性代數" },
  { slug: "dm", name: "離散數學" },
  { slug: "stat", name: "統計學" },
  { slug: "mis", name: "管理資訊系統" },
  { slug: "cs-intro", name: "計算機概論" },
  { slug: "db", name: "資料庫" },
  { slug: "networking", name: "網際網路概論" },
  { slug: "infosec-intro", name: "資訊安全概論" },
  { slug: "prog", name: "程式設計" },
  { slug: "english", name: "英文" },
  // 電機所 考科（大碩/TKB 分類）；ds/algo/co/la/dm 沿用 cs 共用
  { slug: "engmath", name: "工程數學" },
  { slug: "prob", name: "機率" },
  { slug: "electronics", name: "電子學" },
  { slug: "circuits", name: "電路學" },
  { slug: "control", name: "控制系統" },
  { slug: "em", name: "電磁學" },
  { slug: "semicon", name: "半導體元件" },
  { slug: "edevices", name: "電子元件" },
  { slug: "modphys", name: "近代物理" },
  { slug: "genphys", name: "普通物理" },
  { slug: "powersys", name: "電力系統" },
  { slug: "emachine", name: "電機機械" },
  { slug: "powerelec", name: "電力電子" },
  { slug: "commtheory", name: "通訊原理" },
  { slug: "commsys", name: "通訊系統" },
  { slug: "signals", name: "信號與系統" },
];

// track slug → subject slugs (the global shared library; note ds/algo
// are shared across cs[理工] and info-mgmt[商管] — a cross-category shared subject).
const TRACK_SUBJECTS: Record<string, string[]> = {
  cs: ["ds", "algo", "co", "os", "la", "dm", "infosec-intro", "prog"],
  ee: [
    "engmath",
    "prob",
    "la",
    "dm",
    "electronics",
    "circuits",
    "control",
    "em",
    "semicon",
    "edevices",
    "modphys",
    "genphys",
    "powersys",
    "emachine",
    "powerelec",
    "commtheory",
    "commsys",
    "signals",
    "co",
    "ds",
    "algo",
  ],
  "info-mgmt": [
    "stat",
    "mis",
    "cs-intro",
    "ds",
    "db",
    "networking",
    "algo",
    "english",
    "prog",
    "co",
  ],
};

export interface TaxonomySeedResult {
  trackIdBySlug: Map<string, string>;
  counts: { categories: number; tracks: number; subjects: number; links: number };
}

// Idempotent upsert of categories → tracks → subjects → track_subject links.
// Returns trackIdBySlug for downstream seeders (e.g. departments).
export async function seedTaxonomy(prisma: PrismaClient): Promise<TaxonomySeedResult> {
  const trackIdBySlug = new Map<string, string>();

  for (const category of TAXONOMY) {
    const cat = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { slug: category.slug, name: category.name },
    });

    for (const track of category.tracks) {
      const row = await prisma.programTrack.upsert({
        where: { slug: track.slug },
        update: { name: track.name, categoryId: cat.id },
        create: { slug: track.slug, name: track.name, categoryId: cat.id },
      });
      trackIdBySlug.set(track.slug, row.id);
    }
  }

  const subjectIdBySlug = new Map<string, string>();
  for (const subject of SUBJECTS) {
    const row = await prisma.subject.upsert({
      where: { slug: subject.slug },
      update: { name: subject.name },
      create: { slug: subject.slug, name: subject.name },
    });
    subjectIdBySlug.set(subject.slug, row.id);
  }

  for (const [trackSlug, subjectSlugs] of Object.entries(TRACK_SUBJECTS)) {
    const trackId = trackIdBySlug.get(trackSlug);
    if (!trackId) throw new Error(`unknown track slug: ${trackSlug}`);
    for (const subjectSlug of subjectSlugs) {
      const subjectId = subjectIdBySlug.get(subjectSlug);
      if (!subjectId) throw new Error(`unknown subject slug: ${subjectSlug}`);
      await prisma.trackSubject.upsert({
        where: { trackId_subjectId: { trackId, subjectId } },
        update: {},
        create: { trackId, subjectId },
      });
    }
  }

  return {
    trackIdBySlug,
    counts: {
      categories: TAXONOMY.length,
      tracks: trackIdBySlug.size,
      subjects: subjectIdBySlug.size,
      links: Object.values(TRACK_SUBJECTS).reduce((n, s) => n + s.length, 0),
    },
  };
}
