-- Dedicated Women's Health symptom/cycle check-ins for portal reporting.
CREATE TABLE "WomensHealthCheckIn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "careArea" TEXT NOT NULL,
  "periodStatus" TEXT,
  "cycleDay" INTEGER,
  "lastPeriodDate" TIMESTAMP(3),
  "energyLevel" INTEGER NOT NULL,
  "moodLevel" INTEGER NOT NULL,
  "sleepQuality" INTEGER NOT NULL,
  "stressLevel" INTEGER NOT NULL,
  "painLevel" INTEGER,
  "libidoLevel" INTEGER,
  "hotFlushesLevel" INTEGER,
  "cravingsLevel" INTEGER,
  "symptoms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "treatmentSideEffectFlag" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WomensHealthCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WomensHealthCheckIn_userId_idx" ON "WomensHealthCheckIn"("userId");
CREATE INDEX "WomensHealthCheckIn_careArea_idx" ON "WomensHealthCheckIn"("careArea");
CREATE INDEX "WomensHealthCheckIn_checkedInAt_idx" ON "WomensHealthCheckIn"("checkedInAt");

ALTER TABLE "WomensHealthCheckIn"
  ADD CONSTRAINT "WomensHealthCheckIn_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
