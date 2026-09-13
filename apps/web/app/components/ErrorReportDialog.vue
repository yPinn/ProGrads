<script setup lang="ts">
import { reactive } from "vue";
import { CreateErrorReportSchema, type ErrorReportType } from "@prograds/shared";
import type { FormSubmitEvent } from "@nuxt/ui";
import { ERROR_REPORT_TYPE_LABELS } from "~/utils/report-labels";
import { useSubmitErrorReport } from "~/composables/useSubmitErrorReport";

// questionExternalId comes from the page, not the user — the form only collects type+description.
const props = defineProps<{ questionExternalId: string }>();
const open = defineModel<boolean>("open", { default: false });

const formSchema = CreateErrorReportSchema.omit({ questionExternalId: true });
const state = reactive<{ type: ErrorReportType | undefined; description: string }>({
  type: undefined,
  description: "",
});

const typeOptions = Object.entries(ERROR_REPORT_TYPE_LABELS).map(([value, label]) => ({
  label,
  value: value as ErrorReportType,
}));

const toast = useToast();
const { mutate, isPending } = useSubmitErrorReport();

function onSubmit(event: FormSubmitEvent<typeof formSchema._output>) {
  mutate(
    { questionExternalId: props.questionExternalId, ...event.data },
    {
      onSuccess: () => {
        toast.add({ title: "回報已送出,感謝協助", color: "success" });
        open.value = false;
        state.type = undefined;
        state.description = "";
      },
      onError: () => {
        toast.add({ title: "送出失敗,請稍後再試", color: "error" });
      },
    },
  );
}
</script>

<template>
  <UModal v-model:open="open" title="回報此題錯誤" description="協助我們修正題目或解析的問題。">
    <template #body>
      <UForm :schema="formSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="錯誤類型" name="type" required>
          <USelect
            v-model="state.type"
            :items="typeOptions"
            value-key="value"
            placeholder="選擇錯誤類型"
            class="w-full"
          />
        </UFormField>
        <UFormField label="描述" name="description" required>
          <UTextarea
            v-model="state.description"
            :rows="4"
            placeholder="請描述問題(例如:第 3 題答案應為 B,不是 A)"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <AppButton intent="ghost" :disabled="isPending" @click="open = false">取消</AppButton>
          <AppButton type="submit" intent="primary" :loading="isPending">送出回報</AppButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
