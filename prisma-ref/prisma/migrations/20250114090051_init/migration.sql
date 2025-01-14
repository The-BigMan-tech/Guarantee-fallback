/*
  Warnings:

  - You are about to drop the column `timestamp` on the `RequestLogs` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `ResponseLogs` table. All the data in the column will be lost.
  - Added the required column `requestTimestamp` to the `RequestLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responseTimestamp` to the `ResponseLogs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestLogs" DROP COLUMN "timestamp",
ADD COLUMN     "requestTimestamp" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ResponseLogs" DROP COLUMN "timestamp",
ADD COLUMN     "responseTimestamp" TIMESTAMP(3) NOT NULL;
