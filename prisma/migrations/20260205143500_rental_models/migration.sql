-- CreateEnum
CREATE TYPE "CarCategory" AS ENUM ('COMPACT', 'ECONOMY', 'LUXURY');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "MileagePolicy" AS ENUM ('UNLIMITED', 'LIMITED');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_dropoffLocationId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_pickupLocationId_fkey";

-- DropIndex
DROP INDEX "Booking_carId_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "dropoffLocationId",
DROP COLUMN "pickupLocationId",
DROP COLUMN "pricingUnit",
DROP COLUMN "status",
DROP COLUMN "totalAmount",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Car" DROP COLUMN "isAvailable",
DROP COLUMN "name",
ADD COLUMN     "bags" TEXT NOT NULL DEFAULT '2',
ADD COLUMN     "category" "CarCategory" NOT NULL DEFAULT 'ECONOMY',
ADD COLUMN     "hasAC" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "mileagePolicy" "MileagePolicy" NOT NULL DEFAULT 'UNLIMITED',
ADD COLUMN     "seats" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "transmission" "Transmission" NOT NULL DEFAULT 'AUTOMATIC',
ALTER COLUMN "hourlyRate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "RentalProvider" DROP COLUMN "isActive",
ADD COLUMN     "logoUrl" TEXT;

-- Backfill locationId for existing cars using available locations (round-robin)
WITH locs AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rn
  FROM "Location"
),
loc_count AS (
  SELECT count(*) AS cnt FROM locs
),
car_rows AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rn
  FROM "Car"
)
UPDATE "Car" c
SET "locationId" = l.id
FROM car_rows cr
JOIN locs l
  ON ((cr.rn - 1) % (SELECT cnt FROM loc_count)) + 1 = l.rn
WHERE c.id = cr.id;

-- Ensure locationId is required and add FK
ALTER TABLE "Car" ALTER COLUMN "locationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
