import { Injectable, NotFoundException } from "@nestjs/common";
import type { DepartmentWithSchool, School, SchoolWithDepartments } from "@prograds/shared";
import { SchoolsRepository } from "./schools.repository.js";

@Injectable()
export class SchoolsService {
  constructor(private readonly repo: SchoolsRepository) {}

  async getSchools(): Promise<School[]> {
    const rows = await this.repo.findSchools();
    return rows.map((s) => ({ id: s.id, slug: s.slug, name: s.name }));
  }

  async getSchool(slug: string): Promise<SchoolWithDepartments> {
    const school = await this.repo.findSchoolBySlug(slug);
    if (!school) {
      throw new NotFoundException(`school not found: ${slug}`);
    }
    return {
      id: school.id,
      slug: school.slug,
      name: school.name,
      departments: school.departments.map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        schoolId: d.schoolId,
        trackId: d.trackId,
      })),
    };
  }

  async getDepartments(filters: {
    track?: string;
    school?: string;
  }): Promise<DepartmentWithSchool[]> {
    const rows = await this.repo.findDepartments(filters);
    return rows.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      schoolId: d.schoolId,
      trackId: d.trackId,
      school: { id: d.school.id, slug: d.school.slug, name: d.school.name },
    }));
  }
}
