/*
  Warnings:

  - A unique constraint covering the columns `[foreign]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "foreign" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "account" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_foreign_key" ON "User"("foreign");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_foreign_fkey" FOREIGN KEY ("foreign") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
