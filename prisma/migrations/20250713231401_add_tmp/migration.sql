-- CreateTable
CREATE TABLE "tmp" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tmp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);

-- CreateIndex
CREATE INDEX "users_active_deleted_idx" ON "users"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "users_active_created_idx" ON "users"("is_active", "created_at" DESC);
