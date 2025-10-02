/*
  Warnings:

  - You are about to drop the `WorkShift` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WorkShift" DROP CONSTRAINT "WorkShift_stylistId_fkey";

-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "unavailableDates" TIMESTAMP(3)[],
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- DropTable
DROP TABLE "WorkShift";
