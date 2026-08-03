# 考卷萃取 — 操作規格

> 共用規則（契約=真相、seed slug、寧缺勿假、驗證閘門、日期時區、commit）見 [EXTRACTION.md](./EXTRACTION.md)；本文件只補題目專屬方法學。

## 工作流程

1. **轉換圖片**：先將 PDF 轉成頁面圖片：

   ```bash
   pnpm --filter @prograds/pdf-extract to-images <pdf路徑> [output-dir]
   ```

   建議 output-dir：
   - 題目 PDF：`{content-repo}/images/raw/questions/{school}/{year}/{paper}/`
   - 簡章 PDF：`{content-repo}/images/raw/admissions/{year}/{school}/prospectus/`

   這些路徑都在 gitignored 的 `images/` 樹下，只存放可重跑的 PDF 頁面圖與 crop。
   原始 PDF 仍放在 `raw/` 或 `admissions/` 對應內容路徑。
   輸出：`page-01.png, page-02.png, ...`

2. **確認 session metadata**（用於路徑與 frontmatter）：
   - `school`（slug，如 `ntu`）、`year`（如 `2025`）
   - `paper`（整張卷 slug，如 `dsa` / `dsa-a` / `co-os`）
   - `exam-subject-name`（卷名中文顯示名，如 `資料結構與演算法`）
   - `departments`（考此卷的系所 slugs，如 `[csie, mmng]`；共用卷列多個）

3. **逐頁萃取**：分批（每次 3–5 頁）依照下方規格逐題輸出 markdown block。

4. **存檔**：每題建立對應檔案，補填 `source_url`（官方公告連結）：

   ```text
   {content-repo}/questions/{school}/{year}/{paper}/q{NN}.md
   ```

   `question_id` 由路徑推導，必須等於 `{school}-{year}-{paper}-q{NN}`。系所與組別不進路徑；系所寫入 frontmatter `departments`。

5. **驗證與 Commit**：見 [EXTRACTION.md](./EXTRACTION.md)——`validate questions <dir>`（免 DB）→ `sync`（入庫），commit 訊息 `feat(content): {school}-{year}-{paper} Tier1 萃取`。

## 注意事項

- 一次處理一卷（school + year + paper 一致）
- `source_url` 必填，用戶補上官方下載頁 URL 後才算完成
- PDF 掃描件如有旋轉問題，請先修正 PDF 再轉圖片
- `[?]` 標記的位置需人工修正後再執行 sync
- 密集表格／程式碼／圖示辨識不清時，用 `crop` 高解析切割單一區域再讀：
  `pnpm --filter @prograds/pdf-extract crop <pdf> <out.png> <page> <yTop> <yBot> [xL] [xR] [scale]`
  （座標為頁面比例 0–1，與頁面尺寸無關；單張 PNG 寬度建議 ≤1900px）
- Tier1 萃取不輸出 `model_used`、`confidence`、`review_status`；這些只由 AI 解題 pipeline 補上。
- 萃取前查 `packages/db/prisma/seed/knowledge-points.seed.ts`：目前只有 `ds`／`algo`／`english` 建有分類池，其餘科目的 `knowledge_point_slugs` 一律留空。

## 共用聯招卷（跨校，如台聯大）

`Exam` 是 `(school, year, admissionType)` 1:1 校方，`departments` 只能引用同校 seed（`validate/questions.ts` 的 `schoolDepts.get(path_.school)`、`sync.ts` 的 `resolver.department(school.id, d)` 都鎖死同校）。一卷被**多校**共用（如台灣聯合大學系統碩士班聯合招生「台聯大聯招」電機類）不建跨校實體，改比照 `admission-stats` 既有慣例——各校各自一份：

- 原始 PDF 只存一份：`raw/ust/{year}/{subject-slug}.pdf`（不分校）。
- 逐校萃取進 `questions/{school}/{year}/{subject-slug}-ust/qNN.md`：markdown 內容只手動萃取一次，依 `admissions/{year}/{school}/departments.yml` 已標「台聯大聯招」的區塊，複製到每個實際採用該卷的 host school 路徑；`departments` 只列該校自己的系所 slug。
- paper slug **必須加 `-ust` 後綴**（如 `electronics-ust`），不可省略：同校同科目常同時存在獨招卷與台聯大卷（例：NCU `ee` 電子組=台聯大`electronics`、固態組=獨招自己的`electronics`；NTHU `isa`所自己的獨招卷也考`[ds, algo]`）。沒有後綴會讓 sync 依 `(examId, slug)` 誤合併成同一個 ExamSubject，安靜吃掉資料。`subjects:` 欄位不受影響，仍填概念層科目 slug（如 `electronics`）；`exam_subject` 顯示名也不帶 `-ust`。

台聯大成員校為中央/政大/陽明交通/清華，但電機類只有中央(ncu)/清華(nthu)/陽明交通(nycu)有對映 seed 系所（政大無工學院，見 `schools.seed.ts` 註解）；政大在台聯大的角色是人文/文化研究類，目前不在本專案 admissions 內容範圍內，故不適用本節。

2026 電機類已知對照（依 `admissions/2026/{school}/departments.yml` 台聯大區塊彙整；若簡章逐年調整需重新核對）：

| paper slug (`-ust`) | 使用的 host school + dept                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `circuits-ust`      | nthu-ee(325甲，二擇一之一)                                                                                                                                                                                                            |
| `control-ust`       | nthu-ee(325甲，二擇一之一)、nycu-ctrl(313乙A、315丙C二擇一之一)                                                                                                                                                                       |
| `electronics-ust`   | ncu-ee(301電子組)、nthu-ee(327丙)、nthu-elec(329)、nthu-photonics(328二擇一之一)、nycu-elec(304甲二擇一之一)、nycu-ee(308甲/310)、nycu-semi(311)、nycu-ctrl(315丙C)、nycu-comm(317乙/319丙B三擇一之一)、nycu-photonics(320三選二之一) |
| `em-ust`            | nthu-elec(329)、nthu-photonics(328)、nycu-elec(304甲二擇一之一)、nycu-comm(317乙/319丙B)、nycu-photonics(320)                                                                                                                         |
| `modphys-ust`       | nthu-elec(329)、nthu-photonics(328二擇一之一)、nycu-elec(304甲二擇一之一)、nycu-comm(317乙/319丙B三擇一之一)、nycu-photonics(320三選二之一)                                                                                           |
| `edevices-ust`      | nthu-elec(329)、nycu-elec(304甲二擇一之一)                                                                                                                                                                                            |
| `signals-ust`       | nthu-ee(326乙，二擇一之一)、nycu-elec(306乙B)、nycu-ctrl(314乙B)、nycu-comm 未用（comm 用 commsys）                                                                                                                                   |
| `commsys-ust`       | nthu-ee(326乙)、nthu-comm(330)、nycu-elec(306乙B)、nycu-ctrl(314乙B)、nycu-comm(316甲/318丙A)                                                                                                                                         |
| `engmath-b-ust`     | nycu-elec(306乙B)、nycu-ctrl(313乙A/314乙B/315丙C 二擇一之一)、nycu-comm(316甲/318丙A)、nycu-photonics(320二擇一之一)                                                                                                                 |
| `engmath-c-ust`     | nthu-elec(329)、nthu-photonics(328)、nycu-ctrl(313乙A/315丙C 二擇一之一)、nycu-comm(317乙/319丙B三擇一之一)、nycu-photonics(320二擇一之一)                                                                                            |
| `ds-ust`            | 代碼 3002；無對映系所（電機類「資料結構」對映生醫科學與工程學系台聯大302/303組，非 seed，暫不收）                                                                                                                                     |

「工程數學A」該年無試題可略過；`edevices` 對映簡章「固態電子元件」。化學類／物理類目前無任何 seed 系所對映（`schools.seed.ts` 無 chem/physics track 系所），不收。

---

## 任務

讀取台灣研究所考卷圖片，逐題輸出符合 content-sync 格式的 markdown。

## 輸入

用戶提供：圖片 + `school` / `year` / `paper` / `exam-subject-name` / `departments`

## 輸出格式

每題一個獨立 fenced block（存入 `.md` 檔）：

```markdown
---
question_id: {school}-{year}-{paper}-q{NN}
exam_subject: {卷名中文顯示名}
subjects: [{slug}]
departments: [{department-slug}]
question_type: mc
points: {配分數字, 未標示則省略此行}
source_url: ""
license_status: school_official
group: ""
knowledge_points: [{zh短語}]
knowledge_point_slugs: [{比對 knowledge-points.seed.ts 後的 canonical slug；該科目尚無分類池則留 []}]
---

## 題目

{題幹}

## 選項

- (A) ...
- (B) ...
- (C) ...
- (D) ...

## 答案

A
```

## 欄位規則

| 欄位                    | 說明                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `question_id`           | `{school}-{year}-{paper}-q01`（子題 `q01a` / `q01b`），必須與路徑推導值一致                                        |
| `question_type`         | `mc` 選擇題 / `essay` 問答申論 / `calc` 計算 / `proof` 推導證明                                                    |
| `points`                | 題幹標示的配分 (如 `(5pts)`→`5`、`(10 points)`→`10`);未標示或全卷均一則省略此行                                    |
| `subjects`              | 確定的 slug 才填，不確定留 `[]`                                                                                    |
| `departments`           | 考此卷的系所 slugs；共用卷列多個，未知時先向用戶確認                                                               |
| `knowledge_points`      | 中文短語，≤5 個                                                                                                    |
| `knowledge_point_slugs` | 科目已在 seed 分類池中才填；比對 `knowledge_points` 與池中 slug 的 name/aliases，命中才填（可多筆）；未建池留 `[]` |
| `license_status`        | `school_official`（預設）；政府統一考試用 `national_exam`                                                          |
| `group`                 | 題組或分卷輔助 metadata；不確定或不適用時空字串 `""`                                                               |
| `source_url`            | 用戶補填，輸出時留 `""`                                                                                            |

## 區塊規則

- `mc`：輸出 `## 選項` + `## 答案`；多選答案：`A,C`（逗號無空格）
- 非 `mc`：省略 `## 選項` 和 `## 答案`
- **禁止輸出**：`## 標準解答` / `## 知識點延伸` / `model_used` / `confidence` / `review_status`

## 格式規則

- LaTeX 行內：`$...$`；獨立：`$$...$$`
- 程式碼：fenced block + 語言標籤（如 ` ```c `）
- 掃描模糊 / 手寫辨識不確定：用 `[?]` 標記
- 子題相依（共享題幹）→ 整合成一題 `q{NN}`；各自獨立 → 拆成 `q{NN}a` / `q{NN}b`
- **排版可自由重排**：不需複製原題換行位置，以 markdown 可讀性為準（段落自然換行、列表對齊即可）

## 每卷完成後輸出

```text
萃取完成：{N} 題（MC {n}，非選 {n}），[?] 標記 {n} 處
```
