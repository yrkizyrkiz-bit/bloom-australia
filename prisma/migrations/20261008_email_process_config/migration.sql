-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultFromEmail" TEXT NOT NULL DEFAULT 'noreply@sanative.com.au',
    "defaultFromName" TEXT NOT NULL DEFAULT 'Sanative Health',
    "defaultReplyTo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailProcessConfig" (
    "id" TEXT NOT NULL,
    "processKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "replyTo" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailProcessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailProcessConfig_processKey_key" ON "EmailProcessConfig"("processKey");

INSERT INTO "EmailSettings" ("id", "defaultFromEmail", "defaultFromName", "updatedAt")
VALUES ('default', 'noreply@sanative.com.au', 'Sanative Health', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "EmailProcessConfig" ("id", "processKey", "label", "enabled", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('emailproc_auth', 'auth', 'Auth (verification, password reset)', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('emailproc_membership', 'membership', 'Membership (welcome, renewal, cancel, expired)', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('emailproc_stripe', 'stripe', 'Stripe (order confirm, payment failed, magic link)', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('emailproc_bookings', 'bookings', 'Bookings (confirm, reschedule, cancel)', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('emailproc_clinical', 'clinical', 'Clinical (triage, doctor, pathology, declines)', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('emailproc_marketing', 'marketing', 'Marketing (abandoned cart, churn)', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('emailproc_crm', 'crm', 'CRM (care-comms, mass send)', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("processKey") DO NOTHING;
