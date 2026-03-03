/*
  Warnings:

  - Added the required column `basePrice` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropoffLocationId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insuranceFee` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLocationId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricingUnit` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "dropoffLocationId" TEXT NOT NULL,
ADD COLUMN     "insuranceFee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "insuranceId" TEXT,
ADD COLUMN     "pickupLocationId" TEXT NOT NULL,
ADD COLUMN     "pricingUnit" "PricingUnit" NOT NULL,
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "InsurancePackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dailyPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "providerId" TEXT,
    "carId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsurancePackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsurancePackage_providerId_idx" ON "InsurancePackage"("providerId");

-- CreateIndex
CREATE INDEX "InsurancePackage_carId_idx" ON "InsurancePackage"("carId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "InsurancePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePackage" ADD CONSTRAINT "InsurancePackage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "RentalProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePackage" ADD CONSTRAINT "InsurancePackage_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
