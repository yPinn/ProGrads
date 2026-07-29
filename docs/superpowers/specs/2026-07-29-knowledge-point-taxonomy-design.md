# 考點受控詞彙表（KnowledgePoint taxonomy）設計

## 背景

`/questions/trends` 頁面與其 API（`848ddaf`、`1fe771c`）目前直接拿每題 frontmatter 的自由文字
`knowledge_points`（如 `[主定理]`）做「考點 × 年」樞紐，寫入 `Question.metadata.knowledgePoints`
後由 [questions.service.ts](../../../apps/api/src/modules/questions/questions.service.ts) 讀出聚合。
同一概念會因為用字不同（「主定理」/「Master 定理」/「recurrence solving」）被拆成不同列，統計失真。

DB 已經有正式的 `KnowledgePoint`／`QuestionKnowledgePoint`
（[schema.prisma:137,302](../../../packages/db/prisma/schema.prisma)）但尚未接上——這正是
[docs/09-roadmap.md](../../09-roadmap.md) 已規劃的 P0.5（考點受控詞彙表）→ P1（`KnowledgePoint`
目錄+join+sync+validator gate）→ P2（API+Web 趨勢頁）。目前兩個 commit 提前做了 P2（用未入庫的
frontmatter 文字），跳過 P0.5/P1；因兩者都尚未正式 release，不需回退，但要把 P0.5/P1 補上，並把
trends 遷移到正路。

## 目標

- 建立 subject-scoped 的受控考點詞彙表，PR review 治理，杜絕自由文字變體。
- frontmatter 新增 `knowledge_point_slugs`，sync 寫入 `QuestionKnowledgePoint` join。
- validator 對未知 slug / 池子不存在的科目直接擋下（red）。
- trends API 改讀 join table；尚無詞彙表的科目直接隱藏考點軸,型別/年份軸不受影響。

## 非目標

- 不做全站一次性把既有自由文字 `knowledge_points` 轉換成 slug 的大遷移；哪科先建詞彙表，哪科先轉,
  跟著內容工作進度走（[09-roadmap.md](../../09-roadmap.md) 「隨補題漸進做」）。
- 不做 LLM 自動分類/自動造詞的 pipeline；離線內容產製流程本來就是人工/Codex session 覆核
  （非批次自動化），詞彙表由該次覆核順手定案，走 PR。
- 不做前端考點搜尋/篩選 UI；`aliases` 先只是資料欄位，供未來搜尋或人工比對用。

## 資料模型

`KnowledgePoint` 加一個欄位，其餘不變（`QuestionKnowledgePoint` join 已就緒，無需 migration）：

```prisma
model KnowledgePoint {
  id        String                   @id @default(cuid())
  slug      String
  name      String
  aliases   String[]                 @default([])   // 別名清單，任意數量、任意形式混放（中文全名、簡稱、
                                                      // 常見英文變體、常見誤譯等皆可）；搜尋、LLM mapping、
                                                      // 人工審核用，非統計 key，不分型態
  subjectId String
  subject   Subject                  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    KnowledgePoint?          @relation("KnowledgePointTree", fields: [parentId], references: [id])
  children  KnowledgePoint[]         @relation("KnowledgePointTree")
  questions QuestionKnowledgePoint[]

  @@unique([subjectId, slug])
  @@index([parentId])
}
```

需要一支 migration 加 `aliases` 欄位（additive，無資料遺失風險）。

## Seed：`packages/db/prisma/seed/knowledge-points.seed.ts`

比照 [taxonomy.seed.ts](../../../packages/db/prisma/seed/taxonomy.seed.ts)（code repo、PR review、
`from index.ts` orchestrate）：

```ts
type KpSeed = { slug: string; name: string; aliases?: string[] };
type KpGroup = { slug: string; name: string; children: KpSeed[] };

const KNOWLEDGE_POINTS: Record<string, KpGroup[]> = {
  "ds-algo": [
    {
      slug: "recurrence-analysis",
      name: "Recurrence analysis",
      children: [
        {
          slug: "master-theorem",
          name: "Master theorem",
          aliases: ["主定理", "Master 定理", "master's theorem"],
        },
      ],
    },
    {
      slug: "graph-algorithms",
      name: "Graph algorithms",
      children: [
        {
          slug: "minimum-spanning-tree",
          name: "Minimum spanning tree",
          aliases: ["最小生成樹", "MST"],
        },
      ],
    },
  ],
};
```

規則：

- 只有 L2（`children` 裡的節點）可以被題目標記；L1 純分組，避免單科 200+／全站 500+ 規模下無法瀏覽。
- 顆粒度標準：對照該科已收錄的歷屆考題語料反推（哪些概念重複出現到值得給穩定 slug），不是憑空套教科書
  目錄或抄外部分類（同 [02-data-model.md](../../02-data-model.md) 對 `track_subject` 的處理原則——
  有現成權威來源可對照就對照，但以實際收錄內容驗證為準）。
- 顯示名稱以英文/原文專有名詞為主（`name`），其餘所有講法（中文全名、簡稱、常見英文變體、常見誤譯等）
  都放進 `aliases`——這是一個扁平字串陣列，可放任意數量、不分型態，不當統計 key。
- 哪一科先建全憑該科內容工作何時進行；不要求上線前全站到位。

## Frontmatter + Validator

**`packages/shared/src/content.ts`**：新增欄位，舊欄位語意收斂為 legacy：

```ts
knowledge_points: z.array(z.string().min(1)).default([]), // legacy 自由文字，僅供顯示/人工參考,不進 DB join
knowledge_point_slugs: z.array(z.string().min(1)).default([]), // canonical slug,進 QuestionKnowledgePoint
```

**`tools/content-sync/src/seed-refs.ts`**：新增 `readKnowledgePoints()`，文字解析
`knowledge-points.seed.ts` → `Map<subjectSlug, Set<leafSlug>>`（只收 L2），跟 `readSubjects()` /
`readSchoolDepts()` 同模式,離線可用、不連 DB。

**`tools/content-sync/src/validate/questions.ts`**：比照現有 `subjects`/`departments` 檢查段落
（[questions.ts:119-128](../../../tools/content-sync/src/validate/questions.ts)），新增：

- 對每個 `fm.knowledge_point_slugs` 裡的值，必須存在於 `fm.subjects` 對應科目的 leaf 集合聯集中，
  否則 red：`unknown knowledge point slug "x" for subject "y" (not in knowledge-points.seed)`。
- 若 `fm.subjects` 對應的科目全部都還沒有註冊任何 `KnowledgePoint`（多數科目現況），
  `knowledge_point_slugs` 必須是空陣列，否則 red：
  `knowledge_point_slugs set but subject "y" has no registered taxonomy yet`。
  這逼著在池子建好前,考點只能留在舊的 `knowledge_points` 自由文字欄位。

## Sync 寫入（`tools/content-sync/src/sync.ts`）

`Resolver`（[sync.ts:17-55](../../../tools/content-sync/src/sync.ts)）新增：

```ts
async knowledgePoint(subjectId: string, slug: string): Promise<{ id: string }> {
  const key = `${subjectId}|${slug}`;
  const hit = this.knowledgePoints.get(key);
  if (hit) return hit;
  const row = await this.prisma.knowledgePoint.findUnique({
    where: { subjectId_slug: { subjectId, slug } },
    select: { id: true },
  });
  if (!row) throw new Error(`unknown knowledge point slug "${slug}" (seed it first)`);
  this.knowledgePoints.set(key, row);
  return row;
}
```

每個 `fm.knowledge_point_slugs` 裡的 slug，依序在 `fm.subjects` 對應的各科 leaf 池子裡找第一個命中的
`subjectId`（validator 已保證聯集裡一定找得到，這裡只是決定要用哪個 `subjectId` 呼叫
`resolver.knowledgePoint`）。寫入邏輯比照第 176-180 行 `questionSubject` 的 delete-then-createMany
模式，在同一個 transaction 內：

```ts
await tx.questionKnowledgePoint.deleteMany({ where: { questionId: question.id } });
await tx.questionKnowledgePoint.createMany({
  data: resolvedKnowledgePoints.map((kp) => ({ questionId: question.id, knowledgePointId: kp.id })),
});
```

`questionMeta.knowledgePoints`（[sync.ts:114](../../../tools/content-sync/src/sync.ts)，自由文字）維持
原樣寫入 `metadata`,不動、不刪。

## Trends API 遷移（`apps/api/.../questions.service.ts`）

[questions.service.ts:303-316](../../../apps/api/src/modules/questions/questions.service.ts) 的
`kpSet`/`byPoint` 改成 query 帶 `include: { knowledgePoints: { include: { knowledgePoint: true } } }`，
用 `KnowledgePoint.slug`/`name` 取代 `metaStringArray(r.metadata, "knowledgePoints")`。

若該科目查出的 `KnowledgePoint` 集合為空（池子還沒建),`byPoint` 回傳空陣列 / 該欄位整段不給；
`byType`（型別軸）與 `years`（年份軸）不受影響、照常回傳。前端 `/questions/trends` 頁面對空
`byPoint` 直接不渲染考點區塊,不特別顯示錯誤或提示。

## 測試

- `sync.spec.ts`：`knowledge_point_slugs` 正確解析寫入 join；未知 slug → validator red；
  科目無池子時非空陣列 → validator red；科目有池子時正常寫入。
- `questions.service` trends 測試：補「無考點池科目」（`byPoint` 為空）與「有考點池科目」
  （`byPoint` 正確聚合)兩種 fixture。

## Rollout

不要求上線前全站到位。第一個試點科目待定,由內容工作進度決定何時建立第一份
`knowledge-points.seed.ts` 條目。P1（本設計)完成後即可開始,不受阻。
