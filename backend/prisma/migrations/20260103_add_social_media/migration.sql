-- AlterTable: Add social media fields to tenants
ALTER TABLE "tenants" ADD COLUMN "website" TEXT;
ALTER TABLE "tenants" ADD COLUMN "facebook" TEXT;
ALTER TABLE "tenants" ADD COLUMN "instagram" TEXT;
ALTER TABLE "tenants" ADD COLUMN "twitter" TEXT;
ALTER TABLE "tenants" ADD COLUMN "tiktok" TEXT;
ALTER TABLE "tenants" ADD COLUMN "linkedin" TEXT;
ALTER TABLE "tenants" ADD COLUMN "whatsapp" TEXT;
