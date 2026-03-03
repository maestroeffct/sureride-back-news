-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('INCOMPLETE', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- CreateTable
CREATE TABLE "UserKyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "homeAddress" TEXT NOT NULL,
    "governmentIdType" TEXT NOT NULL,
    "governmentIdNumber" TEXT NOT NULL,
    "driverLicenseNumber" TEXT NOT NULL,
    "driverLicenseExpiry" TIMESTAMP(3) NOT NULL,
    "passportPhotoUrl" TEXT NOT NULL,
    "governmentIdFrontUrl" TEXT NOT NULL,
    "governmentIdBackUrl" TEXT NOT NULL,
    "driverLicenseFrontUrl" TEXT NOT NULL,
    "driverLicenseBackUrl" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserKyc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserKyc_userId_key" ON "UserKyc"("userId");

-- AddForeignKey
ALTER TABLE "UserKyc" ADD CONSTRAINT "UserKyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
