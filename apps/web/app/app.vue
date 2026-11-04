<script setup lang="ts">
const site = useSiteConfig();
const shareImage = () => new URL("/prograds-og.png", site.url).href;
const shareImageAlt = "ProGrads 研究所備考作戰中心，提供考古題、報名資訊、招生日程與師資陣容。";

useSeoMeta({
  ogImage: shareImage,
  ogImageType: "image/png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: shareImageAlt,
  twitterCard: "summary_large_image",
  twitterImage: shareImage,
  twitterImageAlt: shareImageAlt,
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <!-- Route transition: subtle token-timed fade-up (CSS classes in main.css). -->
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </NuxtLayout>
  </UApp>
</template>
