import type { PrismaClient } from "@prograds/db";
import { FacultyYml } from "@prograds/shared";
import { parse as parseYaml } from "yaml";
import type { Resolver } from "./sync.js";

export type FacultyResult =
  | { school: string; dept: string; members: number; theses: number }
  | { skipped: string };

// faculty/<school>/<dept>.yml; school/dept are cross-checked against the file body.
export function parseFacultyPath(relPath: string): { school: string; dept: string } {
  const parts = relPath.split("/");
  if (parts.length !== 3 || parts[0] !== "faculty" || !parts[2]?.endsWith(".yml")) {
    throw new Error(`unexpected faculty path: ${relPath} (want faculty/<school>/<dept>.yml)`);
  }
  const school = parts[1] ?? "";
  const dept = parts[2].replace(/\.yml$/, "");
  if (!school || !dept) {
    throw new Error(`unexpected faculty path: ${relPath} (want faculty/<school>/<dept>.yml)`);
  }
  return { school, dept };
}

// Parse, validate, resolve and upsert one faculty file: the department's faculty roster.
// Members are keyed by (departmentId, slug) for idempotent upsert; theses have no natural
// key so they are replaced wholesale (mirroring the admissions season children).
export async function syncFaculty(
  prisma: PrismaClient,
  resolver: Resolver,
  relPath: string,
  rawYml: string,
): Promise<FacultyResult> {
  const pathRef = parseFacultyPath(relPath);
  const yml = FacultyYml.parse(parseYaml(rawYml));

  if (yml.school !== pathRef.school || yml.dept !== pathRef.dept) {
    throw new Error(
      `faculty.yml mismatch in ${relPath}: body (${yml.school}, ${yml.dept}) != path (${pathRef.school}, ${pathRef.dept})`,
    );
  }

  const school = await resolver.school(yml.school);
  const department = await resolver.department(school.id, yml.dept);

  let members = 0;
  let theses = 0;

  for (const [index, m] of yml.members.entries()) {
    const memberData = {
      slug: m.slug ?? null,
      nameEn: m.name_en ?? null,
      title: m.title ?? null,
      lab: m.lab ?? null,
      homepage: m.homepage ?? null,
      sourceUrl: m.source_url ?? yml.source_url ?? null,
      note: m.note ?? null,
      researchAreas: m.research_areas,
      displayOrder: index,
      metadata: { ...(m.metadata ?? {}), sourcePath: relPath },
    };

    await prisma.$transaction(async (tx) => {
      const member = await tx.facultyMember.upsert({
        where: { departmentId_name: { departmentId: department.id, name: m.name } },
        update: memberData,
        create: { departmentId: department.id, name: m.name, ...memberData },
      });

      await tx.facultyThesis.deleteMany({ where: { facultyId: member.id } });
      if (m.theses.length > 0) {
        await tx.facultyThesis.createMany({
          data: m.theses.map((t) => ({
            facultyId: member.id,
            title: t.title,
            year: t.year ?? null,
            role: t.role,
            url: t.url ?? null,
          })),
        });
      }
    });

    members++;
    theses += m.theses.length;
  }

  // The file is the department's full roster (one faculty file per department), so drop
  // members no longer listed. This reconciles within-file removals on every sync, without
  // waiting for the file-level prune (which only fires when the whole file is deleted).
  const currentNames = yml.members.map((m) => m.name);
  await prisma.facultyMember.deleteMany({
    where: { departmentId: department.id, name: { notIn: currentNames } },
  });

  return { school: yml.school, dept: yml.dept, members, theses };
}
