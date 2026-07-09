// Badge intent → Nuxt UI (color, variant). Semantic layer over <UBadge>, ProGrads palette.
// Shared by <AppBadge>. Size is orthogonal (sm/md/lg), not encoded here. See docs/08.
export type BadgeIntent = "tag" | "meta" | "count";
export type BadgeSize = "sm" | "md" | "lg";

export const BADGE_INTENT = {
  tag: { color: "neutral", variant: "outline" }, // 分類/主題標籤;帶 to 時為可點導覽
  meta: { color: "neutral", variant: "subtle" }, // 中性中繼標記:題型、審核狀態、事件類型
  count: { color: "primary", variant: "soft" }, // 分數/強調數量
} as const satisfies Record<BadgeIntent, { color: string; variant: string }>;
