import newsletterHandler from "@/pages/api/client/newsletter";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Lettre d'information  - alias mobile de `/api/client/newsletter`
 * (inscription en POST, désinscription en GET avec jeton).
 */
export default function handler(req, res) {
  if (answerPreflight(req, res)) return;
  return newsletterHandler(req, res);
}
