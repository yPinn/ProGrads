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

> **數學所**與**資管所**皆被大碩歸於「商管類」（非理工）→ 印證 `category` 必須資料化、禁止「理工=有程式/數學」的寫死假設。
> 大碩跨頁對同一所有不同命名（如「電機所」vs「電子電機所」、「生科所」vs「生化化學所」）→ 印證 `slug`/`name` 分離為必要。
> 大碩另有「工轉商 / EMBA」跨考路徑，屬課程包而非 L2 類組，暫不入分類軸。

## 關鍵洞見

- **主軸是「類組(track)」不是「學校」**：考生心智 = 先定「我要考資工所」→ 挑學校 → 看考哪幾科。導覽、URL、SEO 以 track 為入口。
- **考科是全域共用題庫**：台大資工、清大資工都考「演算法」→ 同一 subject 匯集各校各年題目；考生要跨校一起練。
- **考科跨類組共用**：線代/離散同屬資工所與電機所；微積分/經濟學橫跨更多 → `subject` ↔ `track` 為 M:N。
- **物理考卷跨系所共用**：台大資工與多媒體所考同一份「資料結構與演算法」「英文」（位元相同）→ 考卷的身分是 `(校,年,管道,卷slug)`、**不含系所**；共用卷只存一份，「哪些系所考此卷」掛 `exam_subject` ↔ `department` M:N。**只有「對卷單一從屬」的維度（校/年）能當儲存層**，subject 與 department 皆 M:N → 退化為標籤（合科卷證明 subject 當不了儲存單位；共用卷證明 department 當不了）。
- 大碩把**資管歸「商管類」**（非理工）→ category 必須資料化，禁止「理工=有程式」這類寫死假設。

## 核心模型（雙軸 + 共用題庫）

```text
category (理工/商管/人文)
  └ program_track (資工所/資管所/財金所…)        ← 主導覽軸
                        ⇅ M:N track_subject
subject 【全域共用題庫】(資料結構/演算法/線代/經濟學…)
  └ knowledge_point (tree, 屬 subject)

school └ department (台大資工系) ──歸屬──> program_track (nullable)
            └ admission_group (招生組別: 甲/乙/丙…)  ← 報考單位; 招生方式/名額/考科 掛勾於此
            └ faculty_member (師資, 系內 by name)  ← theses(論文佐證) / degrees(學歷)

school └ exam (school + year + admission_type)  ← 某校某年某管道的考試場次 (不含系所)
            └ exam_subject (物理考卷, slug 唯一, 綁 1..n subject)  ← 合科卷, 去重單位
                  ├ ⇅ M:N exam_subject_department (共用卷被多系所採用)  ← 系所退化為標籤
                  └ question ─┬ exam_subject_id (來源整卷)
                              └ ⇅ M:N question_subject (granular 練習標記)

admission_schedule (school, dept?, admission_type, year, event_type, date)
admission_stat     (school, dept, admission_type, year, applicants/quota/admitted)
-- 第二階段：user / attempt(做題記錄) / reminder_subscription（草圖見下，決策見 06 D17）
```

### 第二階段身分模型草圖（OAuth-only，決策見 [06 D17](06-decisions.md)）

僅為預留意圖，**尚未建 model / 跑 migration**；落地時才補。OAuth-only = 不存密碼，只存外部身分對照列。

```text
user                 (id, provider, providerUserId, email?, displayName?, avatarUrl?, createdAt)
                       @@unique([provider, providerUserId])   ← 同一外部身分只一列
  └ attempt          (id, userId, questionId, answer, isCorrect?, durationMs?, createdAt)  ← 做題記錄

reminder_subscription (id, email, scope(school|dept|track), refId, confirmedAt?, unsubscribedAt?, token)
                       ↑ MVP 即可上線；獨立於 user，純 email double opt-in（不綁帳號）
```

### 招生組別（admission_group）：報考的真正單位

考生報考的是「**A 校 B 系所的 C 組**」（如台大電子所甲組）；**招生方式、名額、考科都跟「組別」掛勾**，而非系所。因此「組別」既不屬系所層（會逐年變動）也不屬考卷層（考卷只是某組某年的產物），而是**介於兩者的招生實體**：

```text
department (系所, 穩定)
  └ admission_group (招生組別, 穩定身分 = department + code)   ← 招生方式/名額/考科 的掛勾點
        └ (組別 × 年) 的記錄：exam(考卷) / admission_stat(名額) / schedule(日程)
```

**時間性切分（回應「組別/考科逐年變動」）**：

- **穩定身分**（組別存在、代號甲乙丙、名稱）→ `admission_group`。由 `departments.yml` 冪等 upsert（鍵 = department + code），非 seed —— 解耦後題目 content 已不引用組別，組別不再是參照資料，故與逐年事實同源於招生 content（避免第二事實來源）。組別身分跨年穩定，逐年檔重複宣告同一組即冪等。
- **逐年變動的事實**（考科、名額、報名日程、錄取標準）→ 掛在 `(組別 × 年)` 的 `admission_round`，同檔帶入。改考科/補名額 = 新增當年一列，**永不改寫組別身分**。

> **考卷↔組別**：考卷去系所化後，`exam` 不再帶 `department_id`/`group`/`admission_group_id`——共用卷橫跨多組，單一 group FK 本就失真。卷↔系所改走 `exam_subject.departments`（M:N，來源＝題目 frontmatter `departments` 的聯集）；卷↔招生組別 M:N 留待招生 pipeline（另一刀）。
>
> **未竟**：`admission_stat` 的 key 仍為 `(school, dept, admission_type, year)` **無 group** → 名額分組改掛 `admission_round.quota`（見下）；`admission_stat` 之整併待後續。

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

- **`ExamSubject @@unique([examId, slug])`**：讓 sync 能以 (exam, 卷 slug) 冪等 upsert（否則無法去重重建合科卷）。卷去系所化後 upsert 鍵由卷名改為**路徑帶入的卷 slug**（`name` 不再唯一，可有重複顯示名）；見 migration `decouple_exam_from_department`。
- **`Question.order Int`**：可靠的整卷排序（`number` 為 `"3"/"3a"/"10"` 字串，字典序會錯）；整卷答案匯出與重現整卷靠此。
- **解答結構化**（`Explanation` / `Choice` model 既有）：`Explanation` 以 `answer_type` 判別式表達（選擇→`Choice.isCorrect`、數值→值、申論→markdown）。**已實作**：sync 解析 `## 選項`/`## 答案` 並寫入 `Choice`（`tools/content-sync/src/sync.ts`），MC 不再暫緩。

**規劃中（尚未實作）**：

- **`Asset`（blob 參照表，規劃中）**：二進位大檔（Tier0 raw 整卷、整卷答案匯出快取）永不進 DB。**現況**以 Git LFS 存於私有 content repo；**規劃**大規模後遷 blob store，DB 只留參照列：`storageKey / sha256 / bytes / contentType`（內容定址、去重、license-gated 下載）。
- **raw 參照**：`ExamSubject` 連到 `Asset`（Tier0）；下載權限由 `license_status` gate。
- **整卷答案匯出快取**：整卷答案不另存實體，由 index（`Question.order`）即時組合，產生後做內容定址快取（見 03）。

**招生增量（schema 已落地 migration `admission_season_papers`；content 到 DB 的 importer 已實作，見 [03](03-content-pipeline.md) §招生資料落地狀態）**——三層擁有者 ①季 → ②時間表 → ③組：

- **①季**：新欄/實體——`application_fee` + 減免、`announced_at`（公告日＝簡章新鮮度錨點）、新鮮度狀態（`not_published/published/superseded`）、放榜 `batch`/`sequence`（多梯次）。
- **②`exam_timetable`（新實體，校級）**：subject × 節次 × `at`(時分) × `calculator_allowed` × 考場。**考試時間掛科目/節次（校級共用），非掛組**——筆試時間表全校共用，系所明細頁只有佔分%。
- **③`AdmissionRound` / `AdmissionRoundSubject` 擴欄**：`code`(官方招生代碼,如 2131/1000)、考科 `weight`(%) + 筆試/審查/面試別、面試 `at`、`身分別`(一般/在職/外籍/低收)、同分參酌順序、特定報考資格、指定參考用書、放榜梯次。
- `AdmissionEvent` 新增 `enrollment`（報到）。
- **聯招（台聯大）**：一卷被多 (校,系,組) 共用，打破 `Exam` 1:校系組 → 招生聯盟實體，列為獨立後續 spike（見 03 §聯招）。

**師資增量（schema 已落地；content importer 見 [03](03-content-pipeline.md) §師資資料）**——系所師資陣容，來源 `faculty/<school>/<dept>.yml`：

- **`FacultyMember`**：掛 `Department`（`onDelete: Cascade`），`(departmentId, name)` 為身分＋冪等 upsert 鍵（中文姓名官網必有、較拼音穩定少撞名）。欄位 `slug?`（選填 URL handle，非身分鍵）/`nameEn?`/`title?`（職級）/`lab?`/`homepage?`/`sourceUrl?`/`note?`（行政職等）/`researchAreas String[]`/`displayOrder`/`metadata`。
- **`FacultyThesis`**（論文佐證，無自然鍵 → 整批取代、隨 member cascade 刪）：`title`/`year?`/`role`（`ThesisRole`）/`url?`。`role` 區分 `advised`（指導學生論文，NDLTD）與 `authored`（教授自著，DBLP/OpenAlex）。
- **`FacultyDegree`**（學歷，無自然鍵 → 整批取代）：`level`（`DegreeLevel`）/`institution`（授予校＝資源訊號）/`field?`/`year?`/`order`（顯示序）。最高學歷＝依 `level` 排序最資深者。
- **軸**：師資屬（校,系所）級、非年度循環，故無年份維度（有別於招生的年度軸）；檔即該系所完整 roster，sync 剔除檔中已移除成員。

## 列舉（放 packages/shared，Zod）

- `license_status`：`national_exam | school_official | unknown`
- `admission_type`：`exam | recommended | in_service`（考試入學 / 推甄 / 在職專班）
- `question_type`：`mc | essay | calc | proof | cloze | listening`
- `answer_type`：`single_choice | multi_choice | numeric | essay | proof`
- `review_status`：`ai_generated | human_verified | flagged`
- `thesis_role`：`advised | authored`（指導學生論文 / 教授自著）
- `degree_level`：`bachelor | master | phd | other`（學士 / 碩士 / 博士 / 其他）

## 起步資料（資管/資工 + 實際擴及會計所、政大文學院）

- 資工所考科：資料結構、演算法、計算機組織、作業系統、線性代數、離散數學。
- 資管所考科：資訊管理、程式設計、（與資工共用）資料結構/線代、管理學、統計學等（逐校考科組合待補）。
- **現況已擴及會計所**（非原定「起步聚焦資管/資工」範圍，見 [00-product.md](00-product.md)）：
  政大會計所題目佔題庫 27%，`business-admin` track 已補上對應 `track_subject` 連結。
- **政大文學院全 8 系所**（中文/歷史/哲學/圖資檔案/宗教/台史/台文/華語文教學）已從 prospectus.pdf
  逐系所抽取進 `admissions/2026/nccu/departments.yml`，對應新增 6 個人文類 track（`history`/
  `philosophy`/`lis`/`religion`/`tw-history`/`tw-lit`）+ 16 個考科 slug。`chinese`（國文）現由 2 系
  實證（中文系「高階國文」、華語文教學「國文」），非共通科臆測；`tw-history`（台灣史所）依實證
  無筆試（純資料審查+面試），故無 `track_subject` 連結——與 `tourism`/`leisure` 同理，非遺漏。

  **`track_subject` 查證方法（已定案）**：以 `admissions/*/*/departments.yml` 的
  `papers[].subjects`（官方簡章實際考科）join `schools.seed.ts` dept→track，取實際考科聯集——
  不依 TKB/大碩分類級慣例臆測，共通科目（國文/英文）尤須逐校查證，同 track 內不同系所可能完全
  不同（政大會計所零共通科、MBA 考英文）。已查證 8 校：`chinese` 零證據、任何 track 皆不掛；
  `english` 僅掛在有實證的 track。待更多內容進來持續依此法擴充、核校。
