-- CreateTable
CREATE TABLE "RequestLogs" (
    "primarykey" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "RequestLogs_pkey" PRIMARY KEY ("primarykey")
);
