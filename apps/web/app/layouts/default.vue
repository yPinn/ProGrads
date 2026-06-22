<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-default sticky top-0 z-10 border-b bg-default/80 backdrop-blur">
      <UContainer class="flex h-16 items-center gap-8">
        <NuxtLink to="/" class="font-serif text-lg tracking-tight">ProGrads</NuxtLink>
        <nav class="text-muted flex gap-6 text-sm">
          <NuxtLink to="/questions" class="hover:text-default transition-colors">考古題庫</NuxtLink>
          <NuxtLink to="/admissions" class="hover:text-default transition-colors"
            >報名情報</NuxtLink
          >
          <NuxtLink to="/schedules" class="hover:text-default transition-colors"
            >招生行事曆</NuxtLink
          >
        </nav>
      </UContainer>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-default text-muted mt-16 border-t">
      <UContainer class="flex h-16 items-center text-sm tracking-wide">
        © {{ new Date().getFullYear() }} ProGrads · 研究所備考資訊平台
      </UContainer>
    </footer>
  </div>
</template>
