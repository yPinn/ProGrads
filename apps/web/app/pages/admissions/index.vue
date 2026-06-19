<script setup lang="ts">
import { ref, computed } from "vue";
import { useAdmissions } from "~/composables/useAdmissions";
import { ADMISSION_TYPE_LABELS, ADMISSION_METHOD_LABELS } from "~/utils/admission-labels";
import { formatDateTime } from "~/utils/format";
import type { AdmissionRound } from "@prograds/shared";

useSeoMeta({
  title: "報名情報",
  description: "各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。",
});

// Inputs are committed on search so we don't fetch on every keystroke.
const schoolInput = ref("");
const deptInput = ref("");
const yearInput = ref<number | "">("");
const committed = ref({ school: "", dept: "", year: undefined as number | undefined });

const search = () => {
  committed.value = {
    school: schoolInput.value.trim(),
    dept: deptInput.value.trim(),
    year: yearInput.value === "" ? undefined : yearInput.value,
  };
};

const searched = computed(() => !!committed.value.school && !!committed.value.dept);
const { data, isLoading, isError, error, refetch } = useAdmissions(committed);

// 錄取率 = 錄取 / 報名.
const ratio = (r: AdmissionRound) =>
  r.applicants && r.admitted ? `${((r.admitted / r.applicants) * 100).toFixed(1)}%` : "—";
</script>

<template>
  <UContainer class="py-10">
    <h1 class="mb-6 text-2xl font-bold">報名情報</h1>

    <form class="mb-6 flex flex-wrap items-end gap-3" @submit.prevent="search">
      <UInput
        v-model="schoolInput"
        aria-label="學校 slug"
        placeholder="學校 slug,如 ntu"
        class="w-44"
      />
      <UInput
        v-model="deptInput"
        aria-label="系所 slug"
        placeholder="系所 slug,如 csie"
        class="w-44"
      />
      <UInput
        v-model.number="yearInput"
        type="number"
        aria-label="年度"
        placeholder="年度(選填)"
        class="w-32"
      />
      <UButton type="submit">查詢</UButton>
    </form>

    <p v-if="!searched" class="text-muted py-16 text-center">輸入學校與系所 slug 後查詢。</p>

    <div v-else-if="isLoading" class="space-y-3">
      <USkeleton v-for="n in 3" :key="n" class="h-24 w-full" />
    </div>

    <ErrorState v-else-if="isError" :error="error" @retry="refetch" />

    <p v-else-if="!data || data.length === 0" class="text-muted py-16 text-center">
      查無此校系的招生資料。
    </p>

    <section v-for="g in data" v-else :key="g.id" class="mb-8">
      <h2 class="mb-2 font-semibold">
        {{ g.name || "不分組" }}<span v-if="g.code"> · {{ g.code }} 組</span>
      </h2>

      <div
        v-for="r in g.rounds"
        :key="`${r.year}-${r.admissionType}`"
        class="border-default mt-3 rounded border p-4"
      >
        <div class="font-medium">
          {{ r.year }} 學年 · {{ ADMISSION_TYPE_LABELS[r.admissionType] }}
          <span v-if="r.admissionCode" class="text-muted">· 代碼 {{ r.admissionCode }}</span>
          <span v-if="r.applicantType" class="text-muted">· {{ r.applicantType }}</span>
        </div>

        <div class="mt-1 text-sm">
          名額 {{ r.quota ?? "—" }} · 報名 {{ r.applicants ?? "—" }} · 錄取
          {{ r.admitted ?? "—" }} · 錄取率 {{ ratio(r) }}
        </div>

        <div class="text-muted mt-1 text-sm">
          採計:{{ r.methods.map((m) => ADMISSION_METHOD_LABELS[m]).join("、") || "—" }}
          <span v-if="r.calculator !== null">· 計算機 {{ r.calculator ? "可" : "不可" }}</span>
          <span v-if="r.writtenWeight !== null">· 筆試 {{ r.writtenWeight }}%</span>
          <span v-if="r.interviewWeight !== null">· 面試 {{ r.interviewWeight }}%</span>
          <span v-if="r.interviewAt">· 面試 {{ formatDateTime(r.interviewAt) }}</span>
        </div>

        <ul v-if="r.papers.length" class="mt-2 text-sm">
          <li v-for="(p, i) in r.papers" :key="i">
            {{ p.name }}<span v-if="p.weight !== null"> ({{ p.weight }}%)</span>
            <span v-if="p.subjects.length" class="text-muted">
              — {{ p.subjects.map((s) => s.name).join("、") }}</span
            >
          </li>
        </ul>

        <p v-if="r.tiebreak.length" class="text-muted mt-1 text-sm">
          同分參酌:{{ r.tiebreak.join("、") }}
        </p>

        <a
          v-if="r.sourceUrl"
          :href="r.sourceUrl"
          target="_blank"
          rel="noopener"
          class="text-primary mt-1 inline-block text-sm"
        >
          簡章連結
        </a>
      </div>
    </section>
  </UContainer>
</template>
