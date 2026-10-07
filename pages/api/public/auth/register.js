import registerHandler from "@/pages/api/auth/register";
import { FKTND_H } from "@/services/tools/constants";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Création d'un compte grand public depuis l'application mobile.
 *
 *   POST /api/public/auth/register { firstName, lastName, email, password, phone? }
 *
 * Délègue à la route d'inscription du site : mêmes contrôles, même e-mail de
 * confirmation, même profil client. Seule la clé `verskth` (propre au
 * navigateur) est fournie ici, afin de ne pas l'embarquer dans l'application.
 */
export default function handler(req, res) {
  if (answerPreflight(req, res)) return;
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  if (blockedByRateLimit(req, res, { preset: "password", key: req.body?.email || "" })) return undefined;

  // La route du site attend `first_name` / `last_name` ; l'application envoie
  // des noms de champs plus lisibles. La correspondance est faite ici, sans
  // toucher à la route existante.
  const body = req.body || {};
  req.body = {
    ...body,
    first_name: body.first_name ?? body.firstName ?? "",
    last_name: body.last_name ?? body.lastName ?? "",
    email: String(body.email || "").trim().toLowerCase(),
    acceptNotif: body.acceptNotif ?? true,
    verskth: FKTND_H,
  };
  return registerHandler(req, res);
}
