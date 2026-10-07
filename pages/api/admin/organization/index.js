import { collectionRoute } from "@/services/referential/referentialRoutes";
import { createOrganization, listOrganizations } from "@/services/referential/referentialService";
import { normalizeOrganizationPayload } from "@/services/referential/organizationPayload";

/** GET (liste de gestion) et POST (création) des organisations    règles dans referentialService. */
export default collectionRoute({ label: "organisations", list: listOrganizations, create: createOrganization, normalize: normalizeOrganizationPayload });
