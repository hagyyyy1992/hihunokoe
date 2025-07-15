-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);

-- CreateIndex
CREATE INDEX "users_active_deleted_idx" ON "users"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "users_active_created_idx" ON "users"("is_active", "created_at" DESC);
