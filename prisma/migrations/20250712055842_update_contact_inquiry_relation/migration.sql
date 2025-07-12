-- DropForeignKey
ALTER TABLE "contact_inquiries" DROP CONSTRAINT "contact_inquiries_responded_by_fkey";

-- AddForeignKey
ALTER TABLE "contact_inquiries" ADD CONSTRAINT "contact_inquiries_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
