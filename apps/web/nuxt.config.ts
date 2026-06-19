// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  telemetry: false,
  modules: [
    "@nuxt/ui",
    "@nuxt/content",
    "@nuxt/image",
    "@nuxtjs/seo",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "@nuxt/eslint",
  ],
  css: ["~/assets/css/main.css"],
  // Public runtime config; override per-env via NUXT_PUBLIC_* (see docs/01-architecture.md env layers).
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:8088/api/v1",
    },
  },
  // CF Pages hybrid: content pages prerender at build, dynamic (API-driven) pages render client-side.
  nitro: { preset: "cloudflare-pages" },
  routeRules: {
    "/": { prerender: true },
    // API-driven pages render client-side (edge can't reach the origin DB at build time).
    // SEO prerender of question/answer pages comes with the content pipeline (Phase 2).
    "/schedules": { ssr: false },
    "/admissions": { ssr: false },
    "/questions/**": { ssr: false },
  },
  // Formatting is handled by Prettier.
  eslint: { config: { stylistic: false } },
  // url is env-driven (NUXT_PUBLIC_SITE_URL) so prod/staging/preview each set their own; no real domain yet.
  site: { name: "ProGrads", url: process.env.NUXT_PUBLIC_SITE_URL || "https://app.example.com" },
  // OG image generation needs a native renderer; enable later when needed.
  ogImage: { enabled: false },
  i18n: {
    defaultLocale: "zh-TW",
    strategy: "no_prefix",
    locales: [{ code: "zh-TW", language: "zh-TW", name: "繁體中文" }],
  },
  vite: {
    optimizeDeps: { include: ["@tanstack/vue-query", "@unhead/schema-org/vue"] },
  },
});
