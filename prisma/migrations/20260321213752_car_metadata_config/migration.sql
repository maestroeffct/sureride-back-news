-- CreateTable
CREATE TABLE "CarCategoryConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarCategoryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarBrandConfig" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarBrandConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModelConfig" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarCategoryConfig_slug_key" ON "CarCategoryConfig"("slug");

-- CreateIndex
CREATE INDEX "CarCategoryConfig_isActive_idx" ON "CarCategoryConfig"("isActive");

-- CreateIndex
CREATE INDEX "CarCategoryConfig_externalId_idx" ON "CarCategoryConfig"("externalId");

-- CreateIndex
CREATE INDEX "CarBrandConfig_categoryId_idx" ON "CarBrandConfig"("categoryId");

-- CreateIndex
CREATE INDEX "CarBrandConfig_externalId_idx" ON "CarBrandConfig"("externalId");

-- CreateIndex
CREATE INDEX "CarBrandConfig_isActive_idx" ON "CarBrandConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CarBrandConfig_slug_categoryId_key" ON "CarBrandConfig"("slug", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CarBrandConfig_name_categoryId_key" ON "CarBrandConfig"("name", "categoryId");

-- CreateIndex
CREATE INDEX "CarModelConfig_brandId_idx" ON "CarModelConfig"("brandId");

-- CreateIndex
CREATE INDEX "CarModelConfig_categoryId_idx" ON "CarModelConfig"("categoryId");

-- CreateIndex
CREATE INDEX "CarModelConfig_externalId_idx" ON "CarModelConfig"("externalId");

-- CreateIndex
CREATE INDEX "CarModelConfig_isActive_idx" ON "CarModelConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CarModelConfig_slug_brandId_key" ON "CarModelConfig"("slug", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModelConfig_name_brandId_key" ON "CarModelConfig"("name", "brandId");

-- AddForeignKey
ALTER TABLE "CarBrandConfig" ADD CONSTRAINT "CarBrandConfig_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CarCategoryConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModelConfig" ADD CONSTRAINT "CarModelConfig_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CarCategoryConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModelConfig" ADD CONSTRAINT "CarModelConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CarBrandConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
