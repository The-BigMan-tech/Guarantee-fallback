-- CreateTable
CREATE TABLE "ResponseLogs" (
    "primarykey" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ResponseLogs_pkey" PRIMARY KEY ("primarykey")
);
