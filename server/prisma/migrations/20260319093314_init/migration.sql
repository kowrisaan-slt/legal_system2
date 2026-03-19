-- AlterEnum
ALTER TYPE "InitialDocStatus" ADD VALUE 'REJECTED';

-- CreateTable
CREATE TABLE "CaseActionLog" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseActionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CaseActionLog" ADD CONSTRAINT "CaseActionLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseActionLog" ADD CONSTRAINT "CaseActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
