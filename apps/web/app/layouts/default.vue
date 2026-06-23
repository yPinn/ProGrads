<template>
  <div class="flex min-h-dvh flex-col">
    <header class="border-default sticky top-0 z-10 border-b bg-default/80 backdrop-blur">
      <UContainer class="flex h-16 items-center gap-8">
        <NuxtLink
          to="/"
          class="focus-ring inline-flex min-h-touch items-center font-serif text-title-sm tracking-tight"
          >ProGrads</NuxtLink
        >
        <nav class="text-muted text-small flex gap-6">
          <NuxtLink
            to="/admissions"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >報名資訊</NuxtLink
          >
          <NuxtLink
            to="/questions"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >考古題</NuxtLink
          >
          <NuxtLink
            to="/schedules"
            class="focus-ring hover:text-default inline-flex min-h-touch items-center transition-colors"
            >招生日程</NuxtLink
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
      <UContainer class="text-small flex h-16 items-center tracking-wide">
        © {{ new Date().getFullYear() }} ProGrads · 研究所備考資訊平台
      </UContainer>
    </footer>
  </div>
</template>
