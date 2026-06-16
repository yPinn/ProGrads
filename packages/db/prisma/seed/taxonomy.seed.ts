import type { PrismaClient } from "../../generated/client/client.ts";

// Taxonomy reference data. Authoritative L1/L2 from 大碩 (TKB). See docs/02-data-model.md.
// Subjects + track_subject links cover the starter tracks 資工所 / 資管所 only.

type TrackSeed = { slug: string; name: string };

const TAXONOMY: { slug: string; name: string; tracks: TrackSeed[] }[] = [
  {
    slug: "business-management",
    name: "商管類",
    tracks: [
      { slug: "business-admin", name: "企管所" },
      { slug: "intl-business", name: "國企所" },
      { slug: "economics", name: "經濟所" },
      { slug: "finance", name: "財金所" },
      { slug: "statistics", name: "統計所" },
      { slug: "mathematics", name: "數學所" },
      { slug: "info-management", name: "資管所" },
      { slug: "industrial-management", name: "工管所" },
      { slug: "tourism", name: "觀光所" },
      { slug: "leisure", name: "休閒所" },
    ],
  },
  {
    slug: "science-engineering",
    name: "理工類",
    tracks: [
      { slug: "electrical-engineering", name: "電機所" },
      { slug: "computer-science", name: "資工所" },
      { slug: "mechanical-engineering", name: "機械所" },
      { slug: "civil-engineering", name: "土木所" },
      { slug: "environmental-engineering", name: "環工所" },
      { slug: "materials", name: "材料所" },
      { slug: "chemical-engineering", name: "化工所" },
      { slug: "chemistry", name: "化學所" },
      { slug: "life-science", name: "生科所" },
      { slug: "biomedical", name: "生醫所" },
    ],
  },
  {
    slug: "humanities",
    name: "人文類",
    tracks: [
      { slug: "english-teaching", name: "英教所" },
      { slug: "applied-foreign-languages", name: "應外所" },
      { slug: "chinese-literature", name: "中文所" },
      { slug: "chinese-language", name: "華文所" },
      { slug: "arts", name: "藝術所" },
      { slug: "communication", name: "傳播所" },
      { slug: "counseling", name: "心輔所" },
      { slug: "education", name: "教育所" },
      { slug: "political-science", name: "政治所" },
      { slug: "diplomacy", name: "外交所" },
    ],
  },
];

const SUBJECTS: TrackSeed[] = [
  { slug: "data-structures", name: "資料結構" },
  { slug: "algorithms", name: "演算法" },
  { slug: "computer-organization", name: "計算機組織與結構" },
  { slug: "operating-systems", name: "作業系統" },
  { slug: "linear-algebra", name: "線性代數" },
  { slug: "discrete-mathematics", name: "離散數學" },
  { slug: "statistics", name: "統計學" },
  { slug: "management-information-systems", name: "管理資訊系統" },
  { slug: "computer-concepts", name: "計算機概論" },
  { slug: "databases", name: "資料庫" },
  { slug: "internet-concepts", name: "網際網路概論" },
];

// track slug → subject slugs (the global shared library; note data-structures/algorithms
// are shared across 資工所[理工] and 資管所[商管] — a cross-category shared subject).
const TRACK_SUBJECTS: Record<string, string[]> = {
  "computer-science": [
    "data-structures",
    "algorithms",
    "computer-organization",
    "operating-systems",
    "linear-algebra",
    "discrete-mathematics",
  ],
  "info-management": [
    "statistics",
    "management-information-systems",
    "computer-concepts",
    "data-structures",
    "databases",
    "internet-concepts",
    "algorithms",
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
