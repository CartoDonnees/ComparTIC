import prisma from "@/services/config/auth/prisma";
import { ZONE_TYPES } from "@/services/referential/referentialService";

/**
 * Compatibilité avec l'ancien formulaire, qui envoyait `area` (1 = nationale,
 * sinon internationale) et `selectedCountries` : traduits vers `areaId` et
 * `countryIds`, seuls champs lus par le service.
 */
export const normalizeOrganizationPayload = async (body) => {
  const next = { ...body };
  if (!next.areaId && next.area !== undefined && next.area !== null && next.area !== "") {
    const code = Number(next.area) === 1 ? ZONE_TYPES.NATIONAL.code : ZONE_TYPES.INTERNATIONAL.code;
    const zone = await prisma.area.findUnique({ where: { code }, select: { id: true } });
    next.areaId = zone?.id ?? null;
  }
  if (!Array.isArray(next.countryIds) && Array.isArray(next.selectedCountries)) next.countryIds = next.selectedCountries;
  return next;
};

export default normalizeOrganizationPayload;
