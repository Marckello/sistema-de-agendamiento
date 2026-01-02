-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canDelete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canModify" BOOLEAN NOT NULL DEFAULT true;
