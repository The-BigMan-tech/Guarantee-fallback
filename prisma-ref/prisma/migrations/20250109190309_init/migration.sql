/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - The primary key for the `account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `foreign` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[foreignKey]` on the table `account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_foreign_fkey";

-- DropIndex
DROP INDEX "account_foreign_key";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "primaryKey" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("primaryKey");

-- AlterTable
ALTER TABLE "account" DROP CONSTRAINT "account_pkey",
DROP COLUMN "foreign",
DROP COLUMN "id",
ADD COLUMN     "foreignKey" SERIAL NOT NULL,
ADD COLUMN     "primaryKey" SERIAL NOT NULL,
ADD CONSTRAINT "account_pkey" PRIMARY KEY ("primaryKey");

-- CreateIndex
CREATE UNIQUE INDEX "account_foreignKey_key" ON "account"("foreignKey");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_foreignKey_fkey" FOREIGN KEY ("foreignKey") REFERENCES "User"("primaryKey") ON DELETE RESTRICT ON UPDATE CASCADE;
