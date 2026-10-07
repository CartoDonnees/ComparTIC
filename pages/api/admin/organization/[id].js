import { itemRoute } from "@/services/referential/referentialRoutes";
import { deleteOrganization, updateOrganization } from "@/services/referential/referentialService";
import { normalizeOrganizationPayload } from "@/services/referential/organizationPayload";

/** PUT (modification) et DELETE (suppression contrôlée) d'une organisation. */
export default itemRoute({ label: "organisations", update: updateOrganization, remove: deleteOrganization, normalize: normalizeOrganizationPayload });
