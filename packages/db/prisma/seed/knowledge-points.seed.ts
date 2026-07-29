import type { PrismaClient } from "../../generated/client/client.ts";

// Subject-scoped controlled vocabulary for exam knowledge points. See
// docs/02-data-model.md and docs/09-roadmap.md §考科趨勢.
//
// Flat list (one row per L2 leaf) so the offline text parser
// (tools/content-sync/src/seed-refs.ts readKnowledgePoints) doesn't need to track nested
// bracket depth — it just pairs each entry's `subject` field with the `slug` field that follows
// it. Keep that field order (subject, groupSlug, groupName, slug, name, aliases) per entry.
//
// Only `slug` (the leaf) may be tagged on a question via frontmatter `knowledge_point_slugs`;
// `groupSlug`/`groupName` are pure L1 browsing/governance groups, never tagged directly.
//
// Granularity: derived from the actual collected exam corpus for that subject (which concepts
// recur enough to deserve a stable slug), not an external syllabus imposed top-down. Display
// names use English/original terminology; `aliases` holds every other form (Chinese full name,
// abbreviation, common English variant, common mistranslation) — any count, unstructured, not a
// statistics key.
//
// Empty until a subject's content work builds its first pool — no site-wide upfront taxonomy.
// Add entries here via PR once a subject is ready.
export interface KnowledgePointSeed {
  subject: string; // Subject.slug (packages/db/prisma/seed/taxonomy.seed.ts)
  groupSlug: string;
  groupName: string;
  slug: string;
  name: string;
  aliases?: string[];
}

const KNOWLEDGE_POINTS: KnowledgePointSeed[] = [];

export interface KnowledgePointSeedResult {
  groups: number;
  leaves: number;
}

// Idempotent upsert of L1 groups then L2 leaves, per subject. Full reconcile per subject
// (delete-then-recreate leaves no longer listed) so a shrinking pool doesn't leave stale rows —
// same reasoning as seedTaxonomy's track_subject reconcile; safe because QuestionKnowledgePoint
// cascades on delete.
export async function seedKnowledgePoints(prisma: PrismaClient): Promise<KnowledgePointSeedResult> {
  const bySubject = new Map<string, KnowledgePointSeed[]>();
  for (const entry of KNOWLEDGE_POINTS) {
    const list = bySubject.get(entry.subject) ?? [];
    list.push(entry);
    bySubject.set(entry.subject, list);
  }

  let groups = 0;
  let leaves = 0;

  for (const [subjectSlug, entries] of bySubject) {
    const subject = await prisma.subject.findUnique({
      where: { slug: subjectSlug },
      select: { id: true },
    });
    if (!subject) {
      throw new Error(`unknown subject slug in knowledge-points.seed: "${subjectSlug}"`);
    }

    const groupIdBySlug = new Map<string, string>();
    const wantedSlugs = new Set<string>();

    for (const entry of entries) {
      let groupId = groupIdBySlug.get(entry.groupSlug);
      if (!groupId) {
        const groupRow = await prisma.knowledgePoint.upsert({
          where: { subjectId_slug: { subjectId: subject.id, slug: entry.groupSlug } },
          update: { name: entry.groupName },
          create: { subjectId: subject.id, slug: entry.groupSlug, name: entry.groupName },
        });
        groupId = groupRow.id;
        groupIdBySlug.set(entry.groupSlug, groupId);
        wantedSlugs.add(entry.groupSlug);
        groups += 1;
      }

      await prisma.knowledgePoint.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug: entry.slug } },
        update: { name: entry.name, aliases: entry.aliases ?? [], parentId: groupId },
        create: {
          subjectId: subject.id,
          slug: entry.slug,
          name: entry.name,
          aliases: entry.aliases ?? [],
          parentId: groupId,
        },
      });
      wantedSlugs.add(entry.slug);
      leaves += 1;
    }

    await prisma.knowledgePoint.deleteMany({
      where: { subjectId: subject.id, slug: { notIn: [...wantedSlugs] } },
    });
  }

  return { groups, leaves };
}
