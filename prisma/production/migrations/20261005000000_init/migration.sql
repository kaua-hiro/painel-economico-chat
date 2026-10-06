-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_room_createdAt_idx" ON "Message"("room", "createdAt");

