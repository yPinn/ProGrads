// Locale-aware date/time formatting for display. Pinned to zh-TW + Asia/Taipei so the
// output is stable regardless of the viewer's browser timezone (admissions data is
// Taiwan-local). Formatter instances are built once at module load and reused.
const LOCALE = "zh-TW";
const TIME_ZONE = "Asia/Taipei";

// Date and time are formatted separately and joined: zh-TW keeps the 年月日 layout for a
// date-only formatter, but flips to a 2025/01/08 slash layout once hour12:false is added to
// a combined date+time formatter. Composing the two keeps 年月日 alongside a 24-hour clock.
const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: TIME_ZONE,
});

const timeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeStyle: "short",
  hour12: false,
  timeZone: TIME_ZONE,
});

// Stable Taipei calendar-day key (YYYY-MM-DD) for same-day comparison.
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

// Numeric parts zero-padded to two chars so single-digit months/days keep a constant
// width (2025年01月08日 vs 2025年01月19日) and stay aligned in tabular lists. The 2-digit
// Intl options can't be used directly — zh-TW switches to a 2025/01/08 slash layout.
const PADDED_PARTS = new Set(["month", "day", "hour"]);

function formatPadded(fmt: Intl.DateTimeFormat, iso: string): string {
  return fmt
    .formatToParts(new Date(iso))
    .map((part) => (PADDED_PARTS.has(part.type) ? part.value.padStart(2, "0") : part.value))
    .join("");
}

// Date + time, e.g. 2025年01月02日 09:00 (24-hour).
export function formatDateTime(iso: string): string {
  return `${formatPadded(dateFmt, iso)} ${formatPadded(timeFmt, iso)}`;
}

// Date only, e.g. 2025年01月02日.
export function formatDate(iso: string): string {
  return formatPadded(dateFmt, iso);
}

// A start–end span. Falls back to a single datetime when end is absent. Same-day spans
// collapse the end to a time only (2025年01月02日 09:00 – 11:00). The " – " keeps a
// fixed gap so values line up in tabular lists.
export function formatDateRange(start: string, end: string | null | undefined): string {
  const startText = formatDateTime(start);
  if (!end) return startText;

  const endText = isSameDay(new Date(start), new Date(end))
    ? formatPadded(timeFmt, end)
    : formatDateTime(end);
  return `${startText} – ${endText}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return dayKeyFmt.format(a) === dayKeyFmt.format(b);
}
