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

// Unique departments across {department} link rows (preserves first-seen order).
export function uniqueDepartments(links: { department: DepartmentRow }[]) {
  const seen = new Map<string, ReturnType<typeof mapDepartment>>();
  for (const { department } of links) {
    if (!seen.has(department.id)) seen.set(department.id, mapDepartment(department));
  }
  return [...seen.values()];
}
