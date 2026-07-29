import type { PrismaClient } from "../../generated/client/client.ts";

// Subject-scoped controlled vocabulary for exam knowledge points. See
// docs/02-data-model.md and docs/09-roadmap.md §考科趨勢.
//
// Flat list (one row per L2 leaf) so the offline text parser
// (tools/content-sync/src/seed-refs.ts readKnowledgePoints) doesn't need to track nested
// bracket depth — it just pairs each entry's `subject` field with the `slug` field that follows
// it. Keep that field order (subject, groupSlug, groupName, slug, name, aliases) per entry.
//
// Only `slug` (the leaf) may be tagged on a question via frontmatter `knowledge_point_slugs`;
// `groupSlug`/`groupName` are pure L1 browsing/governance groups, never tagged directly.
//
// Granularity: derived from the actual collected exam corpus for that subject (which concepts
// recur enough to deserve a stable slug), not an external syllabus imposed top-down. Display
// names use English/original terminology; `aliases` holds every other form (Chinese full name,
// abbreviation, common English variant, common mistranslation) — any count, unstructured, not a
// statistics key.
//
// Empty until a subject's content work builds its first pool — no site-wide upfront taxonomy.
// Add entries here via PR once a subject is ready.
export interface KnowledgePointSeed {
  subject: string; // Subject.slug (packages/db/prisma/seed/taxonomy.seed.ts)
  groupSlug: string;
  groupName: string;
  slug: string;
  name: string;
  aliases?: string[];
}

// First pool: ds (資料結構) + algo (演算法), derived from the 149 questions currently collected
// under questions/**/dsa*/ and questions/**/ds-algo/ (nccu/nchu/ntu 2021-2026). Clustered from
// their raw `knowledge_points` free text — see git history for the extraction. Draft for review;
// re-cluster as more papers are added rather than treating this as final.
const KNOWLEDGE_POINTS: KnowledgePointSeed[] = [
  // ---------- ds (資料結構) ----------
  {
    subject: "ds",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "stack",
    name: "Stack",
    aliases: ["堆疊", "LIFO", "堆疊求值", "後綴表示法", "抽象資料型別", "運算子優先序", "括號"],
  },
  {
    subject: "ds",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "queue",
    name: "Queue",
    aliases: ["佇列", "FIFO", "環形陣列", "佇列與堆疊", "雙堆疊實作佇列", "輸出序列合法性"],
  },
  {
    subject: "ds",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "linked-list",
    name: "Linked list",
    aliases: ["鏈結串列", "單向串列", "尾指標"],
  },
  {
    subject: "ds",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "dynamic-array",
    name: "Dynamic array",
    aliases: ["動態陣列", "攤還分析", "攤銷分析", "倍增策略", "收縮門檻"],
  },
  {
    subject: "ds",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "binary-tree",
    name: "Binary tree",
    aliases: [
      "二元樹",
      "中序遍歷",
      "後序遍歷",
      "層序遍歷",
      "運算式樹",
      "表達式樹",
      "二元樹重建",
      "前綴中綴後綴",
      "陣列表示",
      "BFS",
      "後序走訪",
      "中序/後序走訪",
      "遍歷唯一性",
    ],
  },
  {
    subject: "ds",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "binary-search-tree",
    name: "Binary search tree",
    aliases: [
      "二元搜尋樹",
      "陣列實作二元搜尋樹",
      "中序後繼",
      "第k大元素",
      "順序統計量",
      "樹的索引",
      "搜尋路徑",
      "Join操作",
    ],
  },
  {
    subject: "ds",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "avl-tree",
    name: "AVL tree",
    aliases: ["AVL樹", "平衡因子"],
  },
  {
    subject: "ds",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "red-black-tree",
    name: "Red-black tree",
    aliases: ["紅黑樹", "黑高", "樹高上界"],
  },
  {
    subject: "ds",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "b-plus-tree",
    name: "B+ tree",
    aliases: ["B+樹", "節點路由", "鍵值範圍", "葉節點資料"],
  },
  {
    subject: "ds",
    groupSlug: "heap-and-priority-queue",
    groupName: "Heap and priority queue",
    slug: "heap",
    name: "Heap",
    aliases: ["陣列實作最大堆積", "堆積索引", "最大堆積性質", "合併"],
  },
  {
    subject: "ds",
    groupSlug: "heap-and-priority-queue",
    groupName: "Heap and priority queue",
    slug: "priority-queue",
    name: "Priority queue",
    aliases: ["優先佇列", "堆積應用", "串流中位數", "事件驅動模擬"],
  },
  {
    subject: "ds",
    groupSlug: "hashing",
    groupName: "Hashing",
    slug: "hash-table",
    name: "Hash table",
    aliases: [
      "雜湊表",
      "雜湊",
      "雜湊函數設計",
      "碰撞",
      "碰撞處理",
      "線性探測",
      "雙重雜湊",
      "通用雜湊族",
      "碰撞期望值",
      "最壞情況分析",
      "十六進位",
      "模除",
    ],
  },
  {
    subject: "ds",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "sorted-list-operations",
    name: "Sorted list operations (merge-based set intersection)",
    aliases: ["排序串列", "集合交集"],
  },

  // ---------- algo (演算法) ----------
  {
    subject: "algo",
    groupSlug: "complexity-analysis",
    groupName: "Complexity analysis",
    slug: "asymptotic-notation",
    name: "Asymptotic notation",
    aliases: ["漸進記號", "大O與Ω", "漸進成長率", "複雜度分析", "時間複雜度", "空間複雜度"],
  },
  {
    subject: "algo",
    groupSlug: "complexity-analysis",
    groupName: "Complexity analysis",
    slug: "recurrence-relations",
    name: "Recurrence relations",
    aliases: [
      "遞迴關係",
      "遞迴關係式",
      "遞迴式",
      "遞迴式求解",
      "遞迴複雜度",
      "遞迴公式",
      "遞迴時間複雜度",
    ],
  },
  {
    subject: "algo",
    groupSlug: "complexity-analysis",
    groupName: "Complexity analysis",
    slug: "master-theorem",
    name: "Master theorem",
    aliases: ["主定理"],
  },
  {
    subject: "algo",
    groupSlug: "complexity-analysis",
    groupName: "Complexity analysis",
    slug: "akra-bazzi-theorem",
    name: "Akra-Bazzi theorem",
    aliases: ["Akra-Bazzi定理"],
  },
  {
    subject: "algo",
    groupSlug: "complexity-analysis",
    groupName: "Complexity analysis",
    slug: "amortized-analysis",
    name: "Amortized analysis",
    aliases: [
      "攤還分析",
      "攤銷分析",
      "攤還成本",
      "勢能法",
      "二進位計數器",
      "動態表格",
      "動態陣列",
      "記憶體管理",
      "倍增策略",
      "雙堆疊佇列",
    ],
  },
  {
    subject: "algo",
    groupSlug: "divide-and-conquer",
    groupName: "Divide and conquer",
    slug: "divide-and-conquer-technique",
    name: "Divide and conquer",
    aliases: ["分治法", "演算法範式"],
  },
  {
    subject: "algo",
    groupSlug: "divide-and-conquer",
    groupName: "Divide and conquer",
    slug: "matrix-multiplication",
    name: "Matrix multiplication",
    aliases: ["矩陣乘法"],
  },
  {
    subject: "algo",
    groupSlug: "divide-and-conquer",
    groupName: "Divide and conquer",
    slug: "fast-fourier-transform",
    name: "Fast Fourier transform",
    aliases: ["快速傅立葉轉換", "單位根"],
  },
  {
    subject: "algo",
    groupSlug: "sorting",
    groupName: "Sorting",
    slug: "quicksort",
    name: "Quicksort",
    aliases: ["快速排序", "樞紐選擇", "隨機化演算法", "最壞情況"],
  },
  {
    subject: "algo",
    groupSlug: "sorting",
    groupName: "Sorting",
    slug: "merge-sort",
    name: "Merge sort",
    aliases: ["合併排序", "多路合併", "外部排序", "最小堆積", "鏈結串列合併"],
  },
  {
    subject: "algo",
    groupSlug: "sorting",
    groupName: "Sorting",
    slug: "bubble-sort",
    name: "Bubble sort",
    aliases: ["氣泡排序", "逐趟過程", "相鄰交換"],
  },
  {
    subject: "algo",
    groupSlug: "sorting",
    groupName: "Sorting",
    slug: "selection-sort",
    name: "Selection sort",
    aliases: ["選擇排序"],
  },
  {
    subject: "algo",
    groupSlug: "sorting",
    groupName: "Sorting",
    slug: "non-comparison-sorting",
    name: "Non-comparison sorting",
    aliases: ["計數排序", "基數排序", "桶排序", "非比較排序", "期望線性時間", "均勻分布"],
  },
  {
    subject: "algo",
    groupSlug: "sorting",
    groupName: "Sorting",
    slug: "sorting-analysis",
    name: "Sorting algorithm analysis",
    aliases: [
      "排序演算法",
      "排序",
      "排序結果",
      "排序唯一性",
      "最壞情況",
      "最差情況分析",
      "平均情況",
    ],
  },
  {
    subject: "algo",
    groupSlug: "selection-and-order-statistics",
    groupName: "Selection and order statistics",
    slug: "selection-algorithm",
    name: "Selection algorithm",
    aliases: ["選擇問題", "中位數", "中位數的中位數", "最壞線性時間"],
  },
  {
    subject: "algo",
    groupSlug: "graph-traversal",
    groupName: "Graph traversal",
    slug: "graph-traversal-dfs-bfs",
    name: "Graph traversal (DFS/BFS)",
    aliases: [
      "DFS",
      "BFS",
      "深度優先搜尋",
      "廣度優先搜尋",
      "圖走訪",
      "環偵測",
      "回邊",
      "圖的連通分量",
      "佇列",
      "回溯法",
    ],
  },
  {
    subject: "algo",
    groupSlug: "graph-traversal",
    groupName: "Graph traversal",
    slug: "topological-sort",
    name: "Topological sort",
    aliases: ["拓撲排序", "拓樸排序", "有向無環圖", "DAG排程", "關鍵路徑"],
  },
  {
    subject: "algo",
    groupSlug: "shortest-path",
    groupName: "Shortest path",
    slug: "shortest-path-general",
    name: "Shortest path (general)",
    aliases: [
      "最短路徑",
      "單源最短路徑",
      "負權",
      "負權邊",
      "瓶頸路徑",
      "最短路徑距離",
      "Fibonacci heap",
    ],
  },
  {
    subject: "algo",
    groupSlug: "shortest-path",
    groupName: "Shortest path",
    slug: "dijkstra-algorithm",
    name: "Dijkstra's algorithm",
    aliases: ["Dijkstra"],
  },
  {
    subject: "algo",
    groupSlug: "shortest-path",
    groupName: "Shortest path",
    slug: "bellman-ford-algorithm",
    name: "Bellman-Ford algorithm",
    aliases: ["Bellman-Ford"],
  },
  {
    subject: "algo",
    groupSlug: "shortest-path",
    groupName: "Shortest path",
    slug: "floyd-warshall-algorithm",
    name: "Floyd-Warshall algorithm",
    aliases: ["Floyd-Warshall"],
  },
  {
    subject: "algo",
    groupSlug: "minimum-spanning-tree",
    groupName: "Minimum spanning tree",
    slug: "minimum-spanning-tree-general",
    name: "Minimum spanning tree (general)",
    aliases: ["最小生成樹", "生成樹", "環性質", "割性質", "安全邊", "對稱差", "擬陣"],
  },
  {
    subject: "algo",
    groupSlug: "minimum-spanning-tree",
    groupName: "Minimum spanning tree",
    slug: "prim-algorithm",
    name: "Prim's algorithm",
    aliases: ["Prim", "Prim演算法", "貪婪成長"],
  },
  {
    subject: "algo",
    groupSlug: "minimum-spanning-tree",
    groupName: "Minimum spanning tree",
    slug: "kruskal-algorithm",
    name: "Kruskal's algorithm",
    aliases: ["Kruskal", "邊排序", "割邊"],
  },
  {
    subject: "algo",
    groupSlug: "network-flow",
    groupName: "Network flow",
    slug: "max-flow-min-cut",
    name: "Max-flow min-cut",
    aliases: ["最大流", "最小割", "Ford-Fulkerson", "st網路", "網路流建模", "平面圖對偶"],
  },
  {
    subject: "algo",
    groupSlug: "network-flow",
    groupName: "Network flow",
    slug: "bipartite-matching",
    name: "Bipartite matching",
    aliases: ["二分圖匹配", "二分匹配", "最大匹配", "完美匹配", "指派問題"],
  },
  {
    subject: "algo",
    groupSlug: "string-algorithms",
    groupName: "String algorithms",
    slug: "kmp-algorithm",
    name: "KMP algorithm",
    aliases: ["KMP演算法", "KMP", "前綴函數", "失敗函數", "字串比對", "字串比對自動機"],
  },
  {
    subject: "algo",
    groupSlug: "string-algorithms",
    groupName: "String algorithms",
    slug: "rabin-karp-algorithm",
    name: "Rabin-Karp algorithm",
    aliases: ["Rabin-Karp", "滾動雜湊"],
  },
  {
    subject: "algo",
    groupSlug: "string-algorithms",
    groupName: "String algorithms",
    slug: "huffman-coding",
    name: "Huffman coding",
    aliases: ["霍夫曼編碼", "前綴碼", "編碼長度", "最佳性證明"],
  },
  {
    subject: "algo",
    groupSlug: "dynamic-programming",
    groupName: "Dynamic programming",
    slug: "dynamic-programming-general",
    name: "Dynamic programming (general)",
    aliases: ["動態規劃", "最佳子結構", "重疊子問題", "次佳解"],
  },
  {
    subject: "algo",
    groupSlug: "dynamic-programming",
    groupName: "Dynamic programming",
    slug: "knapsack-problem",
    name: "Knapsack problem",
    aliases: ["背包問題", "0/1背包", "無限背包"],
  },
  {
    subject: "algo",
    groupSlug: "dynamic-programming",
    groupName: "Dynamic programming",
    slug: "longest-common-subsequence",
    name: "Longest common subsequence",
    aliases: ["最長共同子序列", "LCS", "全域比對", "序列比對", "計數DP"],
  },
  {
    subject: "algo",
    groupSlug: "dynamic-programming",
    groupName: "Dynamic programming",
    slug: "matrix-chain-multiplication",
    name: "Matrix chain multiplication",
    aliases: ["矩陣鏈乘積", "子問題計數", "組合計數"],
  },
  {
    subject: "algo",
    groupSlug: "dynamic-programming",
    groupName: "Dynamic programming",
    slug: "tree-dp",
    name: "Tree DP",
    aliases: ["樹形DP", "樹DP", "換根法", "樹的直徑", "由上而下"],
  },
  {
    subject: "algo",
    groupSlug: "dynamic-programming",
    groupName: "Dynamic programming",
    slug: "interval-dp",
    name: "Interval DP",
    aliases: ["區間分割", "最小化最大值", "區間長度", "填表順序"],
  },
  {
    subject: "algo",
    groupSlug: "dynamic-programming",
    groupName: "Dynamic programming",
    slug: "grid-dp",
    name: "Grid DP",
    aliases: ["網格DP", "網格路徑", "snake sequence", "路徑回溯"],
  },
  {
    subject: "algo",
    groupSlug: "computational-complexity",
    groupName: "Computational complexity",
    slug: "np-completeness",
    name: "NP-completeness",
    aliases: [
      "NP",
      "NP-hard",
      "NP-Complete",
      "NP-complete",
      "NP-complete證明",
      "NP完全",
      "NP困難",
      "NP完備",
      "多項式歸約",
      "多項式時間歸約",
      "複雜度類",
      "P與NP",
      "停機問題",
      "子集和",
      "子集合和",
    ],
  },
  {
    subject: "algo",
    groupSlug: "computational-complexity",
    groupName: "Computational complexity",
    slug: "approximation-algorithms",
    name: "Approximation algorithms",
    aliases: ["近似演算法", "近似比", "FPTAS", "頂點覆蓋", "最小加權頂點覆蓋", "整數線性規劃"],
  },
  {
    subject: "algo",
    groupSlug: "computational-complexity",
    groupName: "Computational complexity",
    slug: "integer-linear-programming",
    name: "Integer/linear programming relaxation",
    aliases: ["0-1整數規劃", "LP鬆弛", "整數間隙"],
  },
  {
    subject: "algo",
    groupSlug: "greedy-algorithms",
    groupName: "Greedy algorithms",
    slug: "greedy-algorithm-general",
    name: "Greedy algorithms (general)",
    aliases: ["貪婪演算法", "貪婪法", "交換論證", "活動選擇", "區間排程"],
  },
  {
    subject: "algo",
    groupSlug: "randomized-algorithms",
    groupName: "Randomized algorithms",
    slug: "randomized-algorithm",
    name: "Randomized algorithms",
    aliases: [
      "隨機演算法",
      "隨機化演算法",
      "隨機排列",
      "Fisher-Yates洗牌",
      "隨機選擇",
      "期望值分析",
      "均勻分布",
    ],
  },
  {
    subject: "algo",
    groupSlug: "heap-and-priority-queue",
    groupName: "Heap and priority queue",
    slug: "binary-heap",
    name: "Binary heap",
    aliases: [
      "二元堆積",
      "二元最小堆積",
      "上浮",
      "下沉heapify",
      "堆積建構",
      "BUILD-MAX-HEAP",
      "最小堆積",
      "陣列表示",
    ],
  },

  // algo also carries a substantial share of classic data-structure questions (this corpus tags
  // ds-vs-algo per-question, not per-paper, and many DSA papers put stack/queue/tree/hash
  // questions under algo) — mirrors ds's structural groups above, populated from algo's own
  // tagged questions rather than duplicating ds's rows (KnowledgePoint is subject-scoped).
  {
    subject: "algo",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "stack",
    name: "Stack",
    aliases: ["堆疊", "LIFO", "陣列實作", "復原操作"],
  },
  {
    subject: "algo",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "queue",
    name: "Queue",
    aliases: ["環狀佇列", "滿判斷", "模運算"],
  },
  {
    subject: "algo",
    groupSlug: "linear-structures",
    groupName: "Linear structures",
    slug: "linked-list",
    name: "Linked list",
    aliases: ["鏈結串列", "雙向鏈結串列", "走訪方向"],
  },
  {
    subject: "algo",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "binary-search-tree",
    name: "Binary search tree",
    aliases: [
      "二元搜尋樹",
      "平衡樹",
      "根節點",
      "搜尋深度",
      "節點刪除",
      "中序後繼",
      "前序走訪",
      "後序走訪",
      "AVL旋轉",
    ],
  },
  {
    subject: "algo",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "red-black-tree",
    name: "Red-black tree",
    // NOTE: "重新著色" deliberately excluded — it's ambiguous (also appears in an unrelated
    // tree-DP/vertex-cover question, ntu/2025/dsa/q15.md) and would false-positive-tag it here.
    aliases: ["紅黑樹", "旋轉", "性質修復", "旋轉維護", "順序統計樹", "子樹大小"],
  },
  {
    subject: "algo",
    groupSlug: "trees",
    groupName: "Trees",
    slug: "b-tree",
    name: "B-tree",
    aliases: ["B樹", "節點分裂", "內部節點刪除", "前驅後繼替換", "最小度數"],
  },
  {
    subject: "algo",
    groupSlug: "hashing",
    groupName: "Hashing",
    slug: "hash-table",
    name: "Hash table",
    aliases: [
      "雜湊表",
      "開放定址",
      "線性探測",
      "雙重雜湊",
      "負載因子",
      "分離鏈結",
      "動態擴容",
      "探測序列",
      "最大公因數",
    ],
  },
  {
    subject: "algo",
    groupSlug: "disjoint-set",
    groupName: "Disjoint set (union-find)",
    slug: "disjoint-set-union",
    name: "Disjoint set union (union-find)",
    aliases: ["併查集", "並查集", "互斥集合", "加權聯集", "鏈結串列表示"],
  },
  {
    subject: "algo",
    groupSlug: "recursion",
    groupName: "Recursion",
    slug: "recursion-call-stack",
    name: "Recursion and the call stack",
    aliases: ["遞迴追蹤", "堆疊溢位"],
  },
  {
    subject: "algo",
    groupSlug: "polynomial-evaluation",
    groupName: "Polynomial evaluation",
    slug: "horners-rule",
    name: "Horner's rule",
    aliases: ["Horner法則", "多項式求值", "迴圈不變式"],
  },
];

export interface KnowledgePointSeedResult {
  groups: number;
  leaves: number;
}

// Idempotent upsert of L1 groups then L2 leaves, per subject. Full reconcile per subject
// (delete-then-recreate leaves no longer listed) so a shrinking pool doesn't leave stale rows —
// same reasoning as seedTaxonomy's track_subject reconcile; safe because QuestionKnowledgePoint
// cascades on delete.
export async function seedKnowledgePoints(prisma: PrismaClient): Promise<KnowledgePointSeedResult> {
  const bySubject = new Map<string, KnowledgePointSeed[]>();
  for (const entry of KNOWLEDGE_POINTS) {
    const list = bySubject.get(entry.subject) ?? [];
    list.push(entry);
    bySubject.set(entry.subject, list);
  }

  let groups = 0;
  let leaves = 0;

  for (const [subjectSlug, entries] of bySubject) {
    const subject = await prisma.subject.findUnique({
      where: { slug: subjectSlug },
      select: { id: true },
    });
    if (!subject) {
      throw new Error(`unknown subject slug in knowledge-points.seed: "${subjectSlug}"`);
    }

    const groupIdBySlug = new Map<string, string>();
    const wantedSlugs = new Set<string>();

    for (const entry of entries) {
      let groupId = groupIdBySlug.get(entry.groupSlug);
      if (!groupId) {
        // parentId: null on update too — a group row must stay root even if it was previously
        // (incorrectly) upserted as a leaf under a colliding slug.
        const groupRow = await prisma.knowledgePoint.upsert({
          where: { subjectId_slug: { subjectId: subject.id, slug: entry.groupSlug } },
          update: { name: entry.groupName, parentId: null },
          create: { subjectId: subject.id, slug: entry.groupSlug, name: entry.groupName },
        });
        groupId = groupRow.id;
        groupIdBySlug.set(entry.groupSlug, groupId);
        wantedSlugs.add(entry.groupSlug);
        groups += 1;
      }

      await prisma.knowledgePoint.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug: entry.slug } },
        update: { name: entry.name, aliases: entry.aliases ?? [], parentId: groupId },
        create: {
          subjectId: subject.id,
          slug: entry.slug,
          name: entry.name,
          aliases: entry.aliases ?? [],
          parentId: groupId,
        },
      });
      wantedSlugs.add(entry.slug);
      leaves += 1;
    }

    await prisma.knowledgePoint.deleteMany({
      where: { subjectId: subject.id, slug: { notIn: [...wantedSlugs] } },
    });
  }

  return { groups, leaves };
}
