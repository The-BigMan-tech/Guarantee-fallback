/*
  Warnings:

  - A unique constraint covering the columns `[foreignkey]` on the table `RequestLogs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RequestLogs" ADD COLUMN     "foreignkey" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RequestLogs_foreignkey_key" ON "RequestLogs"("foreignkey");

-- AddForeignKey
ALTER TABLE "RequestLogs" ADD CONSTRAINT "RequestLogs_foreignkey_fkey" FOREIGN KEY ("foreignkey") REFERENCES "ResponseLogs"("primarykey") ON DELETE RESTRICT ON UPDATE CASCADE;
