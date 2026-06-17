-- CreateTable
CREATE TABLE "AdmissionGroup" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,

    CONSTRAINT "AdmissionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionRound" (
    "id" TEXT NOT NULL,
    "admissionGroupId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "admissionType" "AdmissionType" NOT NULL,
    "quota" INTEGER,
    "applicants" INTEGER,
    "admitted" INTEGER,
    "sourceUrl" TEXT,

    CONSTRAINT "AdmissionRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionRoundEvent" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "event" "AdmissionEvent" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,

    CONSTRAINT "AdmissionRoundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionRoundSubject" (
    "roundId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "AdmissionRoundSubject_pkey" PRIMARY KEY ("roundId","subjectId")
);

-- CreateIndex
CREATE INDEX "AdmissionGroup_departmentId_idx" ON "AdmissionGroup"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionGroup_departmentId_code_key" ON "AdmissionGroup"("departmentId", "code");

-- CreateIndex
CREATE INDEX "AdmissionRound_admissionGroupId_idx" ON "AdmissionRound"("admissionGroupId");

-- CreateIndex
CREATE INDEX "AdmissionRound_year_idx" ON "AdmissionRound"("year");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionRound_admissionGroupId_year_admissionType_key" ON "AdmissionRound"("admissionGroupId", "year", "admissionType");

-- CreateIndex
CREATE INDEX "AdmissionRoundEvent_roundId_idx" ON "AdmissionRoundEvent"("roundId");

-- CreateIndex
CREATE INDEX "AdmissionRoundSubject_subjectId_idx" ON "AdmissionRoundSubject"("subjectId");

-- AddForeignKey
ALTER TABLE "AdmissionGroup" ADD CONSTRAINT "AdmissionGroup_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRound" ADD CONSTRAINT "AdmissionRound_admissionGroupId_fkey" FOREIGN KEY ("admissionGroupId") REFERENCES "AdmissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRoundEvent" ADD CONSTRAINT "AdmissionRoundEvent_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "AdmissionRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRoundSubject" ADD CONSTRAINT "AdmissionRoundSubject_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "AdmissionRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRoundSubject" ADD CONSTRAINT "AdmissionRoundSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
