# tools — 離線腳本

TypeScript + tsx 執行的 workspace 套件。流程見
[docs/03-content-pipeline.md](../docs/03-content-pipeline.md) 與
[docs/04-ai-pipeline.md](../docs/04-ai-pipeline.md)。

- **`content-sync`**（`@prograds/content-sync`）：`ProGrads-content` → Postgres 同步（gray-matter + Zod 驗證 + 冪等 upsert + 合科卷 reconcile + 招生 schedule/departments importer）。
  執行：`pnpm --filter @prograds/content-sync sync`。
- **`ai-pipeline`**（`@prograds/ai-pipeline`）：列出缺少標準解答的題目，批次離線生成解答。
  執行：`pnpm --filter @prograds/ai-pipeline list-pending`。
  工作流程與規格：[PROMPT.md](./ai-pipeline/PROMPT.md)。
- **`pdf-extract`**（`@prograds/pdf-extract`）：PDF 考卷 → PNG 頁面圖片（供 AI 視覺萃取題目用）。
  執行：`pnpm --filter @prograds/pdf-extract to-images <pdf路徑> [output-dir]`。
  工作流程與規格：[PROMPT.md](./pdf-extract/PROMPT.md)。
