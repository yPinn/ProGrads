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

已啟用模組：Nuxt UI（Tailwind v4）、Content、Image、SEO、i18n（zh-TW）、Pinia、@nuxt/eslint。
函式庫：TanStack Query（已接 plugin）/Table、vee-validate + Zod 3、echarts/vue-echarts、Schedule-X。

> 注意：`ogImage` 暫停用（需原生 renderer，日後啟用）；Zod 固定 v3 以相容 vee-validate 與後端 nestjs-zod。
