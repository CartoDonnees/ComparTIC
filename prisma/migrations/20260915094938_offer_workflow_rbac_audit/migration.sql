-- CreateEnum
CREATE TYPE "OfferWorkflowStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_VALIDATION', 'VALIDATED', 'REFUSED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ValidationDecisionType" AS ENUM ('VALIDATED', 'REFUSED');

-- CreateEnum
CREATE TYPE "DeactivationReason" AS ENUM ('MANUAL', 'MONITORING');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "offerId" INTEGER,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "currentValidationLevel" INTEGER,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedById" INTEGER,
ADD COLUMN     "deactivationReason" "DeactivationReason",
ADD COLUMN     "refusedAt" TIMESTAMP(3),
ADD COLUMN     "sourceOfferId" INTEGER,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "workflowStatus" "OfferWorkflowStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "ValidationDecision" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "decision" "ValidationDecisionType" NOT NULL,
    "transmitted" BOOLEAN NOT NULL DEFAULT false,
    "final" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "offerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'OFFER',
    "entityId" INTEGER,
    "actorRole" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "level" INTEGER,
    "comment" TEXT,
    "metadata" JSONB,
    "offerId" INTEGER,
    "actorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ValidationDecision_offerId_level_idx" ON "ValidationDecision"("offerId", "level");

-- CreateIndex
CREATE INDEX "AuditLog_offerId_createdAt_idx" ON "AuditLog"("offerId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Notification_offerId_idx" ON "Notification"("offerId");

-- CreateIndex
CREATE INDEX "Offer_workflowStatus_currentValidationLevel_idx" ON "Offer"("workflowStatus", "currentValidationLevel");

-- CreateIndex
CREATE INDEX "Offer_sourceOfferId_idx" ON "Offer"("sourceOfferId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_sourceOfferId_fkey" FOREIGN KEY ("sourceOfferId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationDecision" ADD CONSTRAINT "ValidationDecision_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationDecision" ADD CONSTRAINT "ValidationDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================================================
-- REPRISE DES DONNEES EXISTANTES
-- ===========================================================================

-- 1. Nouveaux profils du workflow. Les profils existants (PRF0..PRF3) sont
--    conserves tels quels : leurs codes sont utilises dans toute l application.
INSERT INTO "Profile" ("code", "name", "description", "createdAt", "updatedAt") VALUES
  ('PRF-SUPERADMIN', 'SUPER_ADMIN', 'Super administrateur : tous les droits, dont la designation des administrateurs.', NOW(), NOW()),
  ('PRF-VAL1', 'VALIDATOR_1', 'Validateur niveau 1 : responsable / agent.', NOW(), NOW()),
  ('PRF-VAL2', 'VALIDATOR_2', 'Validateur niveau 2 : chef de service.', NOW(), NOW()),
  ('PRF-VAL3', 'VALIDATOR_3', 'Validateur niveau 3 : chef de departement. Dernier niveau des offres promotionnelles.', NOW(), NOW()),
  ('PRF-VAL4', 'VALIDATOR_4', 'Validateur niveau 4 : directeur. Dernier niveau des offres de base.', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- 2. Etat de workflow deduit de la decision unique de l ancien systeme.
--    Aucune decision par niveau n est inventee : ces offres n ont pas de ligne
--    ValidationDecision, l historique indique qu elles precedent le workflow.
UPDATE "Offer" o SET
  "workflowStatus" = 'VALIDATED', "validatedAt" = v."updatedAt", "currentValidationLevel" = NULL
FROM "Validation" v WHERE v."offerId" = o."id" AND v."status" = 'ALLOW';

UPDATE "Offer" o SET
  "workflowStatus" = 'REFUSED', "refusedAt" = v."updatedAt", "currentValidationLevel" = NULL
FROM "Validation" v WHERE v."offerId" = o."id" AND v."status" = 'DINIED';

UPDATE "Offer" o SET
  "workflowStatus" = 'DEACTIVATED', "deactivatedAt" = v."updatedAt",
  "deactivationReason" = 'MANUAL', "currentValidationLevel" = NULL
FROM "Validation" v WHERE v."offerId" = o."id" AND v."status" = 'SUSPENDED';

-- Offres declarees sans decision : l ancien systeme soumettait a la creation.
UPDATE "Offer" o SET
  "workflowStatus" = 'SUBMITTED', "submittedAt" = o."createdAt", "currentValidationLevel" = 1
WHERE o."workflowStatus" = 'DRAFT'
  AND o."code" <> 'OF-000000000000000'
  AND NOT EXISTS (SELECT 1 FROM "Validation" v WHERE v."offerId" = o."id" AND v."status" <> 'PENDING');

-- Offre repere « Offre Inconnu » : reference technique, jamais soumise a validation.
UPDATE "Offer" SET "workflowStatus" = 'VALIDATED', "currentValidationLevel" = NULL
WHERE "code" = 'OF-000000000000000';

-- 3. Trace de la reprise dans le journal d audit.
INSERT INTO "AuditLog" ("action", "entityType", "entityId", "offerId", "toStatus", "comment", "createdAt")
SELECT 'LEGACY_IMPORT', 'OFFER', o."id", o."id", o."workflowStatus"::text,
       'Etat repris de la validation anterieure au workflow a 4 niveaux.', NOW()
FROM "Offer" o;
