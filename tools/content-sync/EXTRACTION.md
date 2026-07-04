# 內容萃取 — 共用規則

三類內容的萃取共用本規則；型別專屬方法學見各自規格：

- 題目：[PROMPT-questions.md](./PROMPT-questions.md)
- 招生簡章（區A schedule.yml + 區B departments.yml）：[PROMPT-admissions.md](./PROMPT-admissions.md)
- 師資陣容（faculty/\*.yml）：[PROMPT-faculty.md](./PROMPT-faculty.md)

## 契約 = 單一真相

型別欄位以 `packages/shared` 的 Zod 契約為準（`content.ts` / `admission-content.ts` / `faculty-content.ts`），規格只補「怎麼從來源對映到欄位」的方法學、不重抄型別。物件多為 `.strict()`：**鍵拼錯會整檔 red**，逐欄比對契約。

## 參照 slug 必須先 seeded

`school` / `dept` / `subjects` 等以 **slug** 引用既有 seed 列（`schools.seed` / `taxonomy.seed`）。slug 不存在 → validate red。**先補 seed/PR，勿在內容檔硬填新 slug**。slug↔顯示名的唯一 registry 是 seed，內容只用 slug 引用、不另建 map（避免第二事實來源）。

## 路徑↔內容一致

檔案的定位欄（各型別不同，見各規格）必須等於路徑段；sync 逐檔交叉驗證，不一致即 red。已釘選的 id（如 `question_id`）搬檔不改。

## 寧缺勿假

- 查不到的欄位就**省略**（多數為 optional）；**不臆造**。
- 原文有價值但無對應欄位者，放 `note` / `metadata` 逃生口（`metadata` 對映 DB jsonb）。
- 辨識不確定處：題目 markdown 用 `[?]` 標記待人工修正；結構化 YAML 於 `note` 記原文。

## 驗證閘門（三段，由輕到重）

1. **格式**：`pnpm content:check`（prettier + markdownlint）。
2. **契約（免 DB）**：`pnpm --filter @prograds/content-sync validate <questions|admissions|faculty> <dir>`——離線 Zod + slug/路徑一致，**commit 前主閘門**。
3. **入庫（需 DB）**：設 `CONTENT_DIR` 後 `pnpm --filter @prograds/content-sync sync`。

任一步失敗 = 依錯誤訊息（會指出可修正的欄位/路徑）修正後重跑。

## 日期與時區

民國年 +1911 轉西元。含時分的時間點用 RFC3339 + 台北時區（`2026-02-01T09:00:00+08:00`）；只有日期無時分則 `T00:00:00+08:00`；純日期欄（`as_of` / `announced_at`）用 `YYYY-MM-DD`。

## Commit

直接進 content repo `main`（無 feature branch）。訊息 `feat(content): ...`，不含任何 Claude/AI 署名。
