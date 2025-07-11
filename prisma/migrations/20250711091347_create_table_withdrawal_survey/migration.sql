-- CreateEnum
CREATE TYPE "withdrawal_reasons" AS ENUM ('not_useful', 'privacy_concerns', 'too_many_emails', 'found_alternative', 'temporary_break', 'technical_issues', 'other');

-- CreateTable
CREATE TABLE "withdrawal_surveys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" "withdrawal_reasons" NOT NULL,
    "reason_other" TEXT,
    "feedback" TEXT,
    "would_recommend" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawal_surveys_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "withdrawal_surveys" ADD CONSTRAINT "withdrawal_surveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
