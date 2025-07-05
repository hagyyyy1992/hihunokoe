/*
  Warnings:

  - You are about to drop the column `body_type` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `body_type_other` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "body_type",
DROP COLUMN "body_type_other";

-- DropEnum
DROP TYPE "body_types";
