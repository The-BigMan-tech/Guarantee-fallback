/*
  Warnings:

  - You are about to drop the column `foreign` on the `account` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "account_foreign_key";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "foreign";
