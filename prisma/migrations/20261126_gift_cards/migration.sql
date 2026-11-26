-- Single-use membership gift cards.
CREATE TABLE "gift_cards" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeNormalized" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gift_cards_code_key" ON "gift_cards"("code");
CREATE UNIQUE INDEX "gift_cards_codeNormalized_key" ON "gift_cards"("codeNormalized");
CREATE INDEX "gift_cards_batchId_idx" ON "gift_cards"("batchId");
CREATE INDEX "gift_cards_usedAt_idx" ON "gift_cards"("usedAt");

ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
