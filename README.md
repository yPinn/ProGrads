# ProGrads

台灣研究所「備考作戰中心」：歷屆考古題整理、AI 解題（標準解答 + 知識點延伸）、各校報名情報與行事曆。純非營利、開源。

> 起步聚焦 **資管 / 資工**，資料模型設計為全科目可擴充。

## 文件

完整規格與決策都在 **[docs/](docs/)**：

- [產品定位與範圍](docs/00-product.md)
- [系統架構與技術配套](docs/01-architecture.md)
- [資料模型](docs/02-data-model.md)
- [內容 pipeline](docs/03-content-pipeline.md)
- [AI pipeline](docs/04-ai-pipeline.md)
- [API 慣例](docs/05-api-conventions.md)
- [決策紀錄（ADR）](docs/06-decisions.md)

## 技術棧

| 層       | 選用                                                      |
| -------- | --------------------------------------------------------- |
| 前端     | Nuxt（Cloudflare Pages，內容頁 prerender）                |
| 後端     | NestJS（Fastify adapter，自有 server）                    |
| DB / ORM | PostgreSQL（localhost）+ Prisma                           |
| AI       | Claude（離線標準解答）+ Groq（線上 grounded 擴充）        |
| 共用     | TypeScript strict、Zod 契約、monorepo（pnpm + Turborepo） |

## 專案結構

```text
apps/web        Nuxt 前端（CF Pages）
apps/api        NestJS 後端（自有 server）
packages/shared Zod 型別與契約（前後端共用）
packages/db     Prisma schema 與 client
tools/          離線腳本：content-sync（ProGrads-content→DB）、AI 內容工廠
docs/           規格與決策文件
```

## 開發

需求：Node ≥22（建議 24 LTS，見 `.nvmrc`）、pnpm 10（`corepack enable pnpm`，版本由 `packageManager` 鎖定）、Docker（本機 PostgreSQL）。Redis 後期才需要。

```bash
pnpm install                              # 需先 corepack enable pnpm
docker compose up -d postgres             # 本機 Postgres（host 5433，僅綁 localhost）
cp packages/db/.env.example packages/db/.env   # 設 DATABASE_URL
pnpm --filter @prograds/db db:migrate     # 套用 migration（建表）
pnpm --filter @prograds/db db:seed        # 灌參照資料（分類/學校/系所）
cp tools/content-sync/.env.example tools/content-sync/.env  # 設 DATABASE_URL + CONTENT_DIR（指向 ProGrads-content）
pnpm sync                                 # 同步內容（考古題/招生）content → DB；需先 seed
pnpm --filter @prograds/api dev           # 後端 API（http://localhost:8088/api/v1，docs 於 /api/v1/docs）
pnpm --filter @prograds/web dev           # 前端（http://localhost:3000）
```

工作區指令：`pnpm dev`（各 app）、`pnpm lint` / `lint:fix`、`pnpm format` / `format:check`、`pnpm fix`、`pnpm typecheck`、`pnpm test`、`pnpm sync`（內容 → DB）、`pnpm db:refresh`（一鍵 `migrate deploy → seed → sync`，空庫/重置用）。

> 進度：`apps/web` 骨架 + 招生行事曆 / 考古題瀏覽頁已就緒；`packages/db`（Prisma）+ `apps/api`（taxonomy / schools / exams / questions / admissions / schedules 讀取 API）+ `tools/content-sync`（content → DB 同步）已就緒。下一步：AI pipeline、內容渲染（KaTeX/Shiki）。

## 授權

- **程式碼**：MIT（見 [LICENSE](LICENSE)）。
- **考題內容**：著作權屬各來源（學校/命題者），僅收錄官方公開者並附 `source_url`，依各校條款使用，非 MIT 範圍。詳見 [docs/00-product.md](docs/00-product.md)。
