-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_foreign_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_foreign_fkey" FOREIGN KEY ("foreign") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
