-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_admissionGroupId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_departmentId_fkey";

-- DropIndex
DROP INDEX "Exam_admissionGroupId_idx";

-- DropIndex
DROP INDEX "Exam_schoolId_departmentId_year_admissionType_group_key";

-- DropIndex
DROP INDEX "ExamSubject_examId_name_key";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "admissionGroupId",
DROP COLUMN "departmentId",
DROP COLUMN "group",
DROP COLUMN "licenseStatus",
DROP COLUMN "sourceUrl";

-- AlterTable
ALTER TABLE "ExamSubject" ADD COLUMN     "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'unknown',
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ExamSubjectDepartment" (
    "examSubjectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "ExamSubjectDepartment_pkey" PRIMARY KEY ("examSubjectId","departmentId")
);

-- CreateIndex
CREATE INDEX "ExamSubjectDepartment_departmentId_idx" ON "ExamSubjectDepartment"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_schoolId_year_admissionType_key" ON "Exam"("schoolId", "year", "admissionType");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSubject_examId_slug_key" ON "ExamSubject"("examId", "slug");

-- AddForeignKey
ALTER TABLE "ExamSubjectDepartment" ADD CONSTRAINT "ExamSubjectDepartment_examSubjectId_fkey" FOREIGN KEY ("examSubjectId") REFERENCES "ExamSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubjectDepartment" ADD CONSTRAINT "ExamSubjectDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
