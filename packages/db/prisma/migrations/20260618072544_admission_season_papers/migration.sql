-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('not_published', 'published', 'superseded');

-- CreateEnum
CREATE TYPE "ExamMethod" AS ENUM ('written', 'review', 'interview');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdmissionEvent" ADD VALUE 'account_open';
ALTER TYPE "AdmissionEvent" ADD VALUE 'document_deadline';
ALTER TYPE "AdmissionEvent" ADD VALUE 'admit_card';
ALTER TYPE "AdmissionEvent" ADD VALUE 'shortlist';
ALTER TYPE "AdmissionEvent" ADD VALUE 'enrollment';

-- AlterTable
ALTER TABLE "AdmissionGroup" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "AdmissionRound" ADD COLUMN     "admissionCode" TEXT,
ADD COLUMN     "applicantType" TEXT,
ADD COLUMN     "calculator" BOOLEAN,
ADD COLUMN     "interviewAt" TIMESTAMP(3),
ADD COLUMN     "interviewWeight" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "methods" "ExamMethod"[],
ADD COLUMN     "resultBatch" INTEGER,
ADD COLUMN     "tiebreak" TEXT[],
ADD COLUMN     "writtenWeight" INTEGER;

-- CreateTable
CREATE TABLE "AdmissionSeason" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "admissionType" "AdmissionType" NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'published',
    "announcedAt" TIMESTAMP(3),
    "applicationFee" INTEGER,
    "interviewFee" INTEGER,
    "feeWaiver" TEXT[],
    "sourceUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionSeasonEvent" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "event" "AdmissionEvent" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "location" TEXT,
    "sequence" INTEGER,
    "note" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AdmissionSeasonEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionExamSlot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "AdmissionExamSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionRoundPaper" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" INTEGER,
    "weight" DOUBLE PRECISION,
    "note" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AdmissionRoundPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionRoundPaperSubject" (
    "paperId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "AdmissionRoundPaperSubject_pkey" PRIMARY KEY ("paperId","subjectId")
);

-- CreateIndex
CREATE INDEX "AdmissionSeason_year_idx" ON "AdmissionSeason"("year");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionSeason_schoolId_year_admissionType_key" ON "AdmissionSeason"("schoolId", "year", "admissionType");

-- CreateIndex
CREATE INDEX "AdmissionSeasonEvent_seasonId_idx" ON "AdmissionSeasonEvent"("seasonId");

-- CreateIndex
CREATE INDEX "AdmissionExamSlot_seasonId_idx" ON "AdmissionExamSlot"("seasonId");

-- CreateIndex
CREATE INDEX "AdmissionRoundPaper_roundId_idx" ON "AdmissionRoundPaper"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionRoundPaper_roundId_name_key" ON "AdmissionRoundPaper"("roundId", "name");

-- CreateIndex
CREATE INDEX "AdmissionRoundPaperSubject_subjectId_idx" ON "AdmissionRoundPaperSubject"("subjectId");

-- AddForeignKey
ALTER TABLE "AdmissionSeason" ADD CONSTRAINT "AdmissionSeason_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionSeasonEvent" ADD CONSTRAINT "AdmissionSeasonEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionExamSlot" ADD CONSTRAINT "AdmissionExamSlot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRoundPaper" ADD CONSTRAINT "AdmissionRoundPaper_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "AdmissionRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRoundPaperSubject" ADD CONSTRAINT "AdmissionRoundPaperSubject_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "AdmissionRoundPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRoundPaperSubject" ADD CONSTRAINT "AdmissionRoundPaperSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
