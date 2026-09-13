<script setup lang="ts">
import { icons } from "~/utils/icons";

useSeoMeta({ title: "DMCA / 內容通知 — ProGrads" });
</script>

<template>
  <UContainer class="py-page">
    <div class="mx-auto max-w-reading">
      <PageHeader
        eyebrow="法律資訊"
        title="DMCA / 內容通知"
        description="收錄範圍、AI 解析定位，以及如何回報內容爭議或要求取下。"
      />

      <div class="prose prose-sm max-w-none space-y-6">
        <AppCard as="section">
          <h2 class="font-serif text-title-sm tracking-tight">收錄範圍</h2>
          <p class="text-default mt-2">
            ProGrads 僅收錄<strong>官方已公開</strong>的考古題:政府公文性質的國家考試可完整收錄;
            學校官方公開的考題依各校條款附上來源連結。附上來源連結不等於取得重製授權——我們不會
            完整照搬單一校系的大量考題,價值放在標準解答與知識點解析(原創內容)上。
          </p>
        </AppCard>

        <AppCard as="section">
          <h2 class="font-serif text-title-sm tracking-tight">AI 生成解析,僅供參考</h2>
          <p class="text-default mt-2">
            站上每一則標準解析皆由 AI 生成,可能不完全準確,僅供參考,不能取代課堂學習或教師指導。
            解析旁的標籤(AI 生成 / AI 已複查 / 人工驗證 / 已標記)反映目前的審閱狀態。
          </p>
        </AppCard>

        <AppCard as="section">
          <h2 class="font-serif text-title-sm tracking-tight">非營利定位</h2>
          <p class="text-default mt-2">
            本站純非營利:不收費、不放廣告。營運成本由 AI
            離線預生成與快取壓低,伺服器成本另以捐贈支應,非以廣告或會員費營利。
          </p>
        </AppCard>

        <AppCard as="section">
          <h2 class="font-serif text-title-sm tracking-tight">回報錯誤或要求取下</h2>
          <p class="text-default mt-2">
            若你發現某一題的內容有誤、AI 解析錯誤,可直接在該題頁面點擊「回報此題錯誤」。
          </p>
          <p class="text-default mt-2">
            若你是內容權利人,認為站上某份考題不應公開收錄、來源標示有誤,或有其他著作權爭議, 請透過
            GitHub Issues 與我們聯絡,並在標題註明「DMCA / 內容爭議」,附上具體題目或考卷連結。
            我們會儘速處理下架或更正。
          </p>
          <AppButton
            to="https://github.com/yPinn/ProGrads/issues/new?title=DMCA%20%2F%20%E5%85%A7%E5%AE%B9%E7%88%AD%E8%AD%B0"
            target="_blank"
            rel="noopener noreferrer"
            intent="primary"
            :trailing-icon="icons.externalLink"
            class="mt-4 not-prose"
          >
            前往 GitHub Issues 提出通知
          </AppButton>
        </AppCard>
      </div>
    </div>
  </UContainer>
</template>
