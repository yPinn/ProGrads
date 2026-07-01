import { z } from "zod";
import { AdmissionType, ExamMethod } from "./enums.js";

// Admission content-file contracts (schedule.yml / departments.yml, under
// admissions/<year>/<school>/[<season>/]). Single source of truth for the admissions sync.
// snake_case = file keys. Region A schedule.yml = season frame + exam-period timetable;
// Region B departments.yml = department/group detail. See docs/03-content-pipeline.md.
// Flexibility: every object is .strict() to catch typos, but keeps a note + metadata escape
// hatch (metadata maps to the DB metadata jsonb). Date-only values use midnight (T00:00:00+08:00).

const note = z.string().optional();
const metadata = z.record(z.unknown()).optional();
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "want YYYY-MM-DD");
const DateTimeStr = z.string().datetime({ offset: true }); // RFC3339 + offset, e.g. 2026-02-01T09:00:00+08:00
const TimeStr = z.string().regex(/^\d{2}:\d{2}$/, "want HH:MM");
const Url = z.string().url().nullable().optional();

// Prospectus freshness.
export const AdmissionStatus = z.enum(["not_published", "published", "superseded"]);
export type AdmissionStatus = z.infer<typeof AdmissionStatus>;

// ---------- Region A: schedule.yml ----------

// Event vocabulary, one-to-one with the DB AdmissionEvent enum (sync maps directly, same order).
export const ScheduleEvent = z.enum([
  "account_open", // obtain payment account (pre-registration)
  "registration_start",
  "registration_end",
  "document_deadline", // review-document upload deadline
  "admit_card", // admission ticket printing
  "written_exam", // written exam (end = multi-day close)
  "shortlist", // interview shortlist announced
  "interview", // oral / interview / second-round
  "result", // results (sequence = batch)
  "enrollment", // enrollment / report-in
]);
export type ScheduleEvent = z.infer<typeof ScheduleEvent>;

export const ScheduleEventItem = z
  .object({
    event: ScheduleEvent,
    at: DateTimeStr,
    end: DateTimeStr.optional(),
    location: z.string().nullable().optional(),
    sequence: z.number().int().optional(), // result batch
    note,
    metadata,
  })
  .strict();

export const ExamPeriod = z
  .object({ period: z.number().int(), start: TimeStr, end: TimeStr, note })
  .strict();

export const ExamSlotDay = z.object({ date: DateStr, periods: z.array(ExamPeriod), note }).strict();

export const AdmissionFees = z
  .object({
    application: z.number().int().nullable(), // application fee (TWD)
    interview: z.number().int().nullable().optional(), // interview fee
    waiver: z.array(z.string()).optional(), // low_income / lower_middle_income
    note,
    metadata,
  })
  .strict();

export const ScheduleYml = z
  .object({
    school: z.string().min(1),
    year: z.number().int(), // Gregorian academic year
    admission_type: AdmissionType.default("exam"),
    status: AdmissionStatus.default("published"),
    announced_at: DateStr.nullable().optional(), // announcement date = freshness anchor
    source_url: Url,
    fees: AdmissionFees.optional(),
    schedule: z.array(ScheduleEventItem).default([]),
    slots: z.array(ExamSlotDay).default([]), // exam-period timetable (school-level)
    note,
    metadata,
  })
  .strict();
export type ScheduleYml = z.infer<typeof ScheduleYml>;

// ---------- Region B: departments.yml ----------

export const AdmissionPaper = z
  .object({
    name: z.string().min(1), // paper / subject display name
    subjects: z.array(z.string()).optional(), // shared subject slugs
    section: z.number().int().optional(), // section (links to schedule slots)
    weight: z.number().optional(), // % of total score
    note,
    metadata,
  })
  .strict();

export const AdmissionGroupYml = z
  .object({
    code: z.string().default(""), // ASCII a/b/c; "" = no grouping
    name: z.string().optional(),
    admission_code: z.string().optional(), // official admission code
    applicant_type: z.string().optional(), // applicant type
    quota: z.number().int().nullable().optional(),
    result_batch: z.number().int().optional(), // result batch
    methods: z.array(ExamMethod).optional(),
    calculator: z.boolean().optional(),
    exam: z
      .object({
        written: z.number().optional(),
        review: z.number().optional(),
        interview: z.number().optional(),
      })
      .strict()
      .optional(), // written / review / interview weight %
    interview_at: z.union([DateStr, DateTimeStr]).optional(),
    papers: z.array(AdmissionPaper).optional(),
    tiebreak: z.array(z.string()).optional(), // tiebreak order
    note,
    metadata,
  })
  .strict();

export const DepartmentYml = z
  .object({
    dept: z.string().min(1), // dept slug
    source_url: Url,
    groups: z.array(AdmissionGroupYml),
    papers: z.array(AdmissionPaper).optional(), // department-level subject union (shared across groups; per-group split pending review)
    note,
    metadata,
  })
  .strict();

export const DepartmentsYml = z
  .object({
    school: z.string().min(1),
    year: z.number().int(),
    depts: z.array(DepartmentYml),
    note,
    metadata,
  })
  .strict();
export type DepartmentsYml = z.infer<typeof DepartmentsYml>;
