-- CreateTable
CREATE TABLE "SubmissionCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'OFFER_SUBMISSION',
    "codeHash" TEXT NOT NULL,
    "reference" TEXT,
    "label" TEXT,
    "email" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "ticket" TEXT,
    "ip" TEXT,
    "userId" INTEGER NOT NULL,
    "offerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionCode_code_key" ON "SubmissionCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionCode_ticket_key" ON "SubmissionCode"("ticket");

-- CreateIndex
CREATE INDEX "SubmissionCode_userId_purpose_reference_idx" ON "SubmissionCode"("userId", "purpose", "reference");

-- AddForeignKey
ALTER TABLE "SubmissionCode" ADD CONSTRAINT "SubmissionCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
