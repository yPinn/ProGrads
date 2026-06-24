<template>
  <UApp>
    <NuxtLayout>
      <!-- Route transition: subtle token-timed fade-up (CSS classes in main.css). -->
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </NuxtLayout>
  </UApp>
</template>
