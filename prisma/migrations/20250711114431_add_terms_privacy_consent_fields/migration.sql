-- AlterTable
ALTER TABLE "users" ADD COLUMN     "privacy_accepted_at" TIMESTAMPTZ(6),
ADD COLUMN     "terms_accepted_at" TIMESTAMPTZ(6);
