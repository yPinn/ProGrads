<script setup lang="ts">
import { computed } from "vue";
import { ADMISSION_TYPE_LABELS } from "~/utils/admission-labels";
import { groupByYear } from "~/utils/group-by-year";
import { icons } from "~/utils/icons";

// Dev-only content-repo inventory. Follows the /styleguide pattern: 404s in production (ships
// inert but unreachable), no SEO indexing.
if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: "Not Found" });

useSeoMeta({ title: "Coverage", robots: "noindex" });

const { data, isPending, isError, error, refetch } = useCoverage();

const pct = (num: number, den: number): string =>
  den === 0 ? "—" : `${Math.round((100 * num) / den)}%`;
const markIcon = (b: boolean): string => (b ? icons.present : icons.absent);
const markClass = (b: boolean): string => (b ? "text-success-ink" : "text-dimmed");
// season is the admission_type value itself (D22); exam is the unlabeled default.
const seasonSuffix = (season: string): string =>
  season === "exam"
    ? ""
    : ` / ${ADMISSION_TYPE_LABELS[season as keyof typeof ADMISSION_TYPE_LABELS] ?? season}`;

// Per-file parse errors from compute*Coverage() (see tools/content-sync/src/report-*.ts),
// flattened into one list per section.
const questionsBad = computed(() => (data.value?.questions.papers ?? []).flatMap((p) => p.bad));

const questionsByYear = computed(() => groupByYear(data.value?.questions.papers ?? []));

// Admissions (departments.yml) and admission-stats (registration.yml) key identically on
// (year, school, season), so they're shown as one merged table instead of two — see coverage.vue
// history for the split version. Stats-only rows (registration.yml with no matching admissions
// unit at all) are rare in practice but handled: appended after the joined rows.
const mergedUnits = computed(() => {
  const admUnits = data.value?.admissions.units ?? [];
  const statsUnits = data.value?.admissionStats.units ?? [];
  const statsByKey = new Map(statsUnits.map((s) => [`${s.year}/${s.school}/${s.season}`, s]));
  const seen = new Set<string>();

  const merged = admUnits.map((u) => {
    const key = `${u.year}/${u.school}/${u.season}`;
    seen.add(key);
    const s = statsByKey.get(key);
    return { ...u, statsPresent: s?.present ?? false, statsRows: s?.rows ?? 0, statsBad: s?.bad };
  });

  for (const s of statsUnits) {
    const key = `${s.year}/${s.school}/${s.season}`;
    if (seen.has(key)) continue;
    merged.push({
      year: s.year,
      school: s.school,
      season: s.season,
      schoolName: s.schoolName,
      prospectus: false,
      schedule: false,
      departments: false,
      coveredDepts: [],
      groups: 0,
      scopeDeptTotal: 0,
      scopeDeptCovered: 0,
      scopeLabel: "",
      statsPresent: s.present,
      statsRows: s.rows,
      statsBad: s.bad,
    });
  }
  return merged;
});
const mergedByYear = computed(() => groupByYear(mergedUnits.value));
const mergedBad = computed(() =>
  mergedUnits.value
    .filter((u) => u.bad || u.statsBad)
    .map((u) => ({
      ...u,
      admissionsErr: u.bad,
      statsErr: u.statsBad,
    })),
);

// ust (台灣聯合大學系統) is a non-seed pseudo-school: its groups are distributed into member
// schools' own departments.yml, so it never gets one of its own — the note explains that.
const hasUst = computed(() => mergedUnits.value.some((u) => u.school === "ust"));
const UST_NOTE =
  "台灣聯合大學系統：中央、政治、清華、陽明交通四校部分化學類、物理類、電機類、文化研究類校系所組的聯合招生。班組會被拆分收錄進 ncu / nycu / nthu 各自的 departments.yml，故 ust 本身永遠不會有 departments.yml。";
</script>

<template>
  <AppPage
    eyebrow="Internal · Dev only"
    title="Coverage"
    description="content repo 各領域(師資 / 報名資訊 / 考古題 / 招生統計)建置狀況,對照 packages/db seed 基準即時計算。改動 content repo 後重新整理本頁即可。"
  >
    <QueryState
      :pending="isPending"
      :error="isError ? error : null"
      :empty="false"
      @retry="refetch"
    >
      <template #loading>
        <div class="space-y-3">
          <USkeleton v-for="n in 8" :key="n" class="h-8 w-full" />
        </div>
      </template>

      <div v-if="data" class="space-y-section">
        <!-- 總覽：四領域建置比例，一眼掌握重點，點擊跳至對應區塊。排序同主導覽列的使用頻率
             （考古題 → 報名資訊 → 招生日程 → 師資陣容；見 layouts/default.vue navLinks）。 -->
        <nav aria-label="總覽" class="border-default overflow-hidden rounded-card border">
          <div class="-mt-px -ml-px grid grid-cols-1 sm:grid-cols-3">
            <a
              href="#questions"
              class="border-default focus-ring hover:bg-elevated/50 flex flex-col gap-1 border-t border-l p-5 transition-colors"
            >
              <p class="text-muted text-caption tracking-eyebrow uppercase">考古題</p>
              <p class="font-serif text-title-md tabular-nums tracking-tight">
                {{ data.questions.schoolsWithQuestions }}/{{ data.questions.totalSeedSchools }}
              </p>
              <p class="text-muted text-small">
                {{ data.questions.totalQuestions }} 題 · {{ data.questions.totalPapers }} 份考卷
              </p>
            </a>
            <a
              href="#admissions"
              class="border-default focus-ring hover:bg-elevated/50 flex flex-col gap-1 border-t border-l p-5 transition-colors"
            >
              <p class="text-muted text-caption tracking-eyebrow uppercase">報名資訊 / 招生統計</p>
              <p class="font-serif text-title-md tabular-nums tracking-tight">
                {{ data.admissions.withDepartments }}/{{ data.admissions.totalUnits }}
              </p>
              <p class="text-muted text-small">
                統計 {{ data.admissionStats.withRegistration }}/{{ data.admissionStats.totalUnits }}
                ·
                {{ data.admissions.fillable + data.admissionStats.fillable }} 個可補
              </p>
            </a>
            <a
              href="#faculty"
              class="border-default focus-ring hover:bg-elevated/50 flex flex-col gap-1 border-t border-l p-5 transition-colors"
            >
              <p class="text-muted text-caption tracking-eyebrow uppercase">師資</p>
              <p class="font-serif text-title-md tabular-nums tracking-tight">
                {{ data.faculty.builtDepts }}/{{ data.faculty.totalDepts }}
              </p>
              <p class="text-muted text-small">{{ data.faculty.totalMembers }} 位師資</p>
            </a>
          </div>
        </nav>

        <AppCard id="questions" class="scroll-mt-24">
          <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <p class="text-muted text-caption tracking-eyebrow uppercase">Questions</p>
              <h2 class="font-serif text-title-sm tracking-tight">考古題</h2>
            </div>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-muted text-caption">有題目的學校</p>
                <p class="tabular-nums">
                  {{ data.questions.schoolsWithQuestions }}/{{ data.questions.totalSeedSchools }}
                </p>
              </div>
              <div>
                <p class="text-muted text-caption">考卷 / 題數</p>
                <p class="tabular-nums">
                  {{ data.questions.totalPapers }} / {{ data.questions.totalQuestions }}
                </p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">學校</th>
                  <th class="p-2">卷</th>
                  <th class="p-2 text-right">題數</th>
                  <th class="p-2">題型</th>
                  <th class="p-2 text-right">答案</th>
                  <th class="p-2 text-right">解析</th>
                  <th class="p-2 text-right">知識點</th>
                  <th class="p-2">審閱</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="grp in questionsByYear" :key="grp.year">
                  <CoverageYearHeader :year="grp.year" :colspan="8" />
                  <tr
                    v-for="p in grp.rows"
                    :key="`${p.school}-${p.year}-${p.paper}`"
                    class="border-default/60 border-b last:border-b-0"
                  >
                    <td class="p-2">{{ p.schoolName || p.school }}</td>
                    <td class="p-2">{{ p.paper }}</td>
                    <td class="p-2 text-right tabular-nums">{{ p.count }}</td>
                    <td class="text-muted p-2">{{ p.typeMix }}</td>
                    <td class="p-2 text-right tabular-nums">{{ pct(p.answered, p.count) }}</td>
                    <td class="p-2 text-right tabular-nums">{{ pct(p.solved, p.count) }}</td>
                    <td class="p-2 text-right tabular-nums">{{ pct(p.withKp, p.count) }}</td>
                    <td class="text-muted p-2">
                      {{ p.verified || p.flagged ? `${p.verified}✓ ${p.flagged}⚑` : "—" }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <p v-if="data.questions.missingSchools.length" class="text-muted text-small mt-3">
            尚無題目的學校（{{ data.questions.missingSchools.length }}）：{{
              data.questions.missingSchools.map((s) => s.name).join("、")
            }}
          </p>
          <p
            v-if="data.questions.orphans.length"
            class="text-error-ink text-small mt-2 flex items-start gap-1.5"
          >
            <UIcon :name="icons.warning" class="mt-0.5 shrink-0" aria-hidden="true" />
            <span
              >壞檔（{{ data.questions.orphans.length }}）：{{
                data.questions.orphans.join("、")
              }}</span
            >
          </p>
          <div v-if="questionsBad.length" class="text-error-ink text-small mt-2 space-y-1">
            <p class="flex items-center gap-1.5 font-medium">
              <UIcon :name="icons.warning" class="shrink-0" aria-hidden="true" />
              解析錯誤（{{ questionsBad.length }}）
            </p>
            <p v-for="msg in questionsBad" :key="msg">{{ msg }}</p>
          </div>
        </AppCard>

        <AppCard id="admissions" class="scroll-mt-24">
          <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <p class="text-muted text-caption tracking-eyebrow uppercase">
                Admissions &amp; stats
              </p>
              <h2 class="font-serif text-title-sm tracking-tight">報名資訊與招生統計</h2>
            </div>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-muted text-caption">已建 departments.yml</p>
                <p class="tabular-nums">
                  {{ data.admissions.withDepartments }}/{{ data.admissions.totalUnits }} 單位
                </p>
              </div>
              <div>
                <p class="text-muted text-caption">已建 registration.yml</p>
                <p class="tabular-nums">
                  {{ data.admissionStats.withRegistration }}/{{ data.admissionStats.totalUnits }}
                  單位
                </p>
              </div>
              <div>
                <p class="text-muted text-caption">可補</p>
                <p class="tabular-nums">
                  {{ data.admissions.fillable + data.admissionStats.fillable }} 個
                </p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">學校</th>
                  <th class="p-2 text-center">簡章</th>
                  <th class="p-2 text-center">日程</th>
                  <th class="p-2 text-center">系所</th>
                  <th class="p-2 text-right">組別數</th>
                  <th class="border-default border-l border-dashed p-2 pl-5 text-center">
                    招生統計
                  </th>
                  <th class="p-2 text-right">列數</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="grp in mergedByYear" :key="grp.year">
                  <CoverageYearHeader :year="grp.year" :colspan="7" />
                  <tr
                    v-for="u in grp.rows"
                    :key="`${u.year}-${u.school}-${u.season}`"
                    class="border-default/60 border-b last:border-b-0"
                  >
                    <td class="p-2">{{ u.schoolName || u.school }}{{ seasonSuffix(u.season) }}</td>
                    <td class="p-2 text-center">
                      <UIcon
                        :name="markIcon(u.prospectus)"
                        :class="markClass(u.prospectus)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2 text-center">
                      <UIcon
                        :name="markIcon(u.schedule)"
                        :class="markClass(u.schedule)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2 text-center">
                      <UIcon
                        :name="markIcon(u.departments)"
                        :class="markClass(u.departments)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2 text-right tabular-nums">{{ u.groups || "—" }}</td>
                    <td class="border-default/60 border-l border-dashed p-2 pl-5 text-center">
                      <UIcon
                        :name="markIcon(u.statsPresent)"
                        :class="markClass(u.statsPresent)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2 text-right tabular-nums">
                      {{ u.statsPresent ? u.statsRows : "—" }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <p v-if="hasUst" class="text-muted text-small mt-3 flex items-start gap-1.5">
            <UIcon :name="icons.info" class="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{{ UST_NOTE }}</span>
          </p>
          <div v-if="mergedBad.length" class="text-error-ink text-small mt-3 space-y-1">
            <p class="flex items-center gap-1.5 font-medium">
              <UIcon :name="icons.warning" class="shrink-0" aria-hidden="true" />
              解析錯誤（{{ mergedBad.length }}）
            </p>
            <p v-for="u in mergedBad" :key="`${u.year}-${u.school}-${u.season}`">
              {{ u.year }} {{ u.schoolName || u.school }}{{ seasonSuffix(u.season) }}：{{
                [
                  u.admissionsErr && `報名資訊 - ${u.admissionsErr}`,
                  u.statsErr && `招生統計 - ${u.statsErr}`,
                ]
                  .filter(Boolean)
                  .join("；")
              }}
            </p>
          </div>
        </AppCard>

        <AppCard id="faculty" class="scroll-mt-24">
          <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <p class="text-muted text-caption tracking-eyebrow uppercase">Faculty</p>
              <h2 class="font-serif text-title-sm tracking-tight">師資</h2>
            </div>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-muted text-caption">已建立</p>
                <p class="tabular-nums">
                  {{ data.faculty.builtDepts }}/{{ data.faculty.totalDepts }} 系所
                </p>
              </div>
              <div>
                <p class="text-muted text-caption">師資</p>
                <p class="tabular-nums">{{ data.faculty.totalMembers }} 位</p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">學校</th>
                  <th class="p-2">系所</th>
                  <th class="p-2">所別</th>
                  <th class="p-2 text-center">建立</th>
                  <th class="p-2 text-right">人數</th>
                  <th class="p-2 text-right">職稱</th>
                  <th class="p-2 text-right">研究</th>
                  <th class="p-2 text-right">著作</th>
                  <th class="p-2">as_of</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="d in data.faculty.depts"
                  :key="`${d.school}-${d.dept}`"
                  class="border-default/60 border-b last:border-b-0"
                >
                  <td class="p-2">{{ d.schoolName }}</td>
                  <td class="p-2">{{ d.deptName }}</td>
                  <td class="text-muted p-2">{{ d.track }}</td>
                  <td class="p-2 text-center">
                    <UIcon
                      :name="markIcon(d.built)"
                      :class="markClass(d.built)"
                      aria-hidden="true"
                    />
                  </td>
                  <td class="p-2 text-right tabular-nums">{{ d.built ? d.members : "—" }}</td>
                  <td class="p-2 text-right tabular-nums">{{ pct(d.withTitle, d.members) }}</td>
                  <td class="p-2 text-right tabular-nums">{{ pct(d.withResearch, d.members) }}</td>
                  <td class="p-2 text-right tabular-nums">
                    {{ d.built ? `${d.thesesMembers}人/${d.authored}筆` : "—" }}
                  </td>
                  <td class="text-muted p-2">{{ d.asOf }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-if="data.faculty.orphans.length"
            class="text-error-ink text-small mt-3 flex items-start gap-1.5"
          >
            <UIcon :name="icons.warning" class="mt-0.5 shrink-0" aria-hidden="true" />
            <span
              >壞檔（{{ data.faculty.orphans.length }}）：{{
                data.faculty.orphans.join("、")
              }}</span
            >
          </p>
        </AppCard>
      </div>
    </QueryState>
  </AppPage>
</template>
