-- Persist member note (admin roles like 系主任/院長, or 借調); previously parsed but dropped.
ALTER TABLE "FacultyMember" ADD COLUMN "note" TEXT;
