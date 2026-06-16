-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('national_exam', 'school_official', 'unknown');

-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('exam', 'recommended', 'in_service');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('mc', 'essay', 'calc', 'proof', 'cloze', 'listening');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('single_choice', 'multi_choice', 'numeric', 'essay', 'proof');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ai_generated', 'human_verified', 'flagged');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "AdmissionEvent" AS ENUM ('registration_start', 'registration_end', 'written_exam', 'interview', 'result');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramTrack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackSubject" (
    "trackId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "TrackSubject_pkey" PRIMARY KEY ("trackId","subjectId")
);

-- CreateTable
CREATE TABLE "KnowledgePoint" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "KnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "trackId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "admissionType" "AdmissionType" NOT NULL,
    "group" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT,
    "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'unknown',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSubject" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ExamSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSubjectSubject" (
    "examSubjectId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "ExamSubjectSubject_pkey" PRIMARY KEY ("examSubjectId","subjectId")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "examSubjectId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "contentMd" TEXT NOT NULL,
    "points" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSubject" (
    "questionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "QuestionSubject_pkey" PRIMARY KEY ("questionId","subjectId")
);

-- CreateTable
CREATE TABLE "Choice" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "contentMd" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Explanation" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "standardAnswer" TEXT NOT NULL,
    "answerType" "AnswerType" NOT NULL,
    "confidence" "Confidence",
    "modelUsed" TEXT,
    "samplesCount" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'ai_generated',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Explanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionKnowledgePoint" (
    "questionId" TEXT NOT NULL,
    "knowledgePointId" TEXT NOT NULL,

    CONSTRAINT "QuestionKnowledgePoint_pkey" PRIMARY KEY ("questionId","knowledgePointId")
);

-- CreateTable
CREATE TABLE "AdmissionSchedule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "departmentId" TEXT,
    "admissionType" "AdmissionType" NOT NULL,
    "year" INTEGER NOT NULL,
    "event" "AdmissionEvent" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,

    CONSTRAINT "AdmissionSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionStat" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "admissionType" "AdmissionType" NOT NULL,
    "year" INTEGER NOT NULL,
    "applicants" INTEGER,
    "quota" INTEGER,
    "admitted" INTEGER,

    CONSTRAINT "AdmissionStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTrack_slug_key" ON "ProgramTrack"("slug");

-- CreateIndex
CREATE INDEX "ProgramTrack_categoryId_idx" ON "ProgramTrack"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");

-- CreateIndex
CREATE INDEX "TrackSubject_subjectId_idx" ON "TrackSubject"("subjectId");

-- CreateIndex
CREATE INDEX "KnowledgePoint_parentId_idx" ON "KnowledgePoint"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePoint_subjectId_slug_key" ON "KnowledgePoint"("subjectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE INDEX "Department_trackId_idx" ON "Department"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_schoolId_slug_key" ON "Department"("schoolId", "slug");

-- CreateIndex
CREATE INDEX "Exam_year_idx" ON "Exam"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_schoolId_departmentId_year_admissionType_group_key" ON "Exam"("schoolId", "departmentId", "year", "admissionType", "group");

-- CreateIndex
CREATE INDEX "ExamSubject_examId_idx" ON "ExamSubject"("examId");

-- CreateIndex
CREATE INDEX "ExamSubjectSubject_subjectId_idx" ON "ExamSubjectSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_externalId_key" ON "Question"("externalId");

-- CreateIndex
CREATE INDEX "Question_examSubjectId_idx" ON "Question"("examSubjectId");

-- CreateIndex
CREATE INDEX "QuestionSubject_subjectId_idx" ON "QuestionSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Choice_questionId_label_key" ON "Choice"("questionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Explanation_questionId_key" ON "Explanation"("questionId");

-- CreateIndex
CREATE INDEX "QuestionKnowledgePoint_knowledgePointId_idx" ON "QuestionKnowledgePoint"("knowledgePointId");

-- CreateIndex
CREATE INDEX "AdmissionSchedule_schoolId_year_idx" ON "AdmissionSchedule"("schoolId", "year");

-- CreateIndex
CREATE INDEX "AdmissionSchedule_departmentId_idx" ON "AdmissionSchedule"("departmentId");

-- CreateIndex
CREATE INDEX "AdmissionStat_departmentId_idx" ON "AdmissionStat"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionStat_schoolId_departmentId_admissionType_year_key" ON "AdmissionStat"("schoolId", "departmentId", "admissionType", "year");

-- AddForeignKey
ALTER TABLE "ProgramTrack" ADD CONSTRAINT "ProgramTrack_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackSubject" ADD CONSTRAINT "TrackSubject_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "ProgramTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackSubject" ADD CONSTRAINT "TrackSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePoint" ADD CONSTRAINT "KnowledgePoint_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePoint" ADD CONSTRAINT "KnowledgePoint_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "ProgramTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubject" ADD CONSTRAINT "ExamSubject_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubjectSubject" ADD CONSTRAINT "ExamSubjectSubject_examSubjectId_fkey" FOREIGN KEY ("examSubjectId") REFERENCES "ExamSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubjectSubject" ADD CONSTRAINT "ExamSubjectSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examSubjectId_fkey" FOREIGN KEY ("examSubjectId") REFERENCES "ExamSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSubject" ADD CONSTRAINT "QuestionSubject_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSubject" ADD CONSTRAINT "QuestionSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Explanation" ADD CONSTRAINT "Explanation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionKnowledgePoint" ADD CONSTRAINT "QuestionKnowledgePoint_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionKnowledgePoint" ADD CONSTRAINT "QuestionKnowledgePoint_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionSchedule" ADD CONSTRAINT "AdmissionSchedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionSchedule" ADD CONSTRAINT "AdmissionSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStat" ADD CONSTRAINT "AdmissionStat_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionStat" ADD CONSTRAINT "AdmissionStat_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
