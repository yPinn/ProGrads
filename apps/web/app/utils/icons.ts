// Semantic icon registry (see docs/08) — reference icons by meaning (icons.back), not raw
// i-lucide-* strings, so a swap happens in one place. Nuxt UI v4 defaults are already Lucide.
export const icons = {
  // navigation
  back: "i-lucide-arrow-left",
  prev: "i-lucide-arrow-left",
  next: "i-lucide-arrow-right",
  menu: "i-lucide-menu",
  search: "i-lucide-search",
  // question / test
  timer: "i-lucide-timer",
  overtime: "i-lucide-alarm-clock-off",
  correct: "i-lucide-check",
  wrong: "i-lucide-x",
  // generic
  close: "i-lucide-x",
  warning: "i-lucide-triangle-alert",
} as const;

export type IconName = keyof typeof icons;
