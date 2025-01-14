/*
  Warnings:

  - Added the required column `responseTime` to the `ResponseLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusCode` to the `ResponseLogs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResponseLogs" ADD COLUMN     "responseTime" INTEGER NOT NULL,
ADD COLUMN     "statusCode" INTEGER NOT NULL;
