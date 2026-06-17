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

- **Tier0 raw**（規劃中，見 §第一刀範圍）：官方原始整卷（PDF/掃描/整卷 md）→ 存 blob store（DB 只存 `Asset` 參照）；用於下載、驗真、重新萃取；版權敏感度**最高**（逐字整卷）。
- **Tier1 題**：拆出的每一題（題幹＋選項）→ content repo（markdown）；單題顯示、練習、餵 AI；敏感度中。
- **Tier2 解**：AI 標準解答（同檔依附題目）→ content repo（同一 md 的區塊）；顯示、弱點分析；敏感度低（原創）。

Tier1/Tier2 **同檔**（見下）；Tier0 是大檔，永不進 DB / git，只在 blob store。

## 目錄結構

```text
ProGrads-content/
  questions/<track>/<school>/<department>/<year>/[<group>/]<exam-subject>/<qNN>.md
  schedules/<year>/<school>.md
  stats/<track>/<school>.md
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

## 第一刀範圍

- schema 增量：`ExamSubject @@unique([examId, name])`、`Question.order`（`Asset`/raw 隨 blob 那一刀，見 [02-data-model.md](02-data-model.md)）。
- frontmatter Zod schema（`packages/shared`）+ 合規閘門。
- sync 腳本（`tools/`）：Tier1 essay + MC 類（choices / answer 解析、Choice 寫入）+ 參照解析 + exam/exam_subject upsert + 收尾 reconcile。
- questions 讀取 API（含 choices）。
- **先不做**：Tier0 raw / blob store、整卷匯出、knowledge_points 寫入 DB、孤兒清理（各自後續一刀）。
