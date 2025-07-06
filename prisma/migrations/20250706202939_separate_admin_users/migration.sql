-- CreateEnum
CREATE TYPE "admin_roles" AS ENUM ('admin', 'super_admin');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "admin_roles" NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "permissions" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- Update AdminLog table to reference AdminUser instead of User
ALTER TABLE "admin_logs" DROP CONSTRAINT "admin_logs_user_id_fkey";
ALTER TABLE "admin_logs" RENAME COLUMN "user_id" TO "admin_user_id";
ALTER TABLE "admin_logs" ADD COLUMN "target_type" VARCHAR(50);

-- NOTE: role column and user_roles enum will be removed in a future migration
-- after data has been migrated to admin_users table

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_admin_name_key" ON "admin_users"("admin_name");
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;