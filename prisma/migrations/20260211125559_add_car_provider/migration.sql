/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `RentalProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProviderSource" AS ENUM ('SURERIDE_ADMIN', 'PROVIDER_SELF_REGISTERED');

-- AlterTable
ALTER TABLE "RentalProvider" ADD COLUMN     "createdBy" "ProviderSource" NOT NULL DEFAULT 'SURERIDE_ADMIN',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RentalProvider_email_key" ON "RentalProvider"("email");
