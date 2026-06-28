// Installs globalThis.Temporal (runtime) and the ambient `Temporal` namespace. Schedule-X's
// types reference that global, so importing the global build keeps our PlainDate identical to
// the one createCalendar() expects — a plain `temporal-polyfill` import is a distinct type.
import "temporal-polyfill/global";
import type { AdmissionScheduleItem } from "@prograds/shared";
import type { CalendarEvent, CalendarType } from "@schedule-x/calendar";
import {
  ADMISSION_EVENT_LABELS,
  ADMISSION_EVENT_PHASE,
  ADMISSION_PHASE_LABELS,
  ADMISSION_PHASE_ORDER,
  type AdmissionPhase,
} from "./admission-labels";

// Admission datetimes are stored as ISO 8601 with offset, but the schedule is browsed by
// calendar day, so events render as all-day blocks in Taipei local time. The exact time of
// day (e.g. exam start) stays in the list view that sits beside the calendar.
const TZ = "Asia/Taipei";

// ISO 8601 (any offset) → the same instant as a Taipei ZonedDateTime (keeps the time of day).
export function isoToZonedDateTime(iso: string): Temporal.ZonedDateTime {
  return Temporal.Instant.from(iso).toZonedDateTimeISO(TZ);
}

// ISO 8601 (any offset) → the calendar day it falls on in Taipei. Slicing the string would
// drop the offset; going through Instant keeps a +00:00 source landing on the right day.
export function isoToPlainDate(iso: string): Temporal.PlainDate {
  return isoToZonedDateTime(iso).toPlainDate();
}

// Phase → colour bucket. One Schedule-X "calendar" per admission phase so a registration block
// reads the same hue as under the "報名" heading in the list view. Concrete hex (Schedule-X can't
// read CSS tokens) but drawn from the Homer ramps (design/tokens.json): info / warning / secondary
// / success for 報名 / 考試 / 甄選 / 放榜. Light = role-600 main on a role-100 chip with role-900
// text; dark inverts. The calendar follows the app theme through the --sx-* chrome mapping (see
// ScheduleCalendar.vue); these phase chips stay legible on both the cream and dark surfaces.
const PHASE_COLORS: Record<AdmissionPhase, { light: ColorTriplet; dark: ColorTriplet }> = {
  registration: {
    light: { main: "#4d5f86", container: "#e1e5ee", onContainer: "#253047" },
    dark: { main: "#8e9ec0", container: "#253047", onContainer: "#e1e5ee" },
  },
  exam: {
    light: { main: "#9c6408", container: "#f2e6d8", onContainer: "#4b2e00" },
    dark: { main: "#d2a46b", container: "#4b2e00", onContainer: "#f2e6d8" },
  },
  selection: {
    light: { main: "#8f7c38", container: "#edeadd", onContainer: "#43370c" },
    dark: { main: "#c6b782", container: "#43370c", onContainer: "#edeadd" },
  },
  result: {
    light: { main: "#4c6941", container: "#e1e8df", onContainer: "#24361e" },
    dark: { main: "#8ea785", container: "#24361e", onContainer: "#e1e8df" },
  },
};

type ColorTriplet = { main: string; container: string; onContainer: string };

// Stable event id: a school fires each event type at most once per season, so this is unique
// across the year's list and lets Schedule-X diff on events.set() without remounting. Schedule-X
// feeds the id to document.querySelector, so it must be a valid CSS ident — the ISO `at`'s ':'
// and '+' are replaced with '-' (digits still differ, so distinct instants stay distinct).
export function eventId(item: AdmissionScheduleItem): string {
  return `${item.school.slug}-${item.event}-${item.at}`.replace(/[^A-Za-z0-9_-]/g, "-");
}

// Schedule-X calendar definitions, keyed by phase. Passed once as config.calendars; events
// reference them by calendarId.
export function buildScheduleCalendars(): Record<AdmissionPhase, CalendarType> {
  return Object.fromEntries(
    ADMISSION_PHASE_ORDER.map((phase) => [
      phase,
      {
        colorName: phase,
        label: ADMISSION_PHASE_LABELS[phase],
        lightColors: PHASE_COLORS[phase].light,
        darkColors: PHASE_COLORS[phase].dark,
      },
    ]),
  ) as Record<AdmissionPhase, CalendarType>;
}

// Flatten the API's schedule items into Schedule-X all-day events. A null endAt collapses to a
// single-day block (start === end); a range spans inclusive start..end calendar days.
export function toCalendarEvents(items: AdmissionScheduleItem[]): CalendarEvent[] {
  return items.map((item) => ({
    id: eventId(item),
    start: isoToPlainDate(item.at),
    end: isoToPlainDate(item.endAt ?? item.at),
    title: `${ADMISSION_EVENT_LABELS[item.event]}・${item.school.name}`,
    calendarId: ADMISSION_EVENT_PHASE[item.event],
    ...(item.location ? { location: item.location } : {}),
  }));
}

// Timed variant for the hour-axis views (Week/Day): keep the time of day from `at`/`endAt`
// (Taipei local) as a ZonedDateTime instead of collapsing to an all-day block — this is where
// 考試 start/end times matter. A null endAt gets a 1-hour default so point events (e.g. 放榜)
// still render as a block on the time axis.
export function toTimedEvents(items: AdmissionScheduleItem[]): CalendarEvent[] {
  return items.map((item) => {
    const start = isoToZonedDateTime(item.at);
    return {
      id: eventId(item),
      start,
      end: item.endAt ? isoToZonedDateTime(item.endAt) : start.add({ hours: 1 }),
      title: `${ADMISSION_EVENT_LABELS[item.event]}・${item.school.name}`,
      calendarId: ADMISSION_EVENT_PHASE[item.event],
      ...(item.location ? { location: item.location } : {}),
    };
  });
}

// Open the calendar on the earliest event so a freshly switched year lands on populated months
// rather than today (admission seasons run months ahead). Falls back to today when empty.
export function initialSelectedDate(items: AdmissionScheduleItem[]): Temporal.PlainDate {
  if (items.length === 0) return Temporal.Now.plainDateISO(TZ);
  return items
    .map((item) => isoToPlainDate(item.at))
    .reduce((min, date) => (Temporal.PlainDate.compare(date, min) < 0 ? date : min));
}
