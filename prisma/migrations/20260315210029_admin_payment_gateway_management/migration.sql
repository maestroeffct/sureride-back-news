-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('TEST', 'LIVE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentProvider" ADD VALUE 'PAYSTACK';
ALTER TYPE "PaymentProvider" ADD VALUE 'FLUTTERWAVE';

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "displayName" TEXT NOT NULL,
    "mode" "PaymentMode" NOT NULL DEFAULT 'TEST',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "publishableKey" TEXT,
    "secretKeyEncrypted" TEXT,
    "webhookSecretEncrypted" TEXT,
    "merchantDisplayName" TEXT,
    "supportedCurrencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'ngn',
    "allowDelayedPaymentMethods" BOOLEAN NOT NULL DEFAULT true,
    "bookingAutoCancelMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayConfig_provider_key" ON "PaymentGatewayConfig"("provider");
