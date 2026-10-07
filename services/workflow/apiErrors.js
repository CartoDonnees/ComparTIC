import { WorkflowError } from "@/services/workflow/offerWorkflow";
import { sendSchemaOutdated } from "@/services/config/schemaError";

/**
 * Traduit une erreur en réponse HTTP. Les erreurs métier gardent leur statut
 * et leur code ; toute autre erreur devient une 500 SANS détail technique (le
 * message réel est journalisé côté serveur uniquement).
 */
export const sendError = (res, error, context = "Workflow") => {
  if (error instanceof WorkflowError) {
    return res.status(error.status).json({ error: error.message, code: error.code, details: error.details });
  }
  // Migration non appliquée : message explicite plutôt qu'une « erreur interne ».
  if (sendSchemaOutdated(res, error, context)) return undefined;
  console.error(`${context} :`, error?.message);
  return res.status(500).json({ error: "Erreur interne lors du traitement de l'offre.", code: "INTERNAL" });
};

export default sendError;
