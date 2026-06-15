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
content/        題庫與標準解答（markdown，真相層）
tools/          AI 內容工廠等離線腳本
docs/           規格與決策文件
```

## 開發

需求：Node 22+、pnpm 9+（`corepack enable pnpm`）、PostgreSQL、Redis。

```bash
pnpm install
pnpm dev          # turbo: 啟動各 app
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm typecheck    # tsc
pnpm test         # 測試
```

> 目前為骨架階段。`apps/web`、`apps/api`、Prisma schema 尚未 scaffold，見各目錄 README 與 docs。

## 授權

- **程式碼**：MIT（見 [LICENSE](LICENSE)）。
- **考題內容**：著作權屬各來源（學校/命題者），僅收錄官方公開者並附 `source_url`，依各校條款使用，非 MIT 範圍。詳見 [docs/00-product.md](docs/00-product.md)。
