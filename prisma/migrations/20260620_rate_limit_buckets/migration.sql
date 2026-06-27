-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_bucketKey_key" ON "RateLimitBucket"("bucketKey");

-- CreateIndex
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
