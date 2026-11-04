<script setup lang="ts">
defineProps<{
  title: string;
  items: { label: string; value: string }[];
  pending?: boolean;
  failed?: boolean;
  emptyText: string;
}>();

const emit = defineEmits<{ select: [value: string]; retry: [] }>();
</script>

<template>
  <section
    class="border-default grid gap-5 border-y py-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
  >
    <h2 class="font-serif text-title-md self-center">{{ title }}</h2>
    <div class="self-center">
      <p v-if="pending" role="status" class="text-muted text-small">正在載入可瀏覽的項目…</p>
      <div v-else-if="failed" class="flex flex-wrap items-center gap-3">
        <p role="status" class="text-muted text-small">暫時無法載入瀏覽選項。</p>
        <AppButton intent="secondary" size="sm" @click="emit('retry')">重新載入</AppButton>
      </div>
      <ul v-else-if="items.length" class="flex flex-wrap gap-2" aria-label="快速選擇">
        <li v-for="item in items.slice(0, 6)" :key="item.value">
          <AppButton
            intent="secondary"
            size="sm"
            class="min-h-touch"
            @click="emit('select', item.value)"
          >
            {{ item.label }}
          </AppButton>
        </li>
      </ul>
      <p v-else class="text-muted text-small">{{ emptyText }}</p>
    </div>
  </section>
</template>
