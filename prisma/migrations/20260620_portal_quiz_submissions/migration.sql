-- PortalQuizSubmission: persisted in-portal quiz answers per program for doctor review
CREATE TABLE IF NOT EXISTS "PortalQuizSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programKey" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "result" JSONB,
    "intent" TEXT,
    "source" TEXT NOT NULL DEFAULT 'in_portal',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalQuizSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PortalQuizSubmission_userId_idx" ON "PortalQuizSubmission"("userId");
CREATE INDEX IF NOT EXISTS "PortalQuizSubmission_userId_programKey_idx" ON "PortalQuizSubmission"("userId", "programKey");
CREATE INDEX IF NOT EXISTS "PortalQuizSubmission_submittedAt_idx" ON "PortalQuizSubmission"("submittedAt");

ALTER TABLE "PortalQuizSubmission" DROP CONSTRAINT IF EXISTS "PortalQuizSubmission_userId_fkey";
ALTER TABLE "PortalQuizSubmission" ADD CONSTRAINT "PortalQuizSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
