-- Rekey FacultyMember identity from slug to Chinese name (always available from official
-- pages, more stable and collision-resistant than romanized slugs). slug becomes an
-- optional URL handle rather than the natural key.
DROP INDEX "FacultyMember_departmentId_slug_key";

ALTER TABLE "FacultyMember" ALTER COLUMN "slug" DROP NOT NULL;

CREATE UNIQUE INDEX "FacultyMember_departmentId_name_key" ON "FacultyMember"("departmentId", "name");
