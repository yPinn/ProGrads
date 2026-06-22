<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAdmissions } from "~/composables/useAdmissions";
import { useSchools } from "~/composables/useSchools";
import { useDepartments } from "~/composables/useDepartments";
import { ADMISSION_TYPE_LABELS, ADMISSION_METHOD_LABELS } from "~/utils/admission-labels";
import { formatDateTime } from "~/utils/format";
import { toSelectItems } from "~/utils/select";
import type { AdmissionRound } from "@prograds/shared";

useSeoMeta({
  title: "報名情報",
  description: "各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。",
});

// Department-centric flow: school → dept is the primary axis; year is a slot on the
// loaded result (client-side tab), since /admissions returns every year for a dept.
const school = ref<string | undefined>();
const dept = ref<string | undefined>();
const selectedYear = ref<number | "all">("all");

// School list (near-static) + departments of the selected school (cascading).
// isLoading (not isPending): a disabled query is "pending" but idle — selects shouldn't spin.
const { data: schools, isLoading: schoolsLoading } = useSchools();
const { data: depts, isLoading: deptsLoading } = useDepartments(school);
const schoolItems = computed(() => toSelectItems(schools.value));
const deptItems = computed(() => toSelectItems(depts.value));
const schoolName = computed(() => schoolItems.value.find((s) => s.value === school.value)?.label);
const deptName = computed(() => deptItems.value.find((d) => d.value === dept.value)?.label);

// Changing school clears dept; changing dept resets the year tab to "all".
watch(school, () => {
  dept.value = undefined;
});
watch(dept, () => {
  selectedYear.value = "all";
});

// useAdmissions stays disabled until both school + dept are set (no year param —
// it returns all years, which we filter client-side via the year tabs).
const query = computed(() => ({ school: school.value ?? "", dept: dept.value ?? "" }));
const { data, isLoading, isError, error, refetch } = useAdmissions(query);

// Year tabs from the loaded groups' rounds, newest first (drives the client-side filter).
const yearTabs = computed(() => {
  const set = new Set<number>();
  for (const g of data.value ?? []) for (const r of g.rounds) set.add(r.year);
  return [
    { label: "全部", value: "all" as const },
    ...[...set].sort((a, b) => b - a).map((y) => ({ label: String(y), value: y })),
  ];
});

// Groups with rounds narrowed to the selected year (immutably); drop emptied groups.
const visibleGroups = computed(() => {
  const groups = data.value ?? [];
  if (selectedYear.value === "all") return groups;
  return groups
    .map((g) => ({ ...g, rounds: g.rounds.filter((r) => r.year === selectedYear.value) }))
    .filter((g) => g.rounds.length > 0);
});

// 錄取率 = 錄取 / 報名.
const ratio = (r: AdmissionRound) =>
  r.applicants && r.admitted ? `${((r.admitted / r.applicants) * 100).toFixed(1)}%` : "—";
</script>

<template>
  <UContainer class="py-12 md:py-16">
    <PageHeader
      eyebrow="Admissions · 報名情報"
      title="報名情報"
      description="各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。"
    />

    <div
      class="border-default mb-8 flex flex-wrap items-end gap-3 rounded-(--ui-radius) border p-4"
    >
      <USelectMenu
        v-model="school"
        :items="schoolItems"
        value-key="value"
        :loading="schoolsLoading"
        aria-label="學校"
        placeholder="選擇學校"
        class="w-56"
      />
      <USelectMenu
        v-model="dept"
        :items="deptItems"
        value-key="value"
        :disabled="!school"
        :loading="deptsLoading"
        aria-label="系所"
        placeholder="選擇系所"
        class="w-64"
      />
    </div>

    <!-- State A: no school chosen yet. -->
    <EmptyState v-if="!school">選擇學校開始瀏覽。</EmptyState>

    <!-- State B: school chosen, browsing its departments. -->
    <section v-else-if="!dept">
      <h2 class="font-serif mb-3 text-lg tracking-tight">{{ schoolName }} · 系所</h2>

      <div
        v-if="deptsLoading"
        class="border-default divide-default divide-y rounded-(--ui-radius) border"
      >
        <USkeleton v-for="n in 6" :key="n" class="mx-5 my-4 h-5 w-48" />
      </div>

      <EmptyState v-else-if="!deptItems.length">該校尚無系所資料。</EmptyState>

      <ul v-else class="border-default divide-default divide-y rounded-(--ui-radius) border">
        <li v-for="d in deptItems" :key="d.value">
          <button
            type="button"
            class="hover:bg-elevated/50 flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
            @click="dept = d.value"
          >
            <span>{{ d.label }}</span>
            <span class="text-muted">→</span>
          </button>
        </li>
      </ul>
    </section>

    <!-- State C: dept chosen — admissions with a year tab slot. -->
    <template v-else>
      <header class="mb-5">
        <h2 class="font-serif text-xl tracking-tight">{{ deptName }}</h2>
        <p class="text-muted text-sm">{{ schoolName }}</p>
      </header>

      <div v-if="isLoading" class="space-y-3">
        <USkeleton v-for="n in 3" :key="n" class="h-24 w-full" />
      </div>

      <ErrorState v-else-if="isError" :error="error" @retry="refetch" />

      <EmptyState v-else-if="!data || data.length === 0">查無此校系的招生資料。</EmptyState>

      <template v-else>
        <!-- Year slot: client-side filter over the already-loaded rounds. -->
        <div class="border-default mb-6 flex flex-wrap gap-1 border-b">
          <button
            v-for="t in yearTabs"
            :key="t.value"
            type="button"
            class="-mb-px border-b-2 px-3 py-2 text-sm tabular-nums transition-colors"
            :class="
              selectedYear === t.value
                ? 'border-primary text-default'
                : 'border-transparent text-muted hover:text-default'
            "
            @click="selectedYear = t.value"
          >
            {{ t.label }}
          </button>
        </div>

        <section v-for="g in visibleGroups" :key="g.id" class="mb-10">
          <h3 class="font-serif mb-3 text-lg tracking-tight">
            {{ g.name || "不分組" }}<span v-if="g.code" class="text-muted"> · {{ g.code }} 組</span>
          </h3>

          <div
            v-for="r in g.rounds"
            :key="`${r.year}-${r.admissionType}`"
            class="border-default mt-3 rounded-(--ui-radius) border p-5"
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
      </template>
    </template>
  </UContainer>
</template>
