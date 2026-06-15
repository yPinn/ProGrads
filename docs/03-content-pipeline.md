# 03 — 內容 pipeline

## 原則

檔案是**真相層**（git、可審查、可版本控制）；PostgreSQL 是**服務層**。單向同步：檔案 → DB。
內容渲染由 Nuxt Content 負責（build 時 prerender）；動態查詢與使用者資料由 DB 提供。

## 目錄結構

```text
content/
  questions/<track>/<school>/<year>/<exam-subject>/<qNN>.md
  schedules/<year>/<school>.md
  stats/<track>/<school>.md
```

## 題目檔格式（frontmatter + 內文）

```markdown
---
question_id: ntu-csie-2025-algo-q3
track: 資工所
school: 台大
department: 資訊工程學系
year: 2025
admission_type: 考試入學
exam_subject: 資料結構與演算法 # 合科卷 → subjects 可多個
subjects: [演算法] # granular 練習標記（question_subject）
question_type: essay
source_url: https://example.ntu.edu.tw/exam/...
license_status: school_official
knowledge_points: [動態規劃, 最短路徑]
model_used: claude-opus-4-8
confidence: high # 低信心進人工複查
review_status: ai_generated # ai_generated | human_verified | flagged
---

## 題目

（官方公開題幹；markdown 支援 LaTeX 與程式碼）

## 標準解答

（Claude 離線生成，線上 Groq 的 grounding 來源）

## 知識點延伸

（重複考點、關聯觀念，餵給弱點分析/知識圖譜）
```

## frontmatter 驗證

用 `packages/shared` 的 Zod schema（`gray-matter` 解析後）。欄位列舉見 [02-data-model.md](02-data-model.md)。
驗證失敗的檔案讓 CI red，不得進 DB。

## 同步流程

```text
markdown push → CI:
  1. gray-matter 解析 + Zod 驗證 frontmatter
  2. sync script → Prisma upsert（依 question_id 冪等）
  3. 觸發 CF Pages rebuild → 重新 prerender 內容頁
```

合規：每檔必含 `source_url` 與 `license_status`；只收 `national_exam` 或 `school_official`，
`unknown` 不得合併進主分支。
