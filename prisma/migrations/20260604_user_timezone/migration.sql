-- Add patient timezone (IANA) derived from address state/postcode
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Australia/Sydney';
