/*
  Warnings:

  - You are about to drop the column `foreign` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[foreign]` on the table `account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_foreign_fkey";

-- DropIndex
DROP INDEX "User_foreign_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "foreign";

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "foreign" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_foreign_key" ON "account"("foreign");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_foreign_fkey" FOREIGN KEY ("foreign") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
