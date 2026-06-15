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
  // Formatting is handled by Prettier.
  eslint: { config: { stylistic: false } },
  site: { name: "ProGrads", url: "https://example.com" },
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
