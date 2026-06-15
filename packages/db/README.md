# packages/db — Prisma schema 與 client

PostgreSQL + **Prisma 7**，供 `apps/api` 與 `tools/` 共用。資料模型見
[docs/02-data-model.md](../../docs/02-data-model.md)。

## 檔案

- `prisma/schema.prisma`：ER schema（category/track/subject 雙軸 + question_type + jsonb + 例外修正）。
- `prisma.config.ts`：Prisma 7 連線設定（DATABASE_URL 由 `dotenv` 載入；datasource 不再寫在 schema）。
- `generated/client/`：產生的 client（gitignore；先 `db:generate`）。`index.ts` re-export 之。

## 指令

```bash
pnpm --filter @prograds/db db:generate   # 產生 client（= build）
pnpm --filter @prograds/db db:validate   # 驗證 schema
pnpm --filter @prograds/db db:migrate    # 建/套 migration（需 DB）
```

## 注意（Prisma 7）

- DB 僅綁 `127.0.0.1`，不對外；連線設定在 `prisma.config.ts`（`.env` 的 `DATABASE_URL`）。
- **runtime 需 driver adapter**：`apps/api` 實例化 `PrismaClient` 時要用 PostgreSQL adapter（`@prisma/adapter-pg` + `pg`），於 api scaffold 時接上。
- 後期啟用 `pgvector`（知識點向量 / 相似題）。
