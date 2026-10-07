import { itemRoute } from "@/services/referential/referentialRoutes";
import { deleteZone, updateZone } from "@/services/referential/referentialService";

/** PUT (description) et DELETE (suppression contrôlée) d'une zone de référence. */
export default itemRoute({ label: "zones", update: updateZone, remove: deleteZone });
