import { Injectable } from "@nestjs/common";
import { facultyTitleRank, type FacultyMemberWithDepartment } from "@prograds/shared";
import { mapFacultyMember } from "../../common/mappers.js";
import { FacultyRepository } from "./faculty.repository.js";

// Roster order: school → dept → seniority (senior first). Within one rank, the repo's
// displayOrder (the curator's source-page order) is preserved via Array#sort stability,
// since findFaculty returns rows ordered by (school, dept, displayOrder). Sorting here
// (not in SQL) keeps the free-text title→rank logic in one testable place — see
// facultyTitleRank in @prograds/shared. Rosters are small and unpaginated.
function byRoster(a: FacultyMemberWithDepartment, b: FacultyMemberWithDepartment): number {
  return (
    a.department.school.slug.localeCompare(b.department.school.slug) ||
    a.department.slug.localeCompare(b.department.slug) ||
    facultyTitleRank(a.title) - facultyTitleRank(b.title)
  );
}

@Injectable()
export class FacultyService {
  constructor(private readonly repo: FacultyRepository) {}

  async getFaculty(filters: {
    school?: string;
    dept?: string;
    track?: string;
  }): Promise<FacultyMemberWithDepartment[]> {
    const rows = await this.repo.findFaculty(filters);
    return rows.map(mapFacultyMember).sort(byRoster);
  }
}
