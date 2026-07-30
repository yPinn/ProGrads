<script setup lang="ts">
// Dev-only content-repo inventory. Follows the /styleguide pattern: 404s in production (ships
// inert but unreachable), no SEO indexing.
if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: "Not Found" });

useSeoMeta({ title: "Coverage", robots: "noindex" });

const { data, isPending, isError, error, refetch } = useCoverage();

const pct = (num: number, den: number): string =>
  den === 0 ? "—" : `${Math.round((100 * num) / den)}%`;
const mark = (b: boolean): string => (b ? "✓" : "·");
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
        <!-- 師資 -->
        <section aria-label="師資清點">
          <h2 class="font-serif text-title-sm tracking-tight">
            師資 — {{ data.faculty.builtDepts }}/{{ data.faculty.totalDepts }} 系所已建立 ·
            {{ data.faculty.totalMembers }} 位師資
          </h2>
          <div class="border-default mt-3 overflow-x-auto rounded-card border">
            <table class="w-full text-small">
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
                  class="border-default border-b last:border-b-0"
                >
                  <td class="p-2">{{ d.schoolName }}</td>
                  <td class="p-2">{{ d.deptName }}</td>
                  <td class="text-muted p-2">{{ d.track }}</td>
                  <td class="p-2">{{ mark(d.built) }}</td>
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
          <p v-if="data.faculty.orphans.length" class="text-muted text-small mt-2">
            壞檔({{ data.faculty.orphans.length }}):{{ data.faculty.orphans.join("、") }}
          </p>
        </section>

        <!-- 報名資訊 -->
        <section aria-label="報名資訊清點">
          <h2 class="font-serif text-title-sm tracking-tight">
            報名資訊 — {{ data.admissions.withDepartments }}/{{ data.admissions.totalUnits }} 個
            (年,學校)單位已建 departments.yml · {{ data.admissions.fillable }} 個可補(有簡章無系所)
          </h2>
          <div class="border-default mt-3 overflow-x-auto rounded-card border">
            <table class="w-full text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">年度</th>
                  <th class="p-2">學校</th>
                  <th class="p-2">簡章</th>
                  <th class="p-2">日程</th>
                  <th class="p-2">系所</th>
                  <th class="p-2 text-right">組別數</th>
                  <th class="p-2">{{ data.admissions.units[0]?.scopeLabel ?? "" }} 系所涵蓋</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="u in data.admissions.units"
                  :key="`${u.year}-${u.school}-${u.season}`"
                  class="border-default border-b last:border-b-0"
                >
                  <td class="p-2 tabular-nums">{{ u.year }}</td>
                  <td class="p-2">
                    {{ u.schoolName || u.school }}{{ u.season === "exam" ? "" : ` / ${u.season}` }}
                  </td>
                  <td class="p-2">{{ mark(u.prospectus) }}</td>
                  <td class="p-2">{{ mark(u.schedule) }}</td>
                  <td class="p-2">{{ mark(u.departments) }}</td>
                  <td class="p-2 text-right tabular-nums">{{ u.groups || "—" }}</td>
                  <td class="p-2 tabular-nums">
                    {{ u.scopeDeptTotal > 0 ? `${u.scopeDeptCovered}/${u.scopeDeptTotal}` : "—" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 考古題 -->
        <section aria-label="考古題清點">
          <h2 class="font-serif text-title-sm tracking-tight">
            考古題 — {{ data.questions.schoolsWithQuestions }}/{{
              data.questions.totalSeedSchools
            }}
            所學校有題目 · {{ data.questions.totalPapers }} 份考卷 ·
            {{ data.questions.totalQuestions }} 題
          </h2>
          <div class="border-default mt-3 overflow-x-auto rounded-card border">
            <table class="w-full text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">學校</th>
                  <th class="p-2 text-right">年度</th>
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
                <tr
                  v-for="p in data.questions.papers"
                  :key="`${p.school}-${p.year}-${p.paper}`"
                  class="border-default border-b last:border-b-0"
                >
                  <td class="p-2">{{ p.schoolName || p.school }}</td>
                  <td class="p-2 text-right tabular-nums">{{ p.year }}</td>
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
              </tbody>
            </table>
          </div>
          <p v-if="data.questions.missingSchools.length" class="text-muted text-small mt-2">
            尚無題目的學校({{ data.questions.missingSchools.length }}):{{
              data.questions.missingSchools.map((s) => s.name).join("、")
            }}
          </p>
        </section>

        <!-- 招生統計 -->
        <section aria-label="招生統計清點">
          <h2 class="font-serif text-title-sm tracking-tight">
            招生統計 — {{ data.admissionStats.withRegistration }}/{{
              data.admissionStats.totalUnits
            }}
            個單位已建 registration.yml ·
            {{ data.admissionStats.fillable }} 個可補(報名資訊已建無統計)
          </h2>
          <div class="border-default mt-3 overflow-x-auto rounded-card border">
            <table class="w-full text-small">
              <thead>
                <tr class="border-default text-muted border-b text-left tracking-eyebrow uppercase">
                  <th class="p-2">年度</th>
                  <th class="p-2">學校</th>
                  <th class="p-2">報名資訊</th>
                  <th class="p-2">招生統計</th>
                  <th class="p-2 text-right">列數</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="u in data.admissionStats.units"
                  :key="`${u.year}-${u.school}-${u.season}`"
                  class="border-default border-b last:border-b-0"
                >
                  <td class="p-2 tabular-nums">{{ u.year }}</td>
                  <td class="p-2">
                    {{ u.school }}{{ u.season === "exam" ? "" : ` / ${u.season}` }}
                  </td>
                  <td class="p-2">{{ mark(u.admissionsBuilt) }}</td>
                  <td class="p-2">{{ mark(u.present) }}</td>
                  <td class="p-2 text-right tabular-nums">{{ u.present ? u.rows : "—" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </QueryState>
  </AppPage>
</template>
