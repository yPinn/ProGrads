-- Faculty education: a member's degrees (PhD/Master/…), the awarding institution being a
-- resource signal. A list, so multiple/dual degrees fit; replaced wholesale on sync.
CREATE TYPE "DegreeLevel" AS ENUM ('bachelor', 'master', 'phd', 'other');

CREATE TABLE "FacultyDegree" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "level" "DegreeLevel" NOT NULL,
    "institution" TEXT NOT NULL,
    "field" TEXT,
    "year" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "FacultyDegree_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FacultyDegree_facultyId_idx" ON "FacultyDegree"("facultyId");

ALTER TABLE "FacultyDegree" ADD CONSTRAINT "FacultyDegree_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
