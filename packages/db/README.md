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
pnpm --filter @prograds/db db:migrate    # 建/套 migration（互動，需 DB）
pnpm --filter @prograds/db db:seed       # 參照資料（分類/學校/系所）
pnpm --filter @prograds/db db:seed:dev   # 本機 dev fixtures（exams 等；非正式內容）
```

> 內容資料（questions/exams/explanations…）由 `tools/content-sync` 從 `content/` 同步，**不進 seed**（見 [docs/03](../../docs/03-content-pipeline.md)）。

## Migration 命名與非互動建立

- 命名：`<timestamp>_<suffix>`，timestamp 是 Prisma 的**排序 + 防撞鍵**（保留，勿改格式）；`suffix` 用 **snake_case、意圖式、≤3 詞**（首個用 `init`）。例：`..._content_sync_schema`。
- **非互動建立（CI/自動化）**：`prisma migrate dev` 遇警告會拒絕非互動執行；改用 diff + deploy：

```bash
# 1. 產生 SQL（live DB 現狀 → 目標 schema）
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script \
  -o "prisma/migrations/$(date +%Y%m%d%H%M%S)_<suffix>/migration.sql"
# 2. 非互動套用
pnpm --filter @prograds/db exec prisma migrate deploy
```

## 注意（Prisma 7）

- DB 僅綁 `127.0.0.1`，不對外；連線設定在 `prisma.config.ts`（`.env` 的 `DATABASE_URL`）。
- **runtime 需 driver adapter**：`apps/api` 實例化 `PrismaClient` 時要用 PostgreSQL adapter（`@prisma/adapter-pg` + `pg`），於 api scaffold 時接上。
- 後期啟用 `pgvector`（知識點向量 / 相似題）。
