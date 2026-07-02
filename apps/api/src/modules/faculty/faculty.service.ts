import { Injectable } from "@nestjs/common";
import type { FacultyMemberWithDepartment } from "@prograds/shared";
import { mapFacultyMember } from "../../common/mappers.js";
import { FacultyRepository } from "./faculty.repository.js";

@Injectable()
export class FacultyService {
  constructor(private readonly repo: FacultyRepository) {}

  async getFaculty(filters: {
    school?: string;
    dept?: string;
    track?: string;
  }): Promise<FacultyMemberWithDepartment[]> {
    const rows = await this.repo.findFaculty(filters);
    return rows.map(mapFacultyMember);
  }
}
