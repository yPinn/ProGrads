# 03 — 內容 pipeline

## 原則

檔案是**真相層**（git、可審查、可版本控制）；PostgreSQL 是**服務層**。單向同步：檔案 → DB。
現況內容渲染由 Nuxt MDC 負責（DB markdown → `<MDC>`）；動態查詢與使用者資料由 DB 提供。公開內容頁 SEO/prerender 屬後續階段。

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
  raw/<school>/<year>/<paper>.pdf                       # Tier0 整卷（LFS）
  questions/<school>/<year>/<paper>/<qNN>.md            # Tier1/2 結構化單題＋解答
  admissions/<year>/<school>/<season>/{prospectus.pdf,schedule.yml,departments.yml}  # 招生簡章（獨立樹，見 §招生資料）
```

- 路徑段用 **slug**（ASCII、穩定）；`<paper>` 用「整張卷」的 slug（合科卷一個 slug，含卷別如 `dsa-a`）。
- **儲存軸只到「對卷單一從屬」的維度**：`school / year / 卷`。`track`、`department`、`group` **不進路徑**——它們對共用卷是 M:N，當資料夾會撞「該放哪/放幾份」。系所改由題目 frontmatter `departments` 帶（→ `exam_subject` ↔ `department` M:N）；track 由 DB 推導。
- `<paper>` 為**去重單位**：多系所共用的同一份物理卷只存一份（如台大資工與多媒體的 `dsa-a` 同檔）。
- `admission_type` **預設 `exam`（考試入學）**，不進路徑；推甄無考古題，極少數例外才於 frontmatter 明寫。
- 例：`questions/ntu/2025/dsa/q03.md`；含卷別 `questions/ntu/2021/dsa-a/q01.md`。

### Slug 命名慣例

跨 category / track / subject / school / department / exam-subject 一致：

- **有公認縮寫者用縮寫**：學校 `ntu / nthu / nycu`、系所 `csie / im / mis`（台灣學界標準，遠勝 `national-taiwan-university`）。
- **其餘用全字 kebab-case**：`science-engineering`(category)、`env-eng`(track，無公認單字母)。
- **subjects 縮寫**：`ds` / `algo` / `os` / `co` / `la` / `dm` / `db` / `mis` 等（見 taxonomy seed）。
- slug 是**穩定鍵**、顯示名另存（DB 的 `slug` / `name`）；slug↔name 的唯一 registry 是 seed（`seed/{taxonomy,schools}.seed.ts`），content 只用 slug 引用，sync 解析時 slug 不存在即報錯——**不另建 map**（避免第二事實來源）。

## 身分與命名（id 策略）

- `question_id` 寫在 frontmatter、**是唯一的 upsert 鍵，發布後不可變**（被 explanation / attempt / URL / SEO 引用）。
- 首次可由路徑推導預設值：`<school>-<year>-<paper>-<qNN>`
  （`ntu-2025-dsa-q03`；含卷別 `ntu-2021-dsa-a-q01`）。id 屬「卷」而非「系」，共用卷天然不撞。
- sync **驗證「路徑推導值 == frontmatter id」**，不一致則 red（抓誤分類）；但**搬檔不改 id**（id 已釘選）。
- 子題：`q03a` / `q03b`。

## 題目檔格式（單檔：frontmatter + 區塊）

題目與解答**同檔**（策展耦合、原子、MC 正解不跨檔）。卷的定位欄（school/year/paper）由**路徑決定**，不在 frontmatter 重複；系所（`departments`，對卷為 M:N、無法塞進路徑）與其餘無法從路徑推導者留在 frontmatter。

```markdown
---
question_id: ntu-2025-dsa-q03 # 釘選，唯一鍵（<school>-<year>-<paper>-<qNN>）
exam_subject: 資料結構與演算法 # 卷的顯示名（ExamSubject.name；合科卷可多 subject）
subjects: [algo] # granular 練習標記（question_subject），用 slug
departments: [csie, mmng] # 考此卷的系所 slugs → exam_subject ↔ department M:N（共用卷列多系）
question_type: essay # mc | essay | calc | proof | cloze | listening
source_url: https://example.ntu.edu.tw/exam/...
license_status: school_official # national_exam | school_official | unknown
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

- **參照資料（須先存在，由 seed 管）**：category / track / subject / school / department → sync **只解析、不建立**；缺則 red（逼先補 seed/PR）。frontmatter `subjects`/`departments` 皆以 slug 引用既有列。
- **內容資料（sync 建立/更新）**：exam / exam_subject / question / choice / explanation / question_subject / exam_subject_department。

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

# 選用：刪除 content repo 已移除、且 DB metadata.sourcePath 可追蹤的同步資料
pnpm --filter @prograds/content-sync sync:prune
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
  2. sync：逐檔 transaction —— 解析參照（school/subjects/departments）→ upsert Exam(by 校×年×管道)
     → upsert ExamSubject(by examId+slug) → upsert Question(by question_id)
     → 重建子表（choices / question_subjects）→ upsert Explanation
  3. 收尾 reconcile：每個 ExamSubject 重算 ① 合科卷 subject 組成（= 其題目 subjects 聯集）
     ② 採用系所（= 其題目 frontmatter departments 聯集 → exam_subject_department）
  4. （選用）sync:prune：刪除已從 content repo 移除、且 DB metadata.sourcePath 可追蹤的題目/招生季/招生梯次與孤兒考卷
  5. 觸發 CF Pages rebuild
```

- 冪等：依 `question_id` upsert；子表 delete + 重建（在 transaction 內）。
- 合科卷 subject 組成與卷↔系所 M:N 皆為**全量收尾**（卷層事實，逐檔只得部分聯集）。
- 孤兒清理（檔案刪除 → DB 刪除）已以明確 opt-in 的 `sync:prune` 落地；只清理新版 sync 寫入 `metadata.sourcePath` 的資料，避免誤刪手動資料或舊資料。

## 招生資料（admissions，現況 + 後續）

招生簡章是「**一校一年一管道一份**、跨全系所」的文件，與考卷顆粒度（track×系所×組×科）不同，故獨立成樹、以 **`年/校/管道`** 為軸（招生屬年度循環）；系所/組細節進檔案內容、不進路徑。

> **落地狀態（現況）**：三層擁有者設計、契約、schema 與 content sync importer 已落地；聯招與舊表退役仍屬後續：
>
> - 已落地，Zod 契約：`packages/shared/src/admission-content.ts`（`ScheduleYml` 區A、`DepartmentsYml` 區B）。
> - 已落地，DB 表（migration `admission_season_papers`）：`AdmissionSeason`（①季）、`AdmissionSeasonEvent`（校級事件）、`AdmissionExamSlot`（②節次時間表）、`AdmissionRoundPaper`(+`Subject`)（③組考卷）。
> - 已落地，區A importer：`tools/content-sync` 讀 `admissions/<year>/<school>/schedule.yml`，upsert `AdmissionSeason` + 重建 `AdmissionSeasonEvent` / `AdmissionExamSlot`（`src/admissions.ts`）。
> - 已落地，區B importer：`tools/content-sync` 讀 `admissions/<year>/<school>/departments.yml`，upsert `AdmissionGroup`（content-derived，單一事實來源）+ `AdmissionRound`（逐年事實）+ 重建 `AdmissionRoundPaper`(+`Subject`)（`src/admissions.ts`）。
> - 已落地，路徑管道驗證：`admissions/<year>/<school>/recruit/schedule.yml` 等路徑推導出的管道必須與 YAML `admission_type` 一致。
> - 招生 API 現況：`/schedules` 讀校級 `AdmissionSeasonEvent`（content 來源；行事曆為校級，不含系所/組）。`/admissions`（組別/梯次）讀 `AdmissionGroup` / `AdmissionRound`（含 `AdmissionRoundPaper` 結構化考卷與組級事實：招生代碼/身分別/採計%/`interviewAt`/同分參酌），全數來自 `departments.yml`（`seed` 已退役 `admission.seed.ts`）。
> - 待退役（已不被讀寫，留待專屬 drop migration）：`AdmissionRoundEvent`（事件改掛校級 season）、`AdmissionRoundSubject`（考科改由 `AdmissionRoundPaper` 表達；組級面試日改用 `AdmissionRound.interviewAt`）。
>
> **五份壓測**（NTU/NCCU/NCKU/CCU 115 + 台聯大 115）證實一份簡章可乾淨切成兩區：**區 A 日程/地點**（校級、A 層 regex 可抽）與**區 B 系所/組明細**（B 層、須 vision）。NTU 那份甚至**只有區 A**（2 頁「重要日程表」單獨發），坐實兩區可獨立成檔。故 `prospectus.yml` 拆為 `schedule.yml`（區 A）+ `departments.yml`（區 B），沿抽取層邊界切：A 層先落地、不被卡 vision 的 B 層綁架，且兩區 git diff 互不污染。

```text
admissions/<year>/<school>/<season>/         # season: exam(預設可省) / recruit(推甄) / in-service(在職)
  prospectus.pdf     # 簡章原始快照（Tier0,LFS）
  schedule.yml       # 區A:①季框架 + ②科目節次時間表（校級,A 層）
  departments.yml    # 區B:③各系所組明細（系所→組 keyed entry,大時可 shard 成 depts/<dept>.yml）
```

- **`<season>` 段**對齊 `admission_type`；同校同年有考試/推甄/在職多份簡章（NCKU 含在職、推甄另發），不加段會撞檔。**預設 `exam` 可省略**以相容現況。
- **聯招**走 `admissions/<year>/ust/<season>/`，`ust` 為 pseudo-school；`departments.yml` 每筆帶 `school`(成員校) 欄（見 §聯招）。

### 三層擁有者（抽象結論）

切完五份後，區 A 內部還要再切一刀——**「考試時間」掛在「科目/節次」(校級)，不掛「組」**（NTU/NCKU/CCU 的筆試時間都在校級科目時間表，系所明細頁只有佔分%）：

```text
①招生季 admission_season   一筆 = 校 × 年 × 管道  →  schedule.yml
   報名起訖 + 報名費(+減免) + 簡章公告日 + 放榜梯次日期
        │
②科目節次時間表 exam_timetable   校級,掛「科目/節次」  →  schedule.yml
   某科 第幾節 / 日期時間 / 可否用計算機 / 考場（CCU 另依筆試/無筆試分流）
        ▼
③組級明細 admission_round（現有）  一筆 = 系所 × 組 × 年  →  departments.yml
   招生代碼 + 名額 + 身分別 + 考科加權% + 面試%/日期 + 同分參酌 + 放榜梯次 + 規定
```

跨層連結（抽取時須對齊）：組(③)考科名 → 時間表(②)得各科考試時間；組(③)放榜梯次 → 季(①)得第 N 梯放榜日；**面試時間為例外**，掛組(③)（NCCU 財政面試 3/14）、非掛②。

### 抽象：通用 schema + 逐校 adapter

跨校樣本（中興 113/114、清大 114）證實兩件事：**同校跨年模板穩定**、**跨校版面不同但語意件相同**。故抽象切在：

- **正規化 schema 校無關**——每份簡章含同一組語意件（公告/報名/筆試/複試/放榜/報到/名額/考科），DB 與 `prospectus.yml` 用同一套。
- **抽取逐校、跨年攤提**——「讀取器(adapter)」一校寫一次、該校每年複用。規則是 per 校（約 10 校，有界），非 per (校×年)。

抽取分三層：A 自動（民國日期、名額數字、**報名費**，regex 即可，CID 字型也行）；B 視覺（系所/組/考科 CJK，須 PDF→圖 + vision，renderer 已具備：`tools/pdf-extract`，mupdf/FreeType 實心 CJK）；C 略過（試場規則、地圖）。

> 修正：**報名費改列 A 層收錄**（NTU 1,500／口試 500、NCKU 低收/中低收減免都是日程表裡的乾淨數字）；原列「C 略過」係低估。renderer 已實作，B 層不再受阻。

### 欄位集（聚合表視角定稿）

依三層擁有者分列（↔ schedule.yml / departments.yml）：

- **①季（schedule.yml）**：簡章**新鮮度狀態**（`not_published/published/superseded`，避免拿舊資料當今年）＋`announced_at`（公告日，即新鮮度錨點）、報名起訖（**含時分**）、**報名費**（＋低收/中低收減免、口試費）、放榜**多梯次**日期、連結（`prospectus_url`/`rules_url`）。
- **②時間表（schedule.yml）**：科目 × 節次 × 日期時間（可跨天）、可否用計算機、考場（地點/是否另設；CCU 依筆試/無筆試分流）。
- **③組（departments.yml）**：**招生代碼**(官方,如 NCCU 2131／CCU 1000)、名額、**身分別**(一般/在職/外籍/低收)、特定報考資格、**考試項目**(筆試各科加權% + 面試%)、面試日期、同分參酌順序、放榜梯次、**指定參考用書**與其他規定（對備考高價值）、競爭數據（報名人數/錄取→競爭比）。

### schema 缺口（已落地 migration `admission_season_papers`，見 [02-data-model.md](02-data-model.md)）

下列表/欄已建（命名以實際 schema 為準）；content 到 DB 的 importer 已落地（見上節落地狀態）。

- **①季**：新實體 `AdmissionSeason`——`applicationFee`/`interviewFee` + `feeWaiver`、`announcedAt`（公告日）、`status`（`not_published/published/superseded`）；放榜梯次 `sequence` 落在 `AdmissionSeasonEvent`。
- **②時間表**：新實體 `AdmissionExamSlot`（即設計中的 `exam_timetable`）——`date` × `period` × `startTime`/`endTime`，掛 `AdmissionSeason`（校級共用）；可否計算機改掛 `AdmissionRound.calculator`（組級事實）。
- **③組**（擴 `AdmissionRound` + 新 `AdmissionRoundPaper`/`AdmissionRoundPaperSubject`）：`admissionCode`、`applicantType`(身分別)、`writtenWeight`/`interviewWeight`、`interviewAt`、`tiebreak`(同分參酌)、`resultBatch`、`methods`(筆試/審查/口試)；考科 `weight` 落在 `AdmissionRoundPaper`。
- `AdmissionEvent` 新增 `account_open`/`document_deadline`/`admit_card`/`shortlist`/`enrollment`；事件存到「時分」+ 區間（`AdmissionSeasonEvent.endAt?`）。

### 聯招（台聯大）— 核心大例外，先研究後實踐

台灣聯合大學系統（成員：中央/陽明交通/清華/政治，全在本專案範圍）辦碩士聯招：**一次報名、一次筆試、選多校系組志願**；涵蓋化學/物理/**電機**/文化研究類（**資工未納入** → 主要影響 EE），名額各校依當年簡章自訂。

115 實證（`台聯大 115.pdf`）：一次報名 114/11/21~24、四校（中央/政大/陽明交通/清華）、日程表聯盟級但繳費/考場/複查導回各校。

結構衝擊：一份考卷/考科被**多個 (校,系,組) 共用**（打破 `Exam` 1:校系組）；獨招/聯招並存而 `AdmissionType` 無法區分管道（缺「招生管道」維度）；聯招簡章非單校。正解約為「**台聯大=招生聯盟實體，擁有共用考卷；成員校的組各自掛名額**」——中型改動。

**定案命名（先佔位、不實作）**：聯招歸 `admissions/<year>/ust/<season>/`，`ust` 為 pseudo-school；`departments.yml` 每筆帶 `school`(成員校) 欄。**列為獨立後續 spike**（見落地優先序），現階段僅保留此 slot，避免主路徑被聯招卡住。

### 落地優先序

以「風險低、解鎖廣」排序——命名是地基（建檔後改路徑＝牽動 git 史與重抽），聯招是打破 `Exam 1:校系組` 的大例外、現在動會卡主路徑，故先佔位不實作。

1. **文件先行**（本節）：鎖命名＋三層擁有者＋schema 增量，給策展與實作單一真相。
2. **區 A schema migration**：①季欄位（費/公告/放榜 batch）＋②`exam_timetable`。只動區 A、不碰 vision。
3. **MVP 端到端**：拿 **NTU_115**（純區 A、2 頁、A 層 regex）做第一份 `schedule.yml`，跑通 檔案→sync→DB，最低成本驗證新命名＋schedule schema。
4. **區 B（需 vision）**：③`departments.yml` schema 增量 + 單校 adapter（建議 NCKU/NCCU，系所多、模板穩）。
5. **聯招 spike（延後）**：一卷多校系所 + member-school 維度，另開設計；現僅保留 `ust/` slot。

## 第一刀範圍

- schema 增量：`ExamSubject @@unique([examId, slug])`（卷 slug 為冪等 upsert 鍵；卷已去系所化，`Exam` = 校×年×管道，授權改掛 `ExamSubject.licenseStatus`）、`Question.order`（`Asset`/raw 隨 blob 那一刀，見 [02-data-model.md](02-data-model.md)）。
- frontmatter Zod schema（`packages/shared`）+ 合規閘門。
- sync 腳本（`tools/`）：Tier1 essay + MC 類（choices / answer 解析、Choice 寫入）+ 參照解析 + exam/exam_subject upsert + 收尾 reconcile + opt-in prune。
- questions 讀取 API（含 choices）。
- **先不做**：Tier0 raw / blob store、整卷匯出、knowledge_points 寫入 DB（各自後續一刀）。
