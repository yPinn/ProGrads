import type { PrismaClient } from "../../generated/client/client.ts";

// Starter schools + departments (資工系/資管系), each mapped to its program track.
// Department slug is unique per school, so reusing e.g. "csie" across schools is fine.

type DeptSeed = { slug: string; name: string; track: string };

const SCHOOLS: { slug: string; name: string; departments: DeptSeed[] }[] = [
  {
    slug: "ntu",
    name: "國立臺灣大學",
    departments: [
      { slug: "csie", name: "資訊工程學系", track: "computer-science" },
      { slug: "im", name: "資訊管理學系", track: "info-management" },
    ],
  },
  {
    slug: "nthu",
    name: "國立清華大學",
    departments: [{ slug: "csie", name: "資訊工程學系", track: "computer-science" }],
  },
  {
    slug: "nycu",
    name: "國立陽明交通大學",
    departments: [{ slug: "csie", name: "資訊工程學系", track: "computer-science" }],
  },
  {
    slug: "ncku",
    name: "國立成功大學",
    departments: [
      { slug: "csie", name: "資訊工程學系", track: "computer-science" },
      { slug: "iim", name: "資訊管理研究所", track: "info-management" },
    ],
  },
  {
    slug: "nccu",
    name: "國立政治大學",
    departments: [{ slug: "mis", name: "資訊管理學系", track: "info-management" }],
  },
  {
    slug: "ntust",
    name: "國立臺灣科技大學",
    departments: [{ slug: "csie", name: "資訊工程系", track: "computer-science" }],
  },
  {
    slug: "ntnu",
    name: "國立臺灣師範大學",
    departments: [{ slug: "csie", name: "資訊工程學系", track: "computer-science" }],
  },
];

export interface SchoolsSeedResult {
  schools: number;
  departments: number;
}

// Idempotent upsert of schools → departments. Each department links to its track
// via the trackIdBySlug map produced by seedTaxonomy (run taxonomy first).
export async function seedSchools(
  prisma: PrismaClient,
  trackIdBySlug: Map<string, string>,
): Promise<SchoolsSeedResult> {
  let departmentCount = 0;

  for (const school of SCHOOLS) {
    const row = await prisma.school.upsert({
      where: { slug: school.slug },
      update: { name: school.name },
      create: { slug: school.slug, name: school.name },
    });
    for (const dept of school.departments) {
      const trackId = trackIdBySlug.get(dept.track);
      if (!trackId) throw new Error(`unknown track slug: ${dept.track}`);
      await prisma.department.upsert({
        where: { schoolId_slug: { schoolId: row.id, slug: dept.slug } },
        update: { name: dept.name, trackId },
        create: { schoolId: row.id, slug: dept.slug, name: dept.name, trackId },
      });
      departmentCount++;
    }
  }

  return { schools: SCHOOLS.length, departments: departmentCount };
}
