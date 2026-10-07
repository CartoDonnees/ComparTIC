/**
 * Destinataires d'un courrier : lecture et contrôle de forme.
 *
 * Module pur (aucune dépendance serveur) : il sert à la fois à l'éditeur, pour
 * activer les boutons, et au service, qui refait le contrôle avant tout envoi.
 * L'existence du domaine est vérifiée à part, côté serveur uniquement
 * (`recipientDomain.js`).
 */

export const MAX_RECIPIENTS = 5;

const LOCAL_PART = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
const DOMAIN_LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

/** Adresse correctement formée (RFC 5321, sans les formes entre guillemets). */
export const isWellFormedEmail = (value) => {
  const email = String(value ?? "");
  if (!email || email.length > 254 || /\s/.test(email)) return false;
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || !LOCAL_PART.test(local)) return false;
  const labels = domain.split(".");
  if (labels.length < 2 || !labels.every((label) => DOMAIN_LABEL.test(label))) return false;
  // L'extension est faite de lettres : « nom@domaine.1 » n'est pas une adresse.
  return /^[a-z]{2,}$/i.test(labels[labels.length - 1]);
};

/**
 * Lit un champ « destinataire(s) » : adresses séparées par une virgule, un
 * point-virgule ou un retour à la ligne.
 *
 * @returns {{ valid: string[], invalid: string[], tooMany: boolean }}
 */
export const parseRecipients = (raw) => {
  const entries = String(raw ?? "")
    .split(/[,;\n]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const valid = [];
  const invalid = [];
  entries.forEach((entry) => {
    if (!isWellFormedEmail(entry)) invalid.push(entry);
    else if (!valid.includes(entry)) valid.push(entry);
  });
  return { valid, invalid, tooMany: valid.length > MAX_RECIPIENTS };
};

/** Message d'erreur à afficher, ou null si la saisie est exploitable. */
export const recipientsError = (raw) => {
  const { valid, invalid, tooMany } = parseRecipients(raw);
  if (invalid.length) {
    return invalid.length === 1
      ? `L'adresse « ${invalid[0]} » n'est pas valide. Vérifiez son écriture (exemple : nom@operateur.ci).`
      : `Ces adresses ne sont pas valides : ${invalid.join(", ")}. Vérifiez leur écriture.`;
  }
  if (!valid.length) return "Indiquez l'adresse e-mail du destinataire.";
  if (tooMany) return `Un courrier part à ${MAX_RECIPIENTS} destinataires au plus.`;
  return null;
};
