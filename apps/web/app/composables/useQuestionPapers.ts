import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { PapersResponseSchema, type QuestionQuery } from "@prograds/shared";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

// GET /questions/papers — 題庫的「考卷為單位」視圖:每筆為一張卷及其題目清單(供題號選擇)。
// 與 useQuestions 同樣的 { data, meta } 信封與分頁,但分頁是在卷層級。
export function useQuestionPapers(query: MaybeRefOrGetter<QuestionQuery>) {
  const { $api } = useNuxtApp();
  const queryKey = computed(() => ["question-papers", toValue(query)] as const);

  return useQuery({
    queryKey,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const body = await $api("/questions/papers", { query: toValue(query) });
      const { data, meta } = PapersResponseSchema.parse(body);
      return { items: data, meta };
    },
  });
}
