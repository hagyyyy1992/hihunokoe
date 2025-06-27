ALTER TABLE "users" ADD COLUMN     "password_reset_expiry" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_token" VARCHAR(255);
