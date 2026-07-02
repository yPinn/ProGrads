<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useFaculty } from "~/composables/useFaculty";
import { useSchools } from "~/composables/useSchools";
import { useDepartments } from "~/composables/useDepartments";
import { toSelectItems } from "~/utils/select";

useSeoMeta({
  title: "師資陣容",
  description: "各校系所師資:職級、研究方向、實驗室與代表論文佐證。",
});

// School → dept is the primary axis (same flow as 報名資訊). The roster loads once both are set.
const school = ref<string | undefined>();
const dept = ref<string | undefined>();

const { data: schools, isLoading: schoolsLoading } = useSchools();
const { data: depts, isLoading: deptsLoading } = useDepartments(school);
const schoolItems = computed(() => toSelectItems(schools.value));
const deptItems = computed(() => toSelectItems(depts.value));
const schoolName = computed(() => schoolItems.value.find((s) => s.value === school.value)?.label);
const deptName = computed(() => deptItems.value.find((d) => d.value === dept.value)?.label);

watch(school, () => {
  dept.value = undefined;
});

const query = computed(() => ({ school: school.value ?? "", dept: dept.value ?? "" }));
const { data, isLoading, isError, error, refetch } = useFaculty(query);

const THESIS_ROLE_LABELS: Record<string, string> = { advised: "指導論文", authored: "著作" };
const isHttp = (url: string | null): url is string => !!url && /^https?:\/\//.test(url);

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
    </div>

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
        :pending="isLoading"
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
            class="border-default rounded-card border p-card"
          >
            <div class="flex items-baseline justify-between gap-2">
              <h3 class="font-serif text-title-sm tracking-tight">
                {{ m.name }}
                <span v-if="m.nameEn" class="text-muted text-small font-sans">{{ m.nameEn }}</span>
              </h3>
              <span v-if="m.title" class="text-muted text-small shrink-0">{{ m.title }}</span>
            </div>

            <p v-if="m.note || m.lab" class="text-muted text-small mt-1">
              <span v-if="m.note">{{ m.note }}</span>
              <span v-if="m.note && m.lab"> · </span>
              <span v-if="m.lab">{{ m.lab }}</span>
            </p>

            <ul v-if="m.researchAreas.length" class="mt-3 flex flex-wrap gap-1.5">
              <li
                v-for="area in m.researchAreas"
                :key="area"
                class="border-default text-muted text-caption rounded-full border px-2 py-0.5"
              >
                {{ area }}
              </li>
            </ul>

            <ul v-if="m.theses.length" class="text-small mt-3 space-y-1">
              <li v-for="t in m.theses" :key="t.id" class="flex gap-2">
                <span class="text-muted shrink-0"
                  >{{ THESIS_ROLE_LABELS[t.role] ?? t.role
                  }}<span v-if="t.year"> {{ t.year }}</span></span
                >
                <a
                  v-if="isHttp(t.url)"
                  :href="t.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary"
                  >{{ t.title }}</a
                >
                <span v-else>{{ t.title }}</span>
              </li>
            </ul>

            <a
              v-if="isHttp(m.homepage)"
              :href="m.homepage"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary text-small mt-3 inline-block"
            >
              個人/實驗室頁 →
            </a>
          </li>
        </ul>
      </QueryState>
    </template>
  </AppPage>
</template>
