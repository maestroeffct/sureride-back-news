-- CreateEnum
CREATE TYPE "FeatureCategory" AS ENUM ('SAFETY', 'PROTECTION', 'RENTAL_POLICY', 'COMFORT', 'OTHER');

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FeatureCategory" NOT NULL,
    "icon" TEXT,
    "providerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarFeature" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feature_providerId_idx" ON "Feature"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_providerId_name_key" ON "Feature"("providerId", "name");

-- CreateIndex
CREATE INDEX "CarFeature_carId_idx" ON "CarFeature"("carId");

-- CreateIndex
CREATE INDEX "CarFeature_featureId_idx" ON "CarFeature"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "CarFeature_carId_featureId_key" ON "CarFeature"("carId", "featureId");

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "RentalProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarFeature" ADD CONSTRAINT "CarFeature_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarFeature" ADD CONSTRAINT "CarFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
