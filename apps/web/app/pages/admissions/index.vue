<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { AdmissionType } from "@prograds/shared";
import { useAdmissions } from "~/composables/useAdmissions";
import { useSchools } from "~/composables/useSchools";
import { useDepartments } from "~/composables/useDepartments";
import { useQuestionFacets } from "~/composables/useQuestionFacets";
import { ADMISSION_TYPE_LABELS, ADMISSION_METHOD_LABELS } from "~/utils/admission-labels";
import { brochureUrl } from "~/utils/admission-brochure";
import { admitRate } from "~/utils/admit-rate";
import { seasonLine } from "~/utils/admission-season";
import { papersByTiebreak } from "~/utils/papers-by-tiebreak";
import { icons } from "~/utils/icons";
import { formatDateTime } from "~/utils/format";
import { toSelectItems } from "~/utils/select";

useSeoMeta({
  title: "報名資訊",
  description: "各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。",
});

// Department-centric flow: school → dept is the primary axis; year is a slot on the
// loaded result (client-side tab), since /admissions returns every year for a dept.
const school = ref<string | undefined>();
const dept = ref<string | undefined>();
const selectedYear = ref<number | "all">("all");
const selectedAdmissionType = ref<AdmissionType | "all">("all");

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
  selectedAdmissionType.value = "all";
});

// useAdmissions stays disabled until both school + dept are set (no year param —
// it returns all years, which we filter client-side via the year tabs).
const query = computed(() => ({ school: school.value ?? "", dept: dept.value ?? "" }));
const { data, isLoading, isError, error, refetch } = useAdmissions(query);

// Pending until we have data or an error — covers the frame between enabling the query (dept
// picked) and vue-query flipping fetchStatus, where isLoading is briefly false with data still
// undefined and <QueryState> would flash empty instead of the skeleton. Always enabled in State C.
const pending = computed(() => isLoading.value || (!data.value && !isError.value));

// Year tabs from the loaded groups' rounds, newest first (drives the client-side filter).
const yearTabs = computed(() => {
  const set = new Set<number>();
  for (const g of data.value ?? []) for (const r of g.rounds) set.add(r.year);
  return [
    { label: "全部", value: "all" as const },
    ...[...set].sort((a, b) => b - a).map((y) => ({ label: String(y), value: y })),
  ];
});

// Admission-type tabs from the loaded groups' rounds — only the types actually present (not
// all 3 enum values), in the fixed exam→recommended→in_service order (ADMISSION_TYPE_LABELS'
// key order). Hidden in the template unless there's more than one real type to choose between.
const admissionTypeTabs = computed(() => {
  const present = new Set<AdmissionType>();
  for (const g of data.value ?? []) for (const r of g.rounds) present.add(r.admissionType);
  const order = Object.keys(ADMISSION_TYPE_LABELS) as AdmissionType[];
  return [
    { label: "全部", value: "all" as const },
    ...order
      .filter((t) => present.has(t))
      .map((t) => ({ label: ADMISSION_TYPE_LABELS[t], value: t })),
  ];
});

// Drives the filter icon's active-state dot + accessible label — the popover panel itself
// carries no visible trace once closed, so this is the only cue a filter is applied.
const hasActiveFilter = computed(
  () => selectedYear.value !== "all" || selectedAdmissionType.value !== "all",
);
const filterButtonLabel = computed(() =>
  hasActiveFilter.value ? "篩選招生資料(已套用篩選)" : "篩選招生資料",
);

// One labeled toggle-group per facet (year / admission type), rendered as a single v-for in the
// popover instead of a copy-pasted block per facet — adding a facet (e.g. applicant_type, once
// its data is normalized — see tasks/todo.md) is one array entry, not a new template block.
// Hidden once a facet has nothing to choose between (just "全部" + one real option).
interface Facet {
  key: string;
  title: string;
  ariaLabel: string;
  tabularNums?: boolean;
  tabs: { label: string; value: string | number }[];
  selected: string | number;
  onSelect: (value: string | number) => void;
}

const filterFacets = computed<Facet[]>(() =>
  [
    {
      key: "year",
      title: "年度",
      ariaLabel: "篩選年度",
      tabularNums: true,
      tabs: yearTabs.value,
      selected: selectedYear.value,
      onSelect: (v: string | number) => (selectedYear.value = v as number | "all"),
    },
    {
      key: "admissionType",
      title: "管道",
      ariaLabel: "篩選管道",
      tabs: admissionTypeTabs.value,
      selected: selectedAdmissionType.value,
      onSelect: (v: string | number) => (selectedAdmissionType.value = v as AdmissionType | "all"),
    },
  ].filter((f) => f.tabs.length > 2),
);
const hasAnyFacet = computed(() => filterFacets.value.length > 0);

// Groups with rounds narrowed to the selected year + admission type (immutably); drop emptied groups.
const visibleGroups = computed(() => {
  const groups = data.value ?? [];
  if (selectedYear.value === "all" && selectedAdmissionType.value === "all") return groups;
  return groups
    .map((g) => ({
      ...g,
      rounds: g.rounds.filter(
        (r) =>
          (selectedYear.value === "all" || r.year === selectedYear.value) &&
          (selectedAdmissionType.value === "all" ||
            r.admissionType === selectedAdmissionType.value),
      ),
    }))
    .filter((g) => g.rounds.length > 0);
});

// Subjects that actually have question content, for gating the "practice" badges below each
// paper — avoids linking to /questions for a subject that would land on an empty results page.
const { data: facets } = useQuestionFacets();
const practicableSlugs = computed(() => new Set((facets.value?.subjects ?? []).map((s) => s.slug)));

// Honour OS reduce-motion for the JS-driven stagger (CSS guard can't reach it).
const prefersReducedMotion = useReducedMotion();
</script>

<template>
  <AppPage
    eyebrow="Admissions · 報名資訊"
    title="報名資訊"
    description="各校系所招生組別:名額、報名/錄取人數、採計考科與佔分、面試與簡章。"
  >
    <AppCard class="mb-section flex flex-wrap items-end gap-control">
      <USelectMenu
        v-model="school"
        :items="schoolItems"
        value-key="value"
        :loading="schoolsLoading"
        aria-label="學校"
        placeholder="選擇學校"
        class="w-full sm:w-56"
      />
      <USelectMenu
        v-model="dept"
        :items="deptItems"
        value-key="value"
        :disabled="!school"
        :loading="deptsLoading"
        aria-label="系所"
        placeholder="選擇系所"
        class="w-full sm:w-64"
      />
    </AppCard>

    <!-- State A: no school chosen yet. -->
    <EmptyState v-if="!school">選擇學校開始瀏覽各系所招生組別。</EmptyState>

    <!-- State B: school chosen, browsing its departments. -->
    <section v-else-if="!dept">
      <h2 class="font-serif text-title-sm mb-3 tracking-tight">{{ schoolName }} · 系所</h2>

      <AppList v-if="deptsLoading" as="div">
        <USkeleton v-for="n in 6" :key="n" class="mx-5 my-4 h-5 w-48" />
      </AppList>

      <EmptyState v-else-if="!deptItems.length">該校尚無系所資料。</EmptyState>

      <AppList v-else>
        <li
          v-for="(d, di) in deptItems"
          :key="d.value"
          v-motion="motionFadeUp(di, prefersReducedMotion)"
        >
          <AppListRow
            as="button"
            interactive
            type="button"
            class="flex w-full items-center justify-between text-left"
            @click="dept = d.value"
          >
            <span>{{ d.label }}</span>
            <span class="text-muted">→</span>
          </AppListRow>
        </li>
      </AppList>
    </section>

    <!-- State C: dept chosen — admissions with a filter popover (year + admission type). -->
    <template v-else>
      <header class="mb-section flex items-start justify-between gap-4">
        <div>
          <h2 class="font-serif text-title-sm tracking-tight">{{ deptName }}</h2>
          <p class="text-muted text-small">{{ schoolName }}</p>
        </div>

        <!-- Floating filter panel (UPopover), not a docked tab row: keeps the header's height
             stable across depts regardless of how many facets that dept actually has, and stays
             out of the content flow entirely when open. The dot on the trigger is the only
             lingering cue once it's closed — otherwise a filtered view looks identical to an
             unfiltered one. -->
        <UPopover v-if="hasAnyFacet">
          <UChip color="primary" size="sm" :show="hasActiveFilter">
            <IconButton :icon="icons.filter" :label="filterButtonLabel" />
          </UChip>

          <template #content>
            <div class="w-56 space-y-4 p-control">
              <div v-for="facet in filterFacets" :key="facet.key">
                <p class="text-caption text-muted mb-1.5 font-medium">{{ facet.title }}</p>
                <div role="group" :aria-label="facet.ariaLabel" class="flex flex-wrap gap-1.5">
                  <button
                    v-for="t in facet.tabs"
                    :key="t.value"
                    type="button"
                    :aria-pressed="facet.selected === t.value"
                    class="focus-ring min-h-touch inline-flex items-center rounded-full border px-3 text-small transition-colors"
                    :class="[
                      facet.selected === t.value
                        ? 'border-primary text-default'
                        : 'border-default text-muted hover:text-default',
                      facet.tabularNums ? 'tabular-nums' : '',
                    ]"
                    @click="facet.onSelect(t.value)"
                  >
                    {{ t.label }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </UPopover>
      </header>

      <QueryState
        :pending="pending"
        :error="isError ? error : null"
        :empty="!data || data.length === 0"
        @retry="refetch"
      >
        <template #loading>
          <div class="space-y-3">
            <USkeleton v-for="n in 3" :key="n" class="h-24 w-full" />
          </div>
        </template>

        <template #empty>查無此校系的招生資料。</template>

        <section
          v-for="(g, gi) in visibleGroups"
          :key="g.id"
          v-motion="motionFadeUp(gi, prefersReducedMotion)"
          class="mb-section"
        >
          <h3 class="font-serif text-title-sm mb-3 tracking-tight">
            {{ g.name || "不分組" }}
          </h3>

          <AppCard v-for="r in g.rounds" :key="`${r.year}-${r.admissionType}`" class="mt-3">
            <div class="sm:grid sm:grid-cols-[1fr_8rem] sm:gap-x-6">
              <div class="font-medium sm:col-span-2">
                {{ r.year }} 學年 · {{ ADMISSION_TYPE_LABELS[r.admissionType] }}
                <span v-if="r.admissionCode" class="text-muted">· 代碼 {{ r.admissionCode }}</span>
                <span v-if="r.applicantType" class="text-muted">· {{ r.applicantType }}</span>
              </div>

              <div class="mt-1">
                <div class="text-muted text-small">
                  採計:{{ r.methods.map((m) => ADMISSION_METHOD_LABELS[m]).join("、") || "—" }}
                  <span v-if="r.calculator !== null"
                    >· 計算機 {{ r.calculator ? "可" : "不可" }}</span
                  >
                  <span v-if="r.writtenWeight !== null">· 筆試 {{ r.writtenWeight }}%</span>
                  <span v-if="r.reviewWeight !== null">· 審查 {{ r.reviewWeight }}%</span>
                  <span v-if="r.interviewWeight !== null">· 面試 {{ r.interviewWeight }}%</span>
                  <span v-if="r.interviewAt">· 面試 {{ formatDateTime(r.interviewAt) }}</span>
                </div>

                <ul v-if="r.papers.length" class="text-small mt-2">
                  <li v-for="p in papersByTiebreak(r.papers, r.tiebreak)" :key="p.name">
                    {{ p.name }}<span v-if="p.weight !== null"> ({{ p.weight }}%)</span>
                  </li>
                </ul>

                <p v-if="r.tiebreak.length" class="text-muted text-small mt-1">
                  同分參酌:{{ r.tiebreak.join("、") }}
                </p>

                <p v-if="seasonLine(r.season)" class="text-muted text-small mt-1">
                  {{ seasonLine(r.season) }}
                </p>

                <div v-if="r.papers.length" class="mt-2 space-y-1">
                  <div
                    v-for="p in papersByTiebreak(r.papers, r.tiebreak)"
                    :key="p.name"
                    class="flex flex-wrap items-center gap-1 text-small"
                  >
                    <span v-if="p.subjects.length" class="text-muted">{{ p.name }}:</span>
                    <AppBadge
                      v-for="s in p.subjects"
                      :key="s.slug"
                      :to="
                        practicableSlugs.has(s.slug) ? `/questions?subject=${s.slug}` : undefined
                      "
                      intent="tag"
                      size="sm"
                      :aria-label="
                        practicableSlugs.has(s.slug) ? `練習考科:${s.name}(跨校)` : undefined
                      "
                    >
                      {{ s.name }}
                    </AppBadge>
                  </div>
                </div>
              </div>

              <div class="text-small mt-3 flex flex-col gap-3 sm:mt-1 sm:h-full sm:justify-between">
                <div class="space-y-1">
                  <div>名額 {{ r.quota ?? "—" }}</div>
                  <div>報名 {{ r.applicants ?? "—" }}</div>
                  <div>錄取 {{ r.admitted ?? "—" }}</div>
                  <div class="mt-1">
                    <div class="text-muted text-caption">錄取率</div>
                    <div>
                      {{ admitRate(r)?.percent ?? "—"
                      }}<span v-if="admitRate(r)?.estimated" class="text-muted">(估算)</span>
                    </div>
                  </div>
                </div>
                <div class="flex gap-1">
                  <IconButton
                    v-if="brochureUrl(school, r.admissionCode)"
                    :to="brochureUrl(school, r.admissionCode)!"
                    :icon="icons.document"
                    label="簡章 PDF"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                  <IconButton
                    v-if="r.sourceUrl && /^https?:\/\//.test(r.sourceUrl)"
                    :to="r.sourceUrl"
                    :icon="icons.externalLink"
                    label="系所官網"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                </div>
              </div>
            </div>
          </AppCard>
        </section>
      </QueryState>
    </template>
  </AppPage>
</template>
