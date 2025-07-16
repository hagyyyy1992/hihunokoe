-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "posts_deleted_status_created_idx" ON "posts"("deleted_at", "status", "created_at" DESC);
