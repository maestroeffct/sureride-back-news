-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FLAGGED');

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "flaggedReason" TEXT,
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "status" "CarStatus" NOT NULL DEFAULT 'DRAFT';
