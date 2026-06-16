import { Injectable, NotFoundException } from "@nestjs/common";
import type { Category, Subject, Track, TrackWithSubjects } from "@prograds/shared";
import { TaxonomyRepository } from "./taxonomy.repository.js";

// Pure domain logic: shapes Prisma rows into the shared contract, enforces existence.
@Injectable()
export class TaxonomyService {
  constructor(private readonly repo: TaxonomyRepository) {}

  async getCategories(): Promise<Category[]> {
    const rows = await this.repo.findCategories();
    return rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));
  }

  async getTracks(categorySlug?: string): Promise<Track[]> {
    const rows = await this.repo.findTracks(categorySlug);
    return rows.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      categoryId: t.categoryId,
    }));
  }

  async getTrack(slug: string): Promise<TrackWithSubjects> {
    const track = await this.repo.findTrackBySlug(slug);
    if (!track) {
      throw new NotFoundException(`track not found: ${slug}`);
    }
    return {
      id: track.id,
      slug: track.slug,
      name: track.name,
      categoryId: track.categoryId,
      subjects: track.subjects.map((ts) => ({
        id: ts.subject.id,
        slug: ts.subject.slug,
        name: ts.subject.name,
      })),
    };
  }

  async getSubject(slug: string): Promise<Subject> {
    const subject = await this.repo.findSubjectBySlug(slug);
    if (!subject) {
      throw new NotFoundException(`subject not found: ${slug}`);
    }
    return { id: subject.id, slug: subject.slug, name: subject.name };
  }
}
