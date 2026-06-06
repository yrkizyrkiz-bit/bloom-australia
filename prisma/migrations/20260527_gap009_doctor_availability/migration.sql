-- GAP-009: Doctor availability/roster for real calendar-based booking
-- This replaces the random slot generation with database-backed availability

-- Create enum for doctor availability status
CREATE TYPE "DoctorAvailabilityStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- Create DoctorAvailability table for recurring schedules
CREATE TABLE "DoctorAvailability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "specificDate" TIMESTAMP(3),
    "maxBookings" INTEGER NOT NULL DEFAULT 1,
    "status" "DoctorAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);

-- Create DoctorBlockedDate table for holidays/leave
CREATE TABLE "DoctorBlockedDate" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "blockedDate" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorBlockedDate_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient queries
CREATE INDEX "DoctorAvailability_doctorId_idx" ON "DoctorAvailability"("doctorId");
CREATE INDEX "DoctorAvailability_dayOfWeek_idx" ON "DoctorAvailability"("dayOfWeek");
CREATE INDEX "DoctorAvailability_status_idx" ON "DoctorAvailability"("status");
CREATE INDEX "DoctorAvailability_specificDate_idx" ON "DoctorAvailability"("specificDate");

CREATE INDEX "DoctorBlockedDate_doctorId_idx" ON "DoctorBlockedDate"("doctorId");
CREATE INDEX "DoctorBlockedDate_blockedDate_idx" ON "DoctorBlockedDate"("blockedDate");

-- Unique constraint for blocked dates
CREATE UNIQUE INDEX "DoctorBlockedDate_doctorId_blockedDate_key" ON "DoctorBlockedDate"("doctorId", "blockedDate");

-- =============================================
-- SEED DEFAULT DOCTOR AVAILABILITY
-- This creates default availability until real roster is configured
-- Thu=4, Fri=5, Sat=6, 9am-7pm
-- =============================================

-- Note: This should be run manually or via a seed script after doctors are created
-- Example to seed availability for a doctor:
--
-- INSERT INTO "DoctorAvailability" (id, "doctorId", "dayOfWeek", "startTime", "endTime", status, "updatedAt")
-- VALUES
--   (gen_random_uuid()::text, 'doctor_id_here', 4, '09:00', '19:00', 'AVAILABLE', NOW()),
--   (gen_random_uuid()::text, 'doctor_id_here', 5, '09:00', '19:00', 'AVAILABLE', NOW()),
--   (gen_random_uuid()::text, 'doctor_id_here', 6, '09:00', '17:00', 'AVAILABLE', NOW());
