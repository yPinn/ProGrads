# tools — 離線腳本

TypeScript + tsx 執行的 workspace 套件。流程見
[docs/03-content-pipeline.md](../docs/03-content-pipeline.md) 與
[docs/04-ai-pipeline.md](../docs/04-ai-pipeline.md)。

- **`content-sync`**（`@prograds/content-sync`）：`content/` → Postgres 同步（gray-matter + Zod 驗證 + 冪等 upsert + 合科卷 reconcile）。
  執行：`pnpm --filter @prograds/content-sync sync`。
- AI 內容工廠（Claude 生成標準解答）：規劃中。
