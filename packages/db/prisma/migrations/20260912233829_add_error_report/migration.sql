-- CreateEnum
CREATE TYPE "ErrorReportType" AS ENUM ('wrong_answer', 'wrong_explanation', 'typo', 'other');

-- CreateEnum
CREATE TYPE "ErrorReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "ErrorReport" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "type" "ErrorReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ErrorReportStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorReport_questionId_idx" ON "ErrorReport"("questionId");

-- CreateIndex
CREATE INDEX "ErrorReport_status_idx" ON "ErrorReport"("status");

-- AddForeignKey
ALTER TABLE "ErrorReport" ADD CONSTRAINT "ErrorReport_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
