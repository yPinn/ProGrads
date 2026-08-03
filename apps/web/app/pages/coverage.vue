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
const admissionsBad = computed(() => (data.value?.admissions.units ?? []).filter((u) => u.bad));
const questionsBad = computed(() => (data.value?.questions.papers ?? []).flatMap((p) => p.bad));
const statsBad = computed(() => (data.value?.admissionStats.units ?? []).filter((u) => u.bad));

const admissionsByYear = computed(() => groupByYear(data.value?.admissions.units ?? []));
const questionsByYear = computed(() => groupByYear(data.value?.questions.papers ?? []));
const statsByYear = computed(() => groupByYear(data.value?.admissionStats.units ?? []));

// ust (台灣聯合大學系統) is a non-seed pseudo-school: its groups are distributed into member
// schools' own departments.yml, so it never gets one of its own — the note explains that.
const hasUst = computed(() => (data.value?.admissions.units ?? []).some((u) => u.school === "ust"));
const UST_NOTE =
  "本招生為「台灣聯合大學系統」(中央大學、政治大學、清華大學、陽明交通大學)部分化學類、物理類、電機類、文化研究類校系所組聯合招生(四所大學各有各類校系所組碩士班還是在各校個別的碩士班招生中辦理，請參閱各校碩士班招生簡章)，考生只要一次報名、一次考試，就可以選擇多個校系所組為就讀志願。請注意各校口試時間是否衝突。報名前請務必詳讀簡章內容，避免資料遺漏。班組會被拆分收錄進 ncu / nycu / nthu 各自的 departments.yml，故 ust 本身永遠不會有 departments.yml。";
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
        <!-- 總覽：四領域建置比例，一眼掌握重點，點擊跳至對應區塊 -->
        <nav aria-label="總覽" class="border-default overflow-hidden rounded-card border">
          <div class="-mt-px -ml-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
            <a
              href="#admissions"
              class="border-default focus-ring hover:bg-elevated/50 flex flex-col gap-1 border-t border-l p-5 transition-colors"
            >
              <p class="text-muted text-caption tracking-eyebrow uppercase">報名資訊</p>
              <p class="font-serif text-title-md tabular-nums tracking-tight">
                {{ data.admissions.withDepartments }}/{{ data.admissions.totalUnits }}
              </p>
              <p class="text-muted text-small">{{ data.admissions.fillable }} 個可補</p>
            </a>
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
              href="#admission-stats"
              class="border-default focus-ring hover:bg-elevated/50 flex flex-col gap-1 border-t border-l p-5 transition-colors"
            >
              <p class="text-muted text-caption tracking-eyebrow uppercase">招生統計</p>
              <p class="font-serif text-title-md tabular-nums tracking-tight">
                {{ data.admissionStats.withRegistration }}/{{ data.admissionStats.totalUnits }}
              </p>
              <p class="text-muted text-small">{{ data.admissionStats.fillable }} 個可補</p>
            </a>
          </div>
        </nav>

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
                  <th class="p-2">建立</th>
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
                  <td class="p-2">
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

        <AppCard id="admissions" class="scroll-mt-24">
          <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <p class="text-muted text-caption tracking-eyebrow uppercase">Admissions info</p>
              <h2 class="font-serif text-title-sm tracking-tight">報名資訊</h2>
            </div>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-muted text-caption">已建 departments.yml</p>
                <p class="tabular-nums">
                  {{ data.admissions.withDepartments }}/{{ data.admissions.totalUnits }} 單位
                </p>
              </div>
              <div>
                <p class="text-muted text-caption">可補（有簡章無系所）</p>
                <p class="tabular-nums">{{ data.admissions.fillable }} 個</p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">學校</th>
                  <th class="p-2">簡章</th>
                  <th class="p-2">日程</th>
                  <th class="p-2">系所</th>
                  <th class="p-2 text-right">組別數</th>
                  <th class="p-2">{{ data.admissions.units[0]?.scopeLabel ?? "" }} 系所涵蓋</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="grp in admissionsByYear" :key="grp.year">
                  <CoverageYearHeader :year="grp.year" :colspan="6" />
                  <tr
                    v-for="u in grp.rows"
                    :key="`${u.year}-${u.school}-${u.season}`"
                    class="border-default/60 border-b last:border-b-0"
                  >
                    <td class="p-2">{{ u.schoolName || u.school }}{{ seasonSuffix(u.season) }}</td>
                    <td class="p-2">
                      <UIcon
                        :name="markIcon(u.prospectus)"
                        :class="markClass(u.prospectus)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2">
                      <UIcon
                        :name="markIcon(u.schedule)"
                        :class="markClass(u.schedule)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2">
                      <UIcon
                        :name="markIcon(u.departments)"
                        :class="markClass(u.departments)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2 text-right tabular-nums">{{ u.groups || "—" }}</td>
                    <td class="p-2 tabular-nums">
                      {{ u.scopeDeptTotal > 0 ? `${u.scopeDeptCovered}/${u.scopeDeptTotal}` : "—" }}
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
          <div v-if="admissionsBad.length" class="text-error-ink text-small mt-3 space-y-1">
            <p class="flex items-center gap-1.5 font-medium">
              <UIcon :name="icons.warning" class="shrink-0" aria-hidden="true" />
              解析錯誤（{{ admissionsBad.length }}）
            </p>
            <p v-for="u in admissionsBad" :key="`${u.year}-${u.school}-${u.season}`">
              {{ u.year }} {{ u.schoolName || u.school }}{{ seasonSuffix(u.season) }}：{{ u.bad }}
            </p>
          </div>
        </AppCard>

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

        <AppCard id="admission-stats" class="scroll-mt-24">
          <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <p class="text-muted text-caption tracking-eyebrow uppercase">Admission stats</p>
              <h2 class="font-serif text-title-sm tracking-tight">招生統計</h2>
            </div>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-muted text-caption">已建 registration.yml</p>
                <p class="tabular-nums">
                  {{ data.admissionStats.withRegistration }}/{{ data.admissionStats.totalUnits }}
                  單位
                </p>
              </div>
              <div>
                <p class="text-muted text-caption">可補（報名資訊已建無統計）</p>
                <p class="tabular-nums">{{ data.admissionStats.fillable }} 個</p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">學校</th>
                  <th class="p-2">報名資訊</th>
                  <th class="p-2">招生統計</th>
                  <th class="p-2 text-right">列數</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="grp in statsByYear" :key="grp.year">
                  <CoverageYearHeader :year="grp.year" :colspan="4" />
                  <tr
                    v-for="u in grp.rows"
                    :key="`${u.year}-${u.school}-${u.season}`"
                    class="border-default/60 border-b last:border-b-0"
                  >
                    <td class="p-2">{{ u.schoolName || u.school }}{{ seasonSuffix(u.season) }}</td>
                    <td class="p-2">
                      <UIcon
                        :name="markIcon(u.admissionsBuilt)"
                        :class="markClass(u.admissionsBuilt)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2">
                      <UIcon
                        :name="markIcon(u.present)"
                        :class="markClass(u.present)"
                        aria-hidden="true"
                      />
                    </td>
                    <td class="p-2 text-right tabular-nums">{{ u.present ? u.rows : "—" }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-if="statsBad.length" class="text-error-ink text-small mt-3 space-y-1">
            <p class="flex items-center gap-1.5 font-medium">
              <UIcon :name="icons.warning" class="shrink-0" aria-hidden="true" />
              解析錯誤（{{ statsBad.length }}）
            </p>
            <p v-for="u in statsBad" :key="`${u.year}-${u.school}-${u.season}`">
              {{ u.year }} {{ u.schoolName || u.school }}{{ seasonSuffix(u.season) }}：{{ u.bad }}
            </p>
          </div>
        </AppCard>
      </div>
    </QueryState>
  </AppPage>
</template>
