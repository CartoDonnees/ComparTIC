-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IMAGE', 'XLSX', 'CSV', 'PDF', 'KML', 'GEOJSON');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ENABLE', 'DISABLE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OperatorType" AS ENUM ('MOBILE', 'FIXE', 'HYBRIDE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'DONE');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('ALLOW', 'DINIED');

-- CreateEnum
CREATE TYPE "TypeDownload" AS ENUM ('XLSX', 'CSV', 'PDF', 'KML', 'GEOJSON');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('PREPAID', 'POSTPAID', 'HYBRID');

-- CreateEnum
CREATE TYPE "LikeType" AS ENUM ('LIKED', 'LOVED', 'UNLIKED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('NUMBER', 'STRING');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('AUTO', 'BYHAND');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('FLASH', 'PERIOD', 'SPECIAL', 'CUSTOMIZE');

-- CreateEnum
CREATE TYPE "OfferCategory" AS ENUM ('MOBILE', 'FIXE');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('NATIONAL', 'INTERNATIONAL', 'ROAMING');

-- CreateEnum
CREATE TYPE "FormulaType" AS ENUM ('ON_NET', 'OFF_NET', 'ALL_NET');

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DocumentType",
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "imagePath" TEXT,
    "status" "Status" NOT NULL DEFAULT 'DISABLE',
    "confirmToken" TEXT,
    "confirmNotif" BOOLEAN,
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "from" TEXT,
    "content" TEXT,
    "status" "Status",
    "read" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestorePassword" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestorePassword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "type" "OperatorType" NOT NULL,
    "imagePath" TEXT,
    "status" "Status",
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocalPoint" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "Status",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "operatorId" INTEGER NOT NULL,

    CONSTRAINT "FocalPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "focalPointId" INTEGER NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notifiDate" TIMESTAMP(3) NOT NULL,
    "desiredDate" TIMESTAMP(3) NOT NULL,
    "billingType" "BillingType" NOT NULL,
    "category" "OfferCategory" NOT NULL,
    "target" TEXT,
    "status" "OfferStatus",
    "link" TEXT,
    "partner" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "areaId" INTEGER,
    "documentId" INTEGER,
    "parentId" INTEGER,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileOffer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER,

    CONSTRAINT "ProfileOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialPromotion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "offerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessMode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" INTEGER NOT NULL,
    "monitoringId" INTEGER,

    CONSTRAINT "AccessMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" "AreaType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainOrganization" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "areaId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaOrganization" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "areaId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,

    CONSTRAINT "AreaOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "indicator" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationCountry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "areaOrganisationId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "OrganisationCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "LikeType" NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" INTEGER NOT NULL,
    "monitoringId" INTEGER,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulaAdvantage" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formulaId" INTEGER NOT NULL,

    CONSTRAINT "FormulaAdvantage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferFormula" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "validity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "OfferFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferPrice" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formulaId" INTEGER NOT NULL,

    CONSTRAINT "OfferPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferServiceDetail" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "billingSteps" DOUBLE PRECISION,
    "comtype" "FormulaType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formulaId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "OfferServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRate" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceDetailId" INTEGER NOT NULL,

    CONSTRAINT "OfferRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferControl" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "appliedRate" DOUBLE PRECISION NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" INTEGER NOT NULL,
    "formulaId" INTEGER NOT NULL,

    CONSTRAINT "OfferControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Validation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "launchDate" TIMESTAMP(3),
    "status" "ValidationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" INTEGER NOT NULL,
    "monitoringId" INTEGER NOT NULL,

    CONSTRAINT "Validation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validationId" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringPeriod" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitoring" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notifiDate" TIMESTAMP(3) NOT NULL,
    "desiredDate" TIMESTAMP(3) NOT NULL,
    "billingType" "BillingType" NOT NULL,
    "category" "OfferCategory" NOT NULL,
    "target" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL,
    "link" TEXT,
    "partner" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" INTEGER NOT NULL,
    "areaId" INTEGER,
    "documentId" INTEGER,
    "ownerId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "Monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringPromotion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringFormula" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "validity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "MonitoringFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringPrice" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringServiceDetail" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "quntity" DOUBLE PRECISION NOT NULL,
    "billingSteps" DOUBLE PRECISION,
    "comtype" "FormulaType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formulaId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "offerRateId" INTEGER,

    CONSTRAINT "MonitoringServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringControl" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "appliedRate" DOUBLE PRECISION NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringId" INTEGER NOT NULL,
    "monitoringFormulaId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringAdvantage" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitoringFormulaId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringAdvantage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" INTEGER NOT NULL,
    "monitoringId" INTEGER,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "TypeDownload" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DocumentToObservation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DocumentToObservation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserFeature" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserFeature_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserNotification" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserNotification_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OfferToProfileOffer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OfferToProfileOffer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MainOrganizationToOrganization" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MainOrganizationToOrganization_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CountryToOrganization" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CountryToOrganization_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_code_key" ON "Document"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_code_key" ON "Profile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_code_key" ON "Feature"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_code_key" ON "User"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_code_key" ON "Notification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RestorePassword_code_key" ON "RestorePassword"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_code_key" ON "Operator"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FocalPoint_code_key" ON "FocalPoint"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FocalPoint_userId_key" ON "FocalPoint"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_code_key" ON "Observation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_code_key" ON "Offer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileOffer_code_key" ON "ProfileOffer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialPromotion_code_key" ON "SpecialPromotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialPromotion_offerId_key" ON "SpecialPromotion"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessMode_code_key" ON "AccessMode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Area_code_key" ON "Area"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MainOrganization_code_key" ON "MainOrganization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Like_code_key" ON "Like"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FormulaAdvantage_code_key" ON "FormulaAdvantage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfferFormula_code_key" ON "OfferFormula"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfferPrice_code_key" ON "OfferPrice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfferPrice_formulaId_key" ON "OfferPrice"("formulaId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferServiceDetail_code_key" ON "OfferServiceDetail"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfferRate_code_key" ON "OfferRate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfferRate_serviceDetailId_key" ON "OfferRate"("serviceDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OfferControl_code_key" ON "OfferControl"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Validation_code_key" ON "Validation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Validation_offerId_key" ON "Validation"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "Validation_monitoringId_key" ON "Validation"("monitoringId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_code_key" ON "Comment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringPeriod_code_key" ON "MonitoringPeriod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringPeriod_monitoringId_key" ON "MonitoringPeriod"("monitoringId");

-- CreateIndex
CREATE UNIQUE INDEX "Monitoring_code_key" ON "Monitoring"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringPromotion_code_key" ON "MonitoringPromotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringPromotion_monitoringId_key" ON "MonitoringPromotion"("monitoringId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringFormula_code_key" ON "MonitoringFormula"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringPrice_code_key" ON "MonitoringPrice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringPrice_monitoringId_key" ON "MonitoringPrice"("monitoringId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringServiceDetail_code_key" ON "MonitoringServiceDetail"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringControl_code_key" ON "MonitoringControl"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringAdvantage_code_key" ON "MonitoringAdvantage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Review_code_key" ON "Review"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Download_code_key" ON "Download"("code");

-- CreateIndex
CREATE UNIQUE INDEX "History_title_key" ON "History"("title");

-- CreateIndex
CREATE INDEX "_DocumentToObservation_B_index" ON "_DocumentToObservation"("B");

-- CreateIndex
CREATE INDEX "_UserFeature_B_index" ON "_UserFeature"("B");

-- CreateIndex
CREATE INDEX "_UserNotification_B_index" ON "_UserNotification"("B");

-- CreateIndex
CREATE INDEX "_OfferToProfileOffer_B_index" ON "_OfferToProfileOffer"("B");

-- CreateIndex
CREATE INDEX "_MainOrganizationToOrganization_B_index" ON "_MainOrganizationToOrganization"("B");

-- CreateIndex
CREATE INDEX "_CountryToOrganization_B_index" ON "_CountryToOrganization"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestorePassword" ADD CONSTRAINT "RestorePassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocalPoint" ADD CONSTRAINT "FocalPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocalPoint" ADD CONSTRAINT "FocalPoint_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_focalPointId_fkey" FOREIGN KEY ("focalPointId") REFERENCES "FocalPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOffer" ADD CONSTRAINT "ProfileOffer_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialPromotion" ADD CONSTRAINT "SpecialPromotion_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessMode" ADD CONSTRAINT "AccessMode_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessMode" ADD CONSTRAINT "AccessMode_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaOrganization" ADD CONSTRAINT "AreaOrganization_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaOrganization" ADD CONSTRAINT "AreaOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationCountry" ADD CONSTRAINT "OrganisationCountry_areaOrganisationId_fkey" FOREIGN KEY ("areaOrganisationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationCountry" ADD CONSTRAINT "OrganisationCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaAdvantage" ADD CONSTRAINT "FormulaAdvantage_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "OfferFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferFormula" ADD CONSTRAINT "OfferFormula_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferFormula" ADD CONSTRAINT "OfferFormula_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OfferFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferPrice" ADD CONSTRAINT "OfferPrice_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "OfferFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferServiceDetail" ADD CONSTRAINT "OfferServiceDetail_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "OfferFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferServiceDetail" ADD CONSTRAINT "OfferServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRate" ADD CONSTRAINT "OfferRate_serviceDetailId_fkey" FOREIGN KEY ("serviceDetailId") REFERENCES "OfferServiceDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferControl" ADD CONSTRAINT "OfferControl_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferControl" ADD CONSTRAINT "OfferControl_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "OfferFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "Validation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringPeriod" ADD CONSTRAINT "MonitoringPeriod_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoring" ADD CONSTRAINT "Monitoring_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoring" ADD CONSTRAINT "Monitoring_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoring" ADD CONSTRAINT "Monitoring_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoring" ADD CONSTRAINT "Monitoring_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoring" ADD CONSTRAINT "Monitoring_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Monitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringPromotion" ADD CONSTRAINT "MonitoringPromotion_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFormula" ADD CONSTRAINT "MonitoringFormula_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFormula" ADD CONSTRAINT "MonitoringFormula_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MonitoringFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringPrice" ADD CONSTRAINT "MonitoringPrice_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "MonitoringFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringServiceDetail" ADD CONSTRAINT "MonitoringServiceDetail_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "MonitoringFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringServiceDetail" ADD CONSTRAINT "MonitoringServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringServiceDetail" ADD CONSTRAINT "MonitoringServiceDetail_offerRateId_fkey" FOREIGN KEY ("offerRateId") REFERENCES "OfferRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringControl" ADD CONSTRAINT "MonitoringControl_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringControl" ADD CONSTRAINT "MonitoringControl_monitoringFormulaId_fkey" FOREIGN KEY ("monitoringFormulaId") REFERENCES "MonitoringFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringAdvantage" ADD CONSTRAINT "MonitoringAdvantage_monitoringFormulaId_fkey" FOREIGN KEY ("monitoringFormulaId") REFERENCES "MonitoringFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "Monitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToObservation" ADD CONSTRAINT "_DocumentToObservation_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToObservation" ADD CONSTRAINT "_DocumentToObservation_B_fkey" FOREIGN KEY ("B") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFeature" ADD CONSTRAINT "_UserFeature_A_fkey" FOREIGN KEY ("A") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFeature" ADD CONSTRAINT "_UserFeature_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserNotification" ADD CONSTRAINT "_UserNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserNotification" ADD CONSTRAINT "_UserNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfferToProfileOffer" ADD CONSTRAINT "_OfferToProfileOffer_A_fkey" FOREIGN KEY ("A") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfferToProfileOffer" ADD CONSTRAINT "_OfferToProfileOffer_B_fkey" FOREIGN KEY ("B") REFERENCES "ProfileOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MainOrganizationToOrganization" ADD CONSTRAINT "_MainOrganizationToOrganization_A_fkey" FOREIGN KEY ("A") REFERENCES "MainOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MainOrganizationToOrganization" ADD CONSTRAINT "_MainOrganizationToOrganization_B_fkey" FOREIGN KEY ("B") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryToOrganization" ADD CONSTRAINT "_CountryToOrganization_A_fkey" FOREIGN KEY ("A") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryToOrganization" ADD CONSTRAINT "_CountryToOrganization_B_fkey" FOREIGN KEY ("B") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
