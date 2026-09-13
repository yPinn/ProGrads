import { useMutation } from "@tanstack/vue-query";
import { ErrorReportResponseSchema, type CreateErrorReport } from "@prograds/shared";

// POST /reports — public, unauthenticated error report on a question/explanation.
export function useSubmitErrorReport() {
  const { $api } = useNuxtApp();

  return useMutation({
    mutationFn: async (input: CreateErrorReport) => {
      const body = await $api("/reports", { method: "POST", body: input });
      return ErrorReportResponseSchema.parse(body).data;
    },
  });
}
