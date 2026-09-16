-- Annual-update overlay for Australian population comparison reference data
CREATE TABLE IF NOT EXISTS "PopulationReferenceOverride" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,

  CONSTRAINT "PopulationReferenceOverride_pkey" PRIMARY KEY ("id")
);
