# 08 — 前端設計系統（UI 規範）

Nuxt UI v4 + Tailwind v4；設計 token 以 `@theme` 定義、經 utility 消費（**token 即 Tailwind class**，非兩套）。視覺真相在 `/styleguide`（dev-only，明暗雙色對照）。

## Token 分層（`app/assets/css/`）

- `main.css`：分層入口，只做 `@import` 排序（tailwindcss → typography plugin → `@nuxt/ui` → tokens → semantic → base → components → schedule-x），順序即 cascade 順序，不放實際規則。
- `tokens.css`（`@theme`）：字級/間距/圓角/容器/動效 → `text-body`、`p-card`、`rounded-card`、`max-w-reading`、`min-h-touch`、`--spacing-nav`（nav 高度單一真相，header 與其下 sticky bar 共用）。**卷/卡/頁層級走 token utility、勿裸數值**；子元件微間距可用原生 Tailwind。
- `semantic.css`：色彩角色 `--ui-*`（`bg-default`/`text-muted`/`text-dimmed`…），light=`:root`、dark=`.dark`；`text-dimmed` 僅在基底 `bg`／抬升的 `card` 上達 WCAG AA（4.70:1／5.17:1），recessed 的 `bg-muted`/`bg-elevated`/`bg-accented` 上不達標（4.13:1 light／2.36:1 dark）——該用 `text`/`text-muted`（詳見 DESIGN.md Do's and Don'ts）。`--board*` 為黑板面。
- `base.css`：全域元素 + a11y（reduce-motion、隱藏捲軸、按鈕 `select-none` + iOS `tap-highlight`/`touch-action`）。
- `components.css`：跨頁共用 class（`.focus-ring`、頁面轉場 `.page-*`/`.fade-*`）與共用表面（`.board`，因為要套進 `<MDC>` render 出的根節點，component-scoped style 碰不到）；也放 `@tailwindcss/typography` 的 `.prose` 色彩映射（unlayered，覆蓋 plugin 預設色，接到 `--ui-*`）。
- Figma 鏡像 `design/tokens.json`：改 semantic 色須同步。

## 元件分層（`app/components/`）

單層目錄（無 `ui/`/`layout/` 子資料夾），靠命名 + 下方護欄規則分層，不靠資料夾：

1. **基層** — 直接包裝 Nuxt UI 原生元件或裸 HTML，吃 token，不含業務邏輯：
   `AppBadge`、`AppBoard`、`AppButton`、`AppCard`、`AppList`/`AppListRow`、`AppPage`、`IconButton`。
   `AppButton`/`IconButton` 是護欄規則（見下）**唯一**允許碰觸 `<UButton>` 的兩個元件——這是「基層」在本專案唯一有 lint 強制力的定義，不是「有沒有 `App` 前綴」（`IconButton` 無前綴但同屬此層）。
2. **跨頁共用樣式** — 不綁定特定資料型別，被多個 feature 頁面共用：
   `ColorModeToggle`、`EmptyState`、`ErrorState`、`GlobalFetchingBar`、`PageHeader`、`QueryState`、`RenderBoundary`。
3. **領域元件** — props 型別綁定特定資料模型，只服務對應頁面：
   `FacultyMemberCard`（`FacultyMemberWithDepartment`）、`PaperCard`（`PaperSummary`）、`ScheduleCalendar`。
4. **開發工具** — 只在 `/styleguide`（dev-only）出現：
   `StyleguideGallery`、`TokenSwatch`。

已知未收斂：分段控制（toggle 群）目前有兩套做法——`pages/faculty/index.vue` 用 raw `UButton` + lint 豁免，`pages/admissions/index.vue` 用原生 `<button>` + 手刻 class。兩者都是在等 `AppSegmented`（見下）補齊後收斂，非刻意分歧，新頁面別再開第三種寫法。

## 按鈕：intent 階層（`utils/button-intents.ts`）

使用端只選 **intent + size**，不碰 color/variant（命名對齊 shadcn 慣例、外觀走本專案 token）：

| intent      | 映射              | 用途               |
| ----------- | ----------------- | ------------------ |
| `primary`   | primary / solid   | 每視圖唯一主動作   |
| `secondary` | neutral / outline | 次要               |
| `ghost`     | neutral / ghost   | 低強度／導覽／icon |
| `danger`    | error / solid     | 破壞性             |
| `link`      | primary / link    | 行內文字連結       |

- size 正交：`sm/md/lg`（預設 md）。
- **`<AppButton>`**：文字按鈕；`intent`+`size` 為 props，其餘（to/icon/loading/disabled/@click）穿透 UButton。
- **`<IconButton>`**：icon-only；`icon`+`label`（強制 → aria-label）、固定 44px 觸控框、預設 ghost、**無 size**（觸控底線使 sm/md 同大）。
- 分段控制（toggle 群）非單顆按鈕，屬待做的 `AppSegmented`；暫以 raw UButton + `eslint-disable` 豁免。

## 標籤：intent 階層（`utils/badge-intents.ts`）

使用端只選 **intent + size**，不碰 color/variant，與 Button 同構：

| intent  | 映射              | 用途                                                   |
| ------- | ----------------- | ------------------------------------------------------ |
| `tag`   | neutral / outline | 分類／主題標籤（考科、研究領域）；帶 `to` 時為可點導覽 |
| `meta`  | neutral / subtle  | 中性中繼標記（題型、審核狀態、事件類型）               |
| `count` | primary / soft    | 分數／強調數量                                         |

- size 正交：`sm/md/lg`（預設 md）；`intent` 預設 `tag`。
- **`<AppBadge>`**：`intent`+`size`+`to` 為 props，其餘穿透 UBadge；`to` 有值時走 NuxtLink，自帶 focus-ring + hover 底色。
- **不開放** `success`/`warning`/`error`/`info` 作為 badge 色：那組是 dot/ring/icon 用的高亮筆標記，當文字色未達 AA（詳見 DESIGN.md Do's and Don'ts）。`/styleguide` 的全色階展示是刻意的 dev-only 例外，用來對照 Nuxt UI 原生色階，不代表可用組合。

## Icon：語意登記（`utils/icons.ts`）

引用 `icons.back`／`icons.close`…，不寫 `i-lucide-*` 字串。Nuxt UI v4 內建 icon 本即 lucide，與登記表同族（翻頁鍵/箭頭/勾叉自動同調）。

## 護欄（`eslint.config.mjs`）

`App*`／`icons.ts`／styleguide 以外**禁**裸用 `<UButton>`/`<UBadge>`、`i-lucide-*` 字串、`<AppBadge>` 上的 `color`/`variant` → 強制走包裝元件、登記表、intent map，防 ad-hoc 樣式回流。
