-- CreateEnum
CREATE TYPE "EmployeePermission" AS ENUM (
    'EMPLOYEES_READ',
    'EMPLOYEES_CREATE',
    'EMPLOYEES_UPDATE',
    'EMPLOYEES_SUSPEND',
    'ROLES_READ',
    'ROLES_CREATE',
    'ROLES_UPDATE',
    'ROLES_DELETE',
    'PROVIDERS_MANAGE',
    'CARS_MANAGE',
    'BOOKINGS_MANAGE',
    'PROMOTIONS_MANAGE',
    'SETTINGS_MANAGE'
);

-- AlterTable
ALTER TABLE "Admin"
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "nationality" TEXT,
ADD COLUMN "phoneCountry" TEXT,
ADD COLUMN "phoneNumber" TEXT,
ADD COLUMN "roleId" TEXT,
ADD COLUMN "tempPasswordExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmployeeRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" "EmployeePermission"[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeRole_name_key" ON "EmployeeRole"("name");

-- CreateIndex
CREATE INDEX "Admin_roleId_idx" ON "Admin"("roleId");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "EmployeeRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
