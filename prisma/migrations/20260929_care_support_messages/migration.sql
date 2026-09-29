-- CreateTable
CREATE TABLE "CareSupportThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareSupportThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareSupportMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readByStaff" BOOLEAN NOT NULL DEFAULT false,
    "readByMember" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareSupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareSupportThread_userId_idx" ON "CareSupportThread"("userId");
CREATE INDEX "CareSupportThread_status_idx" ON "CareSupportThread"("status");
CREATE INDEX "CareSupportThread_lastMessageAt_idx" ON "CareSupportThread"("lastMessageAt");
CREATE INDEX "CareSupportMessage_threadId_idx" ON "CareSupportMessage"("threadId");
CREATE INDEX "CareSupportMessage_senderId_idx" ON "CareSupportMessage"("senderId");
CREATE INDEX "CareSupportMessage_createdAt_idx" ON "CareSupportMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "CareSupportThread" ADD CONSTRAINT "CareSupportThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareSupportMessage" ADD CONSTRAINT "CareSupportMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CareSupportThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
