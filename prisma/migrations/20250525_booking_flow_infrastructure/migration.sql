-- Migration: Booking Flow Infrastructure
-- Description: Adds new BookingStatus enum values, JourneyStatus values, and ConsultationBooking fields
-- for the quiz booking flow with slot hold/confirm system

-- ============================================================================
-- STEP 1: Update BookingStatus enum
-- ============================================================================

-- Add new BookingStatus values if they don't exist
DO $$ BEGIN
    -- Check if old values exist and need to be migrated
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SCHEDULED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        -- Rename old values to new values
        ALTER TYPE "BookingStatus" RENAME VALUE 'SCHEDULED' TO 'SLOT_HELD';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CONFIRMED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" RENAME VALUE 'CONFIRMED' TO 'BOOKING_CONFIRMED';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'COMPLETED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" RENAME VALUE 'COMPLETED' TO 'BOOKING_COMPLETED';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELLED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" RENAME VALUE 'CANCELLED' TO 'BOOKING_CANCELLED';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NO_SHOW' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" RENAME VALUE 'NO_SHOW' TO 'BOOKING_NO_SHOW';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RESCHEDULED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" RENAME VALUE 'RESCHEDULED' TO 'BOOKING_RESCHEDULED';
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Add new enum values if they don't exist
DO $$ BEGIN
    ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'SLOT_HELD';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'BOOKING_CONFIRMED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'BOOKING_CANCELLED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'BOOKING_COMPLETED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'BOOKING_NO_SHOW';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'BOOKING_RESCHEDULED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: Update JourneyStatus enum with new values
-- ============================================================================

-- Add new JourneyStatus values
DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'CONSENTED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'CONSULTATION_BOOKING_STARTED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'PRE_TRIAGE_PENDING';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'PRE_TRIAGE_COMPLETE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'AWAITING_DOCTOR_CALL';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'CONSULT_COMPLETED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'AWAITING_DOCTOR_DECISION';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'TESTS_ORDERED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'AWAITING_TESTS';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'RESULTS_RECEIVED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'FINAL_DOCTOR_REVIEW';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'SCRIPT_WRITTEN';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'PHARMACY_PENDING';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'DISPENSING';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'ONBOARDING_PENDING';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'ONBOARDING_COMPLETE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "JourneyStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 3: Add new columns to ConsultationBooking table
-- ============================================================================

-- Add holdExpiresAt column for slot hold expiry
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "holdExpiresAt" TIMESTAMP(3);

-- Add paymentIntentId for Stripe payment tracking
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT;

-- Add selectedPlan for CORE or PRECISION
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "selectedPlan" TEXT;

-- Add intakeId to link to quiz/intake
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "intakeId" TEXT;

-- Add doctorId for assigned doctor
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "doctorId" TEXT;

-- Add doctorName for display purposes
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "doctorName" TEXT;

-- Add appointmentType with default
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "appointmentType" TEXT DEFAULT 'PHONE_CONSULT';

-- Add patientPhone for contact
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "patientPhone" TEXT;

-- Add patientBmi for doctor brief
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "patientBmi" DOUBLE PRECISION;

-- Add riskFlags array for major conditions
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "riskFlags" TEXT[] DEFAULT '{}';

-- Add doctorBriefUrl for pre-consultation brief
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "doctorBriefUrl" TEXT;

-- Add calendarEventId for calendar integration
ALTER TABLE "ConsultationBooking"
ADD COLUMN IF NOT EXISTS "calendarEventId" TEXT;

-- ============================================================================
-- STEP 4: Add indexes for efficient queries
-- ============================================================================

-- Index on holdExpiresAt for cleaning up expired holds
CREATE INDEX IF NOT EXISTS "ConsultationBooking_holdExpiresAt_idx"
ON "ConsultationBooking"("holdExpiresAt");

-- ============================================================================
-- STEP 5: Update existing records
-- ============================================================================

-- Set default appointmentType for existing records
UPDATE "ConsultationBooking"
SET "appointmentType" = 'PHONE_CONSULT'
WHERE "appointmentType" IS NULL;

-- Initialize riskFlags array for existing records
UPDATE "ConsultationBooking"
SET "riskFlags" = '{}'
WHERE "riskFlags" IS NULL;

-- ============================================================================
-- Migration complete!
-- ============================================================================
