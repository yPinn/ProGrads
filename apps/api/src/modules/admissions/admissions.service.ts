import { Injectable } from "@nestjs/common";
import type { AdmissionEvent, AdmissionGroup, AdmissionScheduleItem } from "@prograds/shared";
import { AdmissionsRepository } from "./admissions.repository.js";

@Injectable()
export class AdmissionsService {
  constructor(private readonly repo: AdmissionsRepository) {}

  // 報名情報:某系所的招生組別,各組含逐年梯次(名額/考科/日程)。
  async getGroups(filters: {
    school: string;
    dept: string;
    year?: number;
  }): Promise<AdmissionGroup[]> {
    const groups = await this.repo.findGroups(filters);
    return groups.map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      displayOrder: g.displayOrder,
      rounds: g.rounds.map((r) => ({
        year: r.year,
        admissionType: r.admissionType,
        quota: r.quota,
        applicants: r.applicants,
        admitted: r.admitted,
        sourceUrl: r.sourceUrl,
        events: r.events.map((e) => ({
          event: e.event,
          at: e.at.toISOString(),
          location: e.location,
        })),
        subjects: r.subjects.map((s) => ({
          slug: s.subject.slug,
          name: s.subject.name,
          note: s.note,
        })),
      })),
    }));
  }

  // 行事曆:某招生季(年)的校級事件,攤平含校與時間。
  async getSchedule(filters: {
    year: number;
    school?: string;
    event?: AdmissionEvent;
  }): Promise<AdmissionScheduleItem[]> {
    const events = await this.repo.findEvents(filters);
    return events.map((e) => ({
      school: { slug: e.season.school.slug, name: e.season.school.name },
      year: e.season.year,
      admissionType: e.season.admissionType,
      event: e.event,
      at: e.at.toISOString(),
      endAt: e.endAt ? e.endAt.toISOString() : null,
      location: e.location,
      sequence: e.sequence,
    }));
  }
}
