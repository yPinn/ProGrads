<script setup lang="ts">
import { shallowRef, watch, onBeforeUnmount } from "vue";
import { ScheduleXCalendar } from "@schedule-x/vue";
import { createCalendar, createViewMonthGrid } from "@schedule-x/calendar";
import "@schedule-x/theme-default/dist/index.css";
import type { AdmissionScheduleItem } from "@prograds/shared";
import {
  buildScheduleCalendars,
  toCalendarEvents,
  initialSelectedDate,
} from "~/utils/schedule-calendar";

// Month-grid overview of the year's admission events, coloured by phase. Exact times live in
// the list view beside it; this answers "what's happening around when". The page passes
// :key="year" so a year switch remounts this with the right events + selected month.
const props = defineProps<{ items: AdmissionScheduleItem[] }>();

const colorMode = useColorMode();

// Schedule-X drives its own Preact-signals tree, so keep the app instance out of Vue's deep
// reactivity (shallowRef) to avoid the two systems fighting over the same object.
const calendarApp = shallowRef(
  createCalendar({
    views: [createViewMonthGrid()],
    events: toCalendarEvents(props.items),
    calendars: buildScheduleCalendars(),
    selectedDate: initialSelectedDate(props.items),
    locale: "zh-TW",
    isDark: colorMode.value === "dark",
  }),
);

// Same-year refetches keep the key stable, so push new events through the events facade
// rather than remounting (preserves the user's current month/scroll position).
watch(
  () => props.items,
  (items) => calendarApp.value.events.set(toCalendarEvents(items)),
);

// Bridge the app's light/dark toggle into Schedule-X without recreating the calendar.
watch(
  () => colorMode.value,
  (mode) => calendarApp.value.setTheme(mode === "dark" ? "dark" : "light"),
);

onBeforeUnmount(() => calendarApp.value.destroy());
</script>

<template>
  <ScheduleXCalendar :calendar-app="calendarApp" class="schedule-calendar" />
</template>

<style scoped>
/* Sit the calendar on our card surface: app radius, app primary accent, no hard-coded chrome. */
.schedule-calendar {
  --sx-color-primary: var(--ui-primary);
  --sx-rounding: var(--ui-radius);
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}
</style>
