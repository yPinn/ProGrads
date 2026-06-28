// Nuxt UI theme tokens. See https://ui.nuxt.com/getting-started/theme
export default defineAppConfig({
  ui: {
    // Homer «A Basket of Clams» (ColorLisa, TUNED): ink-blue primary, warm stone neutral.
    // Exact light/dark values are overridden on --ui-* in assets/css/main.css.
    colors: {
      primary: "blue",
      neutral: "stone",
    },
    // Skeleton default (bg-elevated) is near-invisible on the cream page (~1.2:1) and vanishes
    // under prefers-reduced-motion (no pulse). Use the warmer border-accented tone so the
    // loading shape stays perceivable in both themes without leaving the palette.
    skeleton: { base: "animate-pulse rounded-md bg-(--ui-border-accented)" },
  },
});
