/*
  Warnings:

  - You are about to drop the column `offerRateId` on the `MonitoringServiceDetail` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[offerId]` on the table `AccessMode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[monitoringId]` on the table `AccessMode` will be added. If there are existing duplicate values, this will fail.
  - Made the column `monitoringId` on table `AccessMode` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AccessMode" DROP CONSTRAINT "AccessMode_monitoringId_fkey";

-- DropForeignKey
ALTER TABLE "MonitoringServiceDetail" DROP CONSTRAINT "MonitoringServiceDetail_offerRateId_fkey";

-- AlterTable
ALTER TABLE "AccessMode" ALTER COLUMN "monitoringId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MonitoringServiceDetail" DROP COLUMN "offerRateId";

-- CreateTable
CREATE TABLE "MonitoringRate" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceDetailId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringRate_code_key" ON "MonitoringRate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringRate_serviceDetailId_key" ON "MonitoringRate"("serviceDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessMode_offerId_key" ON "AccessMode"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessMode_monitoringId_key" ON "AccessMode"("monitoringId");

-- AddForeignKey
ALTER TABLE "AccessMode" ADD CONSTRAINT "AccessMode_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringRate" ADD CONSTRAINT "MonitoringRate_serviceDetailId_fkey" FOREIGN KEY ("serviceDetailId") REFERENCES "MonitoringServiceDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
