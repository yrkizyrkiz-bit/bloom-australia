-- Explicit membership entitlement layer (program access + biomarker insight scopes).
CREATE TYPE "EntitlementType" AS ENUM ('PROGRAM', 'SCOPE');
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'PENDING', 'INACTIVE');
CREATE TYPE "EntitlementSource" AS ENUM ('SUBSCRIPTION', 'PROGRAM_MEMBER', 'LEGACY_TIER', 'ADMIN_GRANT', 'BUNDLE');

CREATE TABLE "Entitlement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "EntitlementType" NOT NULL,
  "key" TEXT NOT NULL,
  "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "source" "EntitlementSource" NOT NULL DEFAULT 'ADMIN_GRANT',
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Entitlement_userId_type_key_key" ON "Entitlement"("userId", "type", "key");
CREATE INDEX "Entitlement_userId_idx" ON "Entitlement"("userId");
CREATE INDEX "Entitlement_key_idx" ON "Entitlement"("key");
CREATE INDEX "Entitlement_status_idx" ON "Entitlement"("status");

ALTER TABLE "Entitlement"
  ADD CONSTRAINT "Entitlement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
