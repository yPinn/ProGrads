# 01 — 系統架構與技術配套

## 取捨原則

SEO 是命脈、非營利要省成本、開源要好協作、AI 內容工廠與線上服務分離。

## 前後端分離與部署拓樸

自有 server 跑 DB + 後端、Cloudflare 跑前端。CF 邊緣環境碰不到 server 上的 DB，
故採「靜態內容上 CF + 動態 API 在 server」，剛好契合內容近乎靜態的特性。

| 類型                         | 渲染               | 位置                  | SEO  |
| ---------------------------- | ------------------ | --------------------- | ---- |
| 考題庫 / 標準解答 / 報名情報 | build 時 prerender | CF Pages 邊緣         | 需要 |
| 做題記錄 / 弱點儀表板        | client-side        | CF（呼叫 server API） | 不需 |
| AI 追問 / 提醒訂閱           | server API         | server                | —    |

- **CF Pages**：Nuxt（`nitro preset: cloudflare-pages`），hybrid 渲染——內容頁 `routeRules: prerender`，動態頁走 client。
- **自有 server**：NestJS API + PostgreSQL（綁 `127.0.0.1`，不對外）+ Groq endpoint（key 留 server）+ Claude 離線 pipeline。
- **CF 放 API 前面**：`api.domain` 經 CF proxy（TLS、隱藏來源 IP、rate-limit、DDoS）；前端 `app.domain` 同掛 CF，cookie 設父網域避開 CORS。
- 分離後必處理：CORS/cookie 同網域、Postgres 僅 localhost、auth 跨來源。

> monorepo ≠ 耦合：`apps/web` 與 `apps/api` 各自獨立部署，monorepo 僅讓兩者共用 `packages/shared` 的 Zod 契約。

環境分層（dev / preview / staging / prod）與晉升管線見 [06-decisions.md](06-decisions.md) D11/D12。

## 內容更新流程

```text
markdown push → CI:
  ├─ sync script → upsert 到 server 的 Postgres
  └─ 觸發 CF Pages rebuild → 重新 prerender 內容頁
```

## 後端架構（NestJS）

定案：**NestJS + Fastify adapter + feature-module-per-domain + Repository(薄 controller)**。
理由：開源、預期多貢獻者 → 強制結構降低協作/review/上手成本（決策見 [06-decisions.md](06-decisions.md)）。

保住「模塊化 + 可替換效能」的三條紀律：

1. `@nestjs/platform-fastify`：Nest 結構 + Fastify 效能基線（官方支援）。
2. Feature module = 擴充切片，對齊資料層 `category/track/subject`：`modules/{taxonomy,questions,explanations,schedules,stats,ai,users}`。
3. DI 只當接線層；service 寫純邏輯 + Repository(Prisma)；controller 維持薄 → 邏輯可攜、可測。

### 資料夾結構與分層慣例

**組織按 domain（feature-sliced），分層按 class（責任分離）——兩者刻意分離。**

頂層分兩類：

- `modules/`：**domain 功能切片**，會隨專案一直長。
- `config/`、`common/`、`prisma/`、`health/`：**跨切面/基礎設施**，相對固定。

```text
apps/api/src/
├─ main.ts          bootstrap（Fastify、helmet、global prefix、ZodValidationPipe、exception filter、swagger）
├─ app.module.ts    根 module
├─ config/          env 驗證（Zod，啟動即 fail fast）
├─ common/          跨切面：HttpExceptionFilter（統一錯誤信封）等
├─ prisma/          全域 PrismaModule/Service（pg driver adapter）
├─ health/          存活探針
└─ modules/         feature-module-per-domain
   └─ taxonomy/      一個 domain 一個資料夾，內部「平鋪」
      ├─ taxonomy.module.ts
      ├─ categories.controller.ts   ┐ Controller 層（薄：HTTP I/O + { data } 信封）
      ├─ tracks.controller.ts       │ 一個 controller = 一個資源（@Controller("tracks")）
      ├─ subjects.controller.ts     ┘
      ├─ taxonomy.service.ts        Service 層（純 domain 邏輯：映射、NotFound、未來規則）
      ├─ taxonomy.repository.ts     Repository 層（Prisma 存取，無邏輯）
      └─ dto/                       createZodDto(shared schema) → 驗證 + Swagger
```

兩條規則：

1. **module = domain、controller = resource、service/repository 各一**。分層體現在 class 與檔名後綴（`.controller`/`.service`/`.repository`），**不開 `controllers/`、`services/` 這類「按技術層分組」的資料夾**（group-by-layer 是規模越大越痛的反模式；更別把層 hoist 成全域 `src/services/`）。
2. **先平鋪，肥了才局部拆**（YAGNI）。唯有當**單一 module** 真的肥起來（如 `questions` 長出 5+ controller、多個 service）才**只在該 module 內**再切子資料夾；其餘小 module 維持平鋪。

檔名規格：`<resource 複數>.controller.ts`、`<domain>.{module,service,repository}.ts`、`dto/<domain>-response.dto.ts`、`dto/<resource 單數>-query.dto.ts`。

理由：會成長的軸是 **domain（→ 數十個）**，不是**技術層（恆為 3）**；沿會長的軸切，且修改多為 feature-scoped（一次動同一 domain 的 controller+service+repo），feature 平鋪讓相關檔聚在一起。

### modules 藍圖

對齊資料層，逐一照上述範本擴充（已做：`taxonomy`）：

```text
modules/{taxonomy, questions, explanations, schedules, stats, ai, users}
```

效能替換三層（profiling 驅動，非預先）：Fastify adapter（全域）→ 熱路徑 raw handler / `fast-json-stringify` → 極端熱點走 CF/nginx 閘道改道到獨立服務（Nest 亦原生支援 microservices）。

## TypeScript（已定案：全棧 strict）

| 因素          | 結論                                                                 |
| ------------- | -------------------------------------------------------------------- |
| NestJS        | 實質強制：DI/裝飾器依賴 `emitDecoratorMetadata` + `reflect-metadata` |
| Prisma        | 型別安全 client 是其核心價值，JS 下喪失                              |
| 共用 Zod 契約 | 前後端型別一致靠 `z.infer` 靜態推導，需 TS                           |
| 開源協作      | 型別=陌生貢獻者的活文件，降低貢獻風險                                |
| 成本          | 近零：Nuxt(Vite)/Nest(swc) 內建轉譯，腳本用 tsx                      |

注意：`apps/api`(Nest) 需自有 tsconfig 開 `experimentalDecorators`/`emitDecoratorMetadata`，
並可能關閉根 config 的 `verbatimModuleSyntax`（干擾 Nest 型別 import DI）。
`packages/shared`、`apps/web` 沿用嚴格根 `tsconfig.base.json`。

## 技術配套（BOM）

### Monorepo

pnpm workspaces + Turborepo。結構：`apps/web`(Nuxt)、`apps/api`(Nest)、`packages/shared`(Zod)、`packages/db`(Prisma)、`content/`(題庫 md)、`tools/`(AI 腳本)。

### 前端（Nuxt）

Nuxt 3/4；UI Nuxt UI + Tailwind；狀態 Pinia；動態取資料 TanStack Query (Vue)；表單 VeeValidate + Zod；
內容渲染 Nuxt Content + KaTeX + Shiki；圖表 vue-echarts；行事曆 Schedule-X；表格 TanStack Table；
SEO `@nuxtjs/seo`；i18n `@nuxtjs/i18n`；`@nuxt/image`、`@nuxt/icon`。

### 後端（NestJS）

NestJS + `@nestjs/platform-fastify`；設定 `@nestjs/config`(+Zod)；DTO `nestjs-zod`；文件 `@nestjs/swagger`；
認證 `@nestjs/jwt` + passport-jwt（httpOnly cookie 父網域）；限流 `@nestjs/throttler`；
快取 `@nestjs/cache-manager` + Redis；佇列 BullMQ；排程 `@nestjs/schedule`；日誌 nestjs-pino；
`@fastify/helmet`、`@nestjs/terminus`。

### DB / AI / 通知

PostgreSQL + Prisma（後期 pgvector）；AI 離線 `@anthropic-ai/sdk`(Claude Opus 4.8) + self-consistency，
線上 `groq-sdk`，串流統一 Vercel AI SDK；Email Resend；推播（後期）`@line/bot-sdk`（LINE Messaging API）。

### 測試 / DX / 部署

Vitest（前後端統一 runner）+ Supertest/Testcontainers（後端整合）、`@nuxt/test-utils`（前端元件）、Playwright（E2E），目標 80%；
ESLint + Prettier + TS strict + Husky + lint-staged + commitlint + release-please；各 app/package 自帶 ESLint 設定（共用 root `base`）；
前端 CF Pages、後端/DB Docker Compose（api + postgres + redis）+ Caddy 反代、CI GitHub Actions、Sentry。
