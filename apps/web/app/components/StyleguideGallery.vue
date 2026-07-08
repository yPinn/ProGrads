<script setup lang="ts">
// Colour-token + base-component gallery for /styleguide. No theme logic here — renders in the
// active colour mode, so the nav theme switch flips every swatch/component. Zones: Colors →
// Typography → Buttons → Icons → Badges → Forms → Feedback → States → Surfaces → Navigation → Prose.
import { ref } from "vue";
import { icons } from "~/utils/icons";
import type { ButtonIntent, ButtonSize } from "~/utils/button-intents";

// Colour tokens as swatches — the palette source of truth (semantic.css). Classes are literal so
// Tailwind's scanner emits them; roles/ink use the --ui-* / --surface-card vars directly.
const surfaceSwatches = [
  { name: "default", cls: "bg-default" },
  { name: "muted", cls: "bg-muted" },
  { name: "elevated", cls: "bg-elevated" },
  { name: "accented", cls: "bg-accented" },
  { name: "card", cls: "bg-(--surface-card)" },
  { name: "inverted", cls: "bg-inverted" },
];
// Brand roles — per-theme (from the painting scheme).
const brandSwatches = [
  { name: "primary", cls: "bg-(--ui-primary)" },
  { name: "secondary", cls: "bg-(--ui-secondary)" },
];
// Status roles — FIXED highlighter markers; each pairs a marker (fill/icon) with a -ink text step.
const statusSwatches = [
  { name: "success", cls: "bg-(--ui-success)", ink: "text-success-ink" },
  { name: "warning", cls: "bg-(--ui-warning)", ink: "text-warning-ink" },
  { name: "error", cls: "bg-(--ui-error)", ink: "text-error-ink" },
  { name: "info", cls: "bg-(--ui-info)", ink: "text-info-ink" },
];
const borderSwatches = [
  { name: "default", cls: "border-default" },
  { name: "accented", cls: "border-accented" },
];
const inkTiers = [
  { name: "text", cls: "text-default" },
  { name: "toned", cls: "text-(--ui-text-toned)" },
  { name: "muted", cls: "text-muted" },
  { name: "dimmed", cls: "text-dimmed" },
];

const selectItems = [
  { label: "資訊聯招", value: "cs" },
  { label: "電機甲組", value: "ee" },
  { label: "光電所", value: "photonics" },
];
const selectVal = ref("cs");
const menuVal = ref("cs");
const page = ref(2);

// Canonical button hierarchy (see utils/button-intents): callers pick an intent + size, never
// raw color/variant. This gallery is the visual source of truth for the migration.
const buttonIntents: ButtonIntent[] = ["primary", "secondary", "ghost", "danger", "link"];
const buttonSizes: ButtonSize[] = ["sm", "md", "lg"];
const iconEntries = Object.entries(icons) as [string, string][];
// Interactive selected-state demo (aria-pressed): 選中 = primary, 未選 = ghost.
const demoSel = ref<"列表" | "卡片" | "樹狀">("列表");
const badgeColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;
const alertColors = ["primary", "success", "warning", "error", "neutral"] as const;
const demoError = new Error("示範錯誤訊息");

// Live QueryState demo — the segmented control drives the four-state machine so the loading
// skeleton, ErrorState (with retry), empty copy, and data content can be eyeballed in place.
const demoStates = ["pending", "error", "empty", "data"] as const;
const demoState = ref<(typeof demoStates)[number]>("data");
</script>

<template>
  <!-- Two-band grid: Foundations (token layer) then Components (UI). Wide zones span both columns;
       compact zones pair two-across. Span order tiles gap-free without reordering, so the reading
       sequence stays system → UI. Bands are col-span-full hairline dividers. -->
  <div class="text-default grid grid-cols-1 gap-x-8 gap-y-section lg:grid-cols-2">
    <!-- ── Foundations · 系統層 ── colour + type tokens, paired to fill the width. -->
    <p class="col-span-full text-dimmed text-caption font-medium tracking-eyebrow uppercase">
      Foundations · 系統層
    </p>

    <!-- Colors — the palette (semantic.css tokens) as swatches. -->
    <section class="space-y-4">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Colors · 色票</h3>

      <div class="space-y-1.5">
        <p class="text-dimmed text-caption">Brand 品牌色（隨主題 · primary + secondary）</p>
        <div class="flex flex-wrap gap-3">
          <div v-for="r in brandSwatches" :key="r.name" class="space-y-1">
            <div class="size-14 rounded-card" :class="r.cls" />
            <p class="text-dimmed text-caption text-center">{{ r.name }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <p class="text-dimmed text-caption">Surfaces 紙面階（背景由淺到深，末為 inverted 墨底）</p>
        <div class="flex flex-wrap gap-3">
          <div v-for="s in surfaceSwatches" :key="s.name" class="space-y-1">
            <div class="border-default size-14 rounded-card border" :class="s.cls" />
            <p class="text-dimmed text-caption text-center">{{ s.name }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <p class="text-dimmed text-caption">Borders 邊框</p>
        <div class="flex flex-wrap gap-3">
          <div v-for="b in borderSwatches" :key="b.name" class="space-y-1">
            <div class="bg-default size-14 rounded-card border-2" :class="b.cls" />
            <p class="text-dimmed text-caption text-center">{{ b.name }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <p class="text-dimmed text-caption">
          Status 狀態燈號（螢光筆 · 固定，不隨主題）— marker 為填色/圖示；文字用 -ink 深階
        </p>
        <div class="flex flex-wrap gap-3">
          <div v-for="s in statusSwatches" :key="s.name" class="space-y-1">
            <div class="size-14 rounded-card" :class="s.cls" />
            <p class="text-caption text-center" :class="s.ink">{{ s.name }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Typography + Ink — text foundations grouped in the right cell; the left cell stays pure
         colour blocks. -->
    <section class="space-y-4">
      <div class="space-y-2">
        <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Typography</h3>
        <p class="font-serif text-title-lg tracking-tight">標題 title-lg · 明體</p>
        <p class="font-serif text-title-sm tracking-tight">標題 title-sm · 明體</p>
        <p class="text-body">內文 body · Inter，研究所備考資訊平台。</p>
        <p class="text-muted text-small">說明 small · 次要文字（墨階見下方 Ink）。</p>
        <p class="text-caption">caption · 最小級（eyebrow / 標註）。</p>
      </div>

      <div class="space-y-0.5">
        <p class="text-dimmed text-caption">Ink 墨階（文字強度，均須達 WCAG AA）</p>
        <p v-for="t in inkTiers" :key="t.name" class="text-body" :class="t.cls">
          {{ t.name }} · 研究所備考資訊平台 Aa 123
        </p>
      </div>
    </section>

    <!-- ── Components · UI 元件 ── built on the tokens above; wide zones span both columns. -->
    <p
      class="col-span-full border-t border-default pt-6 text-dimmed text-caption font-medium tracking-eyebrow uppercase"
    >
      Components · UI 元件
    </p>

    <!-- Buttons — AppButton intent × size; source of truth for the hierarchy. -->
    <section class="space-y-3 lg:col-span-2">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">
        Buttons · AppButton intents
      </h3>
      <!-- intents × states: default / disabled / loading side by side (spot faint states).
           hover · focus · active are interactive — hover / Tab / press each to check. -->
      <div v-for="intent in buttonIntents" :key="intent" class="flex flex-wrap items-center gap-2">
        <span class="text-dimmed text-caption w-20 shrink-0">{{ intent }}</span>
        <AppButton :intent="intent">default</AppButton>
        <AppButton :intent="intent" disabled>disabled</AppButton>
        <AppButton :intent="intent" loading>loading</AppButton>
      </div>
      <!-- size scale — orthogonal to intent, so shown once (on primary) -->
      <div class="flex flex-wrap items-center gap-2 pt-1">
        <span class="text-dimmed text-caption w-20 shrink-0">size</span>
        <AppButton v-for="s in buttonSizes" :key="s" :size="s">{{ s }}</AppButton>
        <span class="text-dimmed text-caption">hover · focus(Tab)· active 為互動態</span>
      </div>

      <!-- selected (aria-pressed): interactive toggle so the 選中 vs 未選 contrast is visible. -->
      <div class="flex flex-wrap items-center gap-2 pt-1">
        <span class="text-dimmed text-caption w-20 shrink-0">選取態</span>
        <AppButton
          v-for="opt in ['列表', '卡片', '樹狀'] as const"
          :key="opt"
          :intent="demoSel === opt ? 'primary' : 'ghost'"
          :aria-pressed="demoSel === opt"
          @click="demoSel = opt"
        >
          {{ opt }}
        </AppButton>
        <span class="text-dimmed text-caption">選中 = primary、未選 = ghost(點擊切換)</span>
      </div>

      <!-- leading / trailing icon -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-dimmed text-caption w-20 shrink-0">icon</span>
        <AppButton :icon="icons.search">leading</AppButton>
        <AppButton intent="ghost" :trailing-icon="icons.next">trailing</AppButton>
      </div>

      <!-- icon-only buttons (label → aria-label, required) -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-dimmed text-caption w-20 shrink-0">IconButton</span>
        <IconButton :icon="icons.menu" label="選單" />
        <IconButton :icon="icons.close" label="關閉" intent="secondary" />
        <IconButton :icon="icons.search" label="搜尋" intent="primary" />
      </div>

      <!-- App-owned focus ring (Tab to a link to see outline-primary). -->
      <a href="#" class="focus-ring text-primary text-small inline-block">app link · .focus-ring</a>
    </section>

    <!-- Icon registry — the semantic names app code references (utils/icons). -->
    <section class="space-y-3 lg:col-span-2">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">
        Icons · registry
      </h3>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="[name] in iconEntries"
          :key="name"
          class="border-default flex min-w-20 flex-col items-center gap-1 rounded-card border p-control"
        >
          <UIcon :name="icons[name as keyof typeof icons]" class="text-title-sm" />
          <span class="text-dimmed text-caption">{{ name }}</span>
        </div>
      </div>
    </section>

    <!-- Badges -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Badges</h3>
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge v-for="c in badgeColors" :key="c" :color="c" variant="subtle">{{ c }}</AppBadge>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge v-for="v in ['solid', 'soft', 'subtle', 'outline']" :key="v" :variant="v"
          >primary {{ v }}</AppBadge
        >
      </div>
    </section>

    <!-- Form controls -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Form controls</h3>
      <div class="flex flex-wrap items-end gap-control">
        <UInput placeholder="輸入關鍵字…" class="w-48" />
        <USelect v-model="selectVal" :items="selectItems" value-key="value" class="w-44" />
        <USelectMenu
          v-model="menuVal"
          :items="selectItems"
          value-key="value"
          class="w-44"
          placeholder="選擇系所"
        />
      </div>
      <UTextarea placeholder="多行輸入…" :rows="2" class="w-full max-w-md" />
    </section>

    <!-- Feedback -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Feedback</h3>
      <div class="space-y-2">
        <UAlert
          v-for="c in alertColors"
          :key="c"
          :color="c"
          variant="subtle"
          :title="`${c} alert`"
          description="說明文字，用來確認雙主題下的可讀性。"
        />
      </div>
      <ErrorState :error="demoError" />
      <EmptyState>沒有符合條件的項目。</EmptyState>
      <div class="space-y-2">
        <USkeleton class="h-4 w-2/3" />
        <USkeleton class="h-4 w-1/2" />
        <USkeleton class="h-24 w-full" />
      </div>
    </section>

    <!-- States (interactive) — drive the QueryState machine to see each branch + transition -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">
        States (QueryState)
      </h3>
      <div role="group" aria-label="切換示範狀態" class="flex flex-wrap gap-1">
        <button
          v-for="s in demoStates"
          :key="s"
          type="button"
          :aria-pressed="demoState === s"
          class="focus-ring rounded-md px-2.5 py-1 text-caption transition-colors"
          :class="
            demoState === s
              ? 'bg-primary text-inverted'
              : 'bg-elevated text-muted hover:text-default'
          "
          @click="demoState = s"
        >
          {{ s }}
        </button>
      </div>
      <QueryState
        :pending="demoState === 'pending'"
        :error="demoState === 'error' ? demoError : null"
        :empty="demoState === 'empty'"
        @retry="demoState = 'data'"
      >
        <template #loading>
          <div class="space-y-2">
            <USkeleton class="h-4 w-40" />
            <USkeleton class="h-4 w-24" />
          </div>
        </template>
        <template #empty>沒有符合條件的項目。</template>
        <div class="border-default text-small rounded-card border p-card">
          資料載入完成的內容範例。
        </div>
      </QueryState>
    </section>

    <!-- Surfaces -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Surfaces</h3>
      <!-- AppCard: 靜態面板。填色 --surface-card(亮 bg-accented / 暗 bg-muted)+ border-accented 銳邊,
           內文限 text/text-muted。 -->
      <AppCard>
        <p class="font-medium">AppCard · 靜態</p>
        <p class="text-muted text-small">扁平面板,靠色調層 + 1px 邊框,無陰影。</p>
      </AppCard>
      <!-- interactive: hover 銳化邊框(border-inverted),仍無陰影。 -->
      <AppCard interactive>
        <p class="font-medium">AppCard · interactive</p>
        <p class="text-muted text-small">hover 邊框轉為 inverted 墨線。</p>
      </AppCard>
      <!-- AppList + AppListRow: 容器透明 + hairline 分隔;列自帶 hover。 -->
      <AppList>
        <AppListRow v-for="n in 2" :key="n" interactive class="flex items-center">
          互動清單列 {{ n }} · hover 提亮
        </AppListRow>
      </AppList>
      <AppBoard :prose="false">
        <p>Board 黑板面 · board-ink 粉筆字（解題題幹用）</p>
      </AppBoard>
    </section>

    <!-- Navigation -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Navigation</h3>
      <div class="flex flex-wrap items-center gap-4">
        <UPagination v-model:page="page" :total="120" :items-per-page="20" />
        <ColorModeToggle />
      </div>
    </section>

    <!-- Prose (MDC content) — the @tailwindcss/typography mapping recoloured to --ui-* roles.
         Mirrors how question stems/choices/explanations render markdown. -->
    <section class="space-y-3 lg:col-span-2">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Prose (MDC)</h3>
      <div class="prose prose-sm max-w-none">
        <h4>標題範例</h4>
        <p>
          內文段落，含 <a href="#">連結</a>、<code>inline code</code> 與 <strong>粗體</strong>。
        </p>
        <ul>
          <li>清單項目一</li>
          <li>清單項目二</li>
        </ul>
        <blockquote>引用區塊範例。</blockquote>
      </div>
      <!-- Same prose on the blackboard surface → chalk text + chalk links (Board's .board.prose). -->
      <AppBoard size="sm">
        <p>黑板題幹：<a href="#">連結</a> 與 <code>code</code> 在粉筆色下的呈現。</p>
      </AppBoard>
    </section>
  </div>
</template>
