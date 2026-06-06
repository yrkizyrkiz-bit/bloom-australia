-- Add ScriptStatus enum
CREATE TYPE "ScriptStatus" AS ENUM (
  'SCRIPT_DRAFT',
  'SCRIPT_WRITTEN',
  'SCRIPT_SENT_TO_PHARMACY',
  'PHARMACY_PENDING',
  'DISPENSING',
  'SHIPPED',
  'DELIVERED'
);

-- Add new columns to Prescription table
ALTER TABLE "Prescription" ADD COLUMN "scriptStatus" "ScriptStatus" NOT NULL DEFAULT 'SCRIPT_DRAFT';
ALTER TABLE "Prescription" ADD COLUMN "pharmacyNotes" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "safetyCounsellingNotes" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "followUpDate" TIMESTAMP(3);

-- Create index on scriptStatus for faster queries
CREATE INDEX "Prescription_scriptStatus_idx" ON "Prescription"("scriptStatus");

-- Update existing prescriptions to have appropriate script status based on current state
-- Active prescriptions that have been filled should be DELIVERED
UPDATE "Prescription"
SET "scriptStatus" = 'DELIVERED'
WHERE "status" = 'ACTIVE'
AND "lastFilledAt" IS NOT NULL;

-- Active prescriptions without fills should be SCRIPT_WRITTEN
UPDATE "Prescription"
SET "scriptStatus" = 'SCRIPT_WRITTEN'
WHERE "status" = 'ACTIVE'
AND "lastFilledAt" IS NULL
AND "scriptStatus" = 'SCRIPT_DRAFT';

-- Comment explaining the script workflow
COMMENT ON COLUMN "Prescription"."scriptStatus" IS 'Script workflow status: SCRIPT_DRAFT -> SCRIPT_WRITTEN -> SCRIPT_SENT_TO_PHARMACY -> PHARMACY_PENDING -> DISPENSING -> SHIPPED -> DELIVERED';
