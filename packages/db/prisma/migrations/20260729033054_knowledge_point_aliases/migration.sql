-- AlterTable
ALTER TABLE "KnowledgePoint" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[];
