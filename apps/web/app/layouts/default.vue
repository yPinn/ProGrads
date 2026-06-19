<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-default border-b">
      <UContainer class="flex h-14 items-center gap-6">
        <NuxtLink to="/" class="font-semibold">ProGrads</NuxtLink>
        <nav class="text-muted flex gap-4 text-sm">
          <NuxtLink to="/questions" class="hover:text-default">考古題庫</NuxtLink>
          <NuxtLink to="/admissions" class="hover:text-default">報名情報</NuxtLink>
          <NuxtLink to="/schedules" class="hover:text-default">招生行事曆</NuxtLink>
        </nav>
      </UContainer>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-default text-muted border-t">
      <UContainer class="flex h-14 items-center text-sm">
        © {{ new Date().getFullYear() }} ProGrads
      </UContainer>
    </footer>
  </div>
</template>
