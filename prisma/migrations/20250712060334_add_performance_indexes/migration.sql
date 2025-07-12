-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "empathies_post_id_idx" ON "empathies"("post_id");

-- CreateIndex
CREATE INDEX "empathies_user_id_idx" ON "empathies"("user_id");

-- CreateIndex
CREATE INDEX "posts_status_created_at_idx" ON "posts"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_status_published_at_idx" ON "posts"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "posts_user_id_status_idx" ON "posts"("user_id", "status");

-- CreateIndex
CREATE INDEX "posts_cosmetic_category_status_idx" ON "posts"("cosmetic_category", "status");

-- CreateIndex
CREATE INDEX "posts_skin_type_status_idx" ON "posts"("skin_type", "status");

-- CreateIndex
CREATE INDEX "posts_mood_tag_status_idx" ON "posts"("mood_tag", "status");
