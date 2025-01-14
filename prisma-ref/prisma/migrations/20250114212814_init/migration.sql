/*
  Warnings:

  - You are about to drop the column `foreignkey` on the `RequestLogs` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[foreignkey]` on the table `ResponseLogs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "RequestLogs" DROP CONSTRAINT "RequestLogs_foreignkey_fkey";

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_foreignKey_fkey";

-- DropIndex
DROP INDEX "RequestLogs_foreignkey_key";

-- AlterTable
ALTER TABLE "RequestLogs" DROP COLUMN "foreignkey";

-- AlterTable
ALTER TABLE "ResponseLogs" ADD COLUMN     "foreignkey" SERIAL NOT NULL;

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "account";

-- CreateIndex
CREATE UNIQUE INDEX "ResponseLogs_foreignkey_key" ON "ResponseLogs"("foreignkey");

-- AddForeignKey
ALTER TABLE "ResponseLogs" ADD CONSTRAINT "ResponseLogs_foreignkey_fkey" FOREIGN KEY ("foreignkey") REFERENCES "RequestLogs"("primarykey") ON DELETE RESTRICT ON UPDATE CASCADE;
