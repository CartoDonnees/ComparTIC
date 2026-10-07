import { promises as dnsPromises } from "dns";

/**
 * Le domaine d'une adresse peut-il recevoir des e-mails ?
 *
 * Un serveur d'envoi accepte en général le message puis renvoie, plus tard, un
 * avis de non-remise dans la boîte d'expédition : la plateforme ne le voit pas.
 * Ce contrôle attrape avant l'envoi le cas le plus courant, la faute de frappe
 * dans le domaine (« orange.cii », « gmial.com ») : aucun serveur de courrier
 * n'y répond.
 *
 * Il ne dit PAS si la boîte existe sur un domaine valide : seul le serveur du
 * destinataire le sait.
 *
 * Réponses :
 *   { ok: true, verified: true }   le domaine a un serveur de courrier
 *   { ok: true, verified: false, cause }  vérification impossible (DNS injoignable) : on n'empêche pas l'envoi
 *   { ok: false, domain }          le domaine n'existe pas ou refuse tout courrier
 */

// Extensions réservées (RFC 2606 / 6761) : jamais délivrables.
const RESERVED_TLDS = new Set(["test", "example", "invalid", "localhost", "local"]);

// Réponses du DNS qui valent une certitude :
//   ENOTFOUND  le nom de domaine n'existe pas du tout ;
//   ENODATA    le nom existe, mais sans enregistrement du type demandé.
const NO_SUCH_DOMAIN = "ENOTFOUND";
const NO_RECORD = "ENODATA";

// Relances rapprochées : sur un réseau qui perd des paquets, la réponse arrive
// à la deuxième ou à la troisième tentative au lieu d'attendre 5 secondes.
let sharedResolver = null;
const defaultResolver = () => {
  if (!sharedResolver) sharedResolver = new dnsPromises.Resolver({ timeout: 1500, tries: 3 });
  return sharedResolver;
};

/** Résultat d'une requête sans jamais lever : { value } ou { code }. */
const settle = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => reject(Object.assign(new Error("DNS timeout"), { code: "ETIMEOUT" })), ms);
      timer.unref?.();
    }),
  ]).then(
    (value) => ({ value: value || [] }),
    (error) => ({ code: error?.code || "UNKNOWN" }),
  );

export const domainOf = (email) => String(email ?? "").slice(String(email ?? "").lastIndexOf("@") + 1).toLowerCase();

export const isReservedDomain = (domain) => RESERVED_TLDS.has(String(domain).split(".").pop());

export const checkRecipientDomain = async (email, { resolver = null, timeoutMs = 7000, dryRun = process.env.MAIL_DRY_RUN === "true" } = {}) => {
  const domain = domainOf(email);
  if (isReservedDomain(domain)) {
    // Envoi simulé : les comptes de test (« @compartic.test ») restent utilisables.
    return dryRun ? { ok: true, verified: false, domain } : { ok: false, domain };
  }
  const dns = resolver || defaultResolver();
  // Serveurs de courrier (MX) et adresse du domaine (A), demandés ensemble.
  const [mx, address] = await Promise.all([settle(dns.resolveMx(domain), timeoutMs), settle(dns.resolve4(domain), timeoutMs)]);

  // « MX nul » (RFC 7505, serveur vide ou « . ») : le domaine déclare ne recevoir aucun courrier.
  const usable = (mx.value || []).filter((record) => record?.exchange && record.exchange !== ".");
  if (usable.length) return { ok: true, verified: true, domain };
  if (mx.value?.length) return { ok: false, domain };

  // Le nom n'existe pas : une seule des deux réponses suffit à le savoir.
  if (mx.code === NO_SUCH_DOMAIN || address.code === NO_SUCH_DOMAIN) return { ok: false, domain };

  if (mx.value || mx.code === NO_RECORD) {
    // Pas d'enregistrement MX : le courrier se rabat sur l'adresse du domaine (RFC 5321).
    if (address.value?.length) return { ok: true, verified: true, domain };
    if (address.value || address.code === NO_RECORD) return { ok: false, domain };
  }
  // Le DNS n'a pas répondu à temps : on ne sait pas, donc on n'empêche pas l'envoi.
  return { ok: true, verified: false, domain, cause: mx.code || address.code || "UNKNOWN" };
};
