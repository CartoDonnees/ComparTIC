/**
 * Limitation des tentatives (protection contre le bourrage d'identifiants).
 *
 * Compteur en mémoire du processus : suffisant pour une instance unique
 * (déploiement actuel). Pour plusieurs instances, remplacer le stockage par
 * Redis ou une table dédiée, l'interface restant la même.
 */

const buckets = new Map();

const PRESETS = {
  login: { max: 10, windowMs: 15 * 60 * 1000, message: "Trop de tentatives de connexion. Réessayez dans quelques minutes." },
  password: { max: 5, windowMs: 15 * 60 * 1000, message: "Trop de demandes. Réessayez dans quelques minutes." },
  assistant: { max: 20, windowMs: 15 * 60 * 1000, message: "Trop de questions envoyées à l'assistant. Patientez quelques minutes." },
  offerImport: { max: 30, windowMs: 15 * 60 * 1000, message: "Trop d'analyses ou d'imports de fichiers. Patientez quelques minutes." },
};

const clientIp = (req) => {
  const fwd = req?.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req?.socket?.remoteAddress || "inconnu";
};

/** Nettoyage paresseux : les fenêtres expirées sont retirées à chaque appel. */
const sweep = (now) => {
  if (buckets.size < 500) return;
  for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key);
};

/**
 * @returns {{ok: true} | {ok: false, retryAfter: number, message: string}}
 */
export const consumeAttempt = (req, { preset = "login", key = "" } = {}) => {
  const rule = PRESETS[preset] || PRESETS.login;
  const now = Date.now();
  sweep(now);

  const id = `${preset}:${clientIp(req)}:${String(key).toLowerCase()}`;
  const entry = buckets.get(id);
  if (!entry || entry.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true };
  }
  entry.count += 1;
  if (entry.count > rule.max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000), message: rule.message };
  }
  return { ok: true };
};

/** Tentative réussie : le compteur repart de zéro. */
export const resetAttempts = (req, { preset = "login", key = "" } = {}) => {
  buckets.delete(`${preset}:${clientIp(req)}:${String(key).toLowerCase()}`);
};

/** Applique la limite et répond 429 le cas échéant. @returns true si bloqué */
export const blockedByRateLimit = (req, res, options) => {
  const result = consumeAttempt(req, options);
  if (result.ok) return false;
  res.setHeader("Retry-After", String(result.retryAfter));
  res.status(429).json({ error: result.message, code: "RATE_LIMITED", retryAfter: result.retryAfter });
  return true;
};

export default blockedByRateLimit;
