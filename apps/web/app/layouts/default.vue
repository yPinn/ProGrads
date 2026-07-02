<script setup lang="ts">
// Dev-only tooling links (styleguide, etc.) surface in the footer's right slot; these pages
// 404 in production, so the links are gated to dev to avoid dead nav in the shipped build.
const isDev = import.meta.dev;
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="border-default sticky top-0 z-10 border-b bg-default/80 backdrop-blur">
      <UContainer class="flex h-16 items-center gap-8">
        <NuxtLink
          to="/"
          class="focus-ring inline-flex min-h-touch items-center gap-2 font-serif text-title-sm tracking-tight"
        >
          <!-- Decorative: the adjacent wordmark already names the site (alt=""). -->
          <img src="/logo.svg" alt="" width="28" height="28" class="size-7" />
          ProGrads
        </NuxtLink>
        <!-- Order by candidate usage frequency: 考古題 (daily driver) leads; 報名資訊 sits beside it
             (its 採計考科 deep-links into the question bank); 招生日程 (deadline-critical) follows;
             師資陣容 (research/甄試-oriented, lowest frequency) trails. -->
        <nav aria-label="主要導覽" class="text-muted text-small flex gap-6">
          <NuxtLink
            to="/questions"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >考古題</NuxtLink
          >
          <NuxtLink
            to="/admissions"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >報名資訊</NuxtLink
          >
          <NuxtLink
            to="/schedules"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >招生日程</NuxtLink
          >
          <NuxtLink
            to="/faculty"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >師資陣容</NuxtLink
          >
        </nav>
        <!-- ClientOnly + fixed-size fallback: colour mode is only known on the client, so this
             avoids a hydration mismatch / layout shift on the prerendered home page. -->
        <ClientOnly>
          <UColorModeButton class="ml-auto" />
          <template #fallback>
            <div class="ml-auto size-8" />
          </template>
        </ClientOnly>
      </UContainer>
    </header>

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
