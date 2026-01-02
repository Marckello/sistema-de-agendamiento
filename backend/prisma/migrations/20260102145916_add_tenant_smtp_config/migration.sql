-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "smtpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smtpFrom" TEXT,
ADD COLUMN     "smtpFromName" TEXT,
ADD COLUMN     "smtpHost" TEXT,
ADD COLUMN     "smtpPass" TEXT,
ADD COLUMN     "smtpPort" INTEGER DEFAULT 587,
ADD COLUMN     "smtpUser" TEXT;
