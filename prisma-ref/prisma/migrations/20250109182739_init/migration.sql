/*
  Warnings:

  - A unique constraint covering the columns `[foreign]` on the table `account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_foreign_fkey";

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "foreign" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_foreign_key" ON "account"("foreign");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_foreign_fkey" FOREIGN KEY ("foreign") REFERENCES "account"("foreign") ON DELETE RESTRICT ON UPDATE CASCADE;
