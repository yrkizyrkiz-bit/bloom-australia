-- Weekly hair restoration check-ins with optional progress photos.
CREATE TABLE IF NOT EXISTS "HairWeeklyCheckIn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekKey" TEXT NOT NULL,
  "overallFeeling" INTEGER NOT NULL,
  "sheddingLevel" INTEGER NOT NULL,
  "scalpComfort" INTEGER NOT NULL,
  "confidence" INTEGER NOT NULL,
  "notes" TEXT,
  "photos" JSONB NOT NULL DEFAULT '[]',
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HairWeeklyCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HairWeeklyCheckIn_userId_weekKey_key" ON "HairWeeklyCheckIn"("userId", "weekKey");
CREATE INDEX IF NOT EXISTS "HairWeeklyCheckIn_userId_idx" ON "HairWeeklyCheckIn"("userId");
CREATE INDEX IF NOT EXISTS "HairWeeklyCheckIn_checkedInAt_idx" ON "HairWeeklyCheckIn"("checkedInAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HairWeeklyCheckIn_userId_fkey'
  ) THEN
    ALTER TABLE "HairWeeklyCheckIn"
      ADD CONSTRAINT "HairWeeklyCheckIn_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
