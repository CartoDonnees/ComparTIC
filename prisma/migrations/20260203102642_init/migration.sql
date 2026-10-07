/*
  Warnings:

  - You are about to drop the column `monitoringId` on the `AccessMode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccessMode" DROP CONSTRAINT "AccessMode_monitoringId_fkey";

-- DropIndex
DROP INDEX "AccessMode_monitoringId_key";

-- DropIndex
DROP INDEX "AccessMode_offerId_key";

-- AlterTable
ALTER TABLE "AccessMode" DROP COLUMN "monitoringId";

-- CreateTable
CREATE TABLE "MonitoringAccessMode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringAccessMode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringAccessMode_code_key" ON "MonitoringAccessMode"("code");

-- AddForeignKey
ALTER TABLE "MonitoringAccessMode" ADD CONSTRAINT "MonitoringAccessMode_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
