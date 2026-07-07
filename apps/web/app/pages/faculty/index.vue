<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { FacultyMemberWithDepartment, FacultyQuery } from "@prograds/shared";
import { useFaculty } from "~/composables/useFaculty";
import { useTracks } from "~/composables/useTracks";
import { useSchools } from "~/composables/useSchools";
import { useDepartments } from "~/composables/useDepartments";
import { toSelectItems } from "~/utils/select";

useSeoMeta({
  title: "師資陣容",
  description: "各校系所師資:職級、研究方向、實驗室與代表論文佐證。",
});

// Two axes onto the same roster: by school (學校→系所) or by track (所別→各校).
type Mode = "school" | "track";
const MODES: { value: Mode; label: string }[] = [
  { value: "school", label: "依學校" },
  { value: "track", label: "依所別" },
];
const mode = ref<Mode>("school");

// School → dept axis (same flow as 報名資訊). Track axis is a single 所別 select.
const school = ref<string | undefined>();
const dept = ref<string | undefined>();
const track = ref<string | undefined>();

const { data: schools, isLoading: schoolsLoading } = useSchools();
const { data: depts, isLoading: deptsLoading } = useDepartments(school);
const { data: tracks, isLoading: tracksLoading } = useTracks();
const schoolItems = computed(() => toSelectItems(schools.value));
const deptItems = computed(() => toSelectItems(depts.value));
const trackItems = computed(() => toSelectItems(tracks.value));
const schoolName = computed(() => schoolItems.value.find((s) => s.value === school.value)?.label);
const deptName = computed(() => deptItems.value.find((d) => d.value === dept.value)?.label);
const trackName = computed(() => trackItems.value.find((t) => t.value === track.value)?.label);

watch(school, () => {
  dept.value = undefined;
});

// The active query depends on the mode; useFaculty stays disabled until its axis is complete.
const query = computed<FacultyQuery>(() =>
  mode.value === "track"
    ? { track: track.value ?? "" }
    : { school: school.value ?? "", dept: dept.value ?? "" },
);
const { data, isLoading, isError, error, refetch } = useFaculty(query);

// Pending until we have data or an error — covers the frame between completing an axis and
// vue-query flipping fetchStatus, where isLoading is briefly false with data still undefined and
// <QueryState> would flash empty instead of the skeleton. Mirrors admissions; always enabled here.
const pending = computed(() => isLoading.value || (!data.value && !isError.value));

// Cross-school (track) results arrive pre-sorted school → dept → seniority; fold consecutive
// rows of the same department into groups so each school/dept gets a heading.
const facultyGroups = computed(() => {
  const groups: {
    key: string;
    school: string;
    dept: string;
    members: FacultyMemberWithDepartment[];
  }[] = [];
  for (const m of data.value ?? []) {
    const last = groups.at(-1);
    if (last && last.key === m.department.id) last.members.push(m);
    else
      groups.push({
        key: m.department.id,
        school: m.department.school.name,
        dept: m.department.name,
        members: [m],
      });
  }
  return groups;
});

const prefersReducedMotion = useReducedMotion();
</script>

<template>
  <AppPage
    eyebrow="Faculty · 師資陣容"
    title="師資陣容"
    description="各校系所師資:職級、研究方向、實驗室與代表論文佐證。"
  >
    <div
      class="border-default mb-section flex flex-wrap items-end gap-control rounded-card border p-card"
    >
      <UFieldGroup aria-label="瀏覽方式">
        <!-- Segmented control (a UFieldGroup of toggle buttons), not a single-action button — this
             is a distinct pattern deferred to a future <AppSegmented>. Kept as raw UButton until
             then; the button-intent guardrail is waived here on purpose. -->
        <!-- eslint-disable-next-line vue/no-restricted-syntax -->
        <UButton
          v-for="opt in MODES"
          :key="opt.value"
          :color="mode === opt.value ? 'primary' : 'neutral'"
          :variant="mode === opt.value ? 'solid' : 'outline'"
          :aria-pressed="mode === opt.value"
          @click="mode = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </UFieldGroup>

      <template v-if="mode === 'school'">
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
      </template>

      <USelectMenu
        v-else
        v-model="track"
        :items="trackItems"
        value-key="value"
        :loading="tracksLoading"
        aria-label="所別"
        placeholder="選擇所別"
        class="w-full sm:w-64"
      />
    </div>

    <!-- By school: school → dept → roster. -->
    <template v-if="mode === 'school'">
      <!-- State A: no school chosen yet. -->
      <EmptyState v-if="!school">選擇學校開始瀏覽各系所師資。</EmptyState>

      <!-- State B: school chosen, browsing its departments. -->
      <section v-else-if="!dept">
        <h2 class="font-serif text-title-sm mb-3 tracking-tight">{{ schoolName }} · 系所</h2>

        <div v-if="deptsLoading" class="border-default divide-default divide-y rounded-card border">
          <USkeleton v-for="n in 6" :key="n" class="mx-5 my-4 h-5 w-48" />
        </div>

        <EmptyState v-else-if="!deptItems.length">該校尚無系所資料。</EmptyState>

        <ul v-else class="border-default divide-default divide-y rounded-card border">
          <li
            v-for="(d, di) in deptItems"
            :key="d.value"
            v-motion="motionFadeUp(di, prefersReducedMotion)"
          >
            <button
              type="button"
              class="focus-ring hover:bg-elevated/50 flex min-h-touch w-full items-center justify-between px-5 py-4 text-left transition-colors"
              @click="dept = d.value"
            >
              <span>{{ d.label }}</span>
              <span class="text-muted">→</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- State C: dept chosen — the roster. -->
      <template v-else>
        <header class="mb-section">
          <h2 class="font-serif text-title-sm tracking-tight">{{ deptName }}</h2>
          <p class="text-muted text-small">{{ schoolName }}</p>
        </header>

        <QueryState
          :pending="pending"
          :error="isError ? error : null"
          :empty="!data || data.length === 0"
          @retry="refetch"
        >
          <template #loading>
            <div class="space-y-3">
              <USkeleton v-for="n in 4" :key="n" class="h-28 w-full" />
            </div>
          </template>

          <template #empty>查無此系所的師資資料。</template>

          <p class="text-muted text-small mb-section">共 {{ data?.length ?? 0 }} 位</p>

          <ul class="grid gap-card sm:grid-cols-2">
            <li
              v-for="(m, mi) in data"
              :key="m.id"
              v-motion="motionFadeUp(mi, prefersReducedMotion)"
            >
              <FacultyMemberCard :member="m" />
            </li>
          </ul>
        </QueryState>
      </template>
    </template>

    <!-- By track: 所別 → 各校 rosters grouped by school/dept. -->
    <template v-else>
      <!-- State A: no track chosen yet. -->
      <EmptyState v-if="!track">選擇所別,瀏覽各校該領域師資。</EmptyState>

      <template v-else>
        <header class="mb-section">
          <h2 class="font-serif text-title-sm tracking-tight">{{ trackName }} · 各校師資</h2>
        </header>

        <QueryState
          :pending="pending"
          :error="isError ? error : null"
          :empty="!data || data.length === 0"
          @retry="refetch"
        >
          <template #loading>
            <div class="space-y-3">
              <USkeleton v-for="n in 4" :key="n" class="h-28 w-full" />
            </div>
          </template>

          <template #empty>查無此所別的師資資料。</template>

          <p class="text-muted text-small mb-section">共 {{ data?.length ?? 0 }} 位</p>

          <section
            v-for="(g, gi) in facultyGroups"
            :key="g.key"
            v-motion="motionFadeUp(gi, prefersReducedMotion)"
            class="mb-section"
          >
            <header class="mb-3">
              <h3 class="font-serif text-title-sm tracking-tight">{{ g.school }}</h3>
              <p class="text-muted text-small">{{ g.dept }} · {{ g.members.length }} 位</p>
            </header>
            <ul class="grid gap-card sm:grid-cols-2">
              <li v-for="m in g.members" :key="m.id">
                <FacultyMemberCard :member="m" />
              </li>
            </ul>
          </section>
        </QueryState>
      </template>
    </template>
  </AppPage>
</template>
