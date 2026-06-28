<script setup lang="ts">
// Base-component gallery for the /styleguide route. Theme-agnostic: it renders the common
// Nuxt UI + app-owned components once; the page renders it twice (light column + a `.dark`
// wrapper) so every component can be eyeballed in both themes side by side. No theme logic
// lives here — the surrounding `.dark` class re-scopes the --ui-* tokens via the cascade.
import { ref } from "vue";

const selectItems = [
  { label: "資訊聯招", value: "cs" },
  { label: "電機甲組", value: "ee" },
  { label: "光電所", value: "photonics" },
];
const selectVal = ref("cs");
const menuVal = ref("cs");
const page = ref(2);

const buttonVariants = ["solid", "outline", "soft", "subtle", "ghost", "link"] as const;
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
  <div class="bg-default text-default space-y-section p-card">
    <!-- Buttons -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Buttons</h3>
      <div class="flex flex-wrap items-center gap-2">
        <UButton v-for="v in buttonVariants" :key="v" :variant="v">{{ v }}</UButton>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton color="neutral" variant="ghost">ghost</UButton>
        <UButton color="neutral" variant="subtle">neutral</UButton>
        <UButton disabled>disabled</UButton>
        <UButton loading>loading</UButton>
        <UButton icon="i-lucide-search" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton v-for="s in ['xs', 'sm', 'md', 'lg', 'xl']" :key="s" :size="s">{{ s }}</UButton>
      </div>
      <!-- App-owned focus ring (Tab to a link to see outline-primary). -->
      <a href="#" class="focus-ring text-primary text-small inline-block">app link · .focus-ring</a>
      <p class="text-dimmed text-caption">hover 上方按鈕、Tab 聚焦此連結即見互動態。</p>
    </section>

    <!-- Badges -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Badges</h3>
      <div class="flex flex-wrap items-center gap-2">
        <UBadge v-for="c in badgeColors" :key="c" :color="c" variant="subtle">{{ c }}</UBadge>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UBadge v-for="v in ['solid', 'soft', 'subtle', 'outline']" :key="v" :variant="v"
          >primary {{ v }}</UBadge
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

    <!-- Navigation -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Navigation</h3>
      <div class="flex flex-wrap items-center gap-4">
        <UPagination v-model:page="page" :total="120" :items-per-page="20" />
        <UColorModeButton />
      </div>
    </section>

    <!-- Surfaces -->
    <section class="space-y-3">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Surfaces</h3>
      <div class="bg-elevated text-default rounded-card p-card">
        <p class="font-medium">Card · bg-elevated</p>
        <p class="text-muted text-small">扁平面板，靠色調層 + 1px 邊框，無陰影。</p>
      </div>
      <ul class="border-default divide-default divide-y rounded-card border">
        <li
          v-for="n in 2"
          :key="n"
          class="hover:bg-elevated/50 flex min-h-touch items-center px-5 py-3 transition-colors"
        >
          互動清單列 {{ n }} · hover 提亮
        </li>
      </ul>
      <div class="board font-serif rounded-card p-card">
        <p>Board 黑板面 · board-ink 粉筆字（解題題幹用）</p>
      </div>
    </section>

    <!-- Typography -->
    <section class="space-y-2">
      <h3 class="text-muted text-caption font-medium tracking-eyebrow uppercase">Typography</h3>
      <p class="font-serif text-title-lg tracking-tight">標題 title-lg · 明體</p>
      <p class="font-serif text-title-sm tracking-tight">標題 title-sm · 明體</p>
      <p class="text-body">內文 body · Inter，研究所備考資訊平台。</p>
      <p class="text-muted text-small">small muted · 次要說明文字。</p>
      <p class="text-dimmed text-small">small dimmed · 最低強度（已調至 ~3.2:1）。</p>
    </section>

    <!-- Prose (MDC content) — the @tailwindcss/typography mapping recoloured to --ui-* roles.
         Mirrors how question stems/choices/explanations render markdown. -->
    <section class="space-y-3">
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
      <!-- Same prose on the blackboard surface → chalk text + chalk links (.board.prose). -->
      <div class="board font-serif prose prose-sm max-w-none rounded-card p-card">
        <p>黑板題幹：<a href="#">連結</a> 與 <code>code</code> 在粉筆色下的呈現。</p>
      </div>
    </section>
  </div>
</template>
