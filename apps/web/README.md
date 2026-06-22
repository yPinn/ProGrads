# apps/web — 前端（Nuxt）

Nuxt 4 應用，部署 Cloudflare Pages（內容頁 prerender、動態頁 client）。
架構與技術配套見 [docs/01-architecture.md](../../docs/01-architecture.md)。

```bash
pnpm --filter @prograds/web dev       # 開發
pnpm --filter @prograds/web build     # 建置
pnpm --filter @prograds/web lint      # ESLint（@nuxt/eslint）
pnpm --filter @prograds/web typecheck # nuxt typecheck（vue-tsc）
pnpm --filter @prograds/web test      # Vitest（@nuxt/test-utils）
```

已啟用模組：Nuxt UI（Tailwind v4）、MDC、Image、SEO、i18n（zh-TW）、Pinia、@nuxt/eslint。
函式庫：TanStack Query（已接 plugin）/Table、vee-validate + Zod 3、echarts/vue-echarts、Schedule-X。

App 骨架（`app/`）：`app.vue`（`UApp` + `NuxtLayout`/`NuxtPage`）、`layouts/default.vue`、`error.vue`、
`pages/index.vue`、`app.config.ts`（Nuxt UI 主題色）。主題自訂見 `app/app.config.ts` 與 `assets/css/main.css`。

資料層：`plugins/api-client.ts`（`$api`，`apiBaseUrl` + 錯誤信封 → `ApiError`）接 TanStack Query；
composable 以 `@prograds/shared` 契約推導型別並做邊界驗證（範本 `useSchedules`/`useQuestions`）。
功能頁 `/schedules`、`/admissions`、`/questions`（API 驅動，`routeRules` 走 client）。Markdown 題幹/解析以 `<MDC>` 渲染，不使用 Nuxt Content collection，因此 Cloudflare Pages 不需要額外 D1 binding。

> 注意：`ogImage` 暫停用（需原生 renderer，日後啟用）；Zod 固定 v3 以相容 vee-validate 與後端 nestjs-zod。
> `site.url` 由 `NUXT_PUBLIC_SITE_URL` 注入（尚無正式網域，fallback 為 `app.example.com`）。
