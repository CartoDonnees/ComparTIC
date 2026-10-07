import { itemRoute } from "@/services/referential/referentialRoutes";
import { deleteCountry, updateCountry } from "@/services/referential/referentialService";

/** PUT (modification) et DELETE (suppression contrôlée) d'un pays. */
export default itemRoute({ label: "pays", update: updateCountry, remove: deleteCountry });
