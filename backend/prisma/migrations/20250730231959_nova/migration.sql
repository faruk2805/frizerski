/*
  Warnings:

  - You are about to drop the column `salonId` on the `Service` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_salonId_fkey";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "salonId";
