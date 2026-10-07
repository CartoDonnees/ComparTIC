-- DropForeignKey
ALTER TABLE "OrganisationCountry" DROP CONSTRAINT "OrganisationCountry_areaOrganisationId_fkey";

-- AddForeignKey
ALTER TABLE "OrganisationCountry" ADD CONSTRAINT "OrganisationCountry_areaOrganisationId_fkey" FOREIGN KEY ("areaOrganisationId") REFERENCES "AreaOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
