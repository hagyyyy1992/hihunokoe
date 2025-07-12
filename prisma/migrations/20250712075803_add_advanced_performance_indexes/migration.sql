-- CreateIndex
CREATE INDEX "comments_post_id_created_at_idx" ON "comments"("post_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "empathies_post_id_created_at_idx" ON "empathies"("post_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_status_cosmetic_category_created_at_idx" ON "posts"("status", "cosmetic_category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_status_skin_type_created_at_idx" ON "posts"("status", "skin_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_status_mood_tag_created_at_idx" ON "posts"("status", "mood_tag", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_multi_filter_idx" ON "posts"("status", "cosmetic_category", "skin_type", "mood_tag", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_view_count_idx" ON "posts"("view_count" DESC);
