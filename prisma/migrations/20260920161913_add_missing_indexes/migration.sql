-- CreateIndex
CREATE INDEX "AccessMode_offerId_idx" ON "AccessMode"("offerId");

-- CreateIndex
CREATE INDEX "FocalPoint_operatorId_idx" ON "FocalPoint"("operatorId");

-- CreateIndex
CREATE INDEX "FormulaAdvantage_formulaId_idx" ON "FormulaAdvantage"("formulaId");

-- CreateIndex
CREATE INDEX "Monitoring_offerId_idx" ON "Monitoring"("offerId");

-- CreateIndex
CREATE INDEX "Offer_operatorId_idx" ON "Offer"("operatorId");

-- CreateIndex
CREATE INDEX "Offer_areaId_idx" ON "Offer"("areaId");

-- CreateIndex
CREATE INDEX "Offer_userId_idx" ON "Offer"("userId");

-- CreateIndex
CREATE INDEX "Offer_parentId_idx" ON "Offer"("parentId");

-- CreateIndex
CREATE INDEX "Offer_desiredDate_idx" ON "Offer"("desiredDate");

-- CreateIndex
CREATE INDEX "Offer_notifiDate_idx" ON "Offer"("notifiDate");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE INDEX "OfferFormula_offerId_idx" ON "OfferFormula"("offerId");

-- CreateIndex
CREATE INDEX "OfferFormula_parentId_idx" ON "OfferFormula"("parentId");

-- CreateIndex
CREATE INDEX "OfferServiceDetail_formulaId_idx" ON "OfferServiceDetail"("formulaId");

-- CreateIndex
CREATE INDEX "OfferServiceDetail_serviceId_idx" ON "OfferServiceDetail"("serviceId");

-- CreateIndex
CREATE INDEX "Organization_areaId_idx" ON "Organization"("areaId");

-- CreateIndex
CREATE INDEX "User_profileId_idx" ON "User"("profileId");

