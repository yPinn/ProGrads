// Shared row-to-DTO projections for the API's read models. Prisma rows carry extra
// fields (timestamps, relations); these pick the exact shape the shared contracts
// expose, so every module returns departments and schools identically.

export interface SchoolRow {
  id: string;
  slug: string;
  name: string;
}

export interface DepartmentRow {
  id: string;
  slug: string;
  name: string;
  schoolId: string;
  trackId: string | null;
}

export function mapSchool(s: SchoolRow) {
  return { id: s.id, slug: s.slug, name: s.name };
}

export function mapDepartment(d: DepartmentRow) {
  return { id: d.id, slug: d.slug, name: d.name, schoolId: d.schoolId, trackId: d.trackId };
}

// Reads a string field from a Prisma `Json?` metadata blob, or null if the blob is
// absent or the key isn't a string. Centralises the guard so callers don't hand-roll
// `typeof x === "string"` checks against loosely-typed metadata.
export function metaString(meta: unknown, key: string): string | null {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const value = (meta as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  return null;
}

// As metaString, but for a finite number field (e.g. ExamSubject.metadata.durationMinutes).
export function metaNumber(meta: unknown, key: string): number | null {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const value = (meta as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export interface FacultyThesisRow {
  id: string;
  title: string;
  year: number | null;
  role: "advised" | "authored";
  url: string | null;
}

export interface FacultyDegreeRow {
  id: string;
  level: "bachelor" | "master" | "phd" | "other";
  institution: string;
  field: string | null;
  year: number | null;
}

export interface FacultyMemberRow {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string | null;
  title: string | null;
  lab: string | null;
  homepage: string | null;
  sourceUrl: string | null;
  note: string | null;
  researchAreas: string[];
  departmentId: string;
  degrees: FacultyDegreeRow[];
  theses: FacultyThesisRow[];
  department: DepartmentRow & { school: SchoolRow };
}

export function mapFacultyThesis(t: FacultyThesisRow) {
  return { id: t.id, title: t.title, year: t.year, role: t.role, url: t.url };
}

export function mapFacultyDegree(d: FacultyDegreeRow) {
  return { id: d.id, level: d.level, institution: d.institution, field: d.field, year: d.year };
}

// Projects a faculty row (+ theses + department/school) to the shared contract shape.
export function mapFacultyMember(m: FacultyMemberRow) {
  return {
    id: m.id,
    name: m.name,
    nameEn: m.nameEn,
    slug: m.slug,
    title: m.title,
    lab: m.lab,
    homepage: m.homepage,
    sourceUrl: m.sourceUrl,
    note: m.note,
    researchAreas: m.researchAreas,
    departmentId: m.departmentId,
    degrees: m.degrees.map(mapFacultyDegree),
    theses: m.theses.map(mapFacultyThesis),
    department: { ...mapDepartment(m.department), school: mapSchool(m.department.school) },
  };
}

// Unique departments across {department} link rows (preserves first-seen order).
export function uniqueDepartments(links: { department: DepartmentRow }[]) {
  const seen = new Map<string, ReturnType<typeof mapDepartment>>();
  for (const { department } of links) {
    if (!seen.has(department.id)) seen.set(department.id, mapDepartment(department));
  }
  return [...seen.values()];
}
