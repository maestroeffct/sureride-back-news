-- CreateEnum
CREATE TYPE "PaymentGatewayRuntimeAdapter" AS ENUM ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PaymentFieldType" AS ENUM ('TEXT', 'SECRET', 'EMAIL', 'URL', 'NUMBER', 'BOOLEAN', 'JSON');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentGatewayKey" TEXT;

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "runtimeAdapter" "PaymentGatewayRuntimeAdapter" NOT NULL DEFAULT 'CUSTOM',
    "mode" "PaymentMode" NOT NULL DEFAULT 'TEST',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "merchantDisplayName" TEXT,
    "supportedCurrencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayField" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "PaymentFieldType" NOT NULL DEFAULT 'TEXT',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "helpText" TEXT,
    "defaultValue" TEXT,
    "validationRegex" TEXT,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewayField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayFieldValue" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valuePlain" TEXT,
    "valueEncrypted" TEXT,
    "updatedByAdminId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewayFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGateway_key_key" ON "PaymentGateway"("key");

-- CreateIndex
CREATE INDEX "PaymentGatewayField_gatewayId_sortOrder_idx" ON "PaymentGatewayField"("gatewayId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayField_gatewayId_key_key" ON "PaymentGatewayField"("gatewayId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayFieldValue_gatewayId_fieldId_key" ON "PaymentGatewayFieldValue"("gatewayId", "fieldId");

-- CreateIndex
CREATE INDEX "Booking_paymentGatewayKey_idx" ON "Booking"("paymentGatewayKey");

-- AddForeignKey
ALTER TABLE "PaymentGatewayField" ADD CONSTRAINT "PaymentGatewayField_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGatewayFieldValue" ADD CONSTRAINT "PaymentGatewayFieldValue_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGatewayFieldValue" ADD CONSTRAINT "PaymentGatewayFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "PaymentGatewayField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
