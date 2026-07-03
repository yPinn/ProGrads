import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { defineComponent, h } from "vue";
import { useSchedules } from "./useSchedules";
import { useQuestions } from "./useQuestions";
import { useQuestionPapers } from "./useQuestionPapers";
import { useQuestion } from "./useQuestion";
import { useAdmissions } from "./useAdmissions";
import { useFaculty } from "./useFaculty";
import { useTracks } from "./useTracks";

// Run a composable inside the real Nuxt app (so $api + QueryClient are wired) and expose
// its result. Requests hit registerEndpoint() mocks because apiBaseUrl is "" in tests.
async function runComposable<T>(composable: () => T) {
  let result!: T;
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        result = composable();
        return () => h("div");
      },
    }),
  );
  return { wrapper, result };
}

const scheduleItem = {
  school: { slug: "ntu", name: "臺灣大學" },
  year: 2025,
  admissionType: "exam",
  event: "registration_start",
  at: "2025-01-02T00:00:00+08:00",
  endAt: null,
  location: null,
  sequence: null,
};

const questionSummary = {
  externalId: "q-1",
  number: "1",
  type: "mc",
  subjects: [{ id: "s1", slug: "algorithms", name: "演算法" }],
  examSubject: {
    id: "es1",
    slug: "cs",
    name: "計算機概論",
    departments: [
      { id: "d1", slug: "ntu-csie", name: "資訊工程學系", schoolId: "sc1", trackId: null },
    ],
  },
  exam: {
    id: "e1",
    year: 2025,
    admissionType: "exam",
    school: { id: "sc1", slug: "ntu", name: "臺灣大學" },
  },
};

describe("useSchedules", () => {
  it("fetches and validates the schedule list", async () => {
    registerEndpoint("/schedules", () => ({ data: [scheduleItem] }));
    const { result } = await runComposable(() => useSchedules({ year: 2025 }));
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual([scheduleItem]);
  });
});

describe("useQuestions", () => {
  it("returns items and pagination meta", async () => {
    registerEndpoint("/questions", () => ({
      data: [questionSummary],
      meta: { page: 1, pageSize: 20, total: 1 },
    }));
    const { result } = await runComposable(() => useQuestions({ page: 1, pageSize: 20 }));
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual({
      items: [questionSummary],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
  });
});

const admissionGroup = {
  id: "g1",
  code: "a",
  name: "甲組",
  displayOrder: 0,
  rounds: [
    {
      year: 2025,
      admissionType: "exam",
      admissionCode: "8611",
      applicantType: null,
      quota: 30,
      applicants: 120,
      admitted: 35,
      resultBatch: null,
      methods: ["written"],
      calculator: null,
      writtenWeight: null,
      reviewWeight: null,
      interviewWeight: null,
      interviewAt: null,
      tiebreak: [],
      sourceUrl: null,
      papers: [{ name: "計算機數學", section: null, weight: null, note: null, subjects: [] }],
    },
  ],
};

const paperSummary = {
  examSubject: questionSummary.examSubject,
  exam: questionSummary.exam,
  subjects: questionSummary.subjects,
  questions: [{ externalId: "q-1", number: "1", type: "mc", group: null }],
};

describe("useQuestionPapers", () => {
  it("returns papers and pagination meta", async () => {
    registerEndpoint("/questions/papers", () => ({
      data: [paperSummary],
      meta: { page: 1, pageSize: 20, total: 1 },
    }));
    const { result } = await runComposable(() => useQuestionPapers({ page: 1, pageSize: 20 }));
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual({
      items: [paperSummary],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
  });
});

describe("useAdmissions", () => {
  it("fetches admission groups for a school + dept", async () => {
    registerEndpoint("/admissions", () => ({ data: [admissionGroup] }));
    const { result } = await runComposable(() => useAdmissions({ school: "ntu", dept: "csie" }));
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual([admissionGroup]);
  });
});

const facultyMember = {
  id: "f1",
  name: "林智仁",
  nameEn: "CJ Lin",
  slug: "cj-lin",
  title: "特聘教授",
  lab: null,
  homepage: null,
  sourceUrl: null,
  note: null,
  researchAreas: ["Machine Learning"],
  departmentId: "d1",
  degrees: [
    { id: "dg1", level: "phd", institution: "University of Michigan", field: null, year: 1998 },
  ],
  theses: [{ id: "t1", title: "LIBSVM", year: 2011, role: "authored", url: null }],
  department: {
    id: "d1",
    slug: "csie",
    name: "資訊工程學系",
    schoolId: "sc1",
    trackId: null,
    school: { id: "sc1", slug: "ntu", name: "臺灣大學" },
  },
};

describe("useFaculty", () => {
  it("fetches the faculty roster for a school + dept", async () => {
    registerEndpoint("/faculty", () => ({ data: [facultyMember] }));
    const { result } = await runComposable(() => useFaculty({ school: "ntu", dept: "csie" }));
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual([facultyMember]);
  });

  it("fetches the cross-school roster for a track alone", async () => {
    registerEndpoint("/faculty", () => ({ data: [facultyMember] }));
    const { result } = await runComposable(() => useFaculty({ track: "cs" }));
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual([facultyMember]);
  });

  it("stays disabled until an axis is complete", async () => {
    registerEndpoint("/faculty", () => ({ data: [facultyMember] }));
    const { result } = await runComposable(() => useFaculty({ school: "ntu" }));
    expect(result.fetchStatus.value).toBe("idle");
  });
});

describe("useTracks", () => {
  it("fetches and validates the track list", async () => {
    registerEndpoint("/tracks", () => ({
      data: [{ id: "t1", slug: "cs", name: "資訊工程", categoryId: "c1" }],
    }));
    const { result } = await runComposable(() => useTracks());
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value).toEqual([
      { id: "t1", slug: "cs", name: "資訊工程", categoryId: "c1" },
    ]);
  });
});

describe("useQuestion", () => {
  it("fetches a single question by externalId", async () => {
    registerEndpoint("/questions/q-1", () => ({
      data: {
        ...questionSummary,
        contentMd: "題幹",
        sourceUrl: null,
        licenseStatus: "national_exam",
        choices: [],
        examSubject: { ...questionSummary.examSubject, subjects: questionSummary.subjects },
        explanation: null,
        group: null,
        groupPassageMd: null,
        prev: null,
        next: null,
      },
    }));
    const { result } = await runComposable(() => useQuestion("q-1"));
    await vi.waitFor(() => expect(result.isSuccess.value).toBe(true));
    expect(result.data.value?.externalId).toBe("q-1");
  });
});
