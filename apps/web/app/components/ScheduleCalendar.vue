<script setup lang="ts">
import { shallowRef, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { ScheduleXCalendar } from "@schedule-x/vue";
import {
  createCalendar,
  createViewMonthGrid,
  createViewWeek,
  createViewDay,
  createViewList,
} from "@schedule-x/calendar";
import "@schedule-x/theme-default/dist/index.css";
import type { AdmissionScheduleItem } from "@prograds/shared";
import {
  buildScheduleCalendars,
  toCalendarEvents,
  toTimedEvents,
  initialSelectedDate,
} from "~/utils/schedule-calendar";

// Schedule-X view, coloured by admission phase. `view` selects the layout: month = all-day
// overview (default, "what's happening around when"); week/day = hour-axis timetable where 考試
// start/end times matter; list = chronological. Hour-axis views need timed events; the rest use
// all-day blocks. View is fixed per instance — a parent switching view should pass :key to remount.
type CalendarView = "month" | "week" | "day" | "list";
const props = withDefaults(defineProps<{ items: AdmissionScheduleItem[]; view?: CalendarView }>(), {
  view: "month",
});

const isTimed = props.view === "week" || props.view === "day";
const mapEvents = isTimed ? toTimedEvents : toCalendarEvents;

function createView(view: CalendarView) {
  switch (view) {
    case "week":
      return createViewWeek();
    case "day":
      return createViewDay();
    case "list":
      return createViewList();
    default:
      return createViewMonthGrid();
  }
}

// Schedule-X drives its own Preact-signals tree, so keep the app instance out of Vue's deep
// reactivity (shallowRef) to avoid the two systems fighting over the same object. The Homer
// theme lives in assets/css/schedule-x.css (global, shared by every calendar/view) keyed off
// the .schedule-calendar class; it maps --sx-* to --ui-* tokens that flip with the .dark
// cascade, so no Schedule-X isDark/setTheme bridge is needed.
const calendarApp = shallowRef(
  createCalendar({
    views: [createView(props.view)],
    events: mapEvents(props.items),
    calendars: buildScheduleCalendars(),
    selectedDate: initialSelectedDate(props.items),
    locale: "zh-TW",
  }),
);

// Same-year refetches keep the key stable, so push new events through the events facade
// rather than remounting (preserves the user's current month/scroll position).
watch(
  () => props.items,
  (items) => calendarApp.value.events.set(mapEvents(items)),
);

// Schedule-X's Vue wrapper renders into `document.getElementById(id)` inside its own mounted
// hook. When this calendar first mounts inside an out-in transition (the page transition and
// QueryState's fade both use mode="out-in"), Vue fires child mounted hooks before the new
// subtree is attached to the document — so getElementById returns null and Preact throws
// "Cannot read properties of null (reading '__k')". Gate the wrapper until our root is actually
// connected to the live DOM, so it only mounts once getElementById can find its element.
const rootEl = ref<HTMLElement | null>(null);
const ready = ref(false);
let rafId = 0;

onMounted(() => {
  const waitForConnection = () => {
    if (rootEl.value?.isConnected) ready.value = true;
    else rafId = requestAnimationFrame(waitForConnection);
  };
  waitForConnection();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  calendarApp.value.destroy();
});
</script>

<template>
  <div ref="rootEl">
    <!-- view modifier lets schedule-x.css give hour-axis/list views their own height -->
    <ScheduleXCalendar
      v-if="ready"
      :calendar-app="calendarApp"
      class="schedule-calendar"
      :class="`schedule-calendar--${view}`"
    />
  </div>
</template>
