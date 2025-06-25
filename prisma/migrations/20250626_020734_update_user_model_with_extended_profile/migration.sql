-- CreateEnum
CREATE TYPE "skin_types" AS ENUM ('normal', 'dry', 'oily', 'combination', 'sensitive', 'other');

-- CreateEnum
CREATE TYPE "genders" AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other');

-- CreateEnum
CREATE TYPE "allergy_types" AS ENUM ('fragrance', 'alcohol', 'paraben', 'sulfate', 'silicone', 'mineral_oil', 'formaldehyde', 'latex', 'nickel', 'other');

-- CreateEnum
CREATE TYPE "body_types" AS ENUM ('atopic', 'sensitive_skin', 'acne_prone', 'mature_skin', 'pigmentation', 'rosacea', 'eczema', 'other');

-- Data migration: Copy display_name to user_name where user_name is null or empty
UPDATE "users" 
SET "user_name" = COALESCE("display_name", CONCAT('user_', SUBSTRING("id"::TEXT, 1, 8)))
WHERE "user_name" IS NULL OR "user_name" = '' OR "display_name" IS NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "display_name";
ALTER TABLE "users" ALTER COLUMN "user_name" TYPE VARCHAR(100);
ALTER TABLE "users" ADD COLUMN     "birth_date" DATE;
ALTER TABLE "users" ADD COLUMN     "gender" "genders";
ALTER TABLE "users" ADD COLUMN     "allergies" "allergy_types"[];
ALTER TABLE "users" ADD COLUMN     "allergies_other" TEXT;
ALTER TABLE "users" ADD COLUMN     "body_type" "body_types";
ALTER TABLE "users" ADD COLUMN     "body_type_other" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN     "skin_type_other" VARCHAR(100);

-- Data migration for skin_type: convert string to enum
UPDATE "users" 
SET "skin_type" = NULL
WHERE "skin_type" NOT IN ('normal', 'dry', 'oily', 'combination', 'sensitive');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "skin_type";
ALTER TABLE "users" ADD COLUMN     "skin_type" "skin_types";

-- Update existing skin_type data
UPDATE "users" 
SET "skin_type" = 'normal'::skin_types
WHERE "user_name" IN (
  SELECT "user_name" FROM "users" WHERE "created_at" < NOW()
);