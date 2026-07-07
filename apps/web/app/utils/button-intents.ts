// Button intent → Nuxt UI (color, variant). Emphasis hierarchy (shadcn-named), ProGrads palette.
// Shared by <AppButton>/<IconButton>. Size is orthogonal (sm/md/lg), not encoded here. See docs/08.
export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_INTENT = {
  primary: { color: "primary", variant: "solid" }, // high emphasis — the one main action
  secondary: { color: "neutral", variant: "outline" }, // medium — supporting; bordered so it stays legible on elevated card fills (soft's tint blends into bg-elevated)
  ghost: { color: "neutral", variant: "ghost" }, // low — toolbar / nav / icon buttons
  danger: { color: "error", variant: "solid" }, // destructive
  link: { color: "primary", variant: "link" }, // inline text-link action
} as const satisfies Record<ButtonIntent, { color: string; variant: string }>;
