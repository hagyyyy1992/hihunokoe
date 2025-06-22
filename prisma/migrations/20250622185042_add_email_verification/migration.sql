-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_expiry" TIMESTAMPTZ(6),
ADD COLUMN     "email_verification_token" VARCHAR(255),
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;
