// Nuxt UI theme tokens. See https://ui.nuxt.com/getting-started/theme
export default defineAppConfig({
  ui: {
    // Homer «A Basket of Clams» (ColorLisa, TUNED): ink-blue primary, warm stone neutral.
    // Exact light/dark values are overridden on --ui-* in assets/css/main.css.
    colors: {
      primary: "blue",
      neutral: "stone",
    },
    // bg-elevated skeleton default is near-invisible on cream and disappears without motion;
    // border-accented fixes that. rounded-sm not rounded-card: tailwind-merge doesn't know
    // rounded-card conflicts with the base theme's rounded-md/lg, so it'd append not override.
    skeleton: { base: "animate-pulse rounded-sm bg-(--ui-border-accented)" },
    select: { slots: { base: "rounded-sm", content: "rounded-sm", item: "before:rounded-sm" } },
    selectMenu: {
      slots: { base: "rounded-sm", content: "rounded-sm", item: "before:rounded-sm" },
    },
    toast: { slots: { root: "rounded-sm" } },
  },
});
