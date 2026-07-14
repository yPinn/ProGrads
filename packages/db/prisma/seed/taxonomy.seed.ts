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
      // NCCU 文學院擴充（見 admissions/2026/nccu/departments.yml）
      { slug: "history", name: "歷史所" },
      { slug: "philosophy", name: "哲學所" },
      { slug: "lis", name: "圖資檔案所" },
      { slug: "religion", name: "宗教所" },
      { slug: "tw-history", name: "台灣史所" },
      { slug: "tw-lit", name: "台文所" },
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
  { slug: "chinese", name: "國文" },
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
  // 商管/數理 考科（nccu 商學院 + 應數）；stat/la/cs-intro/mis/english/calc 跨群共用
  { slug: "econ", name: "經濟學" },
  { slug: "fin-mgmt", name: "財務管理" },
  { slug: "acct", name: "會計學" },
  { slug: "cost-mgmt-acct", name: "成本與管理會計學" },
  { slug: "auditing", name: "審計學" },
  { slug: "tax-law", name: "稅務法規" },
  { slug: "calc", name: "微積分" },
  { slug: "math-stat", name: "數理統計學" },
  { slug: "stat-method", name: "統計方法" },
  { slug: "insurance-law", name: "保險法" },
  { slug: "company-law", name: "公司法" },
  { slug: "insurance", name: "保險學" },
  { slug: "mgmt", name: "管理學" },
  { slug: "mgmt-case", name: "管理個案分析" },
  // 人文類考科（nccu 文學院 8 系所實證）
  { slug: "zh-lit-hist", name: "中國文學史" }, // 中文系
  { slug: "zh-thought-hist", name: "中國思想史" },
  { slug: "philology", name: "文字學" },
  { slug: "zh-hist", name: "中國通史" }, // 歷史系
  { slug: "world-hist", name: "世界通史" },
  { slug: "zh-modern-tw-hist", name: "中國近現代史與台灣史" },
  { slug: "hist-english", name: "歷史英文" },
  { slug: "phil-analysis", name: "哲學問題分析" }, // 哲學系
  { slug: "library-sci", name: "圖書資訊學" }, // 圖資檔案所
  { slug: "archival-sci", name: "檔案學" },
  { slug: "zh-modern-hist", name: "中國現代史" }, // 不含台灣史, 與 zh-modern-tw-hist 不同範圍
  { slug: "religion-hist-culture", name: "宗教歷史與文化" }, // 宗教所
  { slug: "religion-intro", name: "宗教研究概論" },
  { slug: "tw-lit-hist", name: "台灣文學史" }, // 台文所
  { slug: "lit-theory", name: "文學理論與批評" },
  { slug: "ling-intro", name: "語言學概論" }, // 華語文教學
];

// track slug → subject slugs (global shared library; ds/algo cross cs[理工]/info-mgmt[商管]).
// Evidence-derived from admissions/departments.yml + questions content, not TKB/大碩
// category convention — common subjects (english/chinese) are per-department, verify before
// assuming (see 02-data-model.md §起步資料).
const TRACK_SUBJECTS: Record<string, string[]> = {
  cs: ["ds", "algo", "co", "os", "la", "dm", "infosec-intro", "prog", "english", "engmath", "prob"],
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
    "prog",
    "co",
    "english",
    "econ",
  ],
  "business-admin": [
    "mgmt",
    "mgmt-case",
    "acct",
    "cost-mgmt-acct",
    "auditing",
    "tax-law",
    "english",
    "calc",
    "cs-intro",
    "econ",
    "stat",
  ],
  finance: [
    "fin-mgmt",
    "econ",
    "insurance",
    "insurance-law",
    "company-law",
    "english",
    "calc",
    "stat",
  ],
  econ: ["econ", "calc", "stat"],
  stat: ["stat", "math-stat", "stat-method", "calc", "la", "english"],
  math: ["calc", "la"],
  "intl-business": ["econ", "english", "stat"],
  "ind-mgmt": ["mgmt", "mgmt-case", "stat", "english", "calc", "cs-intro", "econ", "la", "prog"],
  // NCCU 文學院實證（見 admissions/2026/nccu/departments.yml）。tw-history（台灣史所）
  // 無筆試（純資料審查+面試），無考科可掛，故不列 track_subject 項——與 tourism/leisure 同理。
  "zh-lit": ["chinese", "zh-lit-hist", "zh-thought-hist", "philology"],
  history: ["zh-hist", "world-hist", "zh-modern-tw-hist", "hist-english"],
  philosophy: ["phil-analysis"],
  lis: ["english", "library-sci", "cs-intro", "archival-sci", "zh-modern-hist"],
  religion: ["english", "religion-hist-culture", "religion-intro"],
  "tw-lit": ["tw-lit-hist", "lit-theory"],
  "zh-lang": ["chinese", "english", "ling-intro"],
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

  // Full reconcile (delete-then-recreate): upsert alone would only ever add links, leaving
  // stale rows behind whenever a track's subject list shrinks. Safe — pure join table, no dependents.
  await prisma.trackSubject.deleteMany({ where: { trackId: { in: [...trackIdBySlug.values()] } } });

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
