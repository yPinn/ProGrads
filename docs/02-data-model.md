# 02 — 分類體系與資料模型

## 分類法（參考大碩，3 層）

- L1 大類組 `category`：理工類 / 商管類 / 人文類。
- L2 所別/類組 `program_track`：資工所、電子電機所…／財金所、統計所、企研所、資管所…／傳播所、教育心輔所。
- L3 考科 `subject`：（資工所例）資料結構、演算法、計算機組織、作業系統、線性代數、離散數學。

### 大碩官方完整 L2 類組（實證）

來源：[TKB 通路事業群介紹](https://www.tkb.com.tw/brand/businessGroup/bc)（大碩母集團官方頁）。
作為 `category`/`program_track` seed 的權威依據；命名以大碩原始用語為準，DB 用 `slug`(穩定鍵) + `name`(顯示名) 分離。

- **商管類**：企管所、國企所、經濟所、財金所、統計所、**數學所**、**資管所**、工管所、觀光所、休閒所
- **理工類**：電機所、資工所、機械所、土木所、環工所、材料所、化工所、化學所、生科所、生醫所
- **人文類**：英教所、應外所、中文所、華文所、藝術所、傳播所、心輔所、教育所、政治所、外交所

> ⚠️ **數學所**與**資管所**皆被大碩歸於「商管類」（非理工）→ 印證 `category` 必須資料化、禁止「理工=有程式/數學」的寫死假設。
> 大碩跨頁對同一所有不同命名（如「電機所」vs「電子電機所」、「生科所」vs「生化化學所」）→ 印證 `slug`/`name` 分離為必要。
> 大碩另有「工轉商 / EMBA」跨考路徑，屬課程包而非 L2 類組，暫不入分類軸。

## 關鍵洞見

- **主軸是「類組(track)」不是「學校」**：考生心智 = 先定「我要考資工所」→ 挑學校 → 看考哪幾科。導覽、URL、SEO 以 track 為入口。
- **考科是全域共用題庫**：台大資工、清大資工都考「演算法」→ 同一 subject 匯集各校各年題目；考生要跨校一起練。
- **考科跨類組共用**：線代/離散同屬資工所與電機所；微積分/經濟學橫跨更多 → `subject` ↔ `track` 為 M:N。
- **物理考卷跨系所共用**：台大資工與多媒體所考同一份「資料結構與演算法」「英文」（位元相同）→ 考卷的身分是 `(校,年,管道,卷slug)`、**不含系所**；共用卷只存一份，「哪些系所考此卷」掛 `exam_subject` ↔ `department` M:N。**只有「對卷單一從屬」的維度（校/年）能當儲存層**，subject 與 department 皆 M:N → 退化為標籤（合科卷證明 subject 當不了儲存單位；共用卷證明 department 當不了）。
- ⚠️ 大碩把**資管歸「商管類」**（非理工）→ category 必須資料化，禁止「理工=有程式」這類寫死假設。

## 核心模型（雙軸 + 共用題庫）

```text
category (理工/商管/人文)
  └ program_track (資工所/資管所/財金所…)        ← 主導覽軸
                        ⇅ M:N track_subject
subject 【全域共用題庫】(資料結構/演算法/線代/經濟學…)
  └ knowledge_point (tree, 屬 subject)

school └ department (台大資工系) ──歸屬──> program_track (nullable)
            └ admission_group (招生組別: 甲/乙/丙…)  ← 報考單位; 招生方式/名額/考科 掛勾於此

school └ exam (school + year + admission_type)  ← 某校某年某管道的考試場次 (不含系所)
            └ exam_subject (物理考卷, slug 唯一, 綁 1..n subject)  ← 合科卷, 去重單位
                  ├ ⇅ M:N exam_subject_department (共用卷被多系所採用)  ← 系所退化為標籤
                  └ question ─┬ exam_subject_id (來源整卷)
                              └ ⇅ M:N question_subject (granular 練習標記)

admission_schedule (school, dept?, admission_type, year, event_type, date)
admission_stat     (school, dept, admission_type, year, applicants/quota/admitted)
-- 第二階段：user / attempt(做題記錄) / reminder_subscription
```

### 招生組別（admission_group）：報考的真正單位

考生報考的是「**A 校 B 系所的 C 組**」（如台大電子所甲組）；**招生方式、名額、考科都跟「組別」掛勾**，而非系所。因此「組別」既不屬系所層（會逐年變動）也不屬考卷層（考卷只是某組某年的產物），而是**介於兩者的招生實體**：

```text
department (系所, 穩定)
  └ admission_group (招生組別, 穩定身分 = department + code)   ← 招生方式/名額/考科 的掛勾點
        └ (組別 × 年) 的記錄：exam(考卷) / admission_stat(名額) / schedule(日程)
```

**時間性切分（回應「組別/考科逐年變動」）**：

- **穩定身分**（組別存在、代號甲乙丙、名稱）→ `admission_group`，可進 **seed/reference**。新增一組 = INSERT 一列，不動舊資料。
- **逐年變動的事實**（考科、名額、報名日程、錄取標準）→ 掛在 `(組別 × 年)` 的記錄上，由 sync/scrape 灌。改考科/補名額 = 新增當年一列，**永不改寫組別身分**。

> **考卷↔組別**：考卷去系所化後，`exam` 不再帶 `department_id`/`group`/`admission_group_id`——共用卷橫跨多組，單一 group FK 本就失真。卷↔系所改走 `exam_subject.departments`（M:N，來源＝題目 frontmatter `departments` 的聯集）；卷↔招生組別 M:N 留待招生 pipeline（另一刀）。
>
> ⚠️ **未竟**：`admission_stat` 的 key 仍為 `(school, dept, admission_type, year)` **無 group** → 名額分組改掛 `admission_round.quota`（見下）；`admission_stat` 之整併待後續。

## 例外驗證（資工/資管 壓測後的修正）

原模型整體成立，以下 4 個例外已併入上方模型：

1. **合科卷**（台大資工「資料結構與演算法」一卷兩科）：`exam_subject` 可綁多 subject；`question.exam_subject_id`（整卷重現）+ `question_subject` M:N（跨校練單科）。
2. **組別**（電機所甲/乙/丙組考不同科、名額分組）：升級為 `admission_group` 實體（招生的真正單位，見上「招生組別」節）。考卷已去系所化（`exam` = 校×年×管道），不再掛 `group`/`admission_group_id`；卷↔組 M:N 留待招生 pipeline。
3. **招生管道獨立於筆試**（推甄只有書審+面試、無考古題）：`admission_schedule` / `admission_stat` 綁 `(school, dept, admission_type, year)`，不依賴 `exam`；`exam` 只在 `考試入學` 管道存在。
4. **未分類系所**：`department.track_id` 可 null + 「其他」catch-all + `metadata jsonb`。

## 雙重索引（殺手鐗）

- `question_subject` → 「演算法考古題」跨所有學校一起練（補習班鎖課、阿摩做不深的缺口）。
- `exam_subject` → 「台大資工 2024 整份卷」原樣重現。
- 同一題兩種進入方式，零重複資料。

## 五個擴充槓桿

1. 分類全資料化（category/track/subject/kp 皆資料列，加領域 = INSERT，不改 code）。
2. 題目用 `question_type`（mc/essay/calc/proof/cloze/listening…）驅動渲染與 AI 策略。
3. 每核心表留 `metadata jsonb` 逃生口（核心關聯 + JSONB，**不走 EAV**）。
4. `explanation.answer_type` 讓 AI pipeline 分流（mc/數值→投票；申論→合併）。
5. 後端 feature-sliced；領域特有功能（跑 code、音檔）當 plugin 掛 `question_type`。

## 內容 pipeline 衍生的 schema 增量

由 [03-content-pipeline.md](03-content-pipeline.md) 的存檔設計引入。

**本次已實作**（migration `content_sync_schema`）：

- **`ExamSubject @@unique([examId, name])`**：讓 sync 能以 (exam, 卷名) 冪等 upsert（否則無法去重重建合科卷）。
- **`Question.order Int`**：可靠的整卷排序（`number` 為 `"3"/"3a"/"10"` 字串，字典序會錯）；整卷答案匯出與重現整卷靠此。
- **解答結構化**（`Explanation` / `Choice` model 既有）：`Explanation` 以 `answer_type` 判別式表達（選擇→`Choice.isCorrect`、數值→值、申論→markdown）。MC 的選項寫入由 sync 暫緩（見 03）。

**規劃中（尚未實作）**：

- **`Asset`（blob 參照表，規劃中）**：二進位大檔（Tier0 raw 整卷、整卷答案匯出快取）永不進 DB。**現況**以 Git LFS 存於私有 content repo；**規劃**大規模後遷 blob store，DB 只留參照列：`storageKey / sha256 / bytes / contentType`（內容定址、去重、license-gated 下載）。
- **raw 參照**：`ExamSubject` 連到 `Asset`（Tier0）；下載權限由 `license_status` gate。
- **整卷答案匯出快取**：整卷答案不另存實體，由 index（`Question.order`）即時組合，產生後做內容定址快取（見 03）。

**招生增量（規劃中，由 [03](03-content-pipeline.md) §招生資料 五份壓測導出）**——三層擁有者 ①季 → ②時間表 → ③組：

- **①季**：新欄/實體——`application_fee` + 減免、`announced_at`（公告日＝簡章新鮮度錨點）、新鮮度狀態（`not_published/published/superseded`）、放榜 `batch`/`sequence`（多梯次）。
- **②`exam_timetable`（新實體，校級）**：subject × 節次 × `at`(時分) × `calculator_allowed` × 考場。**考試時間掛科目/節次（校級共用），非掛組**——筆試時間表全校共用，系所明細頁只有佔分%。
- **③`AdmissionRound` / `AdmissionRoundSubject` 擴欄**：`code`(官方招生代碼,如 2131/1000)、考科 `weight`(%) + 筆試/面試別、面試 `at`、`身分別`(一般/在職/外籍/低收)、同分參酌順序、特定報考資格、指定參考用書、放榜梯次。
- `AdmissionEvent` 新增 `enrollment`（報到）。
- **聯招（台聯大）**：一卷被多 (校,系,組) 共用，打破 `Exam` 1:校系組 → 招生聯盟實體，列為獨立後續 spike（見 03 §聯招）。

## 列舉（放 packages/shared，Zod）

- `license_status`：`national_exam | school_official | unknown`
- `admission_type`：`考試入學 | 推甄 | 在職專班`
- `question_type`：`mc | essay | calc | proof | cloze | listening`
- `answer_type`：`single_choice | multi_choice | numeric | essay | proof`
- `review_status`：`ai_generated | human_verified | flagged`

## 起步資料（資管/資工）

- 資工所考科：資料結構、演算法、計算機組織、作業系統、線性代數、離散數學。
- 資管所考科：資訊管理、程式設計、（與資工共用）資料結構/線代、管理學、統計學等（逐校考科組合待補）。
