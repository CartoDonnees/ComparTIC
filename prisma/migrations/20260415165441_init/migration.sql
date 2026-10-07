/*
  Warnings:

  - Made the column `firstName` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "firstName" SET NOT NULL;
