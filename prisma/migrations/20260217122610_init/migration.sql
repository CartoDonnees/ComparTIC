/*
  Warnings:

  - You are about to drop the column `qauntity` on the `MonitoringServiceDetail` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `MonitoringServiceDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MonitoringServiceDetail" DROP COLUMN "qauntity",
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL;
