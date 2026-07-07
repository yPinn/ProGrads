<script setup lang="ts">
import { icons } from "~/utils/icons";

// Dev-only tooling links (styleguide, etc.) surface in the footer's right slot; these pages
// 404 in production, so the links are gated to dev to avoid dead nav in the shipped build.
const isDev = import.meta.dev;

// Single source of truth for the primary nav, shared by the desktop bar and the mobile slideover
// so the two never drift. Order by candidate usage frequency: 考古題 (daily driver) leads; 報名資訊
// sits beside it (its 採計考科 deep-links into the question bank); 招生日程 (deadline-critical)
// follows; 師資陣容 (research/甄試-oriented, lowest frequency) trails.
const navLinks = [
  { to: "/questions", label: "考古題" },
  { to: "/admissions", label: "報名資訊" },
  { to: "/schedules", label: "招生日程" },
  { to: "/faculty", label: "師資陣容" },
] as const;

// The desktop nav overflows the h-16 bar on phones, so below md it collapses into a slideover.
const mobileNavOpen = ref(false);
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <GlobalFetchingBar />
    <header class="border-default sticky top-0 z-10 border-b bg-default/80 backdrop-blur">
      <UContainer class="flex h-nav items-center gap-8">
        <NuxtLink
          to="/"
          class="focus-ring inline-flex min-h-touch items-center gap-2 font-serif text-title-sm tracking-tight"
        >
          <!-- Decorative: the adjacent wordmark already names the site (alt=""). -->
          <img src="/logo.svg" alt="" width="28" height="28" class="size-7" />
          ProGrads
        </NuxtLink>
        <nav aria-label="主要導覽" class="text-muted text-small hidden gap-6 md:flex">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >{{ link.label }}</NuxtLink
          >
        </nav>
        <!-- ClientOnly + fixed-size fallback: colour mode is only known on the client, so this
             avoids a hydration mismatch / layout shift on the prerendered home page. -->
        <ClientOnly>
          <ColorModeToggle class="ml-auto" />
          <template #fallback>
            <div class="ml-auto size-touch" />
          </template>
        </ClientOnly>
        <!-- Mobile-only trigger; the desktop nav above covers md and up. -->
        <IconButton
          :icon="icons.menu"
          label="開啟主要導覽選單"
          class="md:hidden"
          @click="mobileNavOpen = true"
        />
      </UContainer>
    </header>

    <USlideover v-model:open="mobileNavOpen" title="主要導覽" side="left">
      <template #body>
        <nav aria-label="主要導覽" class="flex flex-col">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="focus-ring text-muted hover:text-default inline-flex min-h-touch items-center border-b border-default text-body transition-colors"
            @click="mobileNavOpen = false"
            >{{ link.label }}</NuxtLink
          >
        </nav>
      </template>
    </USlideover>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-default text-muted mt-16 border-t">
      <UContainer class="text-small flex h-16 items-center justify-between gap-4 tracking-wide">
        <span>© {{ new Date().getFullYear() }} ProGrads · 研究所備考資訊平台</span>
        <nav v-if="isDev" aria-label="開發工具" class="flex gap-4">
          <NuxtLink
            to="/styleguide"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >Styleguide</NuxtLink
          >
        </nav>
      </UContainer>
    </footer>
  </div>
</template>
