import observatoryHandler from "@/pages/api/client/statistics/priceObservatory";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Observatoire tarifaire  - même agrégation que le site public.
 *
 *   GET /api/public/observatory?months=24
 *
 * Simple alias sous l'espace `/api/public` utilisé par l'application mobile :
 * le calcul (et son cache) reste dans un seul module, il n'est pas dupliqué.
 */
export default function handler(req, res) {
  if (answerPreflight(req, res)) return;
  return observatoryHandler(req, res);
}
