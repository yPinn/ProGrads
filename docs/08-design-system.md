# 08 — 前端設計系統（UI 規範）

Nuxt UI v4 + Tailwind v4；設計 token 以 `@theme` 定義、經 utility 消費（**token 即 Tailwind class**，非兩套）。視覺真相在 `/styleguide`（dev-only，明暗雙色對照）。

## Token 分層（`app/assets/css/`）

- `tokens.css`（`@theme`）：字級/間距/圓角/容器/動效 → `text-body`、`p-card`、`rounded-card`、`max-w-reading`、`min-h-touch`、`--spacing-nav`（nav 高度單一真相，header 與其下 sticky bar 共用）。**卷/卡/頁層級走 token utility、勿裸數值**；子元件微間距可用原生 Tailwind。
- `semantic.css`：色彩角色 `--ui-*`（`bg-default`/`text-muted`/`text-dimmed`…），light=`:root`、dark=`.dark`；`text-dimmed` 已達 WCAG AA（~4.5:1）。`--board*` 為黑板面。
- `base.css`：全域元素 + a11y（reduce-motion、隱藏捲軸、按鈕 `select-none` + iOS `tap-highlight`/`touch-action`）。
- Figma 鏡像 `design/tokens.json`：改 semantic 色須同步。

## 按鈕：intent 階層（`utils/button-intents.ts`）

使用端只選 **intent + size**，不碰 color/variant（命名對齊 shadcn 慣例、外觀走本專案 token）：

| intent      | 映射            | 用途               |
| ----------- | --------------- | ------------------ |
| `primary`   | primary / solid | 每視圖唯一主動作   |
| `secondary` | neutral / soft  | 次要               |
| `ghost`     | neutral / ghost | 低強度／導覽／icon |
| `danger`    | error / solid   | 破壞性             |
| `link`      | primary / link  | 行內文字連結       |

- size 正交：`sm/md/lg`（預設 md）。
- **`<AppButton>`**：文字按鈕；`intent`+`size` 為 props，其餘（to/icon/loading/disabled/@click）穿透 UButton。
- **`<IconButton>`**：icon-only；`icon`+`label`（強制 → aria-label）、固定 44px 觸控框、預設 ghost、**無 size**（觸控底線使 sm/md 同大）。
- 分段控制（toggle 群）非單顆按鈕，屬待做的 `AppSegmented`；暫以 raw UButton + `eslint-disable` 豁免。

## Icon：語意登記（`utils/icons.ts`）

引用 `icons.back`／`icons.close`…，不寫 `i-lucide-*` 字串。Nuxt UI v4 內建 icon 本即 lucide，與登記表同族（翻頁鍵/箭頭/勾叉自動同調）。

## 護欄（`eslint.config.mjs`）

`App*`／`icons.ts`／styleguide 以外**禁**裸用 `<UButton>` 與 `i-lucide-*` 字串 → 強制走包裝元件與登記表，防 ad-hoc 樣式回流。
