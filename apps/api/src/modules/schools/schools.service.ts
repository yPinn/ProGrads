import { Injectable, NotFoundException } from "@nestjs/common";
import type { DepartmentWithSchool, School, SchoolWithDepartments } from "@prograds/shared";
import { mapDepartment, mapSchool } from "../../common/mappers.js";
import { SchoolsRepository } from "./schools.repository.js";

@Injectable()
export class SchoolsService {
  constructor(private readonly repo: SchoolsRepository) {}

  async getSchools(): Promise<School[]> {
    const rows = await this.repo.findSchools();
    return rows.map(mapSchool);
  }

  async getSchool(slug: string): Promise<SchoolWithDepartments> {
    const school = await this.repo.findSchoolBySlug(slug);
    if (!school) {
      throw new NotFoundException(`school not found: ${slug}`);
    }
    return {
      ...mapSchool(school),
      departments: school.departments.map(mapDepartment),
    };
  }

  async getDepartments(filters: {
    track?: string;
    school?: string;
  }): Promise<DepartmentWithSchool[]> {
    const rows = await this.repo.findDepartments(filters);
    return rows.map((d) => ({ ...mapDepartment(d), school: mapSchool(d.school) }));
  }
}
