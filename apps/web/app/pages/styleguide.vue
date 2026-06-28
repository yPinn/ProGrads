<script setup lang="ts">
import { backgroundRefetchToast } from "~/utils/query-toast";
// Dev-only component showcase: every common base component on the real Homer tokens, light and
// dark side by side. The page is forced to light (definePageMeta colorMode) so `:root` holds the
// light vars and the `.dark` wrapper column re-scopes them to dark — both themes without touching
// global mode or duplicating tokens. 404s in production (it ships inert but unreachable).
if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: "Not Found" });

definePageMeta({ colorMode: "light" });
useSeoMeta({ title: "Styleguide", robots: "noindex" });

// Toast is global (rendered by UApp), so trigger it once at page level rather than per theme
// column. Uses the real background-refetch policy so the demo matches what users actually see.
const toast = useToast();
function fireDemoToast() {
  const spec = backgroundRefetchToast({ state: { data: [1] } }, new Error("示範：背景更新失敗"));
  if (spec) toast.add(spec);
}
</script>

<template>
  <AppPage
    eyebrow="Internal · Dev only"
    title="Styleguide"
    description="基本組件在 light / dark 雙主題下的外觀複審基地。改 design/tokens.json 後跑 tokens:build，再回此頁目視確認。"
  >
    <template #actions>
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        @click="fireDemoToast"
      >
        觸發 toast
      </UButton>
    </template>

    <div class="grid gap-section lg:grid-cols-2 lg:items-start">
      <!-- Same gallery rendered per theme; the dark column gets `.dark`, which re-scopes the
           --ui-* tokens (semantic.css) for its subtree so both themes show side by side. -->
      <section
        v-for="theme in [
          { label: 'Light', dark: false },
          { label: 'Dark', dark: true },
        ]"
        :key="theme.label"
        class="border-default overflow-hidden rounded-card border"
        :class="{ dark: theme.dark }"
      >
        <h2
          class="border-default bg-elevated text-default border-b px-card py-2 text-small font-medium"
        >
          {{ theme.label }}
        </h2>
        <StyleguideGallery />
      </section>
    </div>
  </AppPage>
</template>
