-- CreateTable
CREATE TABLE "Sample" (
    "primarykey" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "userpassword" TEXT NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("primarykey")
);
