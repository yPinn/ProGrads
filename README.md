# ProGrads

台灣研究所「備考作戰中心」：歷屆考古題整理、AI 解題（標準解答 + 知識點延伸）、各校報名情報與行事曆。純非營利、開源。

> Exam-prep platform for Taiwan graduate school admissions — curated past exams, AI-generated model answers, and structured admissions data. Non-profit, open source.

[![CI](https://github.com/yPinn/ProGrads/actions/workflows/ci.yml/badge.svg)](https://github.com/yPinn/ProGrads/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](docs/01-architecture.md)

<!-- TODO: 截圖或 demo GIF -->

## 這是什麼

把散落在補習班官網、PTT、各校招生處的備考資訊，整合成結構化、可互動、有 AI 陪練的單一入口——從「該考哪間、怎麼準備」到「考古題練到會」。起步聚焦**資管 / 資工**（考科高度重疊），現況已實際擴及會計所與政大文學院；完整產品定位與競品分析見 [docs/00-product.md](docs/00-product.md)。

工程上兩個值得一提的設計：資料模型是拿多校簡章實測壓出來的去系所化設計，不是憑分類慣例臆測（見 [docs/02-data-model.md](docs/02-data-model.md) §關鍵洞見）；AI 標準解答走離線生成 + 人工複查，刻意不接按量計費 SDK 以控管成本與品質（見 [docs/06-decisions.md](docs/06-decisions.md) D19）。

## 專案結構

```text
apps/web        Nuxt 前端（CF Pages）
apps/api        NestJS 後端（自有 server）
packages/shared Zod 型別與契約（前後端共用）
packages/db     Prisma schema 與 client
tools/          離線腳本：content-sync（ProGrads-content→DB）、AI 內容工廠
docs/           規格與決策文件
```

## 文件

完整規格與決策都在 **[docs/](docs/)**：

- [產品定位與範圍](docs/00-product.md)
- [系統架構與技術配套](docs/01-architecture.md)
- [資料模型](docs/02-data-model.md)
- [內容 pipeline](docs/03-content-pipeline.md)
- [AI pipeline](docs/04-ai-pipeline.md)
- [API 慣例](docs/05-api-conventions.md)
- [決策紀錄（ADR）](docs/06-decisions.md)
- [設計系統](docs/08-design-system.md)
- [Roadmap 與產品缺口](docs/09-roadmap.md)

## 技術棧

Nuxt（Cloudflare Pages）+ NestJS（Fastify adapter）+ PostgreSQL/Prisma + TypeScript strict + Zod 全棧契約，monorepo（pnpm + Turborepo）。細節與取捨見 [docs/01-architecture.md](docs/01-architecture.md)。

## 開發（快速開始）

```bash
corepack enable && corepack prepare pnpm@11.9.0 --activate
pnpm install
docker compose up -d postgres   # 本機 Postgres
pnpm --filter @prograds/db db:migrate && pnpm --filter @prograds/db db:seed
pnpm --filter @prograds/api dev   # http://localhost:8088/api/v1
pnpm --filter @prograds/web dev   # http://localhost:3000
```

完整環境設定（含 `.env`）、常用指令、分支與 commit/PR 規範見 **[CONTRIBUTING.md](CONTRIBUTING.md)**。

## 授權

- **程式碼**：MIT（見 [LICENSE](LICENSE)）。
- **考題內容**：著作權屬各來源（學校/命題者），僅收錄官方公開者並附 `source_url`，依各校條款使用，非 MIT 範圍。詳見 [docs/00-product.md](docs/00-product.md)。
