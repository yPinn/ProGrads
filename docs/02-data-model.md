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
- ⚠️ 大碩把**資管歸「商管類」**（非理工）→ category 必須資料化，禁止「理工=有程式」這類寫死假設。

## 核心模型（雙軸 + 共用題庫）

```text
category (理工/商管/人文)
  └ program_track (資工所/資管所/財金所…)        ← 主導覽軸
                        ⇅ M:N track_subject
subject 【全域共用題庫】(資料結構/演算法/線代/經濟學…)
  └ knowledge_point (tree, 屬 subject)

school └ department (台大資工系) ──歸屬──> program_track (nullable)
            └ exam (school + dept + year + admission_type [+ group])
                  └ exam_subject (考卷節次/科目組, 綁 1..n subject)  ← 合科卷
                        └ question ─┬ exam_subject_id (來源整卷)
                                    └ ⇅ M:N question_subject (granular 練習標記)

admission_schedule (school, dept?, admission_type, year, event_type, date)
admission_stat     (school, dept, admission_type, year, applicants/quota/admitted)
-- 第二階段：user / attempt(做題記錄) / reminder_subscription
```

## 例外驗證（資工/資管 壓測後的修正）

原模型整體成立，以下 4 個例外已併入上方模型：

1. **合科卷**（台大資工「資料結構與演算法」一卷兩科）：`exam_subject` 可綁多 subject；`question.exam_subject_id`（整卷重現）+ `question_subject` M:N（跨校練單科）。
2. **組別**（電機所甲/乙/丙組考不同科）：`exam.group`（nullable）。
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

## 列舉（放 packages/shared，Zod）

- `license_status`：`national_exam | school_official | unknown`
- `admission_type`：`考試入學 | 推甄 | 在職專班`
- `question_type`：`mc | essay | calc | proof | cloze | listening`
- `answer_type`：`single_choice | multi_choice | numeric | essay | proof`
- `review_status`：`ai_generated | human_verified | flagged`

## 起步資料（資管/資工）

- 資工所考科：資料結構、演算法、計算機組織、作業系統、線性代數、離散數學。
- 資管所考科：資訊管理、程式設計、（與資工共用）資料結構/線代、管理學、統計學等（逐校考科組合待補）。
