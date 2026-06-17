# 03 — 內容 pipeline

## 原則

檔案是**真相層**（git、可審查、可版本控制）；PostgreSQL 是**服務層**。單向同步：檔案 → DB。
內容渲染由 Nuxt Content 負責（build 時 prerender）；動態查詢與使用者資料由 DB 提供。

**repo 分離（合規關鍵）**：程式碼為公開 OSS；題庫內容（含官方題幹）放**獨立私有 repo**（`ProGrads-content`）。
公開 repo 內含全文題目等同公開散布 → 內容只在 `license_status` 釐清（或取得授權）後才提升公開。

`tools/content-sync` 透過 `CONTENT_DIR` env var 取得內容目錄（見下方 §本地開發 / §CI 部署）。
題庫內容存放於獨立私有 repo（`ProGrads-content`）；公開 monorepo 不含任何題目檔案。

## 三層內容版本（溯源鏈）

`官方來源(source_url) → Tier0 raw → Tier1 結構化單題 → Tier2 結構化解答`

- **Tier0 raw**：官方原始整卷（PDF/掃描）。**現況**存 content repo（Git LFS）；**規劃**大規模後遷 blob store（DB 只存 `Asset` 參照，見 §raw 與 blob 儲存）。用於下載、驗真、重新萃取；版權敏感度**最高**（逐字整卷）。
- **Tier1 題**：拆出的每一題（題幹＋選項）→ content repo（markdown）；單題顯示、練習、餵 AI；敏感度中。
- **Tier2 解**：AI 標準解答（同檔依附題目）→ content repo（同一 md 的區塊）；顯示、弱點分析；敏感度低（原創）。

Tier1/Tier2 **同檔**（見下）；Tier0 是大檔、永不進 DB，**現以 Git LFS 存於 content repo**，大規模後遷 blob store（見 §raw 與 blob 儲存）。

## 目錄結構

```text
ProGrads-content/
  raw/<track>/<school>/<department>/<year>/[<group>/]<exam-subject>.pdf   # Tier0 整卷（LFS）
  questions/<track>/<school>/<department>/<year>/[<group>/]<exam-subject>/<qNN>.md
  admissions/<year>/<school>/prospectus.{pdf,yml}                        # 招生簡章（獨立樹，見 §招生資料）
```

- 路徑段用 **slug**（ASCII、穩定）；`<exam-subject>` 用「整張卷」的 slug（合科卷一個 slug）。
- `<group>` 目錄層在 `<year>` 與 `<exam-subject>` **之間**，**僅分組時存在**（一組含多卷）；不分組則省略。
  group 用 ASCII 代號 `a/b/c`（＝甲/乙/丙，僅作顯示；與招生 `admission_group.code` 對齊）。
- `admission_type` **預設 `exam`（考試入學）**，不進路徑；推甄無考古題，極少數例外才於 frontmatter 明寫。
- 例：不分組 `questions/cs/ntu/csie/2025/dsa/q03.md`；分組 `questions/cs/nchu/cse/2025/a/dsa/q01.md`。

### Slug 命名慣例

跨 category / track / subject / school / department / exam-subject 一致：

- **有公認縮寫者用縮寫**：學校 `ntu / nthu / nycu`、系所 `csie / im / mis`（台灣學界標準，遠勝 `national-taiwan-university`）。
- **其餘用全字 kebab-case**：`science-engineering`(category)、`env-eng`(track，無公認單字母)。
- **subjects 縮寫**：`ds` / `algo` / `os` / `co` / `la` / `dm` / `db` / `mis` 等（見 taxonomy seed）。
- slug 是**穩定鍵**、顯示名另存（DB 的 `slug` / `name`）；slug↔name 的唯一 registry 是 seed（`seed/{taxonomy,schools}.seed.ts`），content 只用 slug 引用，sync 解析時 slug 不存在即報錯——**不另建 map**（避免第二事實來源）。

## 身分與命名（id 策略）

- `question_id` 寫在 frontmatter、**是唯一的 upsert 鍵，發布後不可變**（被 explanation / attempt / URL / SEO 引用）。
- 首次可由路徑推導預設值：`<school>-<department>-<year>[-<group>]-<exam-subject>-<qNN>`
  （不分組 `ntu-csie-2025-dsa-q03`；分組 `nchu-cse-2025-a-dsa-q01`）。
- sync **驗證「路徑推導值 == frontmatter id」**，不一致則 red（抓誤分類）；但**搬檔不改 id**（id 已釘選）。
- 子題：`q03a` / `q03b`。

## 題目檔格式（單檔：frontmatter + 區塊）

題目與解答**同檔**（策展耦合、原子、MC 正解不跨檔）。分類欄（track/school/department/year）由**路徑決定**，不在 frontmatter 重複；frontmatter 只留無法從路徑推導者。

```markdown
---
question_id: ntu-csie-2025-dsa-q03 # 釘選，唯一鍵
exam_subject: 資料結構與演算法 # 卷的顯示名（ExamSubject.name；合科卷可多 subject）
subjects: [algo] # granular 練習標記（question_subject），用 slug
question_type: essay # mc | essay | calc | proof | cloze | listening
source_url: https://example.ntu.edu.tw/exam/...
license_status: school_official # national_exam | school_official | unknown
group: "" # 組別代號 a/b/c（＝甲/乙/丙）；不分組空字串
knowledge_points: [動態規劃, 最短路徑] # 第一刀暫不寫入 DB
# --- 解答 metadata（Tier2）---
model_used: claude-opus-4-8
confidence: high # 低信心進人工複查
review_status: ai_generated # ai_generated | human_verified | flagged
---

## 題目

（官方公開題幹；markdown 支援 LaTeX 與程式碼）

## 選項

（僅選擇題；格式見下）

## 標準解答

（Claude 離線生成；只覆寫此區塊 → git diff 侷限、不動題目）

## 知識點延伸

（重複考點、關聯觀念，餵給弱點分析/知識圖譜）
```

選擇題 `## 選項` 約定：

```markdown
## 選項

- (A) ...
- (B) ...
- (C) ...

## 答案

B
```

## 參照 vs 內容實體（sync 行為分兩類）

- **參照資料（須先存在，由 seed 管）**：category / track / subject / school / department → sync **只解析、不建立**；缺則 red（逼先補 seed/PR）。
- **內容資料（sync 建立/更新）**：exam / exam_subject / question / choice / explanation / question_subject。

## 合規與顯示閘門

- 每檔必含 `source_url` 與 `license_status`；只收 `national_exam` 或 `school_official`，`unknown` 不得入庫。
- **儲存一律做；公開顯示/下載逐層由 `license_status` gate**：
  - `national_exam`（政府著作）→ Tier0/1/2 皆可公開（SEO 金礦）。
  - `school_official` → 公開頁通常只到 Tier2 解析＋導向官網連結；Tier0/Tier1 內部用或待授權。

## raw 與 blob 儲存（規劃中，見 §第一刀範圍）

**現況**：raw 整卷與招生簡章 PDF 以 **Git LFS** 存於私有 content repo（小規模夠用）。下列 blob store 為規模化後的遷移目標，`Asset` 參照介面不變：

- 抽 `StorageService`（`put / get / getSignedUrl`，repository pattern，後端可換）。
- **Phase 1（私有 beta）**：本地檔案系統 / docker-compose MinIO（S3 相容）。
- **Phase 2（公開）**：Cloudflare R2（無 egress 費、貼合 CF）。介面不變，只換實作。
- **內容定址**：以檔案 `sha256` 當 storage key → 去重、immutable、好快取。
- DB 只存參照（`Asset`：`storageKey / sha256 / bytes / contentType`）；二進位永不進 DB / git。
- 下載走 license-gated API 端點（簽名 URL 或串流），不直接掛公開 repo。

## 整卷答案匯出（規劃中，見 §第一刀範圍）

- **不另存整卷答案實體**（避免 drift）。整卷「index」= `ExamSubject → Question`（用 `Question.order` 可靠排序）。
- 匯出 = 走 index 逐題抓 `Explanation` → 渲染（PDF/markdown）。
- **「一次匯出」= 產生後內容定址快取**到同一 blob store（key = 輸入內容＋模板版本的 hash）；任一答案變動 → hash 變 → 自動失效重生。

## Content Repo 設置

### 本地開發

1. Clone 私有 content repo：`git clone https://github.com/yPinn/ProGrads-content /local/path`
2. 複製 `.env.example` → `.env`，設定 `CONTENT_DIR`：

```bash
# tools/content-sync/.env
DATABASE_URL="postgresql://prograds:prograds@localhost:5433/prograds?schema=public"
CONTENT_DIR="/local/path/to/ProGrads-content"

# 執行 sync
pnpm --filter @prograds/content-sync sync
```

未設 `CONTENT_DIR` 時，sync 直接結束（0 題同步），不報錯。

### CI 部署（server-side runner）

Server-side runner 負責寫入 localhost DB，所以只在可以連到 DB 的 self-hosted runner 上執行 sync。  
CI 用 deploy key 存取私有 content repo，並以 env var 傳入路徑：

```yaml
# .github/workflows/content-sync.yml（stub，待正式佈署時建立）
steps:
  - uses: actions/checkout@v4 # monorepo
  - uses: actions/checkout@v4 # private content repo
    with:
      repository: yPinn/ProGrads-content
      ssh-key: ${{ secrets.CONTENT_DEPLOY_KEY }}
      path: /home/runner/ProGrads-content
  - name: sync
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      CONTENT_DIR: /home/runner/ProGrads-content
    run: pnpm --filter @prograds/content-sync sync
```

**不使用 git submodule** 的理由：code contributor 不需要 content repo 存取權；content curator 可獨立作業；CI 無需 submodule 遞迴 checkout 的額外複雜度。

## 同步流程與部署拓樸

DB 綁 localhost（不對外）→ 驗證與寫入分兩段：

```text
content push → 雲端 CI：
  gray-matter 解析 + Zod 驗證 frontmatter（不需 DB）；失敗則 red

merge → server 端（self-hosted runner / webhook，搆得到 localhost DB）：
  1. pull content
  2. sync：逐檔 transaction —— 解析參照 → upsert Exam → upsert ExamSubject
     → upsert Question(by question_id) → 重建子表（choices / question_subjects）→ upsert Explanation
  3. 收尾 reconcile：每個 ExamSubject 重算合科卷 subject 組成（= 其題目 subjects 聯集）
  4. 觸發 CF Pages rebuild → 重新 prerender
```

- 冪等：依 `question_id` upsert；子表 delete + 重建（在 transaction 內）。
- 合科卷組成是**全量收尾**（不可逐檔，否則只得部分聯集）。
- 孤兒清理（檔案刪除 → DB 刪除）列為 phase 2。

## 招生資料（admissions，規劃中）

招生簡章是「**一校一年一份**、跨全系所」的文件，與考卷顆粒度（track×系所×組×科）不同，故獨立成樹、以 **`年/校`** 為軸（招生屬年度循環）；系所/組細節進檔案內容、不進路徑。

```text
admissions/<year>/<school>/
  prospectus.pdf   # 簡章原始快照（LFS）
  prospectus.yml   # 正規化（組/名額/考科/日程）；延後產，累積多校再建 parser
```

### 抽象：通用 schema + 逐校 adapter

跨校樣本（中興 113/114、清大 114）證實兩件事：**同校跨年模板穩定**、**跨校版面不同但語意件相同**。故抽象切在：

- **正規化 schema 校無關**——每份簡章含同一組語意件（公告/報名/筆試/複試/放榜/報到/名額/考科），DB 與 `prospectus.yml` 用同一套。
- **抽取逐校、跨年攤提**——「讀取器(adapter)」一校寫一次、該校每年複用。規則是 per 校（約 10 校，有界），非 per (校×年)。

抽取分三層：A 自動（民國日期、名額數字，regex 即可，CID 字型也行）；B 視覺（系所/組/考科 CJK，須 PDF→圖 + vision，**待修 renderer**）；C 略過（報名費、試場規則、地圖）。

### 欄位集（聚合表視角定稿）

必備：簡章**新鮮度狀態**（`not_published/published/superseded`，避免拿舊資料當今年）、報名（起訖**含時分**）、筆試（可跨天）、**放榜（多梯次）**。
納入：競爭數據（名額/報名人數/錄取→競爭比）、複試/口試（落組層、可依系所）、報到、連結（`prospectus_url`/`rules_url`）、考場（地點/是否另設）、**指定參考用書**與備註（分則每組皆列，對備考高價值）。

### schema 缺口（落地時補，見 [02-data-model.md](02-data-model.md)）

- `AdmissionEvent` 新增 `enrollment`（報到）。
- 放榜**多梯次** → 事件加 `sequence`/batch。
- 事件存到「時分」+ 區間（`endAt?` 或維持成對事件）。
- 簡章新鮮度狀態欄、`announced_at`（公告日）。

### 聯招（台聯大）— 核心大例外，先研究後實踐

台灣聯合大學系統（成員：中央/陽明交通/清華/政治，全在本專案範圍）辦碩士聯招：**一次報名、一次筆試、選多校系組志願**；涵蓋化學/物理/**電機**/文化研究類（**資工未納入** → 主要影響 EE），名額各校依當年簡章自訂。

結構衝擊：一份考卷/考科被**多個 (校,系,組) 共用**（打破 `Exam` 1:校系組）；獨招/聯招並存而 `AdmissionType` 無法區分管道（缺「招生管道」維度）；聯招簡章非單校（歸 `admissions/<year>/ust/`）。正解約為「**台聯大=招生聯盟實體，擁有共用考卷；成員校的組各自掛名額**」——中型改動，列為獨立後續。

## 第一刀範圍

- schema 增量：`ExamSubject @@unique([examId, name])`、`Question.order`（`Asset`/raw 隨 blob 那一刀，見 [02-data-model.md](02-data-model.md)）。
- frontmatter Zod schema（`packages/shared`）+ 合規閘門。
- sync 腳本（`tools/`）：Tier1 essay + MC 類（choices / answer 解析、Choice 寫入）+ 參照解析 + exam/exam_subject upsert + 收尾 reconcile。
- questions 讀取 API（含 choices）。
- **先不做**：Tier0 raw / blob store、整卷匯出、knowledge_points 寫入 DB、孤兒清理（各自後續一刀）。
