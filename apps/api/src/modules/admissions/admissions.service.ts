import { Injectable } from "@nestjs/common";
import type { AdmissionEvent, AdmissionGroup, AdmissionScheduleItem } from "@prograds/shared";
import { AdmissionsRepository } from "./admissions.repository.js";

@Injectable()
export class AdmissionsService {
  constructor(private readonly repo: AdmissionsRepository) {}

  // 報名情報：某系所的招生組別，各組含逐年梯次（名額 / 考科 / 日程）。
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
        admissionCode: r.admissionCode,
        applicantType: r.applicantType,
        quota: r.quota,
        applicants: r.applicants,
        admitted: r.admitted,
        resultBatch: r.resultBatch,
        methods: r.methods,
        calculator: r.calculator,
        writtenWeight: r.writtenWeight,
        reviewWeight: r.reviewWeight,
        interviewWeight: r.interviewWeight,
        interviewAt: r.interviewAt ? r.interviewAt.toISOString() : null,
        tiebreak: r.tiebreak,
        sourceUrl: r.sourceUrl,
        papers: r.papers.map((p) => ({
          name: p.name,
          section: p.section,
          weight: p.weight,
          note: p.note,
          subjects: p.subjects.map((link) => ({
            id: link.subject.id,
            slug: link.subject.slug,
            name: link.subject.name,
          })),
        })),
      })),
    }));
  }

  // 行事曆：某招生季（年）的校級事件，攤平含校與時間。
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
