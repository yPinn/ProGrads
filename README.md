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

| 層       | 選用                                                             |
| -------- | ---------------------------------------------------------------- |
| 前端     | Nuxt（Cloudflare Pages，API-driven 頁面 CSR；MDC 渲染 Markdown） |
| 後端     | NestJS（Fastify adapter，自有 server）                           |
| DB / ORM | PostgreSQL（localhost）+ Prisma                                  |
| AI       | Claude（離線標準解答）+ Groq（線上 grounded 擴充）               |
| 共用     | TypeScript strict、Zod 契約、monorepo（pnpm + Turborepo）        |

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

需求：Node ≥22（建議 24 LTS，見 `.nvmrc`）、pnpm 10（版本由 `packageManager` 鎖定）、Docker（本機 PostgreSQL）。Redis 後期才需要。

```bash
corepack enable
corepack prepare pnpm@10.34.3 --activate # 對齊 packageManager
pnpm install
docker compose up -d postgres             # 本機 Postgres（host 5433，僅綁 localhost）
cp packages/db/.env.example packages/db/.env   # 設 DATABASE_URL
pnpm --filter @prograds/db db:migrate     # 套用 migration（建表）
pnpm --filter @prograds/db db:seed        # 灌參照資料（分類/學校/系所）
cp tools/content-sync/.env.example tools/content-sync/.env  # 設 DATABASE_URL + CONTENT_DIR（指向 ProGrads-content）
pnpm sync                                 # 同步內容（考古題/招生）content → DB；需先 seed
pnpm --filter @prograds/api dev           # 後端 API（http://localhost:8088/api/v1，docs 於 /api/v1/docs）
pnpm --filter @prograds/web dev           # 前端（http://localhost:3000）
```

### 工作區指令

根目錄 `pnpm <script>`，依使用情境分區。

#### 日常開發

| 指令             | 用途                               |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | 各 app 並行開發伺服器（turbo）     |
| `pnpm build`     | 建置全部 app                       |
| `pnpm typecheck` | 全 workspace 型別檢查              |
| `pnpm test`      | 全 workspace 測試                  |
| `pnpm clean`     | 清 build 產物並移除 `node_modules` |

#### 程式碼品質

CI 用 `lint` / `:check`，本機修用 `fix`。

| 指令                | 用途                                          |
| ------------------- | --------------------------------------------- |
| `pnpm lint`         | eslint + 各 workspace lint（唯讀檢查）        |
| `pnpm lint:fix`     | eslint + markdownlint + 各 workspace 自動修復 |
| `pnpm lint:md`      | 只跑 markdownlint（針對性手動執行）           |
| `pnpm format`       | prettier 寫入整個 repo                        |
| `pnpm format:check` | prettier 唯讀檢查                             |
| `pnpm fix`          | 一鍵 `format` + `lint:fix`                    |

#### 內容資料

content repo 與 DB 同步。

| 指令                 | 用途                                                       |
| -------------------- | ---------------------------------------------------------- |
| `pnpm sync`          | content → DB 同步（考古題/招生；需先 seed）                |
| `pnpm sync:prune`    | 同步並刪除已從 content repo 移除且帶 `sourcePath` 的資料   |
| `pnpm db:refresh`    | 一鍵 `migrate deploy → seed → sync`（空庫/重置用）         |
| `pnpm content`       | 對 `../ProGrads-content` 跑 prettier + markdownlint 並寫入 |
| `pnpm content:check` | 同上唯讀檢查                                               |

## 授權

- **程式碼**：MIT（見 [LICENSE](LICENSE)）。
- **考題內容**：著作權屬各來源（學校/命題者），僅收錄官方公開者並附 `source_url`，依各校條款使用，非 MIT 範圍。詳見 [docs/00-product.md](docs/00-product.md)。
