-- Guest LP funnel submissions (no User/account). Staff process these later.
CREATE TABLE "to_process" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "source" TEXT NOT NULL DEFAULT 'lp_weight_management',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "appointmentSlotId" TEXT,
    "appointmentStart" TIMESTAMP(3),
    "appointmentEnd" TIMESTAMP(3),
    "appointmentType" TEXT,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "quizAnswers" JSONB,
    "utm" JSONB,
    "emailsSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "to_process_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "to_process_accessToken_key" ON "to_process"("accessToken");
CREATE UNIQUE INDEX "to_process_stripePaymentIntentId_key" ON "to_process"("stripePaymentIntentId");
CREATE INDEX "to_process_email_idx" ON "to_process"("email");
CREATE INDEX "to_process_status_idx" ON "to_process"("status");
