/*
  Warnings:

  - Changed the type of `status` on the `MedicineLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MedicineStatus" AS ENUM ('pending', 'taken', 'missed');

-- AlterTable
ALTER TABLE "Medicine" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MedicineLog" DROP COLUMN "status",
ADD COLUMN     "status" "MedicineStatus" NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "MedicineLog_userId_status_idx" ON "MedicineLog"("userId", "status");
