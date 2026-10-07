/*
  Warnings:

  - You are about to drop the column `quntity` on the `MonitoringServiceDetail` table. All the data in the column will be lost.
  - Added the required column `qauntity` to the `MonitoringServiceDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MonitoringServiceDetail" DROP COLUMN "quntity",
ADD COLUMN     "qauntity" DOUBLE PRECISION NOT NULL;
