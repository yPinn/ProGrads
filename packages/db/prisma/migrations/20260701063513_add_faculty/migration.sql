-- CreateEnum
CREATE TYPE "ThesisRole" AS ENUM ('advised', 'authored');

-- CreateTable
CREATE TABLE "FacultyMember" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "title" TEXT,
    "lab" TEXT,
    "homepage" TEXT,
    "sourceUrl" TEXT,
    "researchAreas" TEXT[],
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyThesis" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "role" "ThesisRole" NOT NULL DEFAULT 'advised',
    "url" TEXT,
    "metadata" JSONB,

    CONSTRAINT "FacultyThesis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacultyMember_departmentId_idx" ON "FacultyMember"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyMember_departmentId_slug_key" ON "FacultyMember"("departmentId", "slug");

-- CreateIndex
CREATE INDEX "FacultyThesis_facultyId_idx" ON "FacultyThesis"("facultyId");

-- AddForeignKey
ALTER TABLE "FacultyMember" ADD CONSTRAINT "FacultyMember_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyThesis" ADD CONSTRAINT "FacultyThesis_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
