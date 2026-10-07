/*
  Warnings:

  - You are about to drop the column `monitoringId` on the `Validation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Validation" DROP CONSTRAINT "Validation_monitoringId_fkey";

-- DropIndex
DROP INDEX "Validation_monitoringId_key";

-- AlterTable
ALTER TABLE "Validation" DROP COLUMN "monitoringId";

-- CreateTable
CREATE TABLE "MonitoringValidation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "launchDate" TIMESTAMP(3),
    "status" "ValidationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringComment" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringValidationId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringValidation_code_key" ON "MonitoringValidation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringValidation_monitoringId_key" ON "MonitoringValidation"("monitoringId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringComment_code_key" ON "MonitoringComment"("code");

-- AddForeignKey
ALTER TABLE "MonitoringValidation" ADD CONSTRAINT "MonitoringValidation_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringComment" ADD CONSTRAINT "MonitoringComment_monitoringValidationId_fkey" FOREIGN KEY ("monitoringValidationId") REFERENCES "MonitoringValidation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
