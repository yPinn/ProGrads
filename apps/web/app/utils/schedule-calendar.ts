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

// ISO 8601 (any offset) → the calendar day it falls on in Taipei. Slicing the string would
// drop the offset; going through Instant keeps a +00:00 source landing on the right day.
export function isoToPlainDate(iso: string): Temporal.PlainDate {
  return Temporal.Instant.from(iso).toZonedDateTimeISO(TZ).toPlainDate();
}

// Phase → colour bucket. One Schedule-X "calendar" per admission phase so a registration
// block reads the same hue here as under the "報名" heading in the list view. Hand-picked
// hex (Schedule-X needs concrete light/dark values; it can't read our CSS design tokens).
const PHASE_COLORS: Record<AdmissionPhase, { light: ColorTriplet; dark: ColorTriplet }> = {
  registration: {
    light: { main: "#2563eb", container: "#dbeafe", onContainer: "#1e3a8a" },
    dark: { main: "#93c5fd", container: "#1e3a5f", onContainer: "#dbeafe" },
  },
  exam: {
    light: { main: "#d97706", container: "#fef3c7", onContainer: "#7c2d12" },
    dark: { main: "#fcd34d", container: "#4a2f0a", onContainer: "#fef3c7" },
  },
  selection: {
    light: { main: "#7c3aed", container: "#ede9fe", onContainer: "#4c1d95" },
    dark: { main: "#c4b5fd", container: "#3b2a63", onContainer: "#ede9fe" },
  },
  result: {
    light: { main: "#059669", container: "#d1fae5", onContainer: "#064e3b" },
    dark: { main: "#6ee7b7", container: "#0c3b2e", onContainer: "#d1fae5" },
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

// Open the calendar on the earliest event so a freshly switched year lands on populated months
// rather than today (admission seasons run months ahead). Falls back to today when empty.
export function initialSelectedDate(items: AdmissionScheduleItem[]): Temporal.PlainDate {
  if (items.length === 0) return Temporal.Now.plainDateISO(TZ);
  return items
    .map((item) => isoToPlainDate(item.at))
    .reduce((min, date) => (Temporal.PlainDate.compare(date, min) < 0 ? date : min));
}
