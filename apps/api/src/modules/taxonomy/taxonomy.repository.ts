import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

// Thin data-access layer over Prisma; no business logic. See docs/01-architecture.md.
@Injectable()
export class TaxonomyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategories() {
    return this.prisma.category.findMany({ orderBy: { slug: "asc" } });
  }

  findTracks(categorySlug?: string) {
    return this.prisma.programTrack.findMany({
      where: categorySlug ? { category: { slug: categorySlug } } : undefined,
      orderBy: { slug: "asc" },
    });
  }

  findTrackBySlug(slug: string) {
    return this.prisma.programTrack.findUnique({
      where: { slug },
      include: {
        subjects: {
          include: { subject: true },
          orderBy: { subject: { slug: "asc" } },
        },
      },
    });
  }

  findSubjects() {
    return this.prisma.subject.findMany({ orderBy: { slug: "asc" } });
  }

  findSubjectBySlug(slug: string) {
    return this.prisma.subject.findUnique({ where: { slug } });
  }
}
