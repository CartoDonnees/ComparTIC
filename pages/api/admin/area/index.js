import { collectionRoute } from "@/services/referential/referentialRoutes";
import { createZone, listZones, missingZoneTypes, ZONE_TYPES } from "@/services/referential/referentialService";

/**
 * GET (zones de référence) et POST (création)    règles dans referentialService.
 * La liste est accompagnée des types encore sans zone de référence : ce sont
 * les seuls qu'il est possible de créer (une zone de référence par type).
 */
export default collectionRoute({
  label: "zones",
  list: listZones,
  create: createZone,
  extra: async () => ({ missingTypes: await missingZoneTypes(), types: ZONE_TYPES }),
});
