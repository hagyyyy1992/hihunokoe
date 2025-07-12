-- CreateEnum
CREATE TYPE "contact_categories" AS ENUM ('general', 'bug_report', 'feature_request', 'account', 'privacy', 'other');

-- CreateEnum
CREATE TYPE "contact_statuses" AS ENUM ('unread', 'read', 'in_progress', 'resolved', 'spam');

-- CreateTable
CREATE TABLE "contact_inquiries" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "category" "contact_categories" NOT NULL,
    "status" "contact_statuses" NOT NULL DEFAULT 'unread',
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "admin_notes" TEXT,
    "responded_at" TIMESTAMPTZ(6),
    "responded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_inquiries_status_created_at_idx" ON "contact_inquiries"("status", "created_at");

-- AddForeignKey
ALTER TABLE "contact_inquiries" ADD CONSTRAINT "contact_inquiries_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
