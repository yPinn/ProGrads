-- DropIndex
DROP INDEX "ExamSubject_examId_idx";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "ExamSubject_examId_name_key" ON "ExamSubject"("examId", "name");
