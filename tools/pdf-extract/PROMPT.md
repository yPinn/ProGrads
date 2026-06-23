# 考卷萃取 — 操作規格

## 工作流程

1. **轉換圖片**：先將 PDF 轉成頁面圖片：

   ```bash
   pnpm --filter @prograds/pdf-extract to-images <pdf路徑> [output-dir]
   ```

   建議 output-dir：`{content-repo}/images/raw/{school}/{year}/{paper}/`
   （gitignored 的獨立 `images/` 樹，鏡射題目來源路徑，不與內容檔同層）
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

5. **驗證**：

   ```bash
   pnpm --filter @prograds/content-sync sync
   ```

   sync 失敗 = frontmatter 有誤 → 依錯誤訊息修正後重跑。

6. **Commit**：

   ```bash
   git add questions/
   git commit -m "feat(content): {school}-{year}-{paper} Tier1 萃取"
   ```

## 注意事項

- 一次處理一卷（school + year + paper 一致）
- `source_url` 必填，用戶補上官方下載頁 URL 後才算完成
- PDF 掃描件如有旋轉問題，請先修正 PDF 再轉圖片
- `[?]` 標記的位置需人工修正後再執行 sync
- 密集表格／程式碼／圖示辨識不清時，用 `crop` 高解析切割單一區域再讀：
  `pnpm --filter @prograds/pdf-extract crop <pdf> <out.png> <page> <yTop> <yBot> [xL] [xR] [scale]`
  （座標為頁面比例 0–1，與頁面尺寸無關；單張 PNG 寬度建議 ≤1900px）
- Tier1 萃取不輸出 `model_used`、`confidence`、`review_status`；這些只由 AI 解題 pipeline 補上。

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

| 欄位               | 說明                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| `question_id`      | `{school}-{year}-{paper}-q01`（子題 `q01a` / `q01b`），必須與路徑推導值一致     |
| `question_type`    | `mc` 選擇題 / `essay` 問答申論 / `calc` 計算 / `proof` 推導證明                 |
| `points`           | 題幹標示的配分 (如 `(5pts)`→`5`、`(10 points)`→`10`);未標示或全卷均一則省略此行 |
| `subjects`         | 確定的 slug 才填，不確定留 `[]`                                                 |
| `departments`      | 考此卷的系所 slugs；共用卷列多個，未知時先向用戶確認                            |
| `knowledge_points` | 中文短語，≤5 個                                                                 |
| `license_status`   | `school_official`（預設）；政府統一考試用 `national_exam`                       |
| `group`            | 題組或分卷輔助 metadata；不確定或不適用時空字串 `""`                            |
| `source_url`       | 用戶補填，輸出時留 `""`                                                         |

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
