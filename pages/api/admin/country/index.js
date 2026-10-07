import { collectionRoute } from "@/services/referential/referentialRoutes";
import { createCountry, listCountries } from "@/services/referential/referentialService";

/** GET (liste de gestion) et POST (création) des pays    règles dans referentialService. */
export default collectionRoute({ label: "pays", list: listCountries, create: createCountry });
