<script setup lang="ts">
import { backgroundRefetchToast } from "~/utils/query-toast";
import { icons } from "~/utils/icons";

// Dev-only component + colour-token showcase. Follows the real global colour mode (nav theme
// switch) — flip it to review light / dark. 404s in production (ships inert but unreachable).
if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: "Not Found" });

useSeoMeta({ title: "Styleguide", robots: "noindex" });

// Toast is global (rendered by UApp); trigger the real background-refetch policy so the demo
// matches what users actually see.
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
    description="組件與色票的複審基地。用右上主題切換檢視 light / dark；改 design/tokens.json 後跑 tokens:build 再回此頁目視確認。"
  >
    <template #actions>
      <AppButton :icon="icons.warning" @click="fireDemoToast">觸發 toast</AppButton>
    </template>

    <StyleguideGallery />
  </AppPage>
</template>
