-- GAP-012: Make userId nullable in ConsultationBooking
-- This allows booking holds to be created before user registration
-- The booking will be linked to the user during payment confirmation

-- Step 1: Make userId column nullable
ALTER TABLE "ConsultationBooking" ALTER COLUMN "userId" DROP NOT NULL;

-- Step 2: Update any existing "anonymous" userIds to NULL
UPDATE "ConsultationBooking"
SET "userId" = NULL
WHERE "userId" = 'anonymous';

-- GAP-008: Add PENDING status to ProgramMembershipStatus enum
-- This allows members to start in PENDING state before activation criteria are met
ALTER TYPE "ProgramMembershipStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'ACTIVE';
