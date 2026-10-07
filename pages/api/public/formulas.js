import { serverError } from "@/services/config/apiError";
import { answerPreflight } from "@/services/config/preflight";
import {
  applyComparator,
  loadPublishedFormulas,
  parseComparatorQuery,
  toFormulaCard,
} from "@/services/public/publicFormulas";

/**
 * Résultats du comparateur, par formule  - application mobile.
 *
 *   GET /api/public/formulas
 *     ?offerType=-1|1|2 &category=-1|1|2 &cTPrepay=1 &cTPostpay=1 &cTHybride=1
 *     &operators=1,2 &zone=national|internat|roaming &mode=need|budget
 *     &call_volume_min= &call_volume_max= (-1 = illimité) &nb_sms_min= ...
 *     &interOrg= &interCountry= &roamOrg= &roamCountry=
 *     &search= &sort=price|validity|voice|sms|data &order=asc|desc
 *     &random=1 &seed= &page=1 &pageSize=20
 *
 * Réponse : { items, page, pageSize, total, pageCount }
 *
 * Les critères portent les mêmes noms que dans la barre latérale du site et
 * sont appliqués par les mêmes fonctions (voir services/public/publicFormulas).
 * Lecture seule : uniquement des offres validées, aucune donnée nominative.
 */

const MAX_PAGE_SIZE = 50;

export default async function handler(req, res) {
  if (answerPreflight(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  // pageSize=1 sert au décompte en direct du panneau de filtres.
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.pageSize) || 20));

  try {
    const params = parseComparatorQuery(req.query);
    const formulas = await loadPublishedFormulas();
    const matching = applyComparator(formulas, params);
    const total = matching.length;

    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).json({
      items: matching.slice((page - 1) * pageSize, page * pageSize).map(toFormulaCard),
      page,
      pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return serverError(res, error, "API publique : formules");
  }
}
