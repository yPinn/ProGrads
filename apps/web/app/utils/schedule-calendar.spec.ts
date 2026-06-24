// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { AdmissionScheduleItem } from "@prograds/shared";
import {
  isoToPlainDate,
  toCalendarEvents,
  buildScheduleCalendars,
  initialSelectedDate,
  eventId,
} from "./schedule-calendar";

// Map and return the sole event, asserting non-empty so indexed access stays typed.
const onlyEvent = (over: Partial<AdmissionScheduleItem> = {}) => {
  const [ev] = toCalendarEvents([item(over)]);
  if (!ev) throw new Error("expected one event");
  return ev;
};

const item = (over: Partial<AdmissionScheduleItem> = {}): AdmissionScheduleItem => ({
  school: { slug: "ntu", name: "國立臺灣大學" },
  year: 2025,
  admissionType: "exam",
  event: "registration_start",
  at: "2025-10-01T09:00:00+08:00",
  endAt: null,
  location: null,
  sequence: null,
  ...over,
});

describe("isoToPlainDate (Asia/Taipei)", () => {
  it("keeps the local day for a Taipei-offset timestamp", () => {
    expect(isoToPlainDate("2025-10-01T09:00:00+08:00").toString()).toBe("2025-10-01");
  });

  it("rolls a UTC instant forward to its Taipei calendar day", () => {
    // 2025-10-01T16:30Z is already Oct 2 in Taipei (+08:00).
    expect(isoToPlainDate("2025-10-01T16:30:00Z").toString()).toBe("2025-10-02");
  });
});

describe("toCalendarEvents", () => {
  it("collapses a null endAt to a single-day block (start === end)", () => {
    const ev = onlyEvent();
    expect(ev.start.toString()).toBe("2025-10-01");
    expect(ev.end.toString()).toBe("2025-10-01");
  });

  it("spans a multi-day range inclusive of the end day", () => {
    const ev = onlyEvent({ at: "2025-10-01T09:00:00+08:00", endAt: "2025-10-05T17:00:00+08:00" });
    expect(ev.start.toString()).toBe("2025-10-01");
    expect(ev.end.toString()).toBe("2025-10-05");
  });

  it("buckets the event into its phase calendar and labels the title", () => {
    const ev = onlyEvent({ event: "written_exam" });
    expect(ev.calendarId).toBe("exam");
    expect(ev.title).toBe("筆試・國立臺灣大學");
  });

  it("omits location when absent and includes it when present", () => {
    expect(onlyEvent().location).toBeUndefined();
    expect(onlyEvent({ location: "綜合教學館" }).location).toBe("綜合教學館");
  });

  it("derives a stable, unique id per school+event+time", () => {
    const it1 = item();
    expect(onlyEvent().id).toBe(eventId(it1));
    // ISO ':' and '+' sanitised to '-' so the id is a valid CSS ident for Schedule-X.
    expect(eventId(it1)).toBe("ntu-registration_start-2025-10-01T09-00-00-08-00");
    expect(eventId(it1)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("buildScheduleCalendars", () => {
  it("defines one labelled calendar per phase with light and dark colours", () => {
    const cals = buildScheduleCalendars();
    expect(Object.keys(cals)).toEqual(["registration", "exam", "selection", "result"]);
    expect(cals.registration.label).toBe("報名");
    expect(cals.exam.lightColors?.main).toMatch(/^#/);
    expect(cals.exam.darkColors?.main).toMatch(/^#/);
  });
});

describe("initialSelectedDate", () => {
  it("returns the earliest event day regardless of input order", () => {
    const date = initialSelectedDate([
      item({ at: "2025-12-20T09:00:00+08:00" }),
      item({ at: "2025-09-15T09:00:00+08:00" }),
      item({ at: "2025-11-01T09:00:00+08:00" }),
    ]);
    expect(date.toString()).toBe("2025-09-15");
  });

  it("falls back to today when there are no events", () => {
    expect(initialSelectedDate([]).toString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
