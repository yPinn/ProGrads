-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "admissionGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Exam_admissionGroupId_idx" ON "Exam"("admissionGroupId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_admissionGroupId_fkey" FOREIGN KEY ("admissionGroupId") REFERENCES "AdmissionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
