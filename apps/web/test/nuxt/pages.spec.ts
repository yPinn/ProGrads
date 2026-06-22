import { describe, it, expect, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import SchedulesPage from "~/pages/schedules.vue";
import QuestionsPage from "~/pages/questions/index.vue";
import IndexPage from "~/pages/index.vue";

// The Nuxt test app is a singleton across mountSuspended calls, so its QueryClient cache
// is shared. To stay independent, each page is exercised by a single test with its own
// query key: schedules covers the empty branch, questions covers the data branch.

const paperSummary = {
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
  subjects: [{ id: "s1", slug: "algorithms", name: "演算法" }],
  questions: [{ externalId: "q-1", number: "1", type: "mc", group: null }],
};

registerEndpoint("/schedules", () => ({ data: [] }));
registerEndpoint("/questions/papers", () => ({
  data: [paperSummary],
  meta: { page: 1, pageSize: 20, total: 1 },
}));

describe("schedules page", () => {
  it("shows the empty state when there are no events", async () => {
    const wrapper = await mountSuspended(SchedulesPage);
    await vi.waitFor(() => expect(wrapper.text()).toContain("此學年尚無招生事件"));
  });
});

describe("questions page", () => {
  it("renders paper cards with an in-paper 題號 selector from the API", async () => {
    const wrapper = await mountSuspended(QuestionsPage);
    await vi.waitFor(() => {
      // Paper card shows the 卷名 + 考科 badge; questions render as 題號 buttons.
      expect(wrapper.text()).toContain("計算機概論");
      expect(wrapper.text()).toContain("演算法");
    });
  });
});

describe("index page", () => {
  it("renders the landing heading and tagline", async () => {
    const wrapper = await mountSuspended(IndexPage);
    expect(wrapper.text()).toContain("研究所備考作戰中心");
    expect(wrapper.text()).toContain("一處整合考古題庫");
  });
});
