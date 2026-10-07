import contactHandler from "@/pages/api/client/contact";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Formulaire de contact  - alias mobile de `/api/client/contact`.
 * La logique (validation, limitation de débit, notification, e-mail) reste
 * définie une seule fois côté web.
 */
export default function handler(req, res) {
  if (answerPreflight(req, res)) return;
  return contactHandler(req, res);
}
